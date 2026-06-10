# HOME_AGENT_WIDGET_OWNERSHIP.md — Agent Responsibilities per Widget

## Fecha
2026-05-30T02:13 UTC

## Fase
Phase D-5 — W13 AI Recommendation Migration — W13 ahora usa HomeAIInsightAgent ✅

## Propósito
Definitively assign every Home widget to its owning agent(s). Each widget has one primary agent and zero or more supporting agents.

---

## Ownership Summary

| # | Widget | Primary Agent | Supporting Agent(s) | Migration Phase |
|---|--------|:------------:|:-------------------:|:---------------:|
| 1 | Salon Hero | *None* | — | ❌ Skip |
| 2 | Header Feed | HomeOrchestratorAgent | HomeLearningAgent | C |
| 3 | Weather/Date/Time | HomeDataSourceAgent | — | C |
| 4 | Appointment Flow List | HomeOrchestratorAgent | HomeDataSourceAgent | B |
| 5 | Client Focus Card | HomeOrchestratorAgent | HomeLearningAgent | C |
| 6 | Platform Health Card | HomeHealthCheckAgent | HomeLearningAgent | B |
| 7 | KPI Metrics Cards | HomeOrchestratorAgent | HomeMetricsAgent *(future)* | C |
| 8 | Emotional Profile | HomeAIInsightAgent | HomeLearningAgent | D ✅ MIGRATED |
| 9 | Material Intelligence | HomeAIInsightAgent | HomeLearningAgent | D ✅ MIGRATED |
| 10 | Customer LTV | HomeAIInsightAgent | HomeMetricsAgent *(future)* | D ✅ MIGRATED |
| 11 | Arrival Behavior | HomeLearningAgent | — | A |
| 12 | AI Alerts | HomeAIInsightAgent | — | D ✅ MIGRATED |
| 13 | AI Recommendation | HomeAIInsightAgent | — | D ✅ MIGRATED |
| 14 | Technical History | HomeAIInsightAgent | HomeLearningAgent | D ✅ MIGRATED |
| 15 | Tech Parameters | *None* | — | ❌ Skip |

---

## Agent Role Definitions

### HomeOrchestratorAgent (Primary: W2, W4, W5, W7)
**Role:** Central coordinator and data aggregator.

| Widget | Why HomeOrchestratorAgent? |
|--------|---------------------------|
| **W2 Header Feed** | Orchestrator manages the rotation and source of feed items. It decides whether to use static tips (current), dynamic tips (future), or a mix. |
| **W4 Appointment Flow** | Orchestrator handles the merge of mock + API appointments, the isMock flag assignment, and provides the unified list to the UI. This is the core data coordination task. |
| **W5 Client Focus** | Orchestrator aggregates data from multiple sources (appointment details, client profile, dossier) for the selected appointment. |
| **W7 KPI Metrics** | Orchestrator calls HomeMetricsAgent and returns aggregated metrics to the UI. It can fall back to hardcoded metrics if HomeMetricsAgent fails. |

**Why not other agents?** The Orchestrator is the single data entry point. Widgets that need data from multiple sources (mock, API, localStorage, repositories) should go through it.

---

### HomeDataSourceAgent (Primary: W3)
**Role:** Data source metadata provider

| Widget | Why HomeDataSourceAgent? |
|--------|--------------------------|
| **W3 Weather** | DataSourceAgent provides metadata about the weather source (mock → "API pending"). The weather widget itself is trivial — the important part is tracking that the source is not real. |

**Why not other agents?** HomeDataSourceAgent is a read-only metadata provider. It does not transform or aggregate data. W3 is the only widget where source tracking is the primary concern.

**Supporting role:** HomeDataSourceAgent supports **all** widgets by providing `DataSourceInfo` (source type, quality, isMock flag, recommended repository). Every widget migration should first check with DataSourceAgent to understand its current data provenance.

---

### HomeInspectorAgent (No direct widget ownership)
**Role:** Problem detection and reporting

| Widget | Why HomeInspectorAgent? |
|--------|-------------------------|
| *None* | HomeInspectorAgent does not own any widget directly. It inspects ALL widgets and provides a consolidated problem report. |

**Supporting role:** HomeInspectorAgent inspects all 15 widgets and returns:
- Which widgets use mock data
- Which data sources are missing
- Which widgets should feed Intelligence but don't
- Which widgets have broken flows

It is a **read-only diagnostic tool** for developers, not a data provider for the dashboard.

---

### HomeHealthCheckAgent (Primary: W6)
**Role:** Stability and readiness verification

| Widget | Why HomeHealthCheckAgent? |
|--------|---------------------------|
| **W6 Platform Health** | HealthCheckAgent owns the platform health concept — checking if integrations (campaigns, WhatsApp, API) are healthy and reporting a health score. The Platform Health Card is the UI for this concept. |

**Why not other agents?** Platform Health is about integration health, not data. The HealthCheckAgent is the natural owner because it verifies system health. HomeOrchestratorAgent could coordinate, but the health logic lives in HealthCheckAgent.

**Supporting role:** HomeHealthCheckAgent checks ALL widgets for readiness (hasLoadingState, hasErrorState, hasEmptyState, dataSourceConfigured). It provides the readiness summary to HomeOrchestratorAgent for debugging/boot display.

---

### HomeLearningAgent (Primary: W11)
**Role:** Intelligence pipeline bridge

| Widget | Why HomeLearningAgent? |
|--------|------------------------|
| **W11 Arrival Behavior** | Arrival records are already real (manual button → localStorage). The only missing piece is forwarding these events to Intelligence. HomeLearningAgent owns this bridge. |

**Supporting role:** HomeLearningAgent supports **9 widgets** for Intelligence event forwarding:

| Widget | LearningEvent Type | When Fired |
|--------|-------------------|------------|
| W2 | *(future — feed_tip_shown)* | When a tip rotates into view |
| W4 | `appointment_created`, `appointment_completed`, `appointment_cancelled` | On appointment status change |
| W5 | `ai_recommendation_shown` | When client focus card renders recommendations |
| W6 | `platform_health_changed` | When health score changes |
| W8 | `client_preference_detected` | When emotional profile is viewed/updated |
| W9 | *(future — material_preference_detected)* | When material intel is viewed |
| W10 | *(future — ltv_changed)* | When LTV recalculates |
| W11 | `client_arrived` | When arrival is registered |
| W14 | *(future — technical_history_updated)* | When technical notes are updated |

---

### HomeMetricsAgent *(Creado — Phase C-1/C-1B)* ✅
**Role:** Real KPI calculation from AppointmentRepository

| Widget | Why HomeMetricsAgent? |
|--------|------------------------|
| **W7 KPI Metrics** | MetricsAgent calculates real sales, potential, and occupancy from appointment data. Connected via HomeBridge.getMetricsSnapshot() in Phase C-1B. |

**Status:** ✅ Active — `HOME_METRICS_ENABLED=true`

---

### HomeAIInsightAgent *(Creado — Phase C-2)* ✅
**Role:** Generate real AI insights for dossier sections

| Widget | Why HomeAIInsightAgent? |
|--------|--------------------------|
| **W8 Emotional Profile** | Requires client data analysis — emotional patterns, decision styles, anxiety levels |
| **W9 Material Intelligence** | Requires material preference mining from service history |
| **W10 Customer LTV** | Requires transaction data aggregation and value scoring |
| **W12 AI Alerts** | Requires pattern detection (cancellations, absences, engagement drops) | ✅ MIGRATED |
| **W13 AI Recommendation** | Requires cross-selling logic and personalization | ✅ MIGRATED |
| **W14 Technical History** | Requires service history aggregation and stylist note analysis |

**Status:** ✅ Phase D COMPLETE — All 6 dossier widgets migrated

---

## Agent Communication Flow

```
         ┌─────────────────┐
         │  Dashboard UI   │
         │ (page.tsx)      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   HomeOrchestratorAgent      │
         │ (Coordinates all widgets)    │
         └──┬──────┬──────┬──────┬──────┘
            │      │      │      │
            ▼      ▼      ▼      ▼
      ┌────────┐┌────────┐┌────────┐┌────────┐
      │ Data   ││Inspector││Health  ││Learning│
      │Source  ││(read)  ││Check   ││Agent   │
      │Agent   ││        ││Agent   ││        │
      └────────┘└────────┘└────────┘└────────┘
                              │
                              ▼
                        ┌──────────┐
                        │Repositori│
                        │es (future│
                        └──────────┘
```

## Ownership Rules

1. **Every widget has exactly one primary agent** (except W1, W15 which have none)
2. **HomeOrchestratorAgent** is the default primary for widgets that need aggregation or coordination
3. **HomeLearningAgent** is never primary for data delivery — always supporting for Intelligence forwarding
4. **HomeDataSourceAgent** and **HomeInspectorAgent** and **HomeHealthCheckAgent** read-only — never own data delivery
5. **Future agents** (HomeMetricsAgent, HomeAIInsightAgent) will own their specific data domains when created

---

## Status
✅ Every Home widget assigned to an owner agent.
✅ Ownership reasoning documented for each assignment.
✅ Agent communication flow defined.
⏳ Ready for Phase A implementation.
lementation.
tion.
