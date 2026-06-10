# HOME_INTEGRATION_PLAN.md — Connecting Agents to the Home Dashboard

## Fecha
2026-05-29T23:41 UTC

## Fase
Phase 2.3 — Home Integration Plan (Planning Only — No Code Changes)

## Estado
Continuing from **checkpoint-5**

## Propósito
Define the migration strategy that connects the existing Home dashboard (`src/app/page.tsx`) to the 5 new Home agents (`src/agents/home/`), without modifying any code yet. This plan will guide future implementation phases.

---

## 1. Current Architecture

```
Home Dashboard (src/app/page.tsx)
│
├── Inline Data ──────────────────────── 5 hardcoded appointments (mock)
│   ├── appointments[] ───────────────── appointments[].clientIntelligence.* (mock)
│   ├── headerFeed[] (6 tips)
│   ├── metrics[] (3 KPIs)
│   └── stylistPhotos[]
│
├── API Fetch ────────────────────────── GET /api/appointments
│   └── liveAppointments merged with mock (no isMock flag)
│
├── localStorage Reads ───────────────── dashboard:arrival-records
│                                         campaigns:meta-templates
│                                         campaigns:template-health-history
│
└── React State ──────────────────────── selectedAppointment, feedIndex, currentTime
```

## 2. Target Architecture

```
Home Dashboard (src/app/page.tsx)
│
├── HomeOrchestratorAgent ◄── Single entry point for all widget data
│   │
│   ├──► HomeDataSourceAgent ──────► Data source metadata per widget
│   ├──► HomeInspectorAgent ───────► Widget problem detection
│   ├──► HomeHealthCheckAgent ─────► Readiness verification
│   ├──► HomeLearningAgent ────────► Intelligence event bridge
│   ├──► HomeMetricsAgent ─────────► Real KPI calculations (Phase 2.3+)
│   └──► HomeAIInsightAgent ───────► Real AI insights (Phase 2.3+)
│            │
│            ▼
│        Repositories
│            │
│            ├──► AppointmentRepository ───► InMemoryAdapter / API
│            ├──► ClientRepository ────────► InMemoryAdapter / data/customers/
│            ├──► IntelligenceRepository ──► InMemoryAdapter / localStorage
│            └──► PlatformHealthRepository ► InMemoryAdapter / localStorage
│
└── Existing mock data (to be removed widget by widget)
```

## 3. Bridge Strategy

The **HomeOrchestratorAgent** will be the bridge. The dashboard will call it instead of reading inline data, fetching directly, or accessing localStorage.

### Pattern for each widget migration:

```typescript
// BEFORE (current code):
const appointments = [...hardcodedAppointments, ...liveAppointments];
const clientData = getClientIntelligence(selectedAppointment);

// AFTER (migrated):
const orchestrator = new HomeOrchestratorAgent();
orchestrator.initialize();
const overview = await orchestrator.getDashboardOverview();
const widgetData = await orchestrator.getWidgetData('W4');
```

## 4. Migration Constraints

| Constraint | Description |
|-----------|-------------|
| **No breaking changes** | The dashboard must continue working during and after each migration step |
| **No database** | All storage uses InMemoryAdapter, localStorage, or JSON files |
| **Agents don't touch UI** | Agents provide data; the existing UI components consume it |
| **Mock data preserved during migration** | Mock data stays until each widget has a real data replacement |
| **isMock flag required** | Each widget must know whether its data is real or mock |

## 5. Dependency Graph for Migration

```
Phase A ──► W1 (Salon Hero)         — No agent needed, static
             W11 (Arrival Behavior)  — Already real, just wire to HomeLearningAgent
             W15 (Tech Parameters)   — Debug tool, skip migration

Phase B ──► W6 (Platform Health)    — Migrate localStorage → PlatformHealthRepository
             W4 (Appointment Flow)   — Add isMock flag, loading states

Phase C ──► W5 (Client Focus)       — Depends on W4 migration
             W7 (KPI Metrics)       — Depends on HomeMetricsAgent + AppointmentRepository
             W3 (Weather)            — Low effort, low risk
             W2 (Header Feed)        — Low effort, low risk

Phase D ──► W8-W14 (Dossier)        — Critical, depends on ClientRepository + HomeAIInsightAgent
```

## 6. Risk Assessment

| Risk | Severity | Phase | Mitigation |
|------|----------|-------|-----------|
| Agents not ready for production | High | A | Start with read-only agents (DataSource, Inspector, HealthCheck) before Orchestrator |
| Repository layer incomplete | High | B | Mock repository implementations that return current data until real ones are built |
| UI breaks when wiring to agent | Critical | C | Wrap each widget migration behind a feature flag; test independently |
| Intelligence pipeline has no consumer | Low | D | HomeLearningAgent writes to InMemoryAdapter; Intelligence reads when ready |
| Performance overhead from agents | Medium | All | Agents are lightweight TypeScript classes; no network calls between them |
| Data duplication during transition | Medium | C | Keep both old and new data paths active; compare outputs before removing old |

## 7. Rollback Strategy

| Scenario | Rollback Action |
|----------|----------------|
| Widget breaks after agent integration | Revert to inline data for that widget only |
| Agent returns wrong data | Switch to `useMockData` fallback flag |
| Repository failure | LocalStorageAdapter falls back to InMemoryAdapter with cached data |
| Feature flag regression | Remove feature flag → dashboard returns to original state |
| Build error | Revert to checkpoint-5 (all new files are additive, no source code modified yet) |

## 8. Feature Flag Strategy

Every widget migration will use a feature flag pattern:

```typescript
// In Home page or HomeOrchestratorAgent:
const featureFlags = {
  useAgentForWidget: {
    W1: false,  // never needs agent
    W2: false,  // Phase B
    W3: false,  // Phase B
    W4: false,  // Phase B → true
    W5: false,  // Phase C → true
    W6: false,  // Phase B → true
    W7: false,  // Phase C → true
    W8: false,  // Phase D → true
    W9: false,  // Phase D → true
    W10: false, // Phase D → true
    W11: true,  // Phase A → true (already real)
    W12: false, // Phase D → true
    W13: false, // Phase D → true
    W14: false, // Phase D → true
    W15: false, // never needs agent
  }
};
```

## 9. Migration Readiness Checklist

Before starting any migration phase, verify:

- [ ] Target agent is created (Phase 2.2 done — all 5 core agents exist)
- [ ] Target repository is created (Phase 2.3 — pending)
- [ ] StorageAdapter exists for the repository (Phase 2.3 — pending)
- [ ] Feature flag is in place to toggle old/new data paths
- [ ] Rollback path is documented
- [ ] No other migration phase is in progress for overlapping widgets

## 10. Integration Sequence Overview

```
        ┌─────────────────────────────────────────────────────────┐
        │                   HOME DASHBOARD                        │
        │              (src/app/page.tsx)                         │
        └──────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
        ┌─────────────────────────────────────────────────────────┐
        │              HomeOrchestratorAgent                       │
        │  - getDashboardOverview()                                │
        │  - getWidgetData(widgetId)                               │
        │  - inspectHome()                                         │
        │  - checkHomeHealth()                                     │
        │  - collectLearningSignals()                              │
        └──┬──────────┬──────────┬──────────┬──────────────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
     │ W1-W3   │ │ W4-W7   │ │ W8-W14  │ │ W15     │
     │ Low     │ │ High    │ │ Critical│ │ Debug   │
     │ Risk    │ │ Risk    │ │ Risk    │ │ Skip    │
     └─────────┘ └─────────┘ └─────────┘ └─────────┘
     Phase A     Phase B-C    Phase D     No migration
```

---

## Status
✅ Planning complete — no code was modified.
⏳ Ready for Phase A implementation after repository/adapter layer is created.
