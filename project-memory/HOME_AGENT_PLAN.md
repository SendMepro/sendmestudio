# Home Agent Plan

## Date
2026-05-29 @ 23:15 UTC

## Phase
Phase 2.0 — Home Discovery (Pre-Agent Creation)

## Recommended Agents

### Agent 1: HomeOrchestratorAgent
- **Reason:** Coordinate all 15 widgets, manage data merging (mock + real), handle appointment selection state, provide unified data to all dossier sections
- **Inputs:** Appointment list (mock + API), selected appointment ID, time/date, platform health, arrival records
- **Outputs:** Aggregated dashboard state for Home page, widget data packages
- **Dependencies:** AgentRegistry, HomeDataSourceAgent, HomeLearningAgent
- **Priority:** Critical
- **Create in next phase:** Yes

### Agent 2: HomeDataSourceAgent
- **Reason:** Resolve data provenance — distinguish mock from real data, detect empty `data/appointments.json`, normalize appointment format between mock and real, provide data quality metadata
- **Inputs:** Paths to data sources, API endpoints
- **Outputs:** Data source map with `{ source, isMock, quality, lastUpdated }` for each widget
- **Dependencies:** AgentRegistry, AgentInspector
- **Priority:** Critical
- **Create in next phase:** Yes

### Agent 3: HomeInspectorAgent
- **Reason:** Detect broken dossier for real appointments (those with "Nuevo" LTV), identify missing data sources, check if appointment API is responding, flag when mock data is masking real problems
- **Inputs:** Home page state, data source map, API responses
- **Outputs:** Inspection report with `{ issues[], health, recommendations[] }`
- **Dependencies:** AgentRegistry, HomeDataSourceAgent
- **Priority:** High
- **Create in next phase:** Yes

### Agent 4: HomeHealthCheckAgent
- **Reason:** Verify all 15 widgets render correctly, check API connectivity, monitor for errors/empty states, validate data freshness
- **Inputs:** Widget list, API endpoints to check, render status
- **Outputs:** Health report with `{ widgetHealth[], overall, errors[], warnings[] }`
- **Dependencies:** AgentRegistry, AgentInspector
- **Priority:** High
- **Create in next phase:** Yes

### Agent 5: HomeLearningAgent
- **Reason:** Forward client engagement data to Intelligence pipeline — appointment creation, service preferences, arrival behavior, AI recommendation acceptance, LTV changes
- **Inputs:** Dashboard events (appointment_created, client_arrived, service_completed), client data
- **Outputs:** Learning events queued for Intelligence section
- **Dependencies:** AgentRegistry, EmotionalSalonOrchestrator
- **Priority:** High
- **Create in next phase:** Yes

### Agent 6: HomeMetricsAgent (New — not in original plan)
- **Reason:** Calculate real KPI values instead of hardcoded metrics. Needs to aggregate sales from appointments, calculate occupancy from schedule, compute revenue potential from pending bookings
- **Inputs:** Appointment data, service catalog, pricing data
- **Outputs:** `{ ventasHoy, potencial, ocupacion, updatedAt }`
- **Dependencies:** AgentRegistry, HomeDataSourceAgent
- **Priority:** Medium
- **Create in next phase:** No (deferred after core 5 agents)

### Agent 7: HomeAIInsightAgent (New — not in original plan)
- **Reason:** Generate real AI insights instead of hardcoded dossier data. This is the most complex agent — it would need to analyze client history, service patterns, and emotional data to produce real recommendations
- **Inputs:** Client profile, service history, emotional profile (from Intelligence)
- **Outputs:** AI alerts, recommendations, emotional profile, material intelligence
- **Dependencies:** AgentRegistry, Intelligence section agents
- **Priority:** Medium
- **Create in next phase:** No (requires Intelligence section first)

---

## Implementation Order

```
Phase 2.1 — Core Home Agents
├── 1. HomeOrchestratorAgent      (Critical — coordination)
├── 2. HomeDataSourceAgent        (Critical — data quality)
├── 3. HomeInspectorAgent         (High — problem detection)
├── 4. HomeHealthCheckAgent       (High — health monitoring)
└── 5. HomeLearningAgent          (High — intelligence pipeline)

Phase 2.2 — Enhanced Home Agents
├── 6. HomeMetricsAgent           (Medium — real KPIs)
└── 7. HomeAIInsightAgent         (Medium — real AI insights)
```

## Agent Dependency Graph

```
EmotionalSalonOrchestrator
        │
        ▼
HomeOrchestratorAgent
        │
        ├──► HomeDataSourceAgent ──► AgentInspector
        ├──► HomeInspectorAgent ───► HomeDataSourceAgent
        ├──► HomeHealthCheckAgent ─► AgentInspector
        ├──► HomeLearningAgent ────► EmotionalSalonOrchestrator
        ├──► HomeMetricsAgent ─────► HomeDataSourceAgent (deferred)
        └──► HomeAIInsightAgent ──► Intelligence (deferred)
```

## Agent Statuses (in agent-registry.json)

After this phase, the five core Home agents should transition from `planned` to `created`:
- HomeOrchestratorAgent → created
- HomeDataSourceAgent → created
- HomeInspectorAgent → created
- HomeHealthCheckAgent → created
- HomeLearningAgent → created

HomeMetricsAgent and HomeAIInsightAgent remain `planned` for Phase 2.2.
