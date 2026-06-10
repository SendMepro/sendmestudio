# W10_CUSTOMER_LTV_MIGRATION_REPORT.md — Phase D-3

## Resumen

**Fecha:** 2026-05-30T02:05 UTC
**Fase:** Phase D-3 — W10 Customer LTV Migration
**Checkpoint:** 22 ✅
**Estado:** ✅ Completado

Migración del widget W10 (Valor de vida del cliente / Customer Lifetime Value) para consumir datos desde `HomeAIInsightAgent` via `HomeBridge`, con fallback al inline `clientIntelligence.lifetimeValue`.

---

## Old Source (antes de la migración)

### page.tsx — W10 data sources

```
intel = getClientIntelligence(selectedAppointment)
  → appointment.clientIntelligence (inline hardcoded data on each appointment object)
  → defaultClientIntelligence (fallback)

lifetimeValue = intel.lifetimeValue
  → ltv: string          (e.g. "$2.240.000 CLP")
  → avgTicket: string    (e.g. "$160.000 CLP")
  → annualVisits: string (e.g. "14")
  → repurchase: string   (e.g. "91%")
```

Cada appointment en el array `appointments[]` (líneas 30-342 de page.tsx) tenía datos `clientIntelligence.lifetimeValue` escritos a mano.

### page.tsx — W10 rendering (líneas 1532-1579)

```
intel.lifetimeValue.ltv            → card "LTV Total"
intel.lifetimeValue.avgTicket      → card "Ticket Promedio"
intel.lifetimeValue.annualVisits   → barra "Visitas anuales"
intel.lifetimeValue.repurchase     → barra "Recompra"
```

---

## New Source (después de la migración)

### Bridge flow

```
page.tsx useEffect (on selectedAppointmentId change)
  → new HomeBridge()
  → bridge.getLifetimeValue(appointmentId)
    → safeCall('HomeAIInsightAgent', agentFn, 'HOME_AI_INSIGHT_ENABLED')
      → agent.generateClientInsights(appointmentId)
        → clientRepo.getClientByAppointment(appointmentId)
            → ClientRepository (customers.json + AppointmentRepository merge)
        → appointmentRepo.getAppointmentById(appointmentId)
        → deriveLifetimeValue(profile, completed, hasRealData)
            if hasRealData && completed.length > 0:
              avgTicket = totalEstimated / completed.length (formatted CLP)
              annualVisits = max(1, round(completed.length × 1.5))
              estimatedLtv = avgTicket × annualVisits × 3 (3-year projection)
              returnRate = based on appointmentHistory / completed ratio
            if !hasRealData || no completed:
              → default: ltv "—", avgTicket "—", annualVisits "—", repurchase "—"
      → return insights.lifetimeValue
  → setLifetimeValueFromBridge(result.data)

Render:
  clv = lifetimeValueFromBridge ?? intel.lifetimeValue
  → clv.ltv, clv.avgTicket, clv.annualVisits, clv.repurchase
```

### Data pipeline

| Step | Component | Método |
|:----:|-----------|--------|
| 1 | page.tsx | `bridge.getLifetimeValue(appointmentId)` |
| 2 | HomeBridge | `safeCall('HomeAIInsightAgent', ...)` |
| 3 | HomeAIInsightAgent | `deriveLifetimeValue(profile, completed, hasRealData)` |
| 4 | ClientRepository | `getClientByAppointment(appointmentId)` → `StoredCustomer` + `Appointment[]` |
| 5 | AppointmentRepository | `getAppointmentById(appointmentId)` |

### Lifetime Value derivation rules

| Campo | Rule |
|-------|------|
| `ltv` | `avgTicket × annualVisits × 3` formatted as CLP (3-year projection). If no data → `"—"` |
| `avgTicket` | `totalEstimated / completed.length` formatted as CLP. If no data → `"—"` |
| `annualVisits` | `max(1, round(completed.length × 1.5))` (rough frequency estimate). If no data → `"—"` |
| `repurchase` | `min(round(historyCount/completedCount × 70 + 30), 99)` + "%". If no data → `"—"` |
| `source` | `'ai'` if real data, `'default'` if mock |

---

## Bridge flow diagram

```
┌──────────────────────────────────────────────────────────┐
│                     page.tsx                              │
│                                                           │
│  useEffect → bridge.getLifetimeValue(id)                  │
│       ↓                                                   │
│  setLifetimeValueFromBridge(data)                         │
│       ↓                                                   │
│  const clv = lifetimeValueFromBridge ??                   │
│              intel.lifetimeValue                           │
│       ↓                                                   │
│  Render: clv.ltv, clv.avgTicket, clv.annualVisits, ...    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│  HomeBridge.ts                                             │
│                                                            │
│  safeCall('HomeAIInsightAgent', async () => {              │
│    const insights = await agent.generateClientInsights()   │
│    return insights.lifetimeValue;                          │
│  }, 'HOME_AI_INSIGHT_ENABLED')                             │
│                                                            │
│  Flag off    → { success: true, data: null }               │
│  Agent fail  → { success: false, data: null } + fallback  │
│  Agent ok    → { success: true, data: LifetimeValue }      │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│  HomeAIInsightAgent.ts                                     │
│                                                            │
│  generateClientInsights(appointmentId):                    │
│    clientResult = clientRepo.getClientByAppointment(id)    │
│    appointment = appointmentRepo.getAppointmentById(id)    │
│    hasRealData = clientResult.fromCustomerRecord           │
│    return {                                                │
│      lifetimeValue: deriveLifetimeValue(...)               │
│      ...                                                   │
│    }                                                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────┴───────────────────────────────────┐
│  ClientRepository.ts                                      │
│                                                           │
│  getClientByAppointment(appointmentId):                   │
│    1. Get allClientProfiles()                             │
│    2. Find appointment by ID                              │
│    3. Fuzzy-match client name → customer profile          │
│    4. Merge: profile + appointment history                 │
│    5. Return ClientLookupResult                           │
└──────────────────────────────────────────────────────────┘
```

---

## Fallback flow

### Scenario 1: `HOME_AI_INSIGHT_ENABLED = false`

```
bridge.getLifetimeValue('...')
  → isAgentEnabled('HomeAIInsightAgent') = false
  → returns { success: true, data: null, fromAgent: false }
  → setLifetimeValueFromBridge(null)
  → clv = null ?? intel.lifetimeValue  // legacy data
```

### Scenario 2: Bridge/Agent throws

```
bridge.getLifetimeValue('...')
  → safeCall catches error
  → console.error(...)
  → fallbackToLegacy(...)
  → returns { success: false, data: null }
  → setLifetimeValueFromBridge(null)
  → clv = null ?? intel.lifetimeValue  // legacy data
```

### Scenario 3: No real customer data (mock)

```
HomeAIInsightAgent.deriveLifetimeValue()
  → hasRealData = false
  → returns LifetimeValue with all "—" values
  → source: 'default'
```

---

## Validation results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ 0 errores nuevos (solo 2 pre-existentes) |
| 2 | **W10 conectado a HomeAIInsightAgent** | ✅ vía HomeBridge.getLifetimeValue() |
| 3 | **Fallback funciona** | ✅ `clv = lifetimeValueFromBridge ?? intel.lifetimeValue` |
| 4 | **Misma UX** | ✅ Misma card, mismo layout, mismos colores |
| 5 | **W8, W9 intactos** | ✅ Solo W10 lifetimeValue rendering cambiado |
| 6 | **Reusa flag existente** | ✅ `HOME_AI_INSIGHT_ENABLED` (no new flag needed) |
| 7 | **Failsafe pattern** | ✅ safeCall + fallbackToLegacy + clv fallback |
| 8 | **No database** | ✅ InMemory repos only |

---

## Files changed (Phase D-3)

| Archivo | Cambio | Líneas tocadas |
|---------|--------|:--------------:|
| `src/bridges/HomeBridge.ts` | +LifetimeValue import, +getLifetimeValue() method | ~15 |
| `src/app/page.tsx` | +state, +useEffect, +clv computed, `intel.lifetimeValue.*` → `clv.*` | ~15 |

---

## Rollback instructions

### Full rollback

1. **page.tsx**:
   - Remove `lifetimeValueFromBridge` state (lines 702-708)
   - Remove W10 bridge useEffect (lines 941-960)
   - Remove `const clv = ...` (line 1129-1130)
   - Revert `clv.*` → `intel.lifetimeValue.*` in W10 rendering (lines 1576-1604)
2. **HomeBridge.ts**:
   - Remove `LifetimeValue` from import
   - Remove `getLifetimeValue()` method

### Quick rollback (flag only)

Set `HOME_AI_INSIGHT_ENABLED: false` in `featureFlags.ts` → bridge stops routing → page falls back to `intel.lifetimeValue` → legacy inline data.
