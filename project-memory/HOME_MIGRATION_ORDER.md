# HOME_MIGRATION_ORDER.md — Phased Widget Migration Sequence

## Fecha
2026-05-29T23:41 UTC

## Fase
Phase 2.3 — Home Integration Plan (Planning Only — No Code Changes)

## Propósito
Define the exact order in which each Home widget will be migrated from inline/mock data to agent-powered data. Each phase has clear entry criteria, exit criteria, and rollback strategy.

---

## Phase A — Foundation & Zero-Risk Widgets

### Goal
Establish the integration infrastructure and migrate widgets that have no risk of breaking the dashboard.

### Entry Criteria
- HomeOrchestratorAgent, HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent, HomeLearningAgent exist ✅
- Feature flag system agreed upon before any code change
- Rollback path documented

### Exit Criteria
- Feature flags work for all 15 widgets
- HomeDataSourceAgent can return metadata for all widgets
- HomeHealthCheckAgent runs without errors
- HomeInspectorAgent runs without errors
- W11 data flows through HomeLearningAgent

---

### W1: Salon Hero
| Property | Value |
|----------|-------|
| **Should migrate?** | ❌ No |
| **Reason** | Static branding — logo image + hardcoded text. No data dependency. No agent needed. |
| **Agent Owner** | None |
| **What to do** | Nothing — leave as-is. It works correctly. |
| **Risk** | None |

---

### W11: Arrival Behavior
| Property | Value |
|----------|-------|
| **Should migrate?** | ⚠️ Partial |
| **Reason** | Already real data (manual button → localStorage). Only needs HomeLearningAgent to forward events to Intelligence pipeline. No data source change needed. |
| **Agent Owner** | HomeLearningAgent |
| **Migration action** | Add LearningEvent `client_arrived` when `registerArrival()` is called. Keep localStorage as primary storage; add IntelligenceRepository.pushEvent() as secondary. |
| **Rollback** | Remove the pushEvent() call — arrival records continue working via localStorage. |
| **Risk** | Zero — additive only, no existing code removed. |

---

### W15: Technical Parameters
| Property | Value |
|----------|-------|
| **Should migrate?** | ❌ No |
| **Reason** | Developer debug tool. Hidden by default (modo técnico toggle). Uses hardcoded mock data per appointment ID. No business value to migrate. |
| **Agent Owner** | None |
| **What to do** | Nothing — leave as-is. Remove when all other mock data is eliminated. |
| **Risk** | None |

---

### HomeDataSourceAgent Integration
| Property | Value |
|----------|-------|
| **Should integrate?** | ✅ Yes |
| **Reason** | The agent is read-only — it maps data sources without changing anything. Safe to integrate immediately. |
| **Integration action** | Call `homeDataSourceAgent.mapDataSources()` on dashboard mount. Store result in a context or ref for debugging/development use. Initially only used for dev inspection. |
| **Rollback** | Remove the call — no data depends on it. |
| **Risk** | Minimal — read-only, no side effects. |

---

### HomeHealthCheckAgent Integration
| Property | Value |
|----------|-------|
| **Should integrate?** | ✅ Yes |
| **Reason** | Read-only health verification. Safe to integrate. |
| **Integration action** | Call `homeHealthCheckAgent.runHealthCheck()` on dashboard mount. Store result for dev console or hidden dev panel. |
| **Rollback** | Remove the call. |
| **Risk** | Minimal — read-only. |

---

### HomeInspectorAgent Integration
| Property | Value |
|----------|-------|
| **Should integrate?** | ✅ Yes |
| **Reason** | Read-only problem detection. Safe to integrate. |
| **Integration action** | Call `homeInspectorAgent.inspectWidgets()` on dashboard mount after data is loaded. |
| **Rollback** | Remove the call. |
| **Risk** | Minimal — read-only. |

---

## Phase B — Low/Medium Risk Widgets

### Goal
Migrate widgets that need UI changes (flags, loading states) and localStorage→repository migration.

### Entry Criteria
- Phase A complete and stable
- HomeDataSourceAgent returns accurate data source metadata for W4, W6
- Feature flags tested for W4 and W6

### Exit Criteria
- W4 has isMock flag and loading/error states
- W6 reads from PlatformHealthRepository instead of direct localStorage
- No dashboard regression

---

### W4: Appointment Flow List
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase B) |
| **Current Data Source** | Merged mock `appointments[5]` + `GET /api/appointments` |
| **Mock or Real** | Mixed — 5 mock always present |
| **Risk Level** | High |
| **Business Importance** | Critical — this is the primary navigation tool for the dashboard |
| **Feeds Intelligence** | Yes (appointment status changes, service selection, stylist workload) |
| **Recommended Agent** | HomeOrchestratorAgent, HomeDataSourceAgent |
| **Migration Difficulty** | Medium |
| **Migration Action** | 1. Add `isMock` flag to each appointment in the merged array 2. Add skeleton loading state during fetch 3. Add error state when API fails (instead of silent catch) 4. Visual distinction: real appointments have solid border, mock have dashed border 5. Add badge "Demo" for mock appointments |
| **Dependencies** | None (inline data already available) |
| **Risks** | Medium — adding loading state changes the UX flow. Silent catch removal means empty state is possible. |
| **Rollback** | Revert to original fetch pattern (silent catch + mock merge) |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → AppointmentRepository → InMemoryAdapter + API |

---

### W6: Platform Health Card
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase B) |
| **Current Data Source** | `localStorage("campaigns:meta-templates")` + `localStorage("campaigns:template-health-history")` |
| **Mock or Real** | Partially real (reads localStorage if available) |
| **Risk Level** | Medium |
| **Business Importance** | Medium — campaign health is secondary to daily operations |
| **Feeds Intelligence** | Yes (template health trends, compliance patterns) |
| **Recommended Agent** | HomeHealthCheckAgent, HomeLearningAgent |
| **Migration Difficulty** | Medium |
| **Migration Action** | 1. Create PlatformHealthRepository wrapping localStorage access 2. Dashboard reads from PlatformHealthRepository instead of direct localStorage 3. Add HomeLearningAgent event forwarding when health score changes |
| **Dependencies** | PlatformHealthRepository (needs to be created) |
| **Risks** | Low — repository is a thin wrapper around existing localStorage logic |
| **Rollback** | Revert to direct localStorage access |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → PlatformHealthRepository → LocalStorageAdapter |

---

## Phase C — High Risk Widgets

### Goal
Migrate widgets that depend on real data calculations (KPIs) and derived data (Client Focus).

### Entry Criteria
- Phase B complete and stable
- AppointmentRepository exists (wraps inline mock + API)
- HomeMetricsAgent exists (planned Phase 2.3)
- Feature flags tested for W5 and W7

### Exit Criteria
- W7 KPIs calculated from real appointment data
- W5 shows graceful degradation for real clients without dossier
- HomeMetricsAgent running and returning real values

---

### W5: Client Focus Card
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase C) |
| **Current Data Source** | Derived from selected appointment (W4) |
| **Mock or Real** | Depends on selected appointment |
| **Risk Level** | High |
| **Business Importance** | High — this is the highlighted card showing the active client |
| **Feeds Intelligence** | Yes (recommendation shown/accepted, service preferences) |
| **Recommended Agent** | HomeOrchestratorAgent, HomeLearningAgent |
| **Migration Difficulty** | Medium |
| **Migration Action** | 1. Add "perfil en construcción" state for real clients without intelligence 2. Client Focus Card requests data from HomeOrchestratorAgent 3. HomeOrchestratorAgent calls HomeDataSourceAgent to check if data is real 4. If mock → show current data with badge. If real but empty → show "en construcción" |
| **Dependencies** | W4 migration (selected appointment), AppointmentRepository |
| **Risks** | Medium — degrading the UX for real clients is intentional but may surprise staff |
| **Rollback** | Revert to showing mock data for all clients |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → AppointmentRepository → ClientRepository |

---

### W7: KPI Metrics Cards
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase C) |
| **Current Data Source** | Hardcoded `metrics[]` array (3 values) |
| **Mock or Real** | 100% Mock |
| **Risk Level** | High |
| **Business Importance** | High — staff checks KPIs daily for business decisions |
| **Feeds Intelligence** | Yes (sales trends, occupancy patterns, revenue potential) |
| **Recommended Agent** | HomeOrchestratorAgent, HomeMetricsAgent |
| **Migration Difficulty** | Medium |
| **Migration Action** | 1. Create HomeMetricsAgent with calculation logic 2. HomeMetricsAgent reads from AppointmentRepository 3. Calculate: ventasHoy (sum of completed appointments), potencial (pending appointments × avg ticket), ocupación (occupied slots / total slots) 4. Feature flag: use real KPIs or fallback to hardcoded |
| **Dependencies** | AppointmentRepository, HomeMetricsAgent |
| **Risks** | Medium — real KPIs may be lower than hardcoded ones, causing concern |
| **Rollback** | Revert to hardcoded metrics |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeMetricsAgent → AppointmentRepository |

---

### W3: Weather/Date/Time
| Property | Value |
|----------|-------|
| **Should migrate?** | ⚠️ Optional (Phase C) |
| **Current Data Source** | `Date()` (real) + "Santiago, 18°C" (mock) |
| **Mock or Real** | Date/time real, weather mock |
| **Risk Level** | Low |
| **Business Importance** | Low — cosmetic |
| **Feeds Intelligence** | Yes (timing patterns — but not urgent) |
| **Recommended Agent** | HomeDataSourceAgent |
| **Migration Difficulty** | Low |
| **Migration Action** | 1. HomeDataSourceAgent provides source metadata 2. Remove hardcoded weather text 3. Add "Weather API pending" placeholder or hide weather |
| **Dependencies** | None |
| **Risks** | Low — weather removal is cosmetic |
| **Rollback** | Re-add hardcoded weather |
| **Data Flow After** | Dashboard → HomeDataSourceAgent |

---

### W2: Header Feed
| Property | Value |
|----------|-------|
| **Should migrate?** | ⚠️ Optional (Phase C) |
| **Current Data Source** | Hardcoded `headerFeed[]` (6 items) |
| **Mock or Real** | 100% Mock |
| **Risk Level** | Low |
| **Business Importance** | Low — informative, not operational |
| **Feeds Intelligence** | Yes (future: dynamic tips from real-time data) |
| **Recommended Agent** | HomeOrchestratorAgent, HomeLearningAgent |
| **Migration Difficulty** | Low |
| **Migration Action** | 1. Keep static tips as fallback 2. Add feature flag for future dynamic feed 3. HomeLearningAgent can register which tip was shown (engagement tracking) |
| **Dependencies** | None |
| **Risks** | Low |
| **Rollback** | Revert to static feed |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → IntelligenceRepository (future) |

---

## Phase D — Critical Risk Widgets (Dossier)

### Goal
Replace all 7 dossier sections (W8-W14) with agent-driven data.

### Entry Criteria
- Phase C complete and stable
- ClientRepository exists (reads from `data/customers/`)
- Client data structure in `data/customers/` is audited and understood
- HomeAIInsightAgent exists (planned for later phase)
- Feature flags tested for all dossier widgets
- Real data fallback path defined for each dossier section

### Exit Criteria
- All dossier sections show either real data or "en construcción" state
- No dossier section shows mock data as if it were real
- HomeLearningAgent forwards dossier interactions to Intelligence pipeline

---

### W8: Emotional Profile
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.emotionalProfile` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — used by stylists to adapt service approach |
| **Feeds Intelligence** | Yes (emotional patterns, decision styles) |
| **Recommended Agent** | HomeAIInsightAgent, HomeLearningAgent |
| **Migration Difficulty** | High |
| **Migration Actions** | 1. Check if client exists in `data/customers/` via ClientRepository 2. If no customer data → show "Perfil emocional: en construcción" with explanation 3. If customer data exists → build profile from service history and stylist notes 4. Mark clearly with badge: "Real" or "En construcción" |
| **Dependencies** | ClientRepository, HomeAIInsightAgent |
| **Risks** | High — completely changing how a critical widget renders |
| **Rollback** | Revert to showing mock data |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeAIInsightAgent → ClientRepository |

---

### W9: Material Intelligence
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.materialIntelligence` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — material preferences affect service pricing and product inventory |
| **Feeds Intelligence** | Yes (material preferences, margin analysis) |
| **Recommended Agent** | HomeAIInsightAgent, HomeLearningAgent |
| **Migration Difficulty** | High |
| **Migration Actions** | Same strategy as W8 — aggregate from real service history |
| **Dependencies** | ClientRepository, HomeAIInsightAgent |
| **Risks** | High |
| **Rollback** | Revert to showing mock data |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeAIInsightAgent → ClientRepository |

---

### W10: Customer LTV
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.lifetimeValue` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — LTV used for client segmentation and VIP treatment |
| **Feeds Intelligence** | Yes (customer value segmentation, retention trends) |
| **Recommended Agent** | HomeAIInsightAgent, HomeLearningAgent |
| **Migration Difficulty** | Medium |
| **Migration Actions** | 1. Calculate LTV from AppointmentRepository.getByClientId() × service price 2. Calculate average ticket, annual visits, repurchase rate 3. If no transaction history → show "Sin historial de compras" instead of "Nuevo/New 0%" |
| **Dependencies** | AppointmentRepository, ClientRepository |
| **Risks** | Medium — calculation logic is new |
| **Rollback** | Revert to hardcoded LTV |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeMetricsAgent → AppointmentRepository |

---

### W11: Arrival Behavior
*(See Phase A — already migrated)*

---

### W12: AI Alerts
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.aiAlerts` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — alerts are meant to help stylists manage client relationships |
| **Feeds Intelligence** | Yes (risk patterns, alert effectiveness) |
| **Recommended Agent** | HomeAIInsightAgent |
| **Migration Difficulty** | High |
| **Migration Actions** | 1. Replace mock alerts with rule-based alerts (cancellation patterns, low repurchase, long absence) 2. When HomeAIInsightAgent is ready → replace rules with ML-based alerts 3. If no alerts → show empty state "Sin alertas para este cliente" |
| **Dependencies** | HomeAIInsightAgent, IntelligenceRepository |
| **Risks** | High — completely new logic for a feature presented as "AI-powered" |
| **Rollback** | Revert to showing 3 hardcoded mock alerts |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeAIInsightAgent → IntelligenceRepository |

---

### W13: AI Recommendation
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.aiRecommendations` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — most visible "AI" feature on the dashboard |
| **Feeds Intelligence** | Yes (recommendation acceptance, personalization patterns) |
| **Recommended Agent** | HomeAIInsightAgent |
| **Migration Difficulty** | High |
| **Migration Actions** | 1. Replace mock recommendations with rule-based ones (cross-sell services, follow-up offers) 2. When HomeAIInsightAgent is ready → replace with ML recommendations 3. If no recommendations → show empty state "No hay recomendaciones disponibles" |
| **Dependencies** | HomeAIInsightAgent, IntelligenceRepository |
| **Risks** | High — most visible AI feature. Mock removal will make the dashboard feel less "smart" |
| **Rollback** | Revert to showing hardcoded recommendations |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeAIInsightAgent → IntelligenceRepository |

---

### W14: Technical History
| Property | Value |
|----------|-------|
| **Should migrate?** | ✅ Yes (Phase D) |
| **Current Data Source** | `appointments[].clientIntelligence.technicalHistory` |
| **Mock or Real** | 100% Mock |
| **Risk Level** | **CRITICAL** |
| **Business Importance** | Critical — stylists use this for technical service decisions |
| **Feeds Intelligence** | Yes (technical preferences, service history patterns) |
| **Recommended Agent** | HomeAIInsightAgent, HomeLearningAgent |
| **Migration Difficulty** | High |
| **Migration Actions** | 1. Check `data/customers/` for service history 2. Aggregate tones used, services rendered, stylist observations 3. If no history → show "Sin historial técnico" instead of mock data 4. Allow stylists to add observations that feed back to CustomerRepository |
| **Dependencies** | ClientRepository, HomeAIInsightAgent |
| **Risks** | High |
| **Rollback** | Revert to showing mock data |
| **Data Flow After** | Dashboard → HomeOrchestratorAgent → HomeAIInsightAgent → ClientRepository |

---

## Migration Order Summary

```
Phase A (Foundation):
├── Add feature flag system to page.tsx
├── Integrate HomeDataSourceAgent   (read-only, no UI change)
├── Integrate HomeHealthCheckAgent  (read-only, no UI change)
├── Integrate HomeInspectorAgent    (read-only, no UI change)
├── Wire W11 (Arrival) → HomeLearningAgent
└── Skip: W1 (static), W15 (debug)

Phase B (Low/Medium Risk):
├── W4 (Appointment Flow) — isMock flag, loading/error states
├── W6 (Platform Health) — localStorage → PlatformHealthRepository
└── Create: PlatformHealthRepository + LocalStorageAdapter

Phase C (High Risk):
├── W7 (KPI Metrics) — HomeMetricsAgent + AppointmentRepository
├── W5 (Client Focus) — Graceful degradation for real clients
├── W3 (Weather) — Remove mock weather, keep real date/time
├── W2 (Header Feed) — Keep static, prepare dynamic feed slot
└── Create: AppointmentRepository, HomeMetricsAgent

Phase D (Critical Risk — Dossier):
├── W8 (Emotional Profile) — ClientRepository → real data or "en construcción"
├── W9 (Material Intelligence) — ClientRepository → real data or "en construcción"
├── W10 (Customer LTV) — AppointmentRepository → real calculation
├── W12 (AI Alerts) — Rule-based alerts or empty state
├── W13 (AI Recommendation) — Rule-based recs or empty state
├── W14 (Technical History) — ClientRepository → real history or "en construcción"
└── Create: ClientRepository, HomeAIInsightAgent, IntelligenceRepository
```

---

## What NOT to Migrate

| Widget | Reason |
|--------|--------|
| **W1 (Salon Hero)** | Static branding, no data dependency |
| **W15 (Tech Parameters)** | Developer debug tool, hidden by default, no business value |
| **AppShell** | Layout wrapper, works correctly |
| **Sidebar** | Navigation only, shared across sections |
| **CSS Module** | Styling only, no data logic |
| **AIBadge** | Simple reusable component, no data dependency |
| **LiquidGlass** | Decorative only |

---

## Status
✅ Planning complete — no code was modified.
✅ Every widget assigned to a migration phase.
✅ Rollback strategy defined for every phase.
⏳ Ready for Phase A implementation.
