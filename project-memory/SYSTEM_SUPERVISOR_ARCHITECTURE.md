# SYSTEM SUPERVISOR ARCHITECTURE

**Generated:** 2026-05-31T00:41 UTC  
**Status:** Design / No implementation  
**Next phase after:** All UI extraction complete (Home, Inbox, Brain Admin, Knowledge)

---

## 1. Proposed SystemSupervisorAgent

### Location
`src/agents/system/SystemSupervisorAgent.ts`

### Role
The **SystemSupervisorAgent** is the top-level runtime guardian of the entire agent ecosystem. Unlike the current `EmotionalSalonOrchestrator` (which is a manual-invocation skeleton that returns strings), the SystemSupervisorAgent:

- **Polls** managed agents for health (heartbeat/ping)
- **Detects** failures (timeout, crash, stale state)
- **Triggers** recovery via RecoveryAgent + CuratorAgent
- **Runs** periodic inspections via AgentInspector
- **Manages** lifecycle transitions via AgentLifecycleAgent
- **Routes** section requests to real section orchestrators (not string messages)
- **Reports** system-wide status as a single endpoint

### Interface Design

```typescript
// src/agents/system/SystemSupervisorAgent.ts

export interface SupervisorConfig {
  pollingIntervalMs: number;        // How often to ping managed agents
  failureThreshold: number;         // Consecutive pings missed before declaring failure
  autoRecover: boolean;             // Whether to auto-trigger RecoveryAgent
  healthCheckOnStartup: boolean;    // Run HealthCheckAgent on init
}

export interface AgentHeartbeat {
  agentName: string;
  status: 'alive' | 'degraded' | 'unreachable';
  lastPing: string;
  consecutiveFailures: number;
  lastError: string | null;
}

export interface SupervisorReport {
  supervisor: string;               // "SystemSupervisorAgent"
  version: string;
  uptime: number;                   // seconds since init
  managedAgents: AgentHeartbeat[];
  totalAlive: number;
  totalDegraded: number;
  totalUnreachable: number;
  lastInspection: InspectionReport | null;
  lastHealthCheck: HealthReport | null;
  lastCheckpoint: Checkpoint | null;
  lastRecovery: RecoveryReport | null;
  overall: 'healthy' | 'degraded' | 'critical';
}

export class SystemSupervisorAgent {
  constructor(config: SupervisorConfig);
  
  // Lifecycle
  initialize(): Promise<SupervisorReport>;
  shutdown(): Promise<void>;

  // Supervision
  registerManagedAgent(agent: ManagedAgent): void;
  unregisterManagedAgent(name: string): void;
  getHeartbeat(name: string): AgentHeartbeat | null;
  
  // Polling
  startPolling(): void;
  stopPolling(): void;
  pingAll(): Promise<AgentHeartbeat[]>;
  
  // Routing
  routeToSection(section: string, request: SectionRequest): Promise<SectionResponse>;
  
  // Governance
  runInspection(sectionPath?: string): Promise<InspectionReport>;
  runHealthCheck(): Promise<HealthReport>;
  runRecovery(checkpointId: string): Promise<RecoveryReport>;
  createCheckpoint(id: string, description: string, files: string[], phase: string): Checkpoint;
  
  // Status
  getReport(): SupervisorReport;
}
```

### ManagedAgent Contract

```typescript
export interface ManagedAgent {
  name: string;
  version: string;
  
  // The supervisor calls this to check liveness
  ping(): Promise<{ alive: boolean; status: string; timestamp: string }>;
  
  // Optional: the agent can provide a health detail
  health?(): Promise<{ status: 'healthy' | 'degraded' | 'critical'; details: string }>;
}
```

All existing and future agents implement this contract (or are wrapped by an adapter).

---

## 2. Proposed AgentInspector (Enhanced)

### Current State
The existing `AgentInspector` in `src/agents/system/AgentInspector.ts` works as a file-system scanner. It reads `.ts`/`.tsx` files, extracts import strings, and returns an `InspectionReport`.

### What Changes
The AgentInspector gains two new capabilities:

1. **Agent-level inspection** — not just file-system, but inspects the agent registry, checks which agents are registered vs. which have code vs. which have contracts, and cross-references with `agent-registry.json`.

2. **Registered-Agent Inspector** — given a section name (e.g., "messages"), checks:
   - Are all 6 planned agents registered in AgentRegistry?
   - Do they have code files matching their names?
   - Do their imports resolve?
   - Are there orphan/dependency issues?

### Enhanced Interface

```typescript
// Augmented AgentInspector
export interface AgentInspectionReport {
  // File-level inspection (existing)
  section: string;
  path: string;
  files: string[];
  dependencies: string[];
  issues: string[];
  health: 'healthy' | 'warning' | 'critical';
  inspectedAt: string;
  
  // Agent-level inspection (new)
  registryHealth: {
    registeredAgents: number;
    agentsWithCode: number;
    agentsWithoutCode: string[];       // registered but no .ts file
    codeFilesWithoutRegistration: string[]; // has .ts but not registered
  };
  sectionCompletion: {
    planned: number;
    created: number;
    active: number;
    missing: string[];                 // in registry but status=planned
  };
  dependencyIssues: {
    agent: string;
    missingDependency: string;
  }[];
}
```

### How It's Called
- On startup: `SystemSupervisorAgent.runInspection()` calls this for every section.
- On change: after an agent is created/updated, the supervisor calls a targeted section inspection.
- On demand: the supervisor exposes `inspect(path)` as a governance endpoint.

---

## 3. Proposed HealthCheckAgent (Enhanced)

### Current State
The existing `HealthCheckAgent` in `src/agents/system/HealthCheckAgent.ts` returns `skipped` for all three checks (build, lint, routes). It has no real shell integration.

### What Changes

```typescript
// Enhanced HealthCheckAgent
export interface AgentHealthReport {
  // Build checks (existing, now real)
  tscStatus: 'pass' | 'fail' | 'skipped';
  buildStatus: 'pass' | 'fail' | 'skipped';
  testStatus: 'pass' | 'fail' | 'skipped';
  
  // Agent ecosystem checks (new)
  agentRegistryCheck: {
    total: number;
    byStatus: { active: number; inactive: number; pending: number };
    byCategory: Record<string, number>;
  };
  
  // Feature flag checks (new)
  featureFlagConsistency: {
    allFlagsAccounted: boolean;
    flagsEnabled: number;
    flagsDisabled: number;
    mismatches: string[];   // flags that are enabled but agent code is skeleton
  };
  
  // Bridge health checks (new)
  bridgeConnectivity: {
    homeBridge: 'connected' | 'partial' | 'disconnected';
    messagesBridge: 'connected' | 'partial' | 'disconnected' | 'not_created';
    campaignsBridge: 'connected' | 'partial' | 'disconnected' | 'not_created';
  };
  
  overall: 'healthy' | 'degraded' | 'critical';
  checkedAt: string;
}
```

### Real Shell Integration
- **tsc check**: `execSync('npx tsc --noEmit')` with timeout and error parsing.
- **build check**: `execSync('npm run build')` — or a subset build for speed.
- **test check**: `execSync('npx jest --ci --silent')` with count parsing.

---

## 4. Proposed RecoveryAgent (Enhanced)

### Current State
The existing `RecoveryAgent` in `src/agents/system/RecoveryAgent.ts` looks up a checkpoint from `CuratorAgent` but has placeholder restore logic — it only pushes file names to `restored[]` without actually restoring.

### What Changes

```typescript
// Enhanced RecoveryAgent
export interface AgentRecoveryReport {
  checkpointId: string;
  checkpointDescription: string;
  success: boolean;
  steps: {
    step: string;
    status: 'completed' | 'failed' | 'skipped';
    detail: string;
  }[];
  restored: string[];
  failed: string[];
  errors: string[];
  recoveredAt: string;
  
  // Agent-specific recovery (new)
  agentActions: {
    agentName: string;
    action: 'restarted' | 'deactivated' | 'archived' | 'rolled_back';
    success: boolean;
  }[];
}
```

### Recovery Strategy

| Failure Type | Recovery Strategy | Steps |
|---|---|---|
| **Agent crashes** (no ping response) | Restart the agent singleton | 1. Mark agent as `inactive` in lifecycle<br>2. Re-instantiate the agent class<br>3. Run health check on the agent<br>4. Mark as `active` if healthy |
| **Agent returns bad data** | Degrade the agent | 1. Flag agent as `degraded` in heartbeat<br>2. Route requests through fallback (Bridge fallbackToLegacy pattern)<br>3. Notify supervisor<br>4. Create CuratorAgent checkpoint of current state |
| **Build breaks** | Rollback to last stable checkpoint | 1. Restore files from last stable CuratorAgent checkpoint<br>2. Re-run build check<br>3. If build passes → mark checkpoint as rollback<br>4. If build fails → attempt next checkpoint back |
| **Uncaught error in agent** | Isolate and restart | 1. Remove agent from active routing<br>2. Run HealthCheckAgent to assess system health<br>3. Restart agent with backoff (1s, 5s, 30s)<br>4. Re-register if restart succeeds |

### Git Integration (Future)
RecoveryAgent could integrate with git:

```typescript
// Future git-backed restore
export interface GitBackedRecovery {
  commitHash: string;
  resetType: 'soft' | 'hard';
  stashChanges: boolean;
}
```

---

## 5. Proposed AgentLifecycleAgent (Enhanced)

### Current State
The existing `AgentLifecycleAgent` in `src/agents/system/AgentLifecycleAgent.ts` works well for metadata tracking. It supports 6 statuses (planned → created → active → inactive → deprecated → archived) with transition rules.

### What Changes

```typescript
// Enhanced AgentLifecycleAgent
export type AgentLifecycleStatus =
  | 'planned'
  | 'created'
  | 'active'
  | 'running'          // NEW: actively processing, beyond just being active
  | 'degraded'          // NEW: agent works but with issues
  | 'inactive'
  | 'deprecated'
  | 'archived'
  | 'failed';           // NEW: agent crashed and recovery didn't help

export interface AgentLifecycleOperationResult {
  success: boolean;
  message: string;
  agent?: string;
  timestamp: string;
  supervisorAction?: 'none' | 'recovery' | 'restart' | 'deactivate';
}
```

### New Transition Map

```
planned ──→ created ──→ active ──→ running
                           │            │
                           ├──→ degraded ──→ inactive
                           │                  │
                           ├──→ inactive ────→ active (restart)
                           │
                           └──→ failed ──→ RecoveryAgent triggered
                                              │
                                              ├──→ active (recovered)
                                              └──→ archived (unrecoverable)

created ──→ archived (never activated)
inactive ──→ archived (decommissioned)
deprecated ──→ archived (replaced)
```

### Automatic Lifecycle Management

The supervisor calls the lifecycle agent to:

1. **Promote** agents from `created` → `active` after successful initialization.
2. **Demote** agents from `active` → `degraded` when health checks show partial failures.
3. **Escalate** agents from `degraded` → `failed` when recovery attempts fail.
4. **Archive** agents when a replacement agent takes over.

---

## 6. Agent Hierarchy

```
SystemSupervisorAgent                              ← ONE supervisor
├── AgentRegistry                                   ← Read-only: registry queries
├── AgentInspector (enhanced)                       ← Read-only: inspection queries
├── CuratorAgent                                    ← Write: checkpoints + validation
├── RecoveryAgent (enhanced)                        ← Write: recovery actions
├── HealthCheckAgent (enhanced)                     ← Read-only: health queries
├── AgentLifecycleAgent (enhanced)                  ← Write: lifecycle transitions
│
├── EmotionalSalonOrchestrator (refactored)         ← Routing layer (NOT supervisor)
│   ├── routeSection("home")        → HomeOrchestratorAgent
│   ├── routeSection("messages")    → ReceptionOrchestratorAgent (future)
│   ├── routeSection("campaigns")   → CampaignOrchestratorAgent (future)
│   ├── routeSection("intelligence")→ IntelligenceOrchestratorAgent (future)
│   └── validateMetaCompliance()    → Meta compliance guard
│
├── HomeOrchestratorAgent                            ← Section orchestrator
│   ├── HomeDataSourceAgent
│   ├── HomeInspectorAgent
│   ├── HomeHealthCheckAgent
│   ├── HomeLearningAgent
│   ├── HomeMetricsAgent
│   ├── HomeAIInsightAgent
│   └── (plus: EventBus pipeline, IntelligenceLayer, Consumers)
│
├── [planned] ReceptionOrchestratorAgent             ← Section orchestrator
│   ├── ConversationInspectorAgent
│   ├── IntentDetectionAgent
│   ├── DraftResponseAgent
│   ├── MetaReplyGuardAgent
│   └── ConversationMemoryAgent
│
├── [planned] CampaignOrchestratorAgent             ← Section orchestrator
│   ├── AudienceAgent
│   ├── TemplateValidationAgent
│   ├── CampaignComplianceAgent
│   ├── DeliveryMonitorAgent
│   └── CampaignLearningAgent
│
├── [planned] IntelligenceOrchestratorAgent         ← Section orchestrator
│   ├── ClientProfileAgent
│   ├── PreferenceMiningAgent
│   ├── OpportunityDetectionAgent
│   └── SalonTrendsAgent
│
└── Bridges (wires agents to UI)
    ├── HomeBridge
    ├── [planned] MessagesBridge
    ├── [planned] CampaignsBridge
    └── [planned] IntelligenceBridge
```

### Key Design Principle
**SystemSupervisorAgent does NOT route business tasks.**  
Routing is handled by `EmotionalSalonOrchestrator` (the skill layer).

The supervisor's job is governance:
- Is every agent alive?
- Is every agent healthy?
- Can we recover from failures?
- Are lifecycle changes safe?

The orchestrator's job is routing:
- Which agent handles this request?
- What's the response format?
- Is Meta compliance satisfied?

---

## 7. Runtime Flow

### Startup Sequence

```
1. Application boots
       │
2. SystemSupervisorAgent.initialize()
       │
3. Supervisor calls AgentLifecycleAgent to register all agents
       │
4. Supervisor calls AgentRegistry.listAgents() to get baseline
       │
5. Supervisor pings every registered agent (pingAll())
       │
6. Supervisor calls HealthCheckAgent.runChecks()
       │
7. Supervisor calls AgentInspector.inspect(src/agents/)
       │
8. Supervisor creates first checkpoint via CuratorAgent
       │
9. Supervisor starts polling loop (configurable interval)
       │
10. Supervisor returns SupervisorReport
```

### Polling Cycle

```
Every [pollingIntervalMs] ms:
  1. For each managed agent:
     a. Call agent.ping()
     b. If successful → reset failure counter, mark 'alive'
     c. If timeout/failure → increment failure counter
     d. If consecutiveFailures >= failureThreshold:
        i.   Mark agent as 'unreachable' in heartbeat
        ii.  Call AgentLifecycleAgent.deactivateAgent(name)
        iii. Call RecoveryAgent.restore(lastCheckpointId)
        iv.  If recovery succeeds → reactivate
        v.   If recovery fails → mark as 'failed', emit alert
  
  2. Every N cycles (configurable):
     a. Call HealthCheckAgent.runChecks()
     b. Call AgentInspector.inspect() for changed sections
     c. Call CuratorAgent.createCheckpoint() if new code was deployed
```

### Section Request Flow

```
UI / External caller
       │
       ▼
EmotionalSalonOrchestrator
       │
       ├── Call SupervisorAgent.getHeartbeat(sectionAgents)
       │   └── If any are unreachable → return error with recovery status
       │
       ├── routeSection("home")
       │   └── Validate Meta compliance (if outbound)
       │
       ▼
HomeOrchestratorAgent.getData()
       │
       ├── HomeDataSourceAgent.mapDataSources()
       ├── HomeInspectorAgent.inspectWidgets()
       ├── HomeHealthCheckAgent.runHealthCheck() or
       │   HomeMetricsAgent.calculateMetrics() or
       │   HomeAIInsightAgent.generateClientInsights()
       │
       ▼
Bridge (e.g., HomeBridge.getMetricsSnapshot())
       │
       ▼
UI component renders
```

---

## 8. Failure Reporting Flow

### Single Agent Failure

```
Agent X stops responding to ping()
       │
       ▼
SystemSupervisorAgent.pingAll()
  └── Agent X → timeout / error
       │
       ▼
Increment consecutiveFailures counter for Agent X
       │
       ▼
If consecutiveFailures < threshold:
  └── Log warning, continue polling
       │
       ▼
If consecutiveFailures >= threshold:
  └── 1. Supervisor.setHeartbeat("Agent X", "unreachable")
      2. Supervisor.runRecovery() is NOT yet called (wait for 2nd threshold)
      3. Continue polling — if Agent X recovers on its own, reset counter
      
If 2nd threshold reached (total failures > criticalThreshold):
  └── 1. Supervisor deactivates Agent X via AgentLifecycleAgent.deactivateAgent("Agent X")
      2. Supervisor runs AgentInspector.inspect() for Agent X's section
      3. Supervisor runs CuratorAgent.createCheckpoint() to snapshot current state
      4. Supervisor calls RecoveryAgent.restore(lastStableCheckpoint)
      5. HealthCheckAgent.runChecks() to verify recovery
      6. If healthy → reactivate Agent X via AgentLifecycleAgent.activateAgent("Agent X")
      7. If unhealthy → escalate to AgentLifecycleAgent.archiveAgent("Agent X")
                          → Mark as 'failed'
                          → Notify admin (console.error → future: notification)
```

### Failure Report Schema

```typescript
export interface FailureReport {
  timestamp: string;
  agentName: string;
  severity: 'warning' | 'degraded' | 'critical' | 'failure';
  symptoms: string[];
  
  // Context at time of failure
  heartbeatSnapshot: AgentHeartbeat[];
  lastSuccessfulPing: string | null;
  failureCount: number;
  
  // Recovery actions taken
  actions: {
    step: string;
    result: 'success' | 'failure' | 'skipped';
    detail: string;
  }[];
  
  // Final state
  finalStatus: 'recovered' | 'degraded' | 'failed' | 'archived';
  requiresAdminAttention: boolean;
}
```

### Multi-Agent Cascade (Section Failure)

```
Multiple agents in a section fail simultaneously
       │
       ▼
SystemSupervisorAgent detects cascade pattern:
  └── e.g., HomeDataSourceAgent + HomeInspectorAgent both unreachable
       │
       ▼
Cascade detection heuristic:
  └── If 2+ agents in same section fail within [cascadeWindowMs]:
      1. Treat as section-level failure, NOT individual agent failures
      2. Supervisor deactivates entire section
      3. Route requests to section-level fallback (previously healthy state)
      4. Run HealthCheckAgent for the section
      5. If health check passes → reactivate agents one by one
      6. If health check fails → rollback entire section via CuratorAgent checkpoint
```

---

## 9. Skill Validation Flow

### What Is a "Skill"?
A skill in this system is a coordinated capability — a set of agents + rules + compliance checks that together enable a business function. Currently only `EmotionalSalonOrchestrator` exists as a skill.

### Validation on Skill Registration

```
Developer registers a new skill or updates an existing one
       │
       ▼
EmotionalSalonOrchestrator.validateMetaCompliance()
  └── Checks:
      1. Does the skill involve customer messaging? → requires opt-in
      2. Does the skill use templates? → requires Meta-approved templates
      3. Does the skill send outbound messages? → rate limit check
      4. Does the skill access customer data? → consent check
      5. Does the skill write to localStorage? → future: valid adapter only
       │
       ▼
SystemSupervisorAgent.registerManagedAgent() for each agent in the skill
  └── Validates:
      1. Does each agent implement the ManagedAgent contract?
      2. Are their dependency graphs acyclic?
      3. Do all import paths resolve?
      4. Are there duplicate agent names in AgentRegistry?
      5. Is there a Bridge method for each UI-facing capability?
       │
       ▼
AgentLifecycleAgent registers each agent as 'created'
       │
       ▼
SystemSupervisorAgent.pingAll() to verify initialization
       │
       ▼
HealthCheckAgent.runChecks() for the skill's section
       │
       ▼
AgentInspector.inspect(skillPath) for structure validation
       │
       ▼
CuratorAgent.createCheckpoint() snapshots the skill state
       │
       ▼
Supervisor promotes agents to 'active' via AgentLifecycleAgent
```

### Skill Unregistration Flow

```
Skill deprecated or replaced
       │
       ▼
EmotionalSalonOrchestrator.routeSection() marks section as 'deprecated'
       │
       ▼
SystemSupervisorAgent:
  1. Stop polling all agents in that section
  2. Call AgentLifecycleAgent.deprecateAgent() for each
  3. Route existing requests to fallback (legacy bridge logic)
  4. After [deprecationGracePeriod]:
     a. Deactivate all agents in the section
     b. Create a final CuratorAgent checkpoint
     c. Archive agents via AgentLifecycleAgent.archiveAgent()
```

---

## 10. Which Existing Agents Become Managed Agents

All existing agents become managed by the SystemSupervisorAgent. Each needs a `ping()` method (or adapter).

### System Agents (6) — ALL become managed

| Agent | File | Managed as | Ping Strategy |
|---|---|---|---|
| **AgentRegistry** | `src/agents/system/AgentRegistry.ts` | Managed (add ping) | Class is a singleton Map — ping = `check Map size >= 0` |
| **AgentInspector** | `src/agents/system/AgentInspector.ts` | Managed (add ping) | Singleton — ping = `fs.access` to verify the agents directory is readable |
| **CuratorAgent** | `src/agents/system/CuratorAgent.ts` | Managed (add ping) | Singleton Map — ping = `checkpoints.length >= 0` |
| **RecoveryAgent** | `src/agents/system/RecoveryAgent.ts` | Managed (add ping) | Singleton — ping = verify CuratorAgent import resolves |
| **HealthCheckAgent** | `src/agents/system/HealthCheckAgent.ts` | Managed (add ping) | Singleton — ping = verify it can import required modules |
| **AgentLifecycleAgent** | `src/agents/system/AgentLifecycleAgent.ts` | Managed (add ping) | Singleton — ping = check lifecycleStatuses Map exists |

### Skill Layer (1) — becomes managed

| Skill | File | Managed as | Ping Strategy |
|---|---|---|---|
| **EmotionalSalonOrchestrator** | `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | Managed (add ping) | Singleton — ping = verify initialized flag + routeSection works |

### Home Section Agents (7 + 6 sub-modules) — ALL become managed

| Agent | File | Managed as | Ping Strategy |
|---|---|---|---|
| **HomeOrchestratorAgent** | `src/agents/home/HomeOrchestratorAgent.ts` | Managed (add ping) | Instance — ping = `getDashboardOverview()` returns quickly |
| **HomeDataSourceAgent** | `src/agents/home/HomeDataSourceAgent.ts` | Managed (add ping) | Instance — ping = `mapDataSources()` returns array |
| **HomeInspectorAgent** | `src/agents/home/HomeInspectorAgent.ts` | Managed (add ping) | Instance — ping = `inspectWidgets()` returns summary |
| **HomeHealthCheckAgent** | `src/agents/home/HomeHealthCheckAgent.ts` | Managed (add ping) | Instance — ping = `runHealthCheck()` returns |
| **HomeLearningAgent** | `src/agents/home/HomeLearningAgent.ts` | Managed (add ping) | Instance — ping = `getLearningSummary()` returns |
| **HomeMetricsAgent** | `src/agents/home/HomeMetricsAgent.ts` | Managed (add ping) | Instance — ping = `calculateMetrics()` returns snapshot |
| **HomeAIInsightAgent** | `src/agents/home/HomeAIInsightAgent.ts` | Managed (add ping) | Instance — ping = quick empty client insight generation |
| **EventBus** | `src/agents/home/EventBus.ts` | Managed (add ping) | Singleton — ping = verify `totalSubscribers >= 0` |
| **IntelligenceLayer** | `src/agents/home/intelligence/IntelligenceLayer.ts` | Managed (add ping) | Singleton — ping = `serve()` returns array (even if empty) |
| **RecommendationEngine** | `src/agents/home/recommendations/RecommendationEngine.ts` | Managed (add ping) | Singleton — ping = `generate()` returns array |
| **AppointmentSelectionConsumer** | `src/agents/home/consumers/AppointmentSelectionConsumer.ts` | Managed (add ping) | Singleton — ping = `getSnapshot()` returns counters |
| **ClientArrivalConsumer** | `src/agents/home/consumers/ClientArrivalConsumer.ts` | Managed (add ping) | Singleton — ping = `getSnapshot()` returns counters |

### HomeBridge — becomes a managed bridge, not an agent

| Bridge | File | Managed as | Ping Strategy |
|---|---|---|---|
| **HomeBridge** | `src/bridges/HomeBridge.ts` | Managed (add ping) | Instance — ping = `isAgentEnabled()` check + `initialize()` was called |

### Repositories — NOT managed agents

Repositories are data access layers consumed by agents. They do NOT implement `ping()` because they are not independently supervised — they are dependencies of agents. If a repository fails, the agent that depends on it will fail its ping, which triggers the supervisor.

### Planned Agents (17) — become managed when created

All 17 planned agents (Messages: 6, Campaigns: 6, Intelligence: 5) will implement `ManagedAgent` at creation time and register with the supervisor.

---

## Summary: What Changes

| Aspect | Current State | Proposed State |
|---|---|---|
| **Supervisor** | None — `EmotionalSalonOrchestrator` is a skeleton | `SystemSupervisorAgent` with polling, heartbeat, recovery |
| **AgentInspector** | File-system scanner only | Also inspects agent registry, cross-references code vs. registration |
| **HealthCheckAgent** | Returns `skipped` for everything | Runs real `tsc`, `build`, `jest` checks + feature flag audits |
| **RecoveryAgent** | Placeholder — marks files as "restored" without restoring | Real git/checkpoint-based restore with escalation levels |
| **AgentLifecycleAgent** | 6 statuses, no runtime hooks | 9 statuses (adds `running`, `degraded`, `failed`), supervisor-triggered transitions |
| **Managed agents** | None — agents are just singleton classes | 19 existing agents + 1 skill + 1 bridge implement `ManagedAgent` contract |
| **Runtime polling** | None | Configurable interval, ping all managed agents, failure escalation |
| **Failure recovery** | Manual (developer reads an error log) | Automatic: detect → deactivate → checkpoint → restore → verify → reactivate |
| **Skill validation** | None (orchestrator returns strings) | Meta compliance + agent contract validation + dependency graph check |
| **src/system/** | Does not exist | Created for SupervisorAgent configuration, types, contracts |
