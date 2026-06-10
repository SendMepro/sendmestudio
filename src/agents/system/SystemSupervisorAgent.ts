// SystemSupervisorAgent — Top-level runtime guardian of the entire agent ecosystem
// Phase: CP-98 / System Governance Phase 3
// Status: created

import type { PingResult, ManagedAgent, ManagedAgentHealth } from './contracts';
import { AgentRegistry, AGENT_DEFINITIONS } from './AgentRegistry';
import { AgentInspector, type InspectionReport } from './AgentInspector';
import { HealthCheckAgent, type AgentHealthReport } from './HealthCheckAgent';
import { CuratorAgent, type Checkpoint } from './CuratorAgent';
import { RecoveryAgent, type RecoveryReport } from './RecoveryAgent';
import { AgentLifecycleAgent } from './AgentLifecycleAgent';
import { DEFAULT_SUPERVISOR_CONFIG, type SupervisorConfig } from '../../system/config';
import {
  EmotionalSalonOrchestratorAdapter,
  HomeMetricsAgentAdapter,
  HomeAIInsightAgentAdapter,
  HomeLearningAgentAdapter,
  HomeDataSourceAgentAdapter,
  HomeInspectorAgentAdapter,
  HomeHealthCheckAgentAdapter,
  IntelligenceLayerAdapter,
  KnowledgeBundleAgentAdapter,
  KnowledgeCompletionAgentAdapter,
  BrainDataAgentAdapter,
  BrainVoiceAgentAdapter,
  BrainNotesAgentAdapter,
  BrainQRTokenAgentAdapter,
  BrainAuthAgentAdapter,
} from './adapters';
import path from 'node:path';
import { BusinessEventBus, type BusinessMetrics } from './BusinessEventBus';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export type HeartbeatStatus = 'alive' | 'degraded' | 'unreachable';

export interface AgentHeartbeat {
  agentName: string;
  status: HeartbeatStatus;
  lastPing: string;
  consecutiveFailures: number;
  lastError: string | null;
}

export interface SupervisorReport {
  supervisor: string;
  version: string;
  uptime: number;
  managedCount: number;
  heartbeats: AgentHeartbeat[];
  totalAlive: number;
  totalDegraded: number;
  totalUnreachable: number;
  lastInspection: InspectionReport | null;
  lastHealthCheck: AgentHealthReport | null;
  lastCheckpoint: Checkpoint | null;
  lastRecovery: RecoveryReport & { id: string } | null;
  overall: 'healthy' | 'degraded' | 'critical';
  pollIntervalMs: number;
  isPolling: boolean;
  checkedAt: string;
  /** G-9: Real business activity metrics from BusinessEventBus */
  businessMetrics: BusinessMetrics;
}

// All agents that can respond to ping() are registered here.
// The supervisor maintains an internal heartbeat map for live tracking.
export class SystemSupervisorAgent implements ManagedAgent {
  name = 'SystemSupervisorAgent';
  version = '1.0.0';

  private config: SupervisorConfig;
  private startTime: number = 0;
  private initialized = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeats: Map<string, AgentHeartbeat> = new Map();

  // Cached reports from inspections / health checks
  private lastInspection: InspectionReport | null = null;
  private lastHealthCheck: AgentHealthReport | null = null;
  private lastCheckpoint: Checkpoint | null = null;
  private lastRecovery: (RecoveryReport & { id: string }) | null = null;

  // Fast snapshot cache — updated on every poll cycle and on explicit cacheRefresh()
  // API consumers can retrieve this instantly without any async work.
  private cachedSnapshot: SupervisorReport | null = null;

  constructor(config?: Partial<SupervisorConfig>) {
    this.config = { ...DEFAULT_SUPERVISOR_CONFIG, ...config };
  }

  // ── ManagedAgent contract ──

  async ping(): Promise<PingResult> {
    return {
      alive: this.initialized,
      status: this.initialized ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      message: this.initialized
        ? `Supervisor running, monitoring ${this.heartbeats.size} agents`
        : 'Supervisor not initialized',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    const report = await this.getReport();
    return {
      status: report.overall === 'healthy' ? 'healthy' : report.overall === 'degraded' ? 'degraded' : 'critical',
      details: `${report.totalAlive} alive, ${report.totalDegraded} degraded, ${report.totalUnreachable} unreachable`,
      metrics: {
        uptime: report.uptime,
        managedCount: report.managedCount,
        pollIntervalMs: report.pollIntervalMs,
      },
    };
  }

  // ── Lifecycle ──

  async initialize(): Promise<SupervisorReport> {
    if (this.initialized) {
      return this.getReport();
    }

    this.startTime = Date.now();

    // Step 1: Register all system agents (if not already done by orchestrator)
    // The EmotionalSalonOrchestrator.initialize() typically does this, but
    // we ensure it happens here too in case the supervisor initializes independently.
    this.ensureSystemAgentsRegistered();

    // Step 2: Register ALL existing agent classes as managed agents
    // Each agent gets a heartbeat entry. The actual ping() call happens later.
    this.registerAllExistingAgents();

    // Step 3: Startup checks
    if (this.config.healthCheckOnStartup) {
      try {
        this.lastHealthCheck = await HealthCheckAgent.runChecks();
      } catch (err) {
        console.error('[SystemSupervisorAgent] Startup health check failed:', err);
      }
    }

    if (this.config.inspectionOnStartup) {
      try {
        this.lastInspection = await AgentInspector.inspect(
          path.resolve(process.cwd(), 'src', 'agents'),
        );
      } catch (err) {
        console.error('[SystemSupervisorAgent] Startup inspection failed:', err);
      }
    }

    // Step 4: Initial checkpoint
    try {
      this.lastCheckpoint = CuratorAgent.createCheckpoint(
        `supervisor-init-${Date.now()}`,
        'SystemSupervisorAgent initialized',
        ['src/agents/system/SystemSupervisorAgent.ts'],
        'system-governance',
      );
    } catch (err) {
      console.error('[SystemSupervisorAgent] Startup checkpoint failed:', err);
    }

    this.initialized = true;

    // Step 5: Start polling
    if (this.config.enabled) {
      this.startPolling();
    }

    return this.getReport();
  }

  async shutdown(): Promise<void> {
    this.stopPolling();
    this.initialized = false;
    this.startTime = 0;
  }

  // ── Polling ──

  startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      this.pollCycle().catch((err) =>
        console.error('[SystemSupervisorAgent] Poll cycle error:', err),
      );
    }, this.config.pollingIntervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  get isPolling(): boolean {
    return this.pollTimer !== null;
  }

  /**
   * One poll cycle: ping all managed agents, update heartbeats, detect failures.
   */
  private async pollCycle(): Promise<void> {
    const results = await this.pingAllDirect();

    for (const agentName of this.heartbeats.keys()) {
      const result = results.get(agentName);
      const existing = this.heartbeats.get(agentName)!;

      if (!result) {
        // Agent missing from results — mark unreachable
        existing.consecutiveFailures++;
        existing.status = 'unreachable';
        existing.lastError = 'No ping result returned';
      } else if (!result.alive) {
        existing.consecutiveFailures++;
        existing.status = existing.consecutiveFailures >= this.config.failureThreshold ? 'unreachable' : 'degraded';
        existing.lastError = result.message ?? 'ping() returned alive=false';
      } else if (result.status === 'degraded') {
        existing.consecutiveFailures = 0;
        existing.status = 'degraded';
        existing.lastError = result.message ?? null;
      } else {
        existing.consecutiveFailures = 0;
        existing.status = 'alive';
        existing.lastError = null;
      }
      existing.lastPing = result?.timestamp ?? new Date().toISOString();
    }
  }

  // ── Ping all ──

  /**
   * Ping all managed agents and return their heartbeat statuses.
   * This is the public API — also returns the full heartbeat map.
   */
  async pingAll(): Promise<AgentHeartbeat[]> {
    const results = await this.pingAllDirect();
    // Update heartbeats map with results
    for (const [name, result] of results) {
      const existing = this.heartbeats.get(name);
      if (existing) {
        existing.status = result.status === 'alive'
          ? 'alive'
          : (existing.consecutiveFailures >= this.config.failureThreshold ? 'unreachable' : 'degraded');
        existing.lastPing = result.timestamp;
        existing.lastError = result.message ?? null;
        if (result.status === 'alive') {
          existing.consecutiveFailures = 0;
        }
      }
    }
    return Array.from(this.heartbeats.values());
  }

  /**
   * Internal: ping all registered managed agents and return raw results.
   * Timeout-guarded: each ping() call races against a timeout.
   */
  private async pingAllDirect(): Promise<Map<string, { alive: boolean; status: string; timestamp: string; message?: string }>> {
    const results = new Map<string, { alive: boolean; status: string; timestamp: string; message?: string }>();

    const pingTasks: Promise<void>[] = [];

    for (const [name, _heartbeat] of this.heartbeats) {
      const agent = this.getAgentInstance(name);
      if (!agent) {
        results.set(name, { alive: false, status: 'unreachable', timestamp: new Date().toISOString(), message: 'No agent instance registered' });
        continue;
      }

      pingTasks.push(
        this.pingWithTimeout(agent, name).then((r) => {
          results.set(name, r);
        }),
      );
    }

    await Promise.allSettled(pingTasks);
    return results;
  }

  private async pingWithTimeout(
    agent: ManagedAgent,
    name: string,
  ): Promise<{ alive: boolean; status: string; timestamp: string; message?: string }> {
    const timeout = new Promise<{ alive: boolean; status: string; timestamp: string; message?: string }>((resolve) =>
      setTimeout(() => resolve({ alive: false, status: 'unreachable', timestamp: new Date().toISOString(), message: `ping() timeout after ${this.config.pingTimeoutMs}ms` }), this.config.pingTimeoutMs),
    );

    try {
      const result = await Promise.race([agent.ping(), timeout]);
      return result;
    } catch (err) {
      return {
        alive: false,
        status: 'unreachable',
        timestamp: new Date().toISOString(),
        message: err instanceof Error ? err.message : 'ping() threw an error',
      };
    }
  }

  // ── Registration ──

  registerManagedAgent(agent: ManagedAgent): void {
    if (!this.heartbeats.has(agent.name)) {
      this.heartbeats.set(agent.name, {
        agentName: agent.name,
        status: 'alive',
        lastPing: new Date().toISOString(),
        consecutiveFailures: 0,
        lastError: null,
      });
    }
  }

  unregisterManagedAgent(name: string): void {
    this.heartbeats.delete(name);
  }

  getHeartbeat(name: string): AgentHeartbeat | null {
    return this.heartbeats.get(name) ?? null;
  }

  // ── Governance ──

  async runInspection(sectionPath?: string): Promise<InspectionReport> {
    const resolvedPath = sectionPath ?? path.resolve(process.cwd(), 'src', 'agents');
    const report = await AgentInspector.inspect(resolvedPath);
    this.lastInspection = report;
    return report;
  }

  async runHealthCheck(): Promise<AgentHealthReport> {
    const report = await HealthCheckAgent.runChecks();
    this.lastHealthCheck = report;
    return report;
  }

  async runRecovery(checkpointId: string): Promise<RecoveryReport & { id: string }> {
    const report = await RecoveryAgent.restore(checkpointId);
    this.lastRecovery = { ...report, id: checkpointId };
    return this.lastRecovery;
  }

  createCheckpoint(id: string, description: string, files: string[], phase: string): Checkpoint {
    const cp = CuratorAgent.createCheckpoint(id, description, files, phase);
    this.lastCheckpoint = cp;
    return cp;
  }

  // ── Status ──

  getReport(): SupervisorReport {
    const heartbeats = Array.from(this.heartbeats.values());
    const totalAlive = heartbeats.filter((h) => h.status === 'alive').length;
    const totalDegraded = heartbeats.filter((h) => h.status === 'degraded').length;
    const totalUnreachable = heartbeats.filter((h) => h.status === 'unreachable').length;

    const overall: SupervisorReport['overall'] =
      totalUnreachable > 0
        ? 'critical'
        : totalDegraded > 0
          ? 'degraded'
          : this.initialized
            ? 'healthy'
            : 'degraded';

    const snapshot: SupervisorReport = {
      supervisor: 'SystemSupervisorAgent',
      version: this.version,
      uptime: this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      managedCount: heartbeats.length,
      heartbeats,
      totalAlive,
      totalDegraded,
      totalUnreachable,
      lastInspection: this.lastInspection,
      lastHealthCheck: this.lastHealthCheck,
      lastCheckpoint: this.lastCheckpoint,
      lastRecovery: this.lastRecovery,
      overall,
      pollIntervalMs: this.config.pollingIntervalMs,
      isPolling: this.isPolling,
      checkedAt: new Date().toISOString(),
      businessMetrics: BusinessEventBus.getMetrics(),
    };

    this.cachedSnapshot = snapshot;
    return snapshot;
  }

  /**
   * Get the latest cached snapshot without recomputing.
   * Returns null if no snapshot has been computed yet (supervisor not initialized).
   * This is the zero-latency path for API consumers.
   */
  getCachedReport(): SupervisorReport | null {
    return this.cachedSnapshot;
  }

  /**
   * Force refresh the cached snapshot immediately.
   * Called automatically by getReport() — this is for external callers that
   * want to refresh without getting the full report object.
   */
  refreshCache(): void {
    this.getReport();
  }

  // ── Private helpers ──

  /**
   * Ensure system agents are registered in AgentRegistry.
   * This mirrors the EmotionalSalonOrchestrator.initialize() logic
   * but runs independently for standalone use.
   */
  private ensureSystemAgentsRegistered(): void {
    for (const agentDef of AGENT_DEFINITIONS) {
      if (!AgentRegistry.getAgent(agentDef.name)) {
        AgentRegistry.registerAgent(agentDef);
      }
    }
  }

  /**
   * Register all known existing agent singletons as managed agents.
   * This creates heartbeat entries for them.
   */
  private registerAllExistingAgents(): void {
    // System agents
    this.tryRegister('AgentRegistry');
    this.tryRegister('AgentInspector');
    this.tryRegister('CuratorAgent');
    this.tryRegister('RecoveryAgent');
    this.tryRegister('HealthCheckAgent');
    this.tryRegister('AgentLifecycleAgent');
    // Also register self
    this.tryRegister('SystemSupervisorAgent');

    // ── Runtime agents (G-1) ──
    this.tryRegister('EmotionalSalonOrchestrator');
    this.tryRegister('HomeMetricsAgent');
    this.tryRegister('HomeAIInsightAgent');
    this.tryRegister('HomeLearningAgent');
    this.tryRegister('HomeDataSourceAgent');
    this.tryRegister('HomeInspectorAgent');
    this.tryRegister('HomeHealthCheckAgent');
    this.tryRegister('IntelligenceLayer');

    // ── Knowledge agents (G-2) ──
    this.tryRegister('KnowledgeBundleAgent');
    this.tryRegister('KnowledgeCompletionAgent');

    // ── Brain Admin agents (G-3) ──
    this.tryRegister('BrainDataAgent');
    this.tryRegister('BrainVoiceAgent');
    this.tryRegister('BrainNotesAgent');
    this.tryRegister('BrainQRTokenAgent');
    this.tryRegister('BrainAuthAgent');
  }

  private tryRegister(name: string): void {
    if (!this.heartbeats.has(name)) {
      this.heartbeats.set(name, {
        agentName: name,
        status: 'alive',
        lastPing: new Date().toISOString(),
        consecutiveFailures: 0,
        lastError: null,
      });
    }
  }

  /**
   * Get a ManagedAgent instance by name.
   * This maps known agent names to their singleton instances.
   */
  private getAgentInstance(name: string): ManagedAgent | null {
    // Map known agent names to their singleton/static instances
    // The supervisor registers itself so it's also pingable
    switch (name) {
      case 'SystemSupervisorAgent': return this;
      case 'AgentRegistry': return AgentRegistry as unknown as ManagedAgent;
      case 'AgentInspector': return AgentInspector as unknown as ManagedAgent;
      case 'CuratorAgent': return CuratorAgent as unknown as ManagedAgent;
      case 'RecoveryAgent': return RecoveryAgent as unknown as ManagedAgent;
      case 'HealthCheckAgent': return HealthCheckAgent as unknown as ManagedAgent;
      case 'AgentLifecycleAgent': return AgentLifecycleAgent as unknown as ManagedAgent;

      // ── Runtime agents (G-1) ──
      case 'EmotionalSalonOrchestrator': return new EmotionalSalonOrchestratorAdapter();
      case 'HomeMetricsAgent': return new HomeMetricsAgentAdapter();
      case 'HomeAIInsightAgent': return new HomeAIInsightAgentAdapter();
      case 'HomeLearningAgent': return new HomeLearningAgentAdapter();
      case 'HomeDataSourceAgent': return new HomeDataSourceAgentAdapter();
      case 'HomeInspectorAgent': return new HomeInspectorAgentAdapter();
      case 'HomeHealthCheckAgent': return new HomeHealthCheckAgentAdapter();
      case 'IntelligenceLayer': return new IntelligenceLayerAdapter();

      // ── Knowledge agents (G-2) ──
      case 'KnowledgeBundleAgent': return new KnowledgeBundleAgentAdapter();
      case 'KnowledgeCompletionAgent': return new KnowledgeCompletionAgentAdapter();

      // ── Brain Admin agents (G-3) ──
      case 'BrainDataAgent': return new BrainDataAgentAdapter();
      case 'BrainVoiceAgent': return new BrainVoiceAgentAdapter();
      case 'BrainNotesAgent': return new BrainNotesAgentAdapter();
      case 'BrainQRTokenAgent': return new BrainQRTokenAgentAdapter();
      case 'BrainAuthAgent': return new BrainAuthAgentAdapter();
      default: return null;
    }
  }
}

// Singleton export
export const SystemSupervisor = new SystemSupervisorAgent();
