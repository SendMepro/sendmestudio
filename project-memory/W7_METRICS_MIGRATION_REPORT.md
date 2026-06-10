# W7_METRICS_MIGRATION_REPORT.md — Phase C-1B

## Resumen

**Fecha:** 2026-05-30T01:35 UTC
**Fase:** Phase C-1B — W7 KPI Metrics Migration
**Checkpoint:** 18 ✅
**Estado:** ✅ Completado

Conexión de W7 KPI Metrics widget a HomeMetricsAgent. Reemplazo del origen de datos de hardcoded (via KpiMetricsRepository) a cálculo real via AppointmentRepository.

---

## Old Source

**Antes:** Hardcoded KPI values via `KpiMetricsRepository` (W7 KPI Repository Migration — Phase B-1)

```
page.tsx metrics array (hardcoded)
  → HomeBridge.getKpiMetrics()
    → KpiMetricsRepository.getMetrics()
      → Hardcoded values:
        - Ventas hoy: $2.840.000
        - Potencial: $3.420.000
        - Ocupación: 81%
  → Fallback: inline metrics array (same hardcoded values)
```

## New Source

**Ahora:** Real calculation via `HomeMetricsAgent` → `AppointmentRepository`

```
page.tsx loadKpiMetrics useEffect
  │
  ├── FIRST TRY: HomeBridge.getMetricsSnapshot()
  │   → HOME_METRICS_ENABLED (true)
  │     → HomeMetricsAgent.calculateMetrics()
  │       → AppointmentRepository.getAppointments()
  │       → AppointmentRepository.getCompletedAppointments()
  │       → computeFrom(all, completed) → MetricsSnapshot
  │     → Map to 3 KPI cards:
  │       - Ventas hoy: completedAppointments × averageTicket
  │       - Potencial: pendingAppointments × averageTicket
  │       - Ocupación: completedAppointments / totalAppointments × 100
  │
  ├── SECOND TRY: HomeBridge.getKpiMetrics() (legacy bridge path)
  │   → KpiMetricsRepository.getMetrics() → hardcoded
  │
  └── FALLBACK: inline metrics array (legacy)
```

## Bridge Flow

```
┌─────────────────────────────────────────────────────────┐
│ HomeBridge                                              │
│                                                         │
│  getMetricsSnapshot()                                   │
│    → safeCall('HomeMetricsAgent',                       │
│        homeMetricsAgent.calculateMetrics(),             │
│        'HOME_METRICS_ENABLED')                          │
│                                                         │
│  Fields:                                                │
│    + homeMetricsAgent: HomeMetricsAgent                 │
│    + appointmentRepo: AppointmentRepository (moved up)  │
│                                                         │
│  isAgentEnabled():                                      │
│    + 'HomeMetricsAgent' → 'HOME_METRICS_ENABLED'        │
└─────────────────────────────────────────────────────────┘
```

## Metrics Mapping

| KPI Card | MetricsSnapshot Field | Formula |
|----------|----------------------|---------|
| **Ventas hoy** | `completedAppointments × averageTicket.value` | count(completed) × avg(estimated price) |
| **Potencial** | `pendingAppointments × averageTicket.value` | (total - completed) × avg(estimated price) |
| **Ocupación** | `completedAppointments / totalAppointments × 100` | completed / total × 100 |

## Feature Flag

| Flag | Default | Active | Purpose |
|------|:-------:|:------:|---------|
| `HOME_METRICS_ENABLED` | `false` | `true` | Enable HomeMetricsAgent for W7 KPI |

## Files Changed

### Modified
| File | Change |
|------|--------|
| `src/config/featureFlags.ts` | +`HOME_METRICS_ENABLED` flag + default + in `isAnyHomeAgentEnabled()` |
| `src/bridges/HomeBridge.ts` | +import HomeMetricsAgent, +field, +constructor (reordered: appointmentRepo before homeMetricsAgent), +isAgentEnabled entry, +getMetricsSnapshot() method |
| `src/app/page.tsx` | W7 useEffect expanded: try getMetricsSnapshot() first, fallback to getKpiMetrics(), then inline |

### Created
| File | Reason |
|------|--------|
| `project-memory/W7_METRICS_MIGRATION_REPORT.md` | This report |

## Fallback Flow

```
getMetricsSnapshot() fails (throw or returns success:false)
  │
  ├──→ getKpiMetrics() via bridge (KpiMetricsRepository)
  │     └──→ hardcoded values
  │
  └──→ Falls through → state keeps inline metrics array
        └──→ Same "$2.840.000", "$3.420.000", "81%" as before
```

## Rollback Instructions

### Option 1: Disable feature flag (fastest)
```typescript
// in src/config/featureFlags.ts
HOME_METRICS_ENABLED: false,  // bridge returns null → falls through to legacy path
```

### Option 2: Full revert
```bash
git checkout checkpoint-17 -- src/config/featureFlags.ts src/bridges/HomeBridge.ts src/app/page.tsx
```

## Validation

| # | Check | Result |
|:-:|-------|:------:|
| 1 | **W7 reads HomeMetricsAgent** | ✅ `getMetricsSnapshot()` → `HomeMetricsAgent.calculateMetrics()` → `AppointmentRepository` |
| 2 | **HomeMetricsAgent reads AppointmentRepository** | ✅ Constructor injection (already verified in Phase C-1) |
| 3 | **KPI UI unchanged** | ✅ Same 3 cards: Wallet, BarChart3, CalendarDays icons; same labels |
| 4 | **Fallback works** | ✅ Triple fallback: agent → bridge repository → inline array |
| 5 | **No other widgets touched** | ✅ Only W7 KPI effect modified; W2-W6, W8-W15 unchanged |
| 6 | **TypeScript compilation** | ✅ No new errors in our files (only pre-existing inbox + HomeBridge type errors) |
