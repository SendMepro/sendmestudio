// AgentLifecycleAgent — Full lifecycle management with 9-state model, transition history, recovery integration
// Phase: CP-100 / System Governance Phase 5
// Status: enhanced — unified AgentLifecycleStatus from types.ts, transition history, lifecycle report,
//                   RecoveryAgent integration for failed → recovering → recovered flow

import { AgentRegistry, type AgentDefinition } from './AgentRegistry';
import { RecoveryAgent } from './RecoveryAgent';
import type { AgentLifecycleStatus } from './types';

// ─────────────────────────────────────────────────────
// Report interfaces
// ─────────────────────────────────────────────────────

export interface LifecycleOperationResult {
  success: boolean;
  message: string;
  agent?: string;
  timestamp: string;
}

export interface TransitionRecord {
  agentName: string;
  previousStatus: AgentLifecycleStatus | null;
  newStatus: AgentLifecycleStatus;
  triggeredBy: string; // e.g. 'supervisor', 'recovery-agent', 'manual', 'agent-self'
  timestamp: string;
  reason: string;
}

export interface LifecycleReport {
  agents: {
    name: string;
    status: AgentLifecycleStatus;
    lastTransition: string;
    transitionCount: number;
  }[];
  byStatus: Partial<Record<AgentLifecycleStatus, number>>;
  totalTransitions: number;
  recentTransitions: TransitionRecord[];
  recoveryHistory: { agentName: string; checkpointId: string; success: boolean; recoveredAt: string }[];
}

export interface OrphanReport {
  orphans: string[];
  totalOrphans: number;
}

export interface DuplicateReport {
  duplicates: { name: string; matches: string[] }[];
  totalDuplicates: number;
}

export interface InactiveReport {
  inactive: { name: string; daysSinceUpdate: number }[];
  totalInactive: number;
}

export interface LifecycleAgentMetadata {
  version?: string;
  description?: string;
  dependencies?: string[];
  inputs?: string[];
  outputs?: string[];
  tags?: string[];
}

// ─────────────────────────────────────────────────────
// Lifecycle transition map
// ─────────────────────────────────────────────────────

const TRANSITION_MAP: Record<AgentLifecycleStatus, AgentLifecycleStatus[]> = {
  idle: ['starting', 'retired'],
  starting: ['running', 'failed', 'disabled'],
  running: ['degraded', 'failed', 'disabled'],
  degraded: ['running', 'failed', 'disabled'],
  failed: ['recovering', 'disabled', 'retired'],
  recovering: ['recovered', 'failed', 'disabled'],
  recovered: ['running', 'disabled', 'retired'],
  disabled: ['running', 'retired'],
  retired: [], // Terminal state — no transitions out
};

// ─────────────────────────────────────────────────────
// Internal agent class
// ─────────────────────────────────────────────────────

class AgentLifecycleInternal {
  private lifecycleStatuses: Map<string, AgentLifecycleStatus> = new Map();
  private agentMetadata: Map<string, LifecycleAgentMetadata> = new Map();
  private lastUpdated: Map<string, string> = new Map();
  private transitionCounts: Map<string, number> = new Map();

  /** Immutable transition history — never cleared, append-only */
  private transitionHistory: TransitionRecord[] = [];

  /** Recovery history — tracks all failed → recovering → recovered flows */
  private recoveryHistory: { agentName: string; checkpointId: string; success: boolean; recoveredAt: string }[] = [];

  // ── Registration ──

  /**
   * Register a new agent with lifecycle tracking.
   * Initial status: idle.
   */
  registerAgent(def: AgentDefinition): LifecycleOperationResult {
    const existing = AgentRegistry.getAgent(def.name);
    if (existing) {
      return {
        success: false,
        message: `Agent '${def.name}' already exists in AgentRegistry`,
        agent: def.name,
        timestamp: new Date().toISOString(),
      };
    }

    AgentRegistry.registerAgent(def);
    this.lifecycleStatuses.set(def.name, 'idle');
    this.agentMetadata.set(def.name, { description: def.description });
    this.lastUpdated.set(def.name, new Date().toISOString());
    this.transitionCounts.set(def.name, 0);

    this.recordTransition(def.name, null, 'idle', 'registration', 'Agent registered with idle status');

    return {
      success: true,
      message: `Agent '${def.name}' registered with status 'idle'`,
      agent: def.name,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Permanently retire an agent from the registry.
   */
  unregisterAgent(name: string): LifecycleOperationResult {
    const agent = AgentRegistry.getAgent(name);
    if (!agent) {
      return {
        success: false,
        message: `Agent '${name}' not found`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }

    // Transition to retired before removing
    this.transitionStatus(name, 'retired', 'manual', 'Agent permanently unregistered');
    this.lifecycleStatuses.delete(name);
    this.agentMetadata.delete(name);
    this.lastUpdated.delete(name);
    this.transitionCounts.delete(name);
    AgentRegistry.updateAgentStatus(name, 'inactive');

    return {
      success: true,
      message: `Agent '${name}' unregistered`,
      agent: name,
      timestamp: new Date().toISOString(),
    };
  }

  // ── 9-Status lifecycle transitions ──

  /** idle → starting → running */
  async startAgent(name: string): Promise<LifecycleOperationResult> {
    const r1 = this.transitionStatus(name, 'starting', 'supervisor', 'Agent starting');
    if (!r1.success) return r1;

    // In a real deployment, we'd await initialization here.
    // For now, simulate a successful start.
    return this.transitionStatus(name, 'running', 'supervisor', 'Agent started successfully');
  }

  /** running → degraded */
  demoteToDegraded(name: string, reason?: string): LifecycleOperationResult {
    return this.transitionStatus(name, 'degraded', 'supervisor', reason ?? 'Agent performance degraded');
  }

  /** degraded → running */
  promoteToRunning(name: string, reason?: string): LifecycleOperationResult {
    return this.transitionStatus(name, 'running', 'supervisor', reason ?? 'Agent recovered from degraded state');
  }

  /** running/degraded → failed → recovering → recovered → running */
  async escalateToFailed(name: string, reason?: string): Promise<LifecycleOperationResult> {
    const r1 = this.transitionStatus(name, 'failed', 'supervisor', reason ?? 'Agent failure detected');
    if (!r1.success) return r1;

    // Automatic recovery: transition to recovering, invoke RecoveryAgent, transition to recovered, back to running
    const recoverResult = await this.recoverAgent(name, `auto-recovery-${Date.now()}`);
    return recoverResult;
  }

  /** running → disabled */
  disableAgent(name: string, reason?: string): LifecycleOperationResult {
    return this.transitionStatus(name, 'disabled', 'manual', reason ?? 'Agent manually disabled');
  }

  /** disabled → running */
  enableAgent(name: string, reason?: string): LifecycleOperationResult {
    return this.transitionStatus(name, 'running', 'manual', reason ?? 'Agent re-enabled');
  }

  /** disabled/any → retired */
  retireAgent(name: string, reason?: string): LifecycleOperationResult {
    return this.transitionStatus(name, 'retired', 'manual', reason ?? 'Agent permanently retired');
  }

  // ── Archiving/deprecation (kept for backward compatibility) ──

  /** Alias: retireAgent */
  archiveAgent(name: string): LifecycleOperationResult {
    return this.retireAgent(name, 'Agent archived (via archiveAgent)');
  }

  /** Mark as degraded */
  deprecateAgent(name: string): LifecycleOperationResult {
    return this.demoteToDegraded(name, 'Agent deprecated — replacement exists');
  }

  /** idle/disabled → starting → running */
  async activateAgent(name: string): Promise<LifecycleOperationResult> {
    const current = this.lifecycleStatuses.get(name);
    if (current === 'running') {
      return {
        success: true,
        message: `Agent '${name}' is already running`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }
    if (current === 'retired') {
      return {
        success: false,
        message: `Cannot activate retired agent '${name}'`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }
    return this.startAgent(name);
  }

  /** running → disabled */
  deactivateAgent(name: string): LifecycleOperationResult {
    return this.disableAgent(name, 'Agent deactivated');
  }

  // ── Recovery integration ──

  /**
   * Full recovery flow: failed → recovering → (restore via RecoveryAgent) → recovered → running
   */
  async recoverAgent(agentName: string, checkpointId: string): Promise<LifecycleOperationResult> {
    const r1 = this.transitionStatus(agentName, 'recovering', 'recovery-agent', `RecoveryAgent invoked with checkpoint '${checkpointId}'`);
    if (!r1.success) return r1;

    try {
      const report = await RecoveryAgent.restore(checkpointId, agentName);

      if (report.success) {
        const r2 = this.transitionStatus(agentName, 'recovered', 'recovery-agent', `Recovery successful: ${report.restored.length} files restored`);
        this.recoveryHistory.push({
          agentName,
          checkpointId,
          success: true,
          recoveredAt: new Date().toISOString(),
        });

        // Auto-transition recovered → running
        return this.transitionStatus(agentName, 'running', 'recovery-agent', 'Agent auto-restarted after recovery');
      } else {
        this.recoveryHistory.push({
          agentName,
          checkpointId,
          success: false,
          recoveredAt: new Date().toISOString(),
        });
        return {
          success: false,
          message: `Recovery failed for '${agentName}': ${report.errors.join('; ')}`,
          agent: agentName,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `Recovery threw for '${agentName}': ${err instanceof Error ? err.message : err}`,
        agent: agentName,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ── Metadata ──

  /**
   * Update an agent's metadata without changing lifecycle status.
   */
  updateAgentMetadata(name: string, metadata: Partial<LifecycleAgentMetadata>): LifecycleOperationResult {
    const agent = AgentRegistry.getAgent(name);
    if (!agent) {
      return {
        success: false,
        message: `Agent '${name}' not found`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }

    const existing = this.agentMetadata.get(name) ?? {};
    Object.assign(existing, metadata);
    this.agentMetadata.set(name, existing);
    this.lastUpdated.set(name, new Date().toISOString());

    return {
      success: true,
      message: `Metadata updated for agent '${name}'`,
      agent: name,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Detection reports ──

  /**
   * Find agents with no other agents depending on them.
   */
  detectOrphanAgents(): OrphanReport {
    const allAgents = AgentRegistry.listAgents();
    const dependedNames = new Set<string>();

    for (const agent of allAgents) {
      for (const dep of agent.dependencies) {
        dependedNames.add(dep);
      }
    }

    const orphans = allAgents
      .filter((a) => !dependedNames.has(a.name) && a.name !== 'AgentRegistry')
      .map((a) => a.name);

    return { orphans, totalOrphans: orphans.length };
  }

  /**
   * Find agents with overlapping or duplicate responsibilities.
   */
  detectDuplicateAgents(): DuplicateReport {
    const allAgents = AgentRegistry.listAgents();
    const duplicates: { name: string; matches: string[] }[] = [];
    const checked = new Set<string>();

    for (let i = 0; i < allAgents.length; i++) {
      if (checked.has(allAgents[i].name)) continue;
      const matches: string[] = [];

      for (let j = i + 1; j < allAgents.length; j++) {
        if (allAgents[i].description === allAgents[j].description) {
          matches.push(allAgents[j].name);
          checked.add(allAgents[j].name);
        }
      }

      if (matches.length > 0) {
        duplicates.push({ name: allAgents[i].name, matches });
        checked.add(allAgents[i].name);
      }
    }

    return { duplicates, totalDuplicates: duplicates.length };
  }

  /**
   * Find agents that have been disabled or retired beyond a threshold.
   */
  detectInactiveAgents(thresholdDays: number = 30): InactiveReport {
    const now = new Date().getTime();
    const inactive: { name: string; daysSinceUpdate: number }[] = [];
    const inactiveStatuses: AgentLifecycleStatus[] = ['disabled', 'retired'];

    for (const [name, status] of this.lifecycleStatuses) {
      if (inactiveStatuses.includes(status)) {
        const lastUpdated = this.lastUpdated.get(name);
        if (lastUpdated) {
          const daysSince = Math.floor((now - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince >= thresholdDays) {
            inactive.push({ name, daysSinceUpdate: daysSince });
          }
        }
      }
    }

    return { inactive, totalInactive: inactive.length };
  }

  // ── Sync ──

  /**
   * Synchronize lifecycle state with the persisted agent-registry.json.
   * Placeholder — actual file I/O will be implemented when the runtime is connected.
   */
  async syncRegistry(): Promise<{ success: boolean; registryPath: string }> {
    return {
      success: true,
      registryPath: 'project-memory/agent-registry.json',
    };
  }

  // ── Status queries ──

  /**
   * Get the lifecycle status of an agent.
   */
  getStatus(name: string): AgentLifecycleStatus | undefined {
    return this.lifecycleStatuses.get(name);
  }

  /**
   * List all agents with their lifecycle status.
   */
  listLifecycleAgents(): { name: string; status: AgentLifecycleStatus; updatedAt: string }[] {
    const results: { name: string; status: AgentLifecycleStatus; updatedAt: string }[] = [];
    for (const [name, status] of this.lifecycleStatuses) {
      results.push({ name, status, updatedAt: this.lastUpdated.get(name) ?? '' });
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * List all agents filtered by a specific lifecycle status.
   */
  listByStatus(status: AgentLifecycleStatus): string[] {
    const names: string[] = [];
    for (const [name, s] of this.lifecycleStatuses) {
      if (s === status) names.push(name);
    }
    return names.sort();
  }

  // ── Lifecycle report ──

  /**
   * Produce a full lifecycle report with per-agent status, counts by status,
   * transition history, and recovery history.
   */
  getLifecycleReport(): LifecycleReport {
    const agents: LifecycleReport['agents'] = [];
    const byStatus: Partial<Record<AgentLifecycleStatus, number>> = {};

    for (const [name, status] of this.lifecycleStatuses) {
      agents.push({
        name,
        status,
        lastTransition: this.lastUpdated.get(name) ?? '',
        transitionCount: this.transitionCounts.get(name) ?? 0,
      });
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    // Get the 20 most recent transitions
    const recentTransitions = [...this.transitionHistory].reverse().slice(0, 20);

    return {
      agents,
      byStatus,
      totalTransitions: this.transitionHistory.length,
      recentTransitions,
      recoveryHistory: [...this.recoveryHistory].reverse().slice(0, 10),
    };
  }

  /**
   * Get the full transition history for a specific agent.
   */
  getAgentHistory(name: string): TransitionRecord[] {
    return this.transitionHistory.filter((t) => t.agentName === name);
  }

  // ── Private helpers ──

  private transitionStatus(
    name: string,
    target: AgentLifecycleStatus,
    triggeredBy: string,
    reason: string,
  ): LifecycleOperationResult {
    const agent = AgentRegistry.getAgent(name);
    if (!agent) {
      return {
        success: false,
        message: `Agent '${name}' not found`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }

    const current = this.lifecycleStatuses.get(name);
    if (current === target) {
      return {
        success: true,
        message: `Agent '${name}' is already '${target}'`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }

    const transition = this.isTransitionAllowed(current, target);
    if (!transition.allowed) {
      return {
        success: false,
        message: `Cannot transition '${name}' from '${current}' to '${target}': ${transition.reason}`,
        agent: name,
        timestamp: new Date().toISOString(),
      };
    }

    // Execute transition
    this.lifecycleStatuses.set(name, target);
    this.lastUpdated.set(name, new Date().toISOString());
    this.transitionCounts.set(name, (this.transitionCounts.get(name) ?? 0) + 1);

    // Sync with AgentRegistry status for compatible states
    if (target === 'running' || target === 'starting' || target === 'recovering' || target === 'recovered') {
      AgentRegistry.updateAgentStatus(name, 'active');
    }
    if (target === 'disabled' || target === 'retired') {
      AgentRegistry.updateAgentStatus(name, 'inactive');
    }

    // Record transition
    this.recordTransition(name, current ?? null, target, triggeredBy, reason);

    return {
      success: true,
      message: `Agent '${name}' transitioned from '${current}' to '${target}'`,
      agent: name,
      timestamp: new Date().toISOString(),
    };
  }

  private isTransitionAllowed(
    from: AgentLifecycleStatus | undefined,
    to: AgentLifecycleStatus,
  ): { allowed: boolean; reason: string } {
    if (!from) {
      // First transition is always allowed (registration sets idle)
      return { allowed: true, reason: '' };
    }

    const allowed = TRANSITION_MAP[from]?.includes(to) ?? false;
    if (!allowed) {
      return {
        allowed: false,
        reason: `Transition '${from}' → '${to}' is not a valid lifecycle transition`,
      };
    }
    return { allowed: true, reason: '' };
  }

  private recordTransition(
    agentName: string,
    previousStatus: AgentLifecycleStatus | null,
    newStatus: AgentLifecycleStatus,
    triggeredBy: string,
    reason: string,
  ): void {
    this.transitionHistory.push({
      agentName,
      previousStatus,
      newStatus,
      triggeredBy,
      timestamp: new Date().toISOString(),
      reason,
    });
  }
}

export const AgentLifecycleAgent = new AgentLifecycleInternal();
