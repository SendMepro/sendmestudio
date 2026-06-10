// HealthCheckAgent — Verifies project health: build, lint, routes, agent ecosystem, feature flags
// Phase: CP-96 / System Governance Phase 1
// Status: enhanced — real shell exec for tsc/build/jest + agent registry + feature flag checks

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AgentRegistry } from './AgentRegistry';
import { getFeatureFlags } from '../../config/featureFlags';
import { SystemPaths } from '../../system/config';

// ─────────────────────────────────────────────────────
// Report interfaces
// ─────────────────────────────────────────────────────

export interface AgentRegistryCheck {
  total: number;
  byStatus: { active: number; inactive: number; pending: number };
  byCategory: Record<string, number>;
}

export interface FeatureFlagConsistency {
  allFlagsAccounted: boolean;
  flagsEnabled: number;
  flagsDisabled: number;
  mismatches: string[];
}

export interface AgentHealthReport {
  // Build checks
  tscStatus: 'pass' | 'fail' | 'skipped';
  buildStatus: 'pass' | 'fail' | 'skipped';
  testStatus: 'pass' | 'fail' | 'skipped';

  // Agent ecosystem checks
  agentRegistryCheck: AgentRegistryCheck;

  // Feature flag checks
  featureFlagConsistency: FeatureFlagConsistency;

  // Overall
  overall: 'healthy' | 'degraded' | 'critical';
  checkedAt: string;

  // Raw error detail (internal)
  errors: string[];
}

// ─────────────────────────────────────────────────────
// Shell exec helpers
// ─────────────────────────────────────────────────────

/**
 * Run a shell command with a timeout.
 * Returns stdout on success, throws on failure.
 */
function runCommand(cmd: string, cwd: string, timeoutMs: number = 60_000): string {
  const opts: import('node:child_process').ExecSyncOptions = {
    cwd,
    timeout: timeoutMs,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  // shell: true enables Windows cmd.exe compatibility
  if (process.platform === 'win32') {
    opts.shell = 'cmd.exe';
  }
  const result = execSync(cmd, opts);
  return typeof result === 'string' ? result : result.toString('utf-8');
}

/**
 * Run a command and return a pass/fail status with error detail.
 */
function checkPassFail(
  cmd: string,
  label: string,
  cwd: string,
  timeoutMs?: number,
): { status: 'pass' | 'fail' | 'skipped'; errors: string[] } {
  try {
    runCommand(cmd, cwd, timeoutMs);
    return { status: 'pass', errors: [] };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : `${label}: Unknown error`;
    // Truncate very long error messages to avoid bloating the report
    const truncated = message.length > 1000 ? message.slice(0, 1000) + '...' : message;
    return { status: 'fail', errors: [truncated] };
  }
}

// ─────────────────────────────────────────────────────
// Internal agent class
// ─────────────────────────────────────────────────────

class HealthCheckAgentInternal {
  async runChecks(): Promise<AgentHealthReport> {
    const errors: string[] = [];

    // 1. Build checks (shell-out)
    const tscResult = this.checkTypeScript();
    if (tscResult.status === 'fail') errors.push(...tscResult.errors);

    const buildResult = this.checkBuild();
    if (buildResult.status === 'fail') errors.push(...buildResult.errors);

    const testResult = this.checkTests();
    if (testResult.status === 'fail') errors.push(...testResult.errors);

    // 2. Agent ecosystem checks (in-memory)
    const agentRegistryCheck = this.checkAgentRegistry();

    // 3. Feature flag consistency
    const featureFlagConsistency = this.checkFeatureFlags();

    // 4. Overall status
    const overall = this.determineOverall(tscResult, buildResult, testResult, agentRegistryCheck, errors);

    return {
      tscStatus: tscResult.status,
      buildStatus: buildResult.status,
      testStatus: testResult.status,
      agentRegistryCheck,
      featureFlagConsistency,
      overall,
      checkedAt: new Date().toISOString(),
      errors,
    };
  }

  // ── TypeScript check ──

  private checkTypeScript(): { status: 'pass' | 'fail' | 'skipped'; errors: string[] } {
    // First verify the tsconfig exists
    if (!fs.existsSync(SystemPaths.tsconfigPath)) {
      return { status: 'skipped', errors: ['tsconfig.json not found at project root'] };
    }
    return checkPassFail('npx tsc --noEmit', 'TypeScript', SystemPaths.root, 120_000);
  }

  // ── Build check ──

  private checkBuild(): { status: 'pass' | 'fail' | 'skipped'; errors: string[] } {
    const packageJsonPath = path.join(SystemPaths.root, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { status: 'skipped', errors: ['package.json not found'] };
    }
    return checkPassFail('npm run build 2>&1', 'Build', SystemPaths.root, 300_000);
  }

  // ── Test check ──

  private checkTests(): { status: 'pass' | 'fail' | 'skipped'; errors: string[] } {
    const jestConfigPath = path.join(SystemPaths.root, 'jest.config.js');
    const jestConfigTsPath = path.join(SystemPaths.root, 'jest.config.ts');
    if (!fs.existsSync(jestConfigPath) && !fs.existsSync(jestConfigTsPath)) {
      return { status: 'skipped', errors: ['jest config not found — tests not configured'] };
    }
    return checkPassFail('npx jest --ci --silent --passWithNoTests 2>&1', 'Tests', SystemPaths.root, 120_000);
  }

  // ── Agent registry check ──

  private checkAgentRegistry(): AgentRegistryCheck {
    const allAgents = AgentRegistry.listAgents();

    const active = allAgents.filter((a) => a.status === 'active').length;
    const inactive = allAgents.filter((a) => a.status === 'inactive').length;
    const pending = allAgents.filter((a) => a.status === 'pending').length;

    const byCategory: Record<string, number> = {};
    for (const agent of allAgents) {
      byCategory[agent.category] = (byCategory[agent.category] || 0) + 1;
    }

    return {
      total: allAgents.length,
      byStatus: { active, inactive, pending },
      byCategory,
    };
  }

  // ── Feature flag consistency check ──

  private checkFeatureFlags(): FeatureFlagConsistency {
    const flags = getFeatureFlags();
    const entries = Object.entries(flags);
    const enabled = entries.filter(([, v]) => v === true).length;
    const disabled = entries.filter(([, v]) => v === false).length;

    // Check for mismatches: flags that are enabled but their corresponding
    // agent code is a skeleton/placeholder (no real implementation).
    // This is a simple heuristic: if the flag is enabled, we check if any
    // registered agent for that domain exists. Deeper analysis requires
    // AgentInspector (Phase 2).
    const mismatches: string[] = [];

    // HOME_ORCHESTRATOR_ENABLED = true but HomeOrchestratorAgent is flat-disabled in bridge
    if (flags.HOME_ORCHESTRATOR_ENABLED) {
      const homeOrch = AgentRegistry.getAgent('HomeOrchestratorAgent');
      if (!homeOrch || homeOrch.status !== 'active') {
        mismatches.push(
          'HOME_ORCHESTRATOR_ENABLED=true but HomeOrchestratorAgent is not registered/active',
        );
      }
    }

    // HOME_HEALTHCHECK_ENABLED = true but HealthCheckAgent itself should be alive
    if (flags.HOME_HEALTHCHECK_ENABLED) {
      // We don't check ourselves — that would be circular. Just note it.
    }

    return {
      allFlagsAccounted: mismatches.length === 0,
      flagsEnabled: enabled,
      flagsDisabled: disabled,
      mismatches,
    };
  }

  // ── Overall determination ──

  private determineOverall(
    tsc: { status: string; errors: string[] },
    build: { status: string; errors: string[] },
    tests: { status: string; errors: string[] },
    registry: AgentRegistryCheck,
    errors: string[],
  ): 'healthy' | 'degraded' | 'critical' {
    // Critical: TypeScript or build failures
    if (tsc.status === 'fail') return 'critical';
    if (build.status === 'fail') return 'critical';

    // Degraded: test failures, or registry is empty (no agents registered)
    if (tests.status === 'fail') return 'degraded';
    if (registry.total === 0) return 'degraded';

    // Healthy: no errors
    if (errors.length === 0) return 'healthy';

    // Fallback: degraded if any non-critical errors
    return 'degraded';
  }
}

export const HealthCheckAgent = new HealthCheckAgentInternal();

// ─────────────────────────────────────────────────────
// Default export for convenience / toolkit use
// ─────────────────────────────────────────────────────
export default HealthCheckAgent;
