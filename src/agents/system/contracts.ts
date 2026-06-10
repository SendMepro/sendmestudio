// contracts.ts — Managed agent contract for SystemSupervisorAgent governance
// Phase: CP-96 / System Governance Phase 1
// Status: created

/**
 * Result of a single ping() call from a managed agent.
 */
export interface PingResult {
  alive: boolean;
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  message?: string;
}

/**
 * Optional detailed health report an agent can provide beyond the ping contract.
 */
export interface ManagedAgentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  details: string;
  metrics?: Record<string, number | string>;
}

/**
 * Contract interface for every agent managed by SystemSupervisorAgent.
 *
 * All existing and future agents implement this contract (or are wrapped
 * by an adapter). The supervisor calls ping() on each managed agent at
 * a configurable interval to detect failures, timeouts, or stale state.
 */
export interface ManagedAgent {
  /** Unique name for this agent instance (e.g. "AgentRegistry", "HomeOrchestratorAgent") */
  name: string;

  /** Semantic version string (e.g. "1.0.0") */
  version: string;

  /**
   * Liveness check — must resolve quickly (target < 100ms).
   * If the agent is healthy, returns { alive: true, status: 'healthy' }.
   * If the agent is degraded (works but with issues), returns { alive: true, status: 'degraded' }.
   * If the agent has failed, the promise rejects or returns { alive: false }.
   */
  ping(): Promise<PingResult>;

  /**
   * Optional detailed health snapshot.
   * The supervisor calls this after a degraded ping to get more context.
   */
  health?(): Promise<ManagedAgentHealth>;
}
