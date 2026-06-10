# HOMEMETRICS_AGENT_FOUNDATION_REPORT.md — Phase C-1

## Resumen

**Fecha:** 2026-05-30T01:27 UTC
**Fase:** Phase C-1 — HomeMetricsAgent Foundation
**Checkpoint:** 17 ✅
**Estado:** ✅ Completado

Creación del agente `HomeMetricsAgent` que calcula métricas reales a partir de `AppointmentRepository`. Foundation read-only — no reemplaza W7 KPI cards ni ningún widget.

---

## Files Created

| Archivo | Tipo | Líneas |
|---------|:----:|:------:|
| `src/agents/home/HomeMetricsAgent.md` | Documentación | 48 |
| `src/agents/home/HomeMetricsAgent.ts` | Implementación | 256 |

---

## Architecture

```
AppointmentRepository
    │
    ▼
HomeMetricsAgent.calculateMetrics()
    │
    ├── getAppointments()        → allAppointments
    ├── getCompletedAppointments() → completedAppointments
    │
    ▼
MetricsSnapshot
    ├── totalAppointments
    ├── completedAppointments
    ├── cancelledAppointments
    ├── activeClients
    ├── averageTicket (MetricEntry: value + label + detail)
    ├── retentionRate (MetricEntry)
    ├── repurchaseRate (MetricEntry)
    ├── _raw (debug data)
    └── calculatedAt (ISO timestamp)
```

## Agent Structure

```typescript
class HomeMetricsAgent {
  constructor(appointmentRepo: AppointmentRepository)

  async calculateMetrics(): Promise<MetricsSnapshot>
    // Failsafe: try/catch → zeroSnapshot()

  computeFrom(all: Appointment[], completed: Appointment[]): MetricsSnapshot
    // Pure function, testable without repository

  // Private helpers
  uniqueClientIds(appointments): string[]
  clientCounts(appointments): Map<string, number>
  estimateAverageTicket(completed): number
  formatCurrency(amount): string
  zeroSnapshot(): MetricsSnapshot  // Error fallback
}
```

## Metrics Formulas

| Métrica | Fórmula | Implementación |
|---------|---------|:--------------:|
| **totalAppointments** | `count(allAppointments)` | `allAppointments.length` |
| **completedAppointments** | `count(status matches complet*/done)` | `getCompletedAppointments().length` |
| **cancelledAppointments** | `count(status includes cancel)` | `filter(status includes 'cancel')` |
| **activeClients** | `unique client IDs in completed` | `new Set(all.id in completed).size` |
| **averageTicket** | `sum(estimated prices) / count(completed)` | Keyword-based price map (~15 service types) |
| **retentionRate** | `clients with 2+ visits / total unique clients × 100` | `clientCounts >= 2 / uniqueClients` |
| **repurchaseRate** | `returning clients in completed / total completed clients × 100` | `completed clients with count > 1 / completed unique` |

## Average Ticket Price Map

| Keyword | Precio estimado (CLP) |
|---------|:---------------------:|
| balayage | $160.000 |
| olaplex | $96.000 |
| color | $80.000 |
| tinte | $60.000 |
| corte | $35.000 |
| peinado | $25.000 |
| tratamiento | $45.000 |
| keratina | $120.000 |
| alisado | $140.000 |
| ritual | $55.000 |
| manicure | $25.000 |
| pedicure | $30.000 |
| *(default)* | $50.000 |

## Dependencies

| Dependencia | Estado | Tipo |
|-------------|:------:|:----:|
| AppointmentRepository | ✅ Creado (Phase C-0) | Constructor injection |
| Appointment.getAppointments() | ✅ Exists | Async method |
| Appointment.getCompletedAppointments() | ✅ Exists | Async method |

## Lo que NO se modificó

- ❌ W7 KPI cards (page.tsx) — unchanged
- ❌ HomeBridge.ts — no changes (agent-only phase)
- ❌ KpiMetricsRepository.ts — unchanged
- ❌ page.tsx, page.module.css — unchanged
- ❌ W2-W15 — unchanged
- ❌ Messages, Campaigns, Intelligence — unchanged
- ❌ Feature flags — unchanged
- ❌ Ningún widget o UI modificado

## Validación

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ `tsc --noEmit` sin errores |
| 2 | **Agent creado** | ✅ `HomeMetricsAgent.ts` (256 líneas) |
| 3 | **Documentación creada** | ✅ `HomeMetricsAgent.md` (48 líneas) |
| 4 | **Usa AppointmentRepository** | ✅ Constructor injection |
| 5 | **No imports from page.tsx** | ✅ Solo importa AppointmentRepository |
| 6 | **No imports localStorage/fetch/DB** | ✅ Ninguno |
| 7 | **No widget modificado** | ✅ page.tsx intacto |
| 8 | **No KPI modificado** | ✅ KpiMetricsRepository intacto |
| 9 | **No HomeBridge modificado** | ✅ Sin cambios |
| 10 | **No CSS modificado** | ✅ page.module.css intacto |
| 11 | **Failsafe pattern** | ✅ try/catch → zeroSnapshot() |
| 12 | **Testable** | ✅ computeFrom() es pure function |

## Rollback

| Escenario | Acción |
|-----------|--------|
| Agent not needed | Delete `src/agents/home/HomeMetricsAgent.ts` and `.md` |
| Full rollback | Delete both files — no other code references this agent yet |

## Future Integrations

| Phase | Integración | Acción |
|:-----:|-------------|--------|
| W7 refactor | KpiMetricsRepository → HomeMetricsAgent | Bridge route to agent, calc real KPIs |
| HomeBridge | +getMetricsSnapshot() method | Add bridge method behind HOME_DATASOURCE_ENABLED |
| HomeLearningAgent | Emit `metrics_changed` events | On significant metric changes |
| HomeOrchestratorAgent | Aggregate metrics into DashboardOverview | Coordinated data delivery |
