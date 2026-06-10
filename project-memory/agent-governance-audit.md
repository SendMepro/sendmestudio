# Agent Governance Audit — Plan

> **Phase:** agent-governance-audit
> **Date:** 2026-05-31
> **Status:** In Progress

## 1. Current State

### Agents Created (per refactor-state.json)
| Agent | Status (actual) |
|-------|----------------|
| AgentRegistry | ✗ Not created |
| AgentInspector | ✗ Not created |
| CuratorAgent | ✗ Not created |
| RecoveryAgent | ✗ Not created |
| HealthCheckAgent | ✗ Not created |
| AgentLifecycleAgent | ✗ Not created |
| HomeOrchestratorAgent | ✗ Not created |
| HomeDataSourceAgent | ✗ Not created |
| HomeInspectorAgent | ✗ Not created |
| HomeHealthCheckAgent | ✗ Not created |
| HomeLearningAgent | ✗ Not created |
| HomeMetricsAgent | ✗ Not created |
| HomeAIInsightAgent | ✗ Not created |
| EventBus | ✗ Not created |
| IntelligenceLayer | ✗ Not created |
| RecommendationEngine | ✗ Not created |
| AppointmentSelectionConsumer | ✗ Not created |
| ClientArrivalConsumer | ✗ Not created |

**Actual:** Zero agent files exist on disk. The project is an empty Next.js scaffold.

### Missing Repositories
| Repository | Status |
|------------|--------|
| AppointmentRepository | ✗ |
| ClientRepository | ✗ |
| IntelligenceRepository | ✗ (noted as missing in plan) |
| ConversationRepository | ✗ |
| CampaignRepository | ✗ |

## 2. Gap Analysis

The plan describes a comprehensive agent ecosystem but no code exists. The biggest gap:

1. **No runtime layer** — TypeScript agent classes, interfaces, factories
2. **No repository layer** — data access for appointments, clients, campaigns
3. **No event bus** — inter-agent communication
4. **No supervision** — orchestrator, health checks, recovery

## 3. Build Order (Revised)

Given zero existing code, the practical build order is:

### Phase 1: Foundation (Agent Core)
1. `src/agents/core/types.ts` — Agent interfaces & contracts
2. `src/agents/core/EventBus.ts` — inter-agent pub/sub
3. `src/agents/core/AgentRegistry.ts` — register/discover agents
4. `src/agents/core/SystemSupervisorAgent.ts` — supervision & health

### Phase 2: Data Layer
5. `src/repositories/AppointmentRepository.ts`
6. `src/repositories/ClientRepository.ts`
7. `src/repositories/CampaignRepository.ts`
8. `src/repositories/ConversationRepository.ts`
9. `src/repositories/IntelligenceRepository.ts`

### Phase 3: Home Section Agents
10. HomeOrchestratorAgent, DataSourceAgent, InspectorAgent
11. HealthCheckAgent, LearningAgent, MetricsAgent, AIInsightAgent

### Phase 4: UI Sections
12. Create section pages (Inbox, Campaigns, Knowledge, etc.)
13. Create section components, hooks, agents

### Phase 5: Business Brain Integration
14. Connect agents to business-brain/ knowledge files

## 4. SystemSupervisorAgent Design

```
┌─────────────────────────────────────────────────┐
│                 SystemSupervisorAgent              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Inspector │  │  Health  │  │   Recovery    │  │
│  │  Agent    │  │  Check   │  │    Agent      │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │             │               │           │
│       ▼             ▼               ▼           │
│  ┌───────────────────────────────────────────┐  │
│  │              AgentRegistry                  │  │
│  │  [Home] [Inbox] [Campaigns] [Knowledge]   │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Contracts
- **Health ping**: every 30s, agent responds with `{ alive: true, load: number }`
- **Failure detection**: 3 missed pings → mark degraded → 5 missed → mark dead
- **Restart policy**: degraded → restart, dead → RecoveryAgent respawn
- **Registration**: agents register on init with type, version, dependencies

## 5. Next Physical Step

Create `src/agents/core/` directory with TypeScript foundation:

1. `types.ts` — `AgentStatus`, `AgentContract`, `AgentManifest`, `AgentEvent`
2. `EventBus.ts` — typed pub/sub with async handlers
3. `AgentRegistry.ts` — in-memory registry with CRUD
4. `SystemSupervisorAgent.ts` — watchdog that pings, inspects, recovers
