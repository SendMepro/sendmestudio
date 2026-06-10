# G-1: Supervisor Activation Report

**Date:** 2026-05-31T01:41 UTC  
**Phase:** Agent Activation — G-1  
**Status:** ✅ Complete

---

## Summary

SystemSupervisorAgent is now **runtime-active**. It starts automatically when the app loads, registers all known agents (system + runtime), and begins its governance polling cycle.

---

## Where the Supervisor Starts

**Entry file:** `src/app/layout.tsx` (line 4)

```typescript
import "../agents/system/startup";
```

**Chain:**
```
layout.tsx (server component)
  → src/agents/system/startup.ts (dynamic import + microtask)
    → src/agents/system/SystemSupervisorAgent.ts
      → SystemSupervisor.initialize()
```

The `startup.ts` module uses a dynamic `import()` in a microtask to avoid blocking the app's initial render while still firing as early as possible in the server lifecycle.

---

## Which Agents Are Now Registered

### System Agents (6)
| Agent | Category | Phase | Status |
|-------|----------|-------|--------|
| AgentRegistry | system | system-agents-creation | active |
| AgentInspector | system | system-agents-creation | active |
| CuratorAgent | system | system-agents-creation | active |
| RecoveryAgent | system | system-agents-creation | active |
| HealthCheckAgent | system | system-agents-creation | active |
| AgentLifecycleAgent | system | system-agents-creation | active |

### Self
| Agent | Category | Phase | Status |
|-------|----------|-------|--------|
| SystemSupervisorAgent | system | system-agents-creation | active |

### Runtime Agents (5) — **NEW in G-1**
| Agent | Category | Phase | Status |
|-------|----------|-------|--------|
| EmotionalSalonOrchestrator | skill | skill-creation | active |
| HomeMetricsAgent | leaf | home-agents | active |
| HomeAIInsightAgent | leaf | home-agents | active |
| HomeLearningAgent | leaf | home-agents | active |
| IntelligenceLayer | infrastructure | intelligence | active |

All 12 agents are registered in **both** `AgentRegistry` (metadata) and `SystemSupervisorAgent` (heartbeat map). The supervisor will ping each agent on each poll cycle and update their heartbeat status.

---

## Which Agents Remain Inactive

These agents are **NOT registered** and **NOT monitored** by the supervisor:

### Planned — Section Agents (NOT activated per G-1 requirements)
| Agent | Section | Reason |
|-------|---------|--------|
| CampaignOrchestratorAgent | campaigns | Not yet implemented |
| CampaignMetricsAgent | campaigns | Not yet implemented |
| CampaignComplianceAgent | campaigns | Not yet implemented |
| CampaignExecutionAgent | campaigns | Not yet implemented |
| CampaignAIAgent | campaigns | Not yet implemented |
| CampaignLearningAgent | campaigns | Not yet implemented |

### Planned — Contacts Agents (NOT activated per G-1 requirements)
| Agent | Section | Reason |
|-------|---------|--------|
| ContactsOrchestratorAgent | contacts | Not yet implemented |
| ContactsDataSourceAgent | contacts | Not yet implemented |
| ContactsInspectorAgent | contacts | Not yet implemented |
| ContactsHealthCheckAgent | contacts | Not yet implemented |

### Planned — Knowledge Agents (NOT activated per G-1 requirements)
| Agent | Section | Reason |
|-------|---------|--------|
| KnowledgeOrchestratorAgent | knowledge | Not yet implemented |
| KnowledgeDataSourceAgent | knowledge | Not yet implemented |
| KnowledgeInspectorAgent | knowledge | Not yet implemented |
| KnowledgeHealthCheckAgent | knowledge | Not yet implemented |

### Skeleton — Gated Home Agents (exist but not runtime-critical for G-1)
| Agent | Flag | Reason |
|-------|------|--------|
| HomeOrchestratorAgent | HOME_ORCHESTRATOR_ENABLED=false | Skeleton — hardcoded data |
| HomeDataSourceAgent | HOME_DATASOURCE_ENABLED=true | Already runtime-active via bridge |
| HomeInspectorAgent | HOME_INSPECTOR_ENABLED=true | Already runtime-active via bridge |
| HomeHealthCheckAgent | HOME_HEALTHCHECK_ENABLED=true | Already runtime-active via bridge |

### Bridge & Consumer Agents (runtime-active but NOT registered in supervisor)
| Agent | Reason |
|-------|--------|
| HomeBridge | UI bridge — not a managed agent. Created per-request by page.tsx |
| EventBus | Infrastructure — managed via HomeLearningAgent dependency |
| ClientArrivalConsumer | Consumer — not a managed agent. Auto-initialized on import |
| AppointmentSelectionConsumer | Consumer — not a managed agent. Auto-initialized on import |
| RecommendationEngine | Infrastructure — managed via IntelligenceLayer dependency |

---

## Files Modified

| File | Change |
|------|--------|
| `src/agents/system/adapters.ts` | **NEW** — ManagedAgent adapters for 5 runtime agents |
| `src/agents/system/startup.ts` | **NEW** — Auto-initialization module (lazy dynamic import) |
| `src/agents/system/SystemSupervisorAgent.ts` | Updated — added imports, adapters, AgentCategory type, 5 new agent registrations in `ensureSystemAgentsRegistered()`, `registerAllExistingAgents()`, and `getAgentInstance()` |
| `src/app/layout.tsx` | Updated — added `import "../agents/system/startup"` |

---

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass — no TypeScript errors |
| `npm run build` | ✅ Pass — compiled and optimized production build |

---

## Key Details

### How the Supervisor Activates at Startup
1. `layout.tsx` imports `startup.ts` (server component, statically analyzed)
2. `startup.ts` uses a dynamic `import('./SystemSupervisorAgent')` in a microtask — this avoids bundling Node builtins (`node:path`, `node:fs/promises`) into client bundles
3. `SystemSupervisor.initialize()` runs, which:
   - Ensures all 12 agents are registered in `AgentRegistry`
   - Adds heartbeat entries for each agent
   - Runs optional startup health check (if `healthCheckOnStartup` is true)
   - Runs optional startup inspection (if `inspectionOnStartup` is true)
   - Creates a startup checkpoint
   - Starts the polling cycle

### How Adapters Work
Each runtime agent has a lightweight `ManagedAgent` adapter in `adapters.ts` that implements `ping()` and `health()`. These adapters don't import the actual Home agent modules — they just report liveness. This avoids circular dependencies and keeps the governance layer independent of the runtime agent code.

### Architecture After G-1
```
layout.tsx (server)
  │
  ├── SystemSupervisorAgent (auto-initialized at startup)
  │     ├── Pings 12 agents on each poll cycle
  │     ├── Runs health checks and inspections
  │     └── Manages agent lifecycle
  │
  └── page.tsx (client)
        │
        └── HomeBridge (17 instantiation points)
              ├── HomeMetricsAgent        → real data
              ├── HomeAIInsightAgent      → real data
              ├── HomeLearningAgent       → real events
              ├── IntelligenceLayer       → real insights
              └── Other Home agents       → gated by flags
```
