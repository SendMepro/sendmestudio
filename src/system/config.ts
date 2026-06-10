// src/system/config.ts — Supervisor configuration and system paths
// Phase: CP-96 / System Governance Phase 1
// Status: created

import path from 'node:path';

/**
 * Configuration for SystemSupervisorAgent.
 * Controls polling frequency, failure thresholds, and startup behaviors.
 */
export interface SupervisorConfig {
  /** How often to ping managed agents (milliseconds). Default: 10000 */
  pollingIntervalMs: number;

  /** Consecutive failures before declaring an agent unreachable. Default: 3 */
  failureThreshold: number;

  /** Total failures before triggering RecoveryAgent. Default: 5 */
  criticalThreshold: number;

  /** Whether to auto-trigger RecoveryAgent on critical failure. Default: true */
  autoRecover: boolean;

  /** Run HealthCheckAgent.runChecks() on supervisor startup. Default: true */
  healthCheckOnStartup: boolean;

  /** Run AgentInspector.inspect() on supervisor startup. Default: true */
  inspectionOnStartup: boolean;

  /** Timeout for a single ping() call (milliseconds). Default: 2000 */
  pingTimeoutMs: number;

  /**
   * Cascade detection window (milliseconds).
   * If 2+ agents in the same section fail within this window,
   * treat as a section-level failure, not individual failures.
   * Default: 5000
   */
  cascadeWindowMs: number;

  /** Deprecation grace period before archiving (milliseconds). Default: 86400000 (24h) */
  deprecationGracePeriodMs: number;

  /** Whether the supervisor is enabled. When false, all governance is skipped. Default: true */
  enabled: boolean;
}

/**
 * Default supervisor configuration.
 * Designed for development safety: moderate polling, conservative thresholds.
 */
export const DEFAULT_SUPERVISOR_CONFIG: SupervisorConfig = {
  pollingIntervalMs: 10000,
  failureThreshold: 3,
  criticalThreshold: 5,
  autoRecover: true,
  healthCheckOnStartup: true,
  inspectionOnStartup: true,
  pingTimeoutMs: 2000,
  cascadeWindowMs: 5000,
  deprecationGracePeriodMs: 86_400_000,
  enabled: true,
};

/**
 * System paths used by the governance layer.
 * Resolved relative to the project root.
 */
export const SystemPaths = {
  /** Absolute path to the project root directory */
  get root(): string {
    // Walk up from `src/system/` or use cwd (Next.js convention)
    return process.cwd();
  },

  /** Path to the agents directory */
  get agentsDir(): string {
    return path.join(this.root, 'src', 'agents');
  },

  /** Path to the system agents directory */
  get systemAgentsDir(): string {
    return path.join(this.agentsDir, 'system');
  },

  /** Path to skills directory */
  get skillsDir(): string {
    return path.join(this.root, 'src', 'skills');
  },

  /** Path to bridges directory */
  get bridgesDir(): string {
    return path.join(this.root, 'src', 'bridges');
  },

  /** Path to the project-memory directory */
  get projectMemoryDir(): string {
    return path.join(this.root, 'project-memory');
  },

  /** Absolute path to tsconfig.json */
  get tsconfigPath(): string {
    return path.join(this.root, 'tsconfig.json');
  },
};
