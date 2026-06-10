# AGENT RUNTIME AUDIT

**Generated:** 2026-05-31T01:33 UTC  
**Type:** Full static analysis of all agent/skill/bridge/repository code  
**Method:** Read every `.ts` file, cross-reference imports/callers/registrations/flag-gates

---

## A. Runtime Active Agents

Agents that execute code at page load time or during user interaction, with measurable business impact.

| # | Agent | How It Runs | What It Does | Used By | Business Value |
|---|-------|-------------|-------------|---------|---------------|
| 1 | **HomeBridge** | Instantiated 17× in `page.tsx` (useEffect hooks) | Routes requests to Home agents with feature-flag gating and fallback | `page.tsx` (the only page) | **10** — sole bridge between UI and agent layer |
| 2 | **HomeAIInsightAgent** | `bridge.getEmotionalProfile()` etc. in 7 useEffect hooks | Generates emotional profile, material intelligence, LTV, alerts, recommendations, technical history from real ClientRepository + AppointmentRepository | HomeBridge → W8/W9/W10/W12/W13/W14 dossier | **9** — dossier insights directly influence the stylist's view of the client |
| 3 | **HomeMetricsAgent** | `bridge.getMetricsSnapshot()` in W7 useEffect | Calculates total appointments, avg ticket, retention/repurchase rates from AppointmentRepository | HomeBridge → W7 KPI cards | **7** — real metrics but not yet displayed (W7 still uses legacy kpiMetrics state) |
| 4 | **HomeLearningAgent** | `bridge.enqueueArrivalEvent()` and `enqueueAppointmentEvent()` in useEffect | Builds LearningEvents, persists to LearningEventRepository, emits to EventBus | HomeBridge → W11 arrival, W4 appointment selection | **8** — feeds the entire intelligence pipeline |
| 5 | **IntelligenceLayer** | `bridge.getIntelligenceInsights()` → `intelligenceLayer.serve()` | Aggregates recommendations into business-categorized insights | HomeBridge → intelligence insights panel | **6** — shows in UI but data sparsity limits impact |
| 6 | **RecommendationEngine** | Called by IntelligenceLayer.serve() | Deterministic rules: VIP detection, upsell, rebooking, retention from consumer data | IntelligenceLayer | **5** — rule-based, no real consumer data yet |
| 7 | **ClientArrivalConsumer** | Auto-init via `clientArrivalConsumer.init()` on import | Listens to `client_arrived` events, tracks arrival counters | EventBus → RecommendationEngine | **4** — app-wide singleton, runs in background |
| 8 | **AppointmentSelectionConsumer** | Auto-init via `appointmentSelectionConsumer.init()` on import | Listens to `appointment_selected` events, tracks selection counters | EventBus → RecommendationEngine | **4** — app-wide singleton, runs in background |
| 9 | **EventBus** | Singleton imported by 3 agents | Pub/sub: subscribe, emit, unsubscribe | HomeLearningAgent, ClientArrivalConsumer, AppointmentSelectionConsumer | **3** — infrastructure, not user-facing |
| 10 | **AppointmentRepository** | Constructed in HomeBridge constructor | Fetches appointments (mock + API), provides query methods | HomeMetricsAgent, HomeAIInsightAgent, HomeBridge | **9** — primary data source for metrics + insights |
| 11 | **ClientRepository** | Constructed in HomeBridge constructor | Fetches customer profiles, maps to appointment history | HomeAIInsightAgent | **8** — primary data source for dossier insights |
| 12 | **LearningEventRepository** | Auto-init singleton | Persists learning events to localStorage | HomeLearningAgent | **3** — persistence layer, not user-facing |

---

## B. Registered But Never Used

Agents that are registered in `AgentRegistry` (via `EmotionalSalonOrchestrator.initialize()` or `SystemSupervisorAgent.ensureSystemAgentsRegistered()`) but have **zero runtime callers** in `page.tsx` or any API route.

| Agent | Registered By | Called By | Status |
|-------|--------------|-----------|--------|
| **AgentRegistry** | EmotionalSalonOrchestrator, SystemSupervisorAgent | Other system agents (internal) | **Active metadata** — used by AgentInspector, HealthCheckAgent, AgentLifecycleAgent as data store |
| **AgentInspector** | SystemSupervisorAgent.initialize() | Only `SystemSupervisorAgent.runInspection()` | **Dead code** at runtime — supervisor is never initialized in production |
| **CuratorAgent** | SystemSupervisorAgent.initialize() | Only `SystemSupervisorAgent.createCheckpoint()` + RecoveryAgent | **Dead code** at runtime — same reason |
| **RecoveryAgent** | SystemSupervisorAgent.initialize() | Only `SystemSupervisorAgent.runRecovery()` + AgentLifecycleAgent.recoverAgent() | **Dead code** at runtime — same reason |
| **HealthCheckAgent** | SystemSupervisorAgent.initialize() | Only `SystemSupervisorAgent.runHealthCheck()` | **Dead code** at runtime — same reason |
| **AgentLifecycleAgent** | SystemSupervisorAgent.initialize() | Only inside SystemSupervisorAgent polls | **Dead code** at runtime — supervisor never runs |
| **SystemSupervisorAgent** | Self-registered | Nowhere | **Dead code** — never initialized. Its `export const SystemSupervisor = new SystemSupervisorAgent()` singleton exists but `initialize()` is never called |
| **EmotionalSalonOrchestrator** | Self | Nowhere in page.tsx or API routes | **Dead code** — `export const orchestrator = new EmotionalSalonOrchestrator()` exists but no code calls it |

---

## C. Orphan Agents

Registered but depended-on-by-zero other agents (excluding `AgentRegistry` which is implicitly depended-on by all).

| Agent | Dependencies On | Depended-On By | Status |
|-------|----------------|---------------|--------|
| **AgentRegistry** | none | All system agents | **Hub** — correctly has no dependents |
| **AgentInspector** | AgentRegistry | none | **Orphan** — no agent depends on it |
| **CuratorAgent** | AgentRegistry | RecoveryAgent | **Not orphan** — RecoveryAgent depends on it |
| **RecoveryAgent** | CuratorAgent, AgentRegistry | AgentLifecycleAgent | **Not orphan** — LifecycleAgent depends on it |
| **HealthCheckAgent** | AgentRegistry | none | **Orphan** — no agent depends on it |
| **AgentLifecycleAgent** | AgentRegistry, RecoveryAgent | none | **Orphan** — supervisor imports it but supervisor is dead code |
| **SystemSupervisorAgent** | (self) | none | **Orphan** — no agent depends on it |
| **EmotionalSalonOrchestrator** | AgentRegistry, AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent | none | **Orphan** — no code calls it |
| **HomeOrchestratorAgent** | none | HomeBridge (imports class) | **Not orphan** — HomeBridge creates instances but never calls its methods at runtime (flag OFF) |
| **HomeDataSourceAgent** | none | HomeBridge | **Not orphan** — bridge calls `getDataSource()` but flag OFF → returns null |
| **HomeInspectorAgent** | HomeDataSourceAgent (type) | HomeBridge | **Not orphan** — bridge calls `runInspection()` but flag ON → actually runs |
| **HomeHealthCheckAgent** | none | HomeBridge | **Not orphan** — bridge calls `runHealthCheck()` but flag ON → actually runs |
| **KpiMetricsRepository** | none | HomeBridge (getKpiMetrics) | **Not orphan** — used but data is hardcoded |
| **WeatherRepository** | none | HomeBridge (getWeather) | **Not orphan** — used but data is placeholder |
| **PlatformHealthRepository** | none | HomeBridge (getPlatformHealth) | **Not orphan** — actively reads localStorage |

---

## D. Orphan Skills

| Skill | File | Runtime Usage | Status |
|-------|------|--------------|--------|
| **EmotionalSalonOrchestrator** | `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | Zero — never imported by page.tsx or any API | **Dead code** — the entire skill directory |
| **skill.md** | `src/skills/emotional-salon/skill.md` | Documentation only | **Doc only** |
| **registry.json** | `src/skills/emotional-salon/registry.json` | Unused | **Dead config** |

---

## E. Orphan Bridges

| Bridge | Runtime Usage | Status |
|--------|--------------|--------|
| **HomeBridge** | **Active** — instantiated 17× in page.tsx | **Runtime active** — the ONLY bridge with runtime code paths |
| **HomeBridge.md** | Documentation | Doc only |

**No other bridges exist.** The architecture mentions MessagesBridge, CampaignsBridge, IntelligenceBridge as planned — none have code files.

---

## F. Dead Governance Code

The entire `src/agents/system/` directory is dead code at runtime:

| File | Lines | Dead Since | Reason |
|------|-------|-----------|--------|
| `SystemSupervisorAgent.ts` | 501 | Created (CP-98) | Never initialized. No code calls `SystemSupervisor.initialize()`. |
| `SystemSupervisorAgent.md` | 87 | Created | Doc only |
| `AgentLifecycleAgent.ts` | 579 | Created (CP-96) → rewritten (CP-100) | Never invoked at runtime. No code calls lifecycle transitions. |
| `AgentLifecycleAgent.md` | ~30 | Created | Doc only |
| `RecoveryAgent.ts` | 477 | Created (CP-96) → rewritten (CP-99) | Never invoked. Checkpoints are never created at runtime. |
| `RecoveryAgent.md` | ~30 | Created | Doc only |
| `HealthCheckAgent.ts` | 254 | Created (CP-96) | Never invoked at runtime. `runChecks()` never called during app usage. |
| `HealthCheckAgent.md` | ~30 | Created | Doc only |
| `AgentInspector.ts` | 637 | Created (CP-96) → rewritten (CP-97) | Never invoked at runtime. No automated inspection loop. |
| `AgentInspector.md` | ~45 | Created | Doc only |
| `CuratorAgent.ts` | 71 | Created (CP-96) | Never invoked at runtime. No checkpoint created during app usage. |
| `CuratorAgent.md` | ~20 | Created | Doc only |
| `AgentRegistry.ts` | 57 | Created (CP-96) | **Semi-dead** — populated by system agents at startup, but only used as an in-memory store by other dead governance agents |
| `contracts.ts` | 51 | Created (CP-96) | Type definitions only — no runtime code |
| `types.ts` | 41 | Created (CP-96) → rewritten (CP-100) | Type definitions only |
| `src/system/config.ts` | 105 | Created (CP-96) | `SystemPaths` is used by HealthCheckAgent (dead). `SupervisorConfig` is used by SystemSupervisorAgent (dead). |
| **Total dead governance code** | **~2,850 lines** | | |

---

## G. Recommended Removals

These can be **safely deleted** without affecting any runtime behavior. The application will compile and run identically.

| Priority | File | Reason | Impact if Removed |
|----------|------|--------|-------------------|
| **HIGH** | `src/skills/emotional-salon/` (entire directory) | Dead code — no imports at runtime | Zero. `EmotionalSalonOrchestrator` is a "skeleton" that was superseded by `SystemSupervisorAgent` for governance, and `HomeBridge` for UI. |
| **HIGH** | `src/agents/system/SystemSupervisorAgent.ts` | Dead code — never initialized | Zero. The singleton exists but `initialize()` is never called. |
| **HIGH** | `src/agents/system/SystemSupervisorAgent.md` | Doc for dead code | Zero — doc is stale anyway |
| **MEDIUM** | `src/agents/system/AgentLifecycleAgent.ts` | Dead code — never called | Zero. AgentLifecycleAgent tracks state that no runtime code queries. |
| **MEDIUM** | `src/agents/system/AgentLifecycleAgent.md` | Doc for dead code | Zero |
| **LOW** | `src/agents/system/CuratorAgent.ts` | Dead code — no runtime checkpoint creation | Zero. In-memory checkpoints are only created by dead governance agents. |
| **LOW** | `src/agents/system/RecoveryAgent.ts` | Dead code — no runtime restore | Zero. No checkpoint → no restore. |
| **LOW** | `src/agents/system/HealthCheckAgent.ts` | Dead code — no runtime health checks | Zero. `runChecks()` shell-execs tsc/build/jest which already run via npm. |
| **LOW** | `src/agents/system/AgentInspector.ts` | Dead code — no automated inspection loop | Zero. AgentInspector is filesystem analysis only. |
| **INFO** | `src/system/config.ts` | SystemPaths used by dead HealthCheckAgent. SupervisorConfig used by dead SystemSupervisorAgent. | Zero if governance agents are removed. If kept, SystemPaths is still useful as a project path helper. |

**If all HIGH-priority removals are applied:** ~1,100 lines removed. Build still passes. App still renders identically.

---

## H. Recommended Activations

These are existing agents that **should become active** because they already have real logic but are gated, not called, or not wired.

| Priority | Agent | Current Status | Recommended Action | Expected Impact |
|----------|-------|---------------|-------------------|-----------------|
| **1** | **HomeMetricsAgent → W7** | `HOME_METRICS_ENABLED=true` but W7 card still uses legacy inline `kpiMetrics` array | Replace the legacy KPI inline data with `bridge.getMetricsSnapshot()` result in W7 | W7 shows real metrics (appointment count, avg ticket, retention, repurchase) |
| **2** | **HomeOrchestratorAgent** | `HOME_ORCHESTRATOR_ENABLED=false`. Not called by UI. | Enable flag + wire `getDashboardOverview()` to replace useWidgets() | Dashboard overview data sourced from agent instead of hardcoded |
| **3** | **SystemSupervisorAgent** | Never initialized. No call to `initialize()`. | Call `SystemSupervisor.initialize()` at app startup (e.g., in a useEffect or layout) | Starts health checks, inspections, checkpoints, polling loop. Catches regressions early. |
| **4** | **HomeDataSourceAgent → getDataSource()** | `HOME_DATASOURCE_ENABLED=true` but bridge returns null (flag correctly on) | Used by `bridge.getDataSource()` call in page.tsx (line 1101) — this IS active | Works — no action needed |
| **5** | **HomeInspectorAgent → runInspection()** | `HOME_INSPECTOR_ENABLED=true`. Called by bridge at mount. | No action — already active | Already works |

---

## I. Proposed Final Agent Hierarchy

```
page.tsx (Home Dashboard)
  │
  └── HomeBridge (17 instantiation points, all gated by feature flags)
        │
        ├── HomeMetricsAgent        → AppointmentRepository  [FLAG ON — real data]
        ├── HomeAIInsightAgent      → ClientRepository
        │                            → AppointmentRepository  [FLAG ON — real data]
        ├── HomeLearningAgent       → LearningEventRepository
        │                            → EventBus              [FLAG ON — real events]
        │                              ├── ClientArrivalConsumer
        │                              └── AppointmentSelectionConsumer
        │                                    │
        │                                    └── RecommendationEngine
        │                                          │
        │                                          └── IntelligenceLayer   [FLAG ON]
        │
        ├── HomeOrchestratorAgent   [FLAG OFF — skeleton]
        ├── HomeDataSourceAgent     [FLAG ON — metadata map]
        ├── HomeInspectorAgent      [FLAG ON — hardcoded issues]
        ├── HomeHealthCheckAgent    [FLAG ON — always partial]
        ├── PlatformHealthRepository [FLAG ON — localStorage]
        ├── KpiMetricsRepository     [FLAG ON — hardcoded]
        └── WeatherRepository        [FLAG ON — placeholder]
```

---

## Answers

### Which agent is currently the top-level orchestrator?

**There is none.** The architecture has two candidate orchestrators:

1. **`EmotionalSalonOrchestrator`** — the "master skill" in `src/skills/`. Registered all 6 system agents. But it's never instantiated, never imported, never called. **Dead code.**
2. **`SystemSupervisorAgent`** — created in CP-98 as the top-level runtime guardian. Has `initialize()`, polling, heartbeats, governance delegation. But `initialize()` is never called. **Dead code.**

**The actual "orchestrator" is `page.tsx` itself** — it creates `new HomeBridge()` 17 times in useEffect hooks and calls bridge methods directly. There is no agent-to-agent orchestration. The HomeBridge is a routing layer, not an orchestrator.

### Which agents actually influence the UI?

| Agent | UI Influence | Via |
|-------|-------------|-----|
| **HomeAIInsightAgent** | W8 (Emotional Profile), W9 (Material Intelligence), W10 (LTV), W12 (AI Alerts), W13 (AI Recommendations), W14 (Technical History) | `bridge.getEmotionalProfile()` etc. in page.tsx useEffect |
| **IntelligenceLayer** | Intelligence insights panel (center column) | `bridge.getIntelligenceInsights()` |
| **HomeLearningAgent** | No direct UI — drives the data pipeline | `bridge.enqueueArrivalEvent()` and `enqueueAppointmentEvent()` |
| **HomeMetricsAgent** | W7 KPI cards — **NOT YET** (metrics calculated but W7 still uses legacy inline `kpiMetrics` array) | `bridge.getMetricsSnapshot()` is called but result not displayed |
| **HomeInspectorAgent** | No direct UI — logged only | `bridge.runInspection()` runs at mount but data is logged, not rendered |
| **HomeHealthCheckAgent** | W6 Platform Health card | `bridge.getPlatformHealth()` via PlatformHealthRepository |
| **HomeDataSourceAgent** | No direct UI | `bridge.getDataSource()` runs at mount |

### Which agents influence customer-facing behavior?

**None directly.** All agents are salon-facing (dashboard used by stylists/salon owners). No customer-facing agents exist:

- No agent sends messages to customers (ReceptionOrchestrator, ConversationInspector, etc. are planned, not implemented)
- No agent manages campaign delivery (CampaignOrchestrator is planned)
- No agent handles customer-facing workflows (appointment booking flows go directly to API routes)

The **HomeLearningAgent + EventBus pipeline** indirectly influences customer experience by learning preferences, but that pipeline has no output that reaches customers yet.

### Which agents are governance only?

All agents in `src/agents/system/`:

| Agent | Governance Purpose | Runtime? |
|-------|-------------------|----------|
| **AgentRegistry** | In-memory database of all agents | Semi — populated but not queried at runtime |
| **AgentInspector** | Inspects project sections for structure/health | **No** |
| **CuratorAgent** | Creates checkpoints during refactors | **No** |
| **RecoveryAgent** | Restores files from checkpoints on failure | **No** |
| **HealthCheckAgent** | Runs tsc/build/jest health checks | **No** |
| **AgentLifecycleAgent** | Tracks 9-state lifecycle transitions | **No** |
| **SystemSupervisorAgent** | Polling, heartbeats, failure detection | **No** |
| **contracts.ts** | Type definitions for ManagedAgent contract | **No** (types only) |
| **types.ts** | AgentLifecycleStatus + AgentCategory types | **No** (types only) |
| **src/system/config.ts** | SupervisorConfig + SystemPaths constants | **No** |

### Which agents should become active next?

**Ranked by business impact / effort ratio:**

| Rank | Agent | Why Now | Effort |
|------|-------|---------|--------|
| **1** | **HomeMetricsAgent → W7** | Logic is already done — just needs W7 widget to display `bridge.getMetricsSnapshot()` result instead of the legacy inline `kpiMetrics` array. | **Low** — ~20 lines of UI wiring |
| **2** | **SystemSupervisorAgent** | Already fully implemented (501 lines). Just needs a single `SystemSupervisor.initialize()` call at app startup. Would enable health checks, inspection, and failure detection on every page load. | **Very low** — 1 import + 1 call |
| **3** | **HomeOrchestratorAgent** | `HOME_ORCHESTRATOR_ENABLED=false`. Enabling it would make dashboard overview + recommended actions come from agents. But the agent is skeleton (hardcoded data) — value is low until real data flows. | **Low** — flip flag |
| **4** | **Messages section agents** | 6 agents planned (ReceptionOrchestrator, ConversationInspector, IntentDetection, DraftResponse, MetaReplyGuard, ConversationMemory). Zero code exists. Would unlock WhatsApp/messaging automation. | **High** — full implementation |
| **5** | **Campaigns section agents** | 6 agents planned. Zero code exists. Would unlock campaign automation. | **High** — full implementation |
| **6** | **Intelligence section agents** | 5 agents planned. Zero code exists. The IntelligenceLayer + RecommendationEngine already exists under Home — section agents would formalize the pipeline. | **Medium-High** |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total `.ts` files in agent/skill/bridge | ~35 files |
| Total lines of agent code | ~6,500 |
| **Lines of runtime-active agent code** | **~1,200** (~18%) |
| **Lines of dead governance code** | **~2,850** (~44%) |
| **Lines of skeleton/placeholder code** | **~2,450** (~38%) |
| Agents with real data derivation | 4 (HomeMetricsAgent, HomeAIInsightAgent, HomeLearningAgent, IntelligenceLayer) |
| Agents that are pure placeholders | 6 (HomeOrchestratorAgent, HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent, KpiMetricsRepository, WeatherRepository) |
| Governance agents (all dead at runtime) | 10 (AgentRegistry, AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent, AgentLifecycleAgent, SystemSupervisorAgent, EmotionalSalonOrchestrator, contracts.ts, types.ts) |
| Dead skill directories | 1 (emotional-salon/) |
| Missing (planned but no code) | 17 agents across messages/campaigns/intelligence sections |
