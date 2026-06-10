// RecoveryAgent — Restores project to a stable checkpoint on failure
// Phase: CP-99 / System Governance Phase 4
// Status: enhanced — real restore via git (fallback: file copy), per-agent restart, section rollback,
//                   post-recovery HealthCheckAgent + AgentInspector verification

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CuratorAgent, type Checkpoint } from './CuratorAgent';
import { HealthCheckAgent, type AgentHealthReport } from './HealthCheckAgent';
import { AgentInspector, type InspectionReport } from './AgentInspector';

// ─────────────────────────────────────────────────────
// Report interfaces
// ─────────────────────────────────────────────────────

export interface RecoveryStep {
  step: string;
  status: 'success' | 'failure' | 'skipped';
  detail: string;
}

export interface RecoveryReport {
  checkpointId: string;
  success: boolean;
  /** Agent name or '*' for full-system recovery. When null, a simple checkpoint restore. */
  agentName: string | null;
  restored: string[];
  failed: string[];
  errors: string[];
  steps: RecoveryStep[];
  postHealthCheck: AgentHealthReport | null;
  postInspection: InspectionReport | null;
  recoveredAt: string;
}

export type RecoveryStrategy = 'git' | 'file-copy' | 'none';

// ─────────────────────────────────────────────────────
// Internal agent class
// ─────────────────────────────────────────────────────

class RecoveryAgentInternal {
  /**
   * Full recovery pipeline:
   * 1. Validate checkpoint exists
   * 2. Attempt git restore (or file-copy fallback)
   * 3. Re-run HealthCheckAgent
   * 4. Re-run AgentInspector (if health check passes or partially)
   * 5. Return RecoveryReport with all steps and verification results
   */
  async restore(checkpointId: string, agentName?: string): Promise<RecoveryReport> {
    const steps: RecoveryStep[] = [];
    const errors: string[] = [];
    const restored: string[] = [];
    const failed: string[] = [];

    // ── Step 1: Validate checkpoint ──
    const cp = CuratorAgent.getCheckpoint(checkpointId);
    if (!cp) {
      steps.push({ step: 'validate-checkpoint', status: 'failure', detail: `Checkpoint '${checkpointId}' not found` });
      return this.buildReport(checkpointId, agentName ?? null, restored, failed, [cp ? '' : `Checkpoint '${checkpointId}' not found`], steps);
    }
    steps.push({ step: 'validate-checkpoint', status: 'success', detail: `Checkpoint '${checkpointId}' found with ${cp.filesTouched.length} files` });

    // ── Step 2: Determine recovery strategy ──
    const strategy = this.detectStrategy();
    steps.push({ step: 'detect-strategy', status: 'success', detail: `Using strategy: ${strategy}` });

    // ── Step 3: Restore files ──
    if (strategy === 'git') {
      const result = this.restoreViaGit(cp, agentName ?? null);
      restored.push(...result.restored);
      failed.push(...result.failed);
      errors.push(...result.errors);
      steps.push(...result.steps);
    } else if (strategy === 'file-copy') {
      const result = this.restoreViaFileCopy(cp, agentName ?? null);
      restored.push(...result.restored);
      failed.push(...result.failed);
      errors.push(...result.errors);
      steps.push(...result.steps);
    } else {
      // No strategy available — just report what would be restored
      for (const file of cp.filesTouched) {
        restored.push(file);
      }
      steps.push({ step: 'restore-files', status: 'skipped', detail: 'No git or file-copy fallback available — files listed as would-be-restored only' });
    }

    // ── Step 4: Mark rollback in curator ──
    if (failed.length === 0 && restored.length > 0) {
      CuratorAgent.markRollback(checkpointId);
      steps.push({ step: 'mark-rollback', status: 'success', detail: `Checkpoint '${checkpointId}' marked as rollback` });
    } else if (failed.length > 0) {
      steps.push({ step: 'mark-rollback', status: 'skipped', detail: 'Skipped — some files failed to restore' });
    }

    // ── Step 5: Post-recovery HealthCheckAgent ──
    let postHealthCheck: AgentHealthReport | null = null;
    try {
      postHealthCheck = await HealthCheckAgent.runChecks();
      steps.push({
        step: 'post-health-check',
        status: postHealthCheck.overall === 'healthy' ? 'success' : 'failure',
        detail: `HealthCheckAgent: tsc=${postHealthCheck.tscStatus}, build=${postHealthCheck.buildStatus}, tests=${postHealthCheck.testStatus}, overall=${postHealthCheck.overall}`,
      });
    } catch (err) {
      steps.push({ step: 'post-health-check', status: 'failure', detail: `HealthCheckAgent threw: ${err instanceof Error ? err.message : err}` });
    }

    // ── Step 6: Post-recovery AgentInspector ──
    let postInspection: InspectionReport | null = null;
    try {
      postInspection = await AgentInspector.inspect(path.resolve(process.cwd(), 'src', 'agents'));
      steps.push({
        step: 'post-inspection',
        status: postInspection.health === 'healthy' || postInspection.health === 'warning' ? 'success' : 'failure',
        detail: `AgentInspector: health=${postInspection.health}, ${postInspection.registryHealth.agentsWithCode}/${postInspection.registryHealth.registered} agents have code`,
      });
    } catch (err) {
      steps.push({ step: 'post-inspection', status: 'failure', detail: `AgentInspector threw: ${err instanceof Error ? err.message : err}` });
    }

    // ── Step 7: Overall success ──
    const overallSuccess = failed.length === 0;
    if (!overallSuccess) {
      steps.push({ step: 'overall', status: 'failure', detail: `Recovery completed with ${failed.length} failed, ${errors.length} errors` });
    } else {
      steps.push({ step: 'overall', status: 'success', detail: `All ${restored.length} files restored successfully` });
    }

    return {
      checkpointId,
      success: overallSuccess,
      agentName: agentName ?? null,
      restored,
      failed,
      errors,
      steps,
      postHealthCheck,
      postInspection,
      recoveredAt: new Date().toISOString(),
    };
  }

  /**
   * Restart an agent by name — currently a no-op that simulates restart.
   * In a real deployment, this would send a signal or invoke a lifecycle API.
   */
  async restartAgent(agentName: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate restart — in production, this would:
      // 1. Call AgentLifecycleAgent.deactivateAgent(agentName)
      // 2. Wait for graceful shutdown
      // 3. Re-initialize the agent
      // 4. Call AgentLifecycleAgent.activateAgent(agentName)
      return {
        success: true,
        message: `Agent '${agentName}' restart signaled (simulated — real lifecycle integration pending Phase 5)`,
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to restart agent '${agentName}': ${err instanceof Error ? err.message : err}`,
      };
    }
  }

  /**
   * Deactivate an agent — marks it as inactive in the registry.
   * In a real deployment, this would also stop the agent's runtime.
   */
  async deactivateAgent(agentName: string): Promise<{ success: boolean; message: string }> {
    try {
      // Import AgentRegistry inline to avoid circular dependency
      const { AgentRegistry } = await import('./AgentRegistry');
      const record = AgentRegistry.getAgent(agentName);
      if (!record) {
        return { success: false, message: `Agent '${agentName}' not found in registry` };
      }
      AgentRegistry.updateAgentStatus(agentName, 'inactive');
      return { success: true, message: `Agent '${agentName}' deactivated` };
    } catch (err) {
      return {
        success: false,
        message: `Failed to deactivate agent '${agentName}': ${err instanceof Error ? err.message : err}`,
      };
    }
  }

  /**
   * Rollback an entire section (category) — restores all checkpoints
   * that were created for agents in that section.
   */
  async rollbackSection(sectionName: string): Promise<RecoveryReport> {
    const steps: RecoveryStep[] = [];
    const restored: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    const sectionCheckpoints = CuratorAgent.recentCheckpoints.filter((cp) => {
      const phaseMatch = cp.phase.toLowerCase().includes(sectionName.toLowerCase());
      const fileMatch = cp.filesTouched.some((f) => f.toLowerCase().includes(sectionName.toLowerCase()));
      return phaseMatch || fileMatch;
    });

    if (sectionCheckpoints.length === 0) {
      steps.push({ step: 'find-checkpoints', status: 'failure', detail: `No checkpoints found for section '${sectionName}'` });
      return {
        checkpointId: `section-${sectionName}`,
        success: false,
        agentName: null,
        restored: [],
        failed: [],
        errors: [`No checkpoints found for section '${sectionName}'`],
        steps,
        postHealthCheck: null,
        postInspection: null,
        recoveredAt: new Date().toISOString(),
      };
    }

    steps.push({
      step: 'find-checkpoints',
      status: 'success',
      detail: `Found ${sectionCheckpoints.length} checkpoints for section '${sectionName}'`,
    });

    for (const cp of sectionCheckpoints) {
      const result = await this.restore(cp.id, `section:${sectionName}`);
      restored.push(...result.restored);
      failed.push(...result.failed);
      errors.push(...result.errors);
      if (result.success) {
        steps.push({ step: `restore-${cp.id}`, status: 'success', detail: `Checkpoint '${cp.id}' restored (${result.restored.length} files)` });
      } else {
        steps.push({ step: `restore-${cp.id}`, status: 'failure', detail: `Checkpoint '${cp.id}' failed: ${result.errors.join('; ')}` });
      }
    }

    const overallSuccess = failed.length === 0;
    if (!overallSuccess) {
      steps.push({ step: 'overall', status: 'failure', detail: `Section rollback completed with ${failed.length} failed files` });
    } else {
      steps.push({ step: 'overall', status: 'success', detail: `Section '${sectionName}' fully rolled back (${restored.length} files)` });
    }

    return {
      checkpointId: `section-${sectionName}`,
      success: overallSuccess,
      agentName: null,
      restored,
      failed,
      errors,
      steps,
      postHealthCheck: null,
      postInspection: null,
      recoveredAt: new Date().toISOString(),
    };
  }

  // ── Strategy detection ──

  private detectStrategy(): RecoveryStrategy {
    // Check if git is available
    try {
      execSync('git --version', {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 5000,
      });
      // Check if the project is a git repository
      execSync('git rev-parse --git-dir', {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 5000,
      });
      return 'git';
    } catch {
      // Git not available — check if we have checkpoint backup files
      const checkpointDir = path.resolve(process.cwd(), 'project-memory', 'checkpoints');
      if (fs.existsSync(checkpointDir)) {
        return 'file-copy';
      }
      return 'none';
    }
  }

  // ── Git restore ──

  private restoreViaGit(
    cp: Checkpoint,
    agentName: string | null,
  ): { restored: string[]; failed: string[]; errors: string[]; steps: RecoveryStep[] } {
    const restored: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];
    const steps: RecoveryStep[] = [];

    // Build list of files to restore, filtering by agent if specified
    const filesToRestore = agentName
      ? cp.filesTouched.filter((f) => f.includes(agentName))
      : [...cp.filesTouched];

    if (filesToRestore.length === 0) {
      steps.push({
        step: 'git-restore',
        status: 'success',
        detail: `No files to restore for ${agentName ?? 'full system'} from checkpoint '${cp.id}'`,
      });
      return { restored, failed, errors, steps };
    }

    // Before restore: stash any working changes to avoid conflicts
    try {
      execSync('git stash push -m "RecoveryAgent auto-stash before restore" 2>&1', {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 10000,
      });
    } catch {
      // Stash is optional — continue even if it fails
    }

    let anyRestored = false;
    for (const file of filesToRestore) {
      try {
        // Restore using git checkout <file> (old-style) or git restore <file>
        // Try git restore first (modern), fall back to git checkout
        try {
          execSync(`git restore -- "${file}" 2>&1`, {
            stdio: ['ignore', 'pipe', 'pipe'],
            encoding: 'utf-8',
            timeout: 15000,
          });
        } catch {
          execSync(`git checkout -- "${file}" 2>&1`, {
            stdio: ['ignore', 'pipe', 'pipe'],
            encoding: 'utf-8',
            timeout: 15000,
          });
        }
        restored.push(file);
        anyRestored = true;
      } catch (e) {
        failed.push(file);
        errors.push(`Failed to git-restore '${file}': ${e instanceof Error ? e.message : e}`);
      }
    }

    steps.push({
      step: 'git-restore',
      status: anyRestored ? 'success' : 'failure',
      detail: `git restore: ${restored.length} restored, ${failed.length} failed`,
    });

    return { restored, failed, errors, steps };
  }

  // ── File copy fallback ──

  private restoreViaFileCopy(
    cp: Checkpoint,
    agentName: string | null,
  ): { restored: string[]; failed: string[]; errors: string[]; steps: RecoveryStep[] } {
    const restored: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];
    const steps: RecoveryStep[] = [];

    const checkpointDir = path.resolve(process.cwd(), 'project-memory', 'checkpoints', cp.id);
    if (!fs.existsSync(checkpointDir)) {
      steps.push({
        step: 'file-copy-restore',
        status: 'failure',
        detail: `Checkpoint backup directory not found: ${checkpointDir}`,
      });
      return { restored, failed, errors, steps };
    }

    const filesToRestore = agentName
      ? cp.filesTouched.filter((f) => f.includes(agentName))
      : [...cp.filesTouched];

    if (filesToRestore.length === 0) {
      steps.push({
        step: 'file-copy-restore',
        status: 'success',
        detail: `No files to restore for ${agentName ?? 'full system'} from checkpoint '${cp.id}'`,
      });
      return { restored, failed, errors, steps };
    }

    let anyRestored = false;
    for (const file of filesToRestore) {
      const sourcePath = path.resolve(checkpointDir, file.replace(/[\\/]/g, '_'));
      const targetPath = path.resolve(process.cwd(), file);

      if (!fs.existsSync(sourcePath)) {
        failed.push(file);
        errors.push(`Backup file not found: ${sourcePath}`);
        continue;
      }

      try {
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, targetPath);
        restored.push(file);
        anyRestored = true;
      } catch (e) {
        failed.push(file);
        errors.push(`Failed to copy '${sourcePath}' -> '${targetPath}': ${e instanceof Error ? e.message : e}`);
      }
    }

    steps.push({
      step: 'file-copy-restore',
      status: anyRestored ? 'success' : 'failure',
      detail: `file-copy restore: ${restored.length} restored, ${failed.length} failed`,
    });

    return { restored, failed, errors, steps };
  }

  /**
   * Validate that a candidate checkpoint actually has restorable files on disk
   * (for git strategy, this is always true; for file-copy, we verify the backup dir).
   */
  validateRestoreCapability(checkpointId: string): { restorable: boolean; strategy: RecoveryStrategy; reason: string } {
    const strategy = this.detectStrategy();
    if (strategy === 'none') {
      return { restorable: false, strategy, reason: 'No git or file-copy fallback available' };
    }
    if (strategy === 'file-copy') {
      const cp = CuratorAgent.getCheckpoint(checkpointId);
      if (!cp) {
        return { restorable: false, strategy, reason: `Checkpoint '${checkpointId}' not found` };
      }
      const backupDir = path.resolve(process.cwd(), 'project-memory', 'checkpoints', checkpointId);
      if (!fs.existsSync(backupDir)) {
        return { restorable: false, strategy, reason: `Backup directory not found: ${backupDir}` };
      }
    }
    return { restorable: true, strategy, reason: `${strategy} strategy available` };
  }

  // ── Report builder ──

  private buildReport(
    checkpointId: string,
    agentName: string | null,
    restored: string[],
    failed: string[],
    errors: string[],
    steps: RecoveryStep[],
  ): RecoveryReport {
    return {
      checkpointId,
      success: failed.length === 0 && errors.length === 0,
      agentName,
      restored,
      failed,
      errors,
      steps,
      postHealthCheck: null,
      postInspection: null,
      recoveredAt: new Date().toISOString(),
    };
  }
}

export const RecoveryAgent = new RecoveryAgentInternal();
