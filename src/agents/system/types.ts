// types.ts — Shared types for the System Governance layer
// Phase: CP-100 / System Governance Phase 5
// Status: updated — unified 9-status lifecycle model

/**
 * Lifecycle statuses for agents managed by the SystemSupervisorAgent.
 *
 * 9-state model tracking every phase of an agent's existence.
 *
 * Transition rules (enforced by AgentLifecycleAgent):
 *   idle → starting → running
 *   running → degraded → failed → recovering → recovered → running
 *   running → disabled → retired
 *   idle → retired (never activated)
 *   disabled → retired (decommissioned)
 *   recovered → running (auto-restart)
 */
export type AgentLifecycleStatus =
  | 'idle'        // Registered but not yet started
  | 'starting'    // Initialization in progress
  | 'running'     // Active and healthy
  | 'degraded'    // Running with issues (e.g., high latency, partial failure)
  | 'failed'      // Unrecoverable error — needs RecoveryAgent
  | 'recovering'  // RecoveryAgent is actively restoring this agent
  | 'recovered'   // Restore completed — ready to re-enter running
  | 'disabled'    // Manually taken offline (graceful stop)
  | 'retired';    // Permanently decommissioned

/**
 * Category that an agent belongs to within the ecosystem.
 */
export type AgentCategory =
  | 'system'        // Governance agents (Registry, Inspector, Curator, etc.)
  | 'skill'         // Skill orchestrators (EmotionalSalonOrchestrator)
  | 'section'       // Section orchestrators (HomeOrchestrator, etc.)
  | 'leaf'          // Leaf agents (DataSource, Inspector, Metrics, etc.)
  | 'bridge'        // UI bridges (HomeBridge, etc.)
  | 'consumer'      // Event consumers (AppointmentSelectionConsumer, etc.)
  | 'infrastructure'// Core infrastructure (EventBus, IntelligenceLayer, etc.)
  | 'repository'    // Data repositories (not managed, but tracked for dependency mapping)
  | 'planned';      // Planned agents that don't exist yet
