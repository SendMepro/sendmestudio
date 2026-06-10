# AGENT INVENTORY REPORT

**Generated:** 2026-05-31T00:32 UTC  
**Source:** Full scan of `src/agents/`, `src/skills/`, `src/bridges/`, `src/repositories/`, `project-memory/`

---

## 1. Every File Under `src/agents/`

### System Agents (6 code files + 6 doc files = 12 files)

| # | File | Status |
|---|------|--------|
| 1 | `src/agents/system/AgentRegistry.ts` | Created |
| 2 | `src/agents/system/AgentRegistry.md` | Doc |
| 3 | `src/agents/system/AgentInspector.ts` | Created |
| 4 | `src/agents/system/AgentInspector.md` | Doc |
| 5 | `src/agents/system/CuratorAgent.ts` | Created |
| 6 | `src/agents/system/CuratorAgent.md` | Doc |
| 7 | `src/agents/system/RecoveryAgent.ts` | Created |
| 8 | `src/agents/system/RecoveryAgent.md` | Doc |
| 9 | `src/agents/system/HealthCheckAgent.ts` | Created |
| 10 | `src/agents/system/HealthCheckAgent.md` | Doc |
| 11 | `src/agents/system/AgentLifecycleAgent.ts` | Created |
| 12 | `src/agents/system/AgentLifecycleAgent.md` | Doc |

### Home Agents (9 code files + 7 doc files = 16 files)

| # | File | Status |
|---|------|--------|
| 1 | `src/agents/home/HomeOrchestratorAgent.ts` | Created |
| 2 | `src/agents/home/HomeOrchestratorAgent.md` | Doc |
| 3 | `src/agents/home/HomeInspectorAgent.ts` | Created |
| 4 | `src/agents/home/HomeInspectorAgent.md` | Doc |
| 5 | `src/agents/home/HomeDataSourceAgent.ts` | Created |
| 6 | `src/agents/home/HomeDataSourceAgent.md` | Doc |
| 7 | `src/agents/home/HomeHealthCheckAgent.ts` | Created |
| 8 | `src/agents/home/HomeHealthCheckAgent.md` | Doc |
| 9 | `src/agents/home/HomeLearningAgent.ts` | Created |
| 10 | `src/agents/home/HomeLearningAgent.md` | Doc |
| 11 | `src/agents/home/HomeMetricsAgent.ts` | Created |
| 12 | `src/agents/home/HomeMetricsAgent.md` | Doc |
| 13 | `src/agents/home/HomeAIInsightAgent.ts` | Created |
| 14 | `src/agents/home/HomeAIInsightAgent.md` | Doc |
| 15 | `src/agents/home/EventBus.ts` | Created |
| 16 | `src/agents/home/intelligence/IntelligenceLayer.ts` | Created |
| 17 | `src/agents/home/intelligence/types.ts` | Types |
| 18 | `src/agents/home/recommendations/RecommendationEngine.ts` | Created |
| 19 | `src/agents/home/recommendations/types.ts` | Types |
| 20 | `src/agents/home/consumers/ClientArrivalConsumer.ts` | Created |
| 21 | `src/agents/home/consumers/AppointmentSelectionConsumer.ts` | Created |

---

## 2. Every File Under `src/skills/`

| # | File | Status |
|---|------|--------|
| 1 | `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | Created |
| 2 | `src/skills/emotional-salon/EmotionalSalonOrchestrator.md` | Doc |
| 3 | `src/skills/emotional-salon/skill.md` | Doc |
| 4 | `src/skills/emotional-salon/registry.json` | Config |

---

## 3. Every Bridge File

| # | File | Status |
|---|------|--------|
| 1 | `src/bridges/HomeBridge.ts` | Created |
| 2 | `src/bridges/HomeBridge.md` | Doc |

---

## 4. Every Repository File

| # | File | Status |
|---|------|--------|
| 1 | `src/repositories/LearningEventRepository.ts` | Created |
| 2 | `src/repositories/ClientRepository.ts` | Created |
| 3 | `src/repositories/AppointmentRepository.ts` | Created |
| 4 | `src/repositories/WeatherRepository.ts` | Created |
| 5 | `src/repositories/KpiMetricsRepository.ts` | Created |
| 6 | `src/repositories/PlatformHealthRepository.ts` | Created |
| 7 | `src/repositories/README.md` | Doc |

---

## 5. Agent/Skill Table

| Agent/Skill | File | Used by | Depends on | Status |
|---|---|---|---|---|
| **EmotionalSalonOrchestrator** | `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | None (singleton) | AgentRegistry, AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent | **SKELETON** |
| **AgentRegistry** | `src/agents/system/AgentRegistry.ts` | EmotionalSalonOrchestrator, AgentLifecycleAgent, CuratorAgent, RecoveryAgent, HealthCheckAgent | None | **ACTIVE** (in-memory) |
| **AgentInspector** | `src/agents/system/AgentInspector.ts` | EmotionalSalonOrchestrator | None | **ACTIVE** (fs-based) |
| **CuratorAgent** | `src/agents/system/CuratorAgent.ts` | EmotionalSalonOrchestrator, RecoveryAgent | None | **ACTIVE** (in-memory) |
| **RecoveryAgent** | `src/agents/system/RecoveryAgent.ts` | EmotionalSalonOrchestrator | CuratorAgent | **SKELETON** (restore logic placeholder) |
| **HealthCheckAgent** | `src/agents/system/HealthCheckAgent.ts` | EmotionalSalonOrchestrator | None | **SKELETON** (build/lint checks not integrated) |
| **AgentLifecycleAgent** | `src/agents/system/AgentLifecycleAgent.ts` | None directly | AgentRegistry | **ACTIVE** (lifecycle transitions work) |
| **HomeOrchestratorAgent** | `src/agents/home/HomeOrchestratorAgent.ts` | HomeBridge (`getDashboardOverview`, `getRecommendedActions`) | None (self-contained) | **SKELETON** (placeholder data) |
| **HomeDataSourceAgent** | `src/agents/home/HomeDataSourceAgent.ts` | HomeBridge (`getDataSource`), HomeInspectorAgent (types) | None | **SKELETON** (static metadata map) |
| **HomeInspectorAgent** | `src/agents/home/HomeInspectorAgent.ts` | HomeBridge (`runInspection`) | HomeDataSourceAgent (type import) | **SKELETON** (hardcoded known issues) |
| **HomeHealthCheckAgent** | `src/agents/home/HomeHealthCheckAgent.ts` | HomeBridge (`runHealthCheck`) | None | **SKELETON** (always returns "partial" / "not_ready") |
| **HomeLearningAgent** | `src/agents/home/HomeLearningAgent.ts` | HomeBridge (`collectLearningSignals`, `enqueueArrivalEvent`, `enqueueAppointmentEvent`, `getLearningSummary`) | LearningEventRepository, EventBus | **ACTIVE** (persists + emits events) |
| **HomeMetricsAgent** | `src/agents/home/HomeMetricsAgent.ts` | HomeBridge (`getMetricsSnapshot`) | AppointmentRepository | **ACTIVE** (real calculations) |
| **HomeAIInsightAgent** | `src/agents/home/HomeAIInsightAgent.ts` | HomeBridge (`getEmotionalProfile`, `getMaterialIntelligence`, `getLifetimeValue`, `getAIAlerts`, `getAIRecommendations`, `getTechnicalHistory`) | ClientRepository, AppointmentRepository | **ACTIVE** (real derivations) |
| **EventBus** | `src/agents/home/EventBus.ts` | HomeLearningAgent, ClientArrivalConsumer, AppointmentSelectionConsumer, LearningEventRepository | None | **ACTIVE** (pub/sub) |
| **IntelligenceLayer** | `src/agents/home/intelligence/IntelligenceLayer.ts` | HomeBridge (`getIntelligenceInsights`) | RecommendationEngine | **ACTIVE** (deterministic pipeline) |
| **RecommendationEngine** | `src/agents/home/recommendations/RecommendationEngine.ts` | IntelligenceLayer | AppointmentSelectionConsumer, ClientArrivalConsumer | **ACTIVE** (rule-based) |
| **AppointmentSelectionConsumer** | `src/agents/home/consumers/AppointmentSelectionConsumer.ts` | RecommendationEngine | EventBus | **ACTIVE** (auto-subscribed) |
| **ClientArrivalConsumer** | `src/agents/home/consumers/ClientArrivalConsumer.ts` | RecommendationEngine | EventBus | **ACTIVE** (auto-subscribed) |
| **HomeBridge** | `src/bridges/HomeBridge.ts` | Home dashboard (page.tsx) | All Home agents + repositories | **ACTIVE** (feature-flag gated) |
| **LearningEventRepository** | `src/repositories/LearningEventRepository.ts` | HomeLearningAgent | LocalStorageAdapter, EventBus | **ACTIVE** (localStorage-backed) |
| **ClientRepository** | `src/repositories/ClientRepository.ts` | HomeAIInsightAgent, HomeBridge | AppointmentRepository, customer.json fetch | **ACTIVE** (DI-configured) |
| **AppointmentRepository** | `src/repositories/AppointmentRepository.ts` | HomeMetricsAgent, HomeAIInsightAgent, ClientRepository, HomeBridge | Mock data + API fetch | **ACTIVE** (DI-configured) |
| **WeatherRepository** | `src/repositories/WeatherRepository.ts` | HomeBridge | External API (placeholder) | **SKELETON** (always returns fallback) |
| **KpiMetricsRepository** | `src/repositories/KpiMetricsRepository.ts` | HomeBridge | LocalStorageAdapter | **SKELETON** (hardcoded values) |
| **PlatformHealthRepository** | `src/repositories/PlatformHealthRepository.ts` | HomeBridge | LocalStorageAdapter | **ACTIVE** (reads localStorage) |
| **EmotionalSalonOrchestrator (skill)** | `src/skills/emotional-salon/` | None (no UI or runtime integration) | System agents | **SKELETON** |

---

## 6. Answers

### Q1: Does an orchestrator/supervisor exist?

**Yes, two levels:**

| Level | Orchestrator | File | Type |
|---|---|---|---|
| **Master Skill (top)** | `EmotionalSalonOrchestrator` | `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | **SKELETON** — registers system agents, routes tasks by section name, but does NOT wire to any UI or runtime. No automated initialization. |
| **Section (home)** | `HomeOrchestratorAgent` | `src/agents/home/HomeOrchestratorAgent.ts` | **SKELETON** — placeholder data (getDashboardOverview returns hardcoded widget list). Flag `HOME_ORCHESTRATOR_ENABLED=false`. NOT connected to UI. |

### Q2: Does any agent supervise other agents?

**No.** There is NO runtime supervision chain. The architecture *describes* one (`EmotionalSalonOrchestrator → HomeOrchestratorAgent → HomeInspectorAgent → ...`) but:

- `EmotionalSalonOrchestrator.routeSection("home")` returns a string message — it does NOT call `HomeOrchestratorAgent`.
- `HomeOrchestratorAgent.inspectHome()` says "Future: delegates to HomeInspectorAgent" but does NOT actually call it.
- No agent monitors other agents for failures, timeouts, or health.
- No agent orchestrates multi-step flows.

**AgentLifecycleAgent** can *track* statuses but does NOT supervise runtime execution — it's a metadata manager.

### Q3: Which modules are connected to agents?

| Connected Module | Connected Via | Agent(s) Involved |
|---|---|---|
| **Home dashboard (page.tsx)** | `HomeBridge` (28 bridge methods) | HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent, HomeLearningAgent, HomeOrchestratorAgent, HomeMetricsAgent, HomeAIInsightAgent, IntelligenceLayer |
| **UI Widget W7 (KPI Cards)** | `HomeBridge.getMetricsSnapshot()` | HomeMetricsAgent |
| **UI Widget W8-W14 (Dossier)** | `HomeBridge.getEmotionalProfile()`, `getMaterialIntelligence()`, `getLifetimeValue()`, `getAIAlerts()`, `getAIRecommendations()`, `getTechnicalHistory()` | HomeAIInsightAgent |
| **UI Intelligence Insights** | `HomeBridge.getIntelligenceInsights()` | IntelligenceLayer → RecommendationEngine → Consumers → EventBus |
| **Learning Events** | `HomeBridge.enqueueArrivalEvent()`, `enqueueAppointmentEvent()` | HomeLearningAgent → LearningEventRepository |
| **Event Bus** | Auto-initialized consumers | AppointmentSelectionConsumer, ClientArrivalConsumer, LearningEventRepository |

### Q4: Which modules have no agent connection?

| Module | Location | Gap |
|---|---|---|
| **Messages/Inbox** | `src/app/messages/` or equivalent | No agents created. All 6 planned agents (ReceptionOrchestrator, ConversationInspector, IntentDetection, DraftResponse, MetaReplyGuard, ConversationMemory) are `planned` — zero code. |
| **Campaigns** | `src/app/campaigns/` or equivalent | No agents created. All 6 planned agents are `planned` — zero code. |
| **Intelligence (section)** | `src/agents/intelligence/` | No agents created. The intelligence pipeline *exists* as `IntelligenceLayer` + `RecommendationEngine` under Home, but the planned **section** agents (IntelligenceOrchestrator, ClientProfile, PreferenceMining, OpportunityDetection, SalonTrends) are `planned` — zero code. |
| **Weather (W3)** | WeatherRepository | Connected via HomeBridge but the data is placeholder (always fallback). No real API integration. |
| **KPI Metrics (W7 legacy)** | KpiMetricsRepository | Hardcoded values `$2.84M`, `$3.42M`, `81%`. HomeMetricsAgent exists but its results are NOT yet displayed in the UI — the UI still uses the legacy inline KPI array. |

### Q5: What is missing to implement this workflow?

**Target workflow:** `SupervisorAgent → AgentInspector → SectionAgents → Repositories → UI`

#### SupervisorAgent → AgentInspector

| Missing | Details |
|---|---|
| **Runtime supervisor** | No agent is wired to actually CALL other agents. `EmotionalSalonOrchestrator` is a manual-invocation skeleton. Need: automated supervisor that polls/inspects, or at minimum a startup that initializes the chain. |
| **Agent-to-agent invocation** | No agent imports another agent's class to call at runtime. HomeOrchestratorAgent says "future: delegates to" but doesn't actually delegate. Need: actual method delegation. |

#### AgentInspector → SectionAgents

| Missing | Details |
|---|---|
| **Section agents for messages, campaigns, intelligence** | Zero code exists outside Home. Need: 17 planned agents created as code files. |
| **AgentInspector invoked by orchestrator** | Currently `AgentInspector.inspect(path)` works standalone (reads fs). But no automated inspection loop exists. |

#### SectionAgents → Repositories

| Missing | Details |
|---|---|
| **Orchestrator-connected repositories** | Home agents DO call repositories (HomeMetricsAgent → AppointmentRepository, HomeAIInsightAgent → ClientRepository + AppointmentRepository). This part WORKS for Home. |
| **Missing repositories for other sections** | `IntelligenceRepository.ts` is documented but does NOT exist as a file. `ConversationRepository.ts` and `CampaignRepository.ts` are also only in README. |

#### Repositories → UI

| Missing | Details |
|---|---|
| **HomeMetricsAgent data NOT in UI** | The `getMetricsSnapshot()` bridge method works, but the Home dashboard still uses legacy `kpiMetrics` state. Need: W7 widget to consume MetricsSnapshot. |
| **Feature flag gap** | `HOME_ORCHESTRATOR_ENABLED=false` — meaning the orchestrator-level methods (`getDashboardOverview`, `getRecommendedActions`) are never called from the UI. |
| **Intelligence insights NOT in UI** | `getIntelligenceInsights()` bridge exists, but UI integration (center column rendering) needs to be verified or completed. |

#### Summary of blocks

```
SUPERVISOR
├── EmotionalSalonOrchestrator (SKELETON — no runtime, not connected)
│   ├── routeSection("messages")   → MISSING: no agents
│   ├── routeSection("campaigns")  → MISSING: no agents
│   ├── routeSection("intelligence") → MISSING: no agents
│   └── routeSection("home")       → EXISTS but NOT called by orchestrator
│
├── AgentInspector                → EXISTS but no automated calls from orchestrator
├── CuratorAgent                  → EXISTS (in-memory checkpoints)
├── RecoveryAgent                 → SKELETON (restore logic placeholder)
├── HealthCheckAgent              → SKELETON (build/lint not integrated)
└── AgentLifecycleAgent           → EXISTS (metadata manager, no runtime hooks)

HOME SECTION (partial — works with gaps)
├── HomeOrchestratorAgent → SKELETON (flag=OFF, not connected to UI)
├── HomeDataSourceAgent  → SKELETON (static metadata, not used by UI)
├── HomeInspectorAgent   → SKELETON (hardcoded issues, not used by UI)
├── HomeHealthCheckAgent → SKELETON (always partial, not used by UI)
├── HomeLearningAgent    → ACTIVE (writing localStorage events)
├── HomeMetricsAgent     → ACTIVE but NOT rendered in UI
├── HomeAIInsightAgent   → ACTIVE (W8-W14 connected via HomeBridge)
└── IntelligenceLayer    → ACTIVE (pipeline works, UI connection TBC)

OTHER SECTIONS (entirely missing)
├── Messages agents      → 0 files, 6 planned
├── Campaigns agents     → 0 files, 6 planned
├── Intelligence agents  → 0 files, 5 planned
└── ConversationRepo     → 0 files
└── CampaignRepo         → 0 files
└── IntelligenceRepo     → 0 files
```

#### To unblock the full workflow, in priority order:

1. **Enable `HOME_ORCHESTRATOR_ENABLED=true`** and wire the UI to `getDashboardOverview()` / `getRecommendedActions()`.
2. **Wire HomeMetricsAgent output** to W7 in the UI (replace legacy inline `kpiMetrics`).
3. **Connect HomeOrchestratorAgent** to actually call HomeDataSourceAgent → HomeInspectorAgent → HomeHealthCheckAgent (chain of delegation).
4. **Wire EmotionalSalonOrchestrator** to auto-initialize and route section calls to actual agents.
5. **Create IntelligenceRepository.ts** (referenced but missing).
6. **Create Messages agents** (6 planned → code).
7. **Create Campaigns agents** (6 planned → code).
8. **Create Intelligence section agents** (5 planned → code).
9. **Build ConversationRepository, CampaignRepository.**
10. **Implement real bridge calls for non-Home sections** (MessagesBridge, CampaignsBridge).

---

## Classification Summary

| Category | Count |
|---|---|
| **ACTIVE** | 9 (EventBus, HomeLearningAgent, HomeMetricsAgent, HomeAIInsightAgent, IntelligenceLayer, RecommendationEngine, AppointmentSelectionConsumer, ClientArrivalConsumer, PlatformHealthRepository) |
| **SKELETON** | 8 (EmotionalSalonOrchestrator, HomeOrchestratorAgent, HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent, RecoveryAgent, HealthCheckAgent, WeatherRepository) |
| **ACTIVE (metadata-only)** | 4 (AgentRegistry, AgentInspector, CuratorAgent, AgentLifecycleAgent) |
| **ACTIVE (with gaps)** | 3 (HomeBridge, ClientRepository, AppointmentRepository) |
| **SKELETON (hardcoded)** | 1 (KpiMetricsRepository) |
| **DOCUMENTATION_ONLY** | 3 (ConversationRepository, CampaignRepository, IntelligenceRepository — mentioned in README only) |
| **UNUSED (planned, no code)** | 17 (all Messages, Campaigns, Intelligence section agents) |

**Total code files scanned:** 33 agent files + 4 skill files + 2 bridge files + 7 repository files = **46 files**
