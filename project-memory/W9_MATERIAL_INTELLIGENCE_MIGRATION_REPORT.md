# W9_MATERIAL_INTELLIGENCE_MIGRATION_REPORT.md — Phase D-2

## Resumen

**Fecha:** 2026-05-30T02:01 UTC
**Fase:** Phase D-2 — W9 Material Intelligence Migration
**Checkpoint:** 21 ✅
**Estado:** ✅ Completado

Migración del widget W9 (Inteligencia de Materiales / Material Intelligence) para consumir datos desde `HomeAIInsightAgent` via `HomeBridge`, con fallback al inline `clientIntelligence.materialIntelligence`.

---

## Old Source (antes de la migración)

### page.tsx — W9 data sources

```
intel = getClientIntelligence(selectedAppointment)
  → appointment.clientIntelligence (inline hardcoded data on each appointment object)
  → defaultClientIntelligence (fallback)

materialIntelligence = intel.materialIntelligence
  → avgCost: string       (e.g. "$24.000 CLP")
  → brands: string[]      (e.g. ["Olaplex", "Wella", "Sebastian"])
  → colorations: string   (e.g. "Satinados cálidos / Warm satins")
  → sessionTime: string   (e.g. "3h 45m")
  → margin: string        (e.g. "68%")
```

Cada appointment en el array `appointments[]` (líneas 30-342 de page.tsx) tenía datos `clientIntelligence.materialIntelligence` escritos a mano.

### page.tsx — W9 rendering (líneas 1460-1497)

```
intel.materialIntelligence.avgCost       → card "Gasto promedio"
intel.materialIntelligence.margin        → card "Margen"
intel.materialIntelligence.brands        → chips "Marcas"
intel.materialIntelligence.colorations   → row "Coloración"
intel.materialIntelligence.sessionTime   → row "Tiempo promedio"
```

---

## New Source (después de la migración)

### Bridge flow

```
page.tsx useEffect (on selectedAppointmentId change)
  → new HomeBridge()
  → bridge.getMaterialIntelligence(appointmentId)
    → safeCall('HomeAIInsightAgent', agentFn, 'HOME_AI_INSIGHT_ENABLED')
      → agent.generateClientInsights(appointmentId)
        → clientRepo.getClientByAppointment(appointmentId)
            → ClientRepository (customers.json + AppointmentRepository merge)
        → appointmentRepo.getAppointmentById(appointmentId)
        → deriveMaterialIntelligence(profile, completed, hasRealData)
            if hasRealData && completed.length > 0:
              avgCost = totalEstimated / completed.length (formatted CLP)
              brands = extractBrands(profile, completed)
              colorations = detection from service names ("Con coloración / Sin coloración")
              sessionTime = based on count (≤2 → "1h 30m", else "2h 30m")
              margin = 60-75% (estimated)
            if !hasRealData || no completed:
              → default: avgCost "—", brands [], colorations "—", etc.
      → return insights.materialIntelligence
  → setMaterialIntelligenceFromBridge(result.data)

Render:
  mi = materialIntelligenceFromBridge ?? intel.materialIntelligence
  → mi.avgCost, mi.margin, mi.brands, mi.colorations, mi.sessionTime
```

### Data pipeline

| Step | Component | Método |
|:----:|-----------|--------|
| 1 | page.tsx | `bridge.getMaterialIntelligence(appointmentId)` |
| 2 | HomeBridge | `safeCall('HomeAIInsightAgent', ...)` |
| 3 | HomeAIInsightAgent | `deriveMaterialIntelligence(profile, completed, hasRealData)` |
| 4 | ClientRepository | `getClientByAppointment(appointmentId)` → `StoredCustomer` + `Appointment[]` |
| 5 | AppointmentRepository | `getAppointmentById(appointmentId)` |

### Material Intelligence derivation rules

| Campo | Rule |
|-------|------|
| `avgCost` | `totalEstimated / completed.length` formatted as CLP. If no data → `"—"` |
| `brands` | `extractBrands()`: search known brands (Olaplex, Wella, Kérastase, etc.) in service names. If none found, infer from service types (balayage/color → Wella, L'Oréal; treatment → Olaplex) |
| `colorations` | Any service matching balayage/color/tinte/fantasía → "Con coloración / With coloring", else "Sin coloración / Without coloring" |
| `sessionTime` | ≤2 completed → "1h 30m", else "2h 30m" |
| `margin` | 60 + random(0-15) + "%" (estimated operational margin) |
| `source` | `'ai'` if real data, `'default'` if mock |

---

## Bridge flow diagram

```
┌─────────────────────────────────────────────────────────┐
│                     page.tsx                             │
│                                                          │
│  useEffect → bridge.getMaterialIntelligence(id)          │
│       ↓                                                  │
│  setMaterialIntelligenceFromBridge(data)                 │
│       ↓                                                  │
│  const mi = materialIntelligenceFromBridge ??             │
│             intel.materialIntelligence                    │
│       ↓                                                  │
│  Render: mi.avgCost, mi.margin, mi.brands, ...           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  HomeBridge.ts                                            │
│                                                           │
│  safeCall('HomeAIInsightAgent', async () => {             │
│    const insights = await agent.generateClientInsights()  │
│    return insights.materialIntelligence;                  │
│  }, 'HOME_AI_INSIGHT_ENABLED')                            │
│                                                           │
│  Flag off    → { success: true, data: null }              │
│  Agent fail  → { success: false, data: null } + fallback │
│  Agent ok    → { success: true, data: MaterialIntelligen} │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  HomeAIInsightAgent.ts                                    │
│                                                           │
│  generateClientInsights(appointmentId):                   │
│    clientResult = clientRepo.getClientByAppointment(id)   │
│    appointment = appointmentRepo.getAppointmentById(id)   │
│    hasRealData = clientResult.fromCustomerRecord          │
│    return {                                               │
│      materialIntelligence: deriveMaterialIntelligence(..) │
│      ...                                                  │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────┴──────────────────────────────────┐
│  ClientRepository.ts                                     │
│                                                          │
│  getClientByAppointment(appointmentId):                  │
│    1. Get allClientProfiles()                            │
│    2. Find appointment by ID                             │
│    3. Fuzzy-match client name → customer profile         │
│    4. Merge: profile + appointment history                │
│    5. Return ClientLookupResult { found, profile,        │
│         fromCustomerRecord }                              │
└─────────────────────────────────────────────────────────┘
```

---

## Fallback flow

### Scenario 1: `HOME_AI_INSIGHT_ENABLED = false`

```
bridge.getMaterialIntelligence('...')
  → isAgentEnabled('HomeAIInsightAgent') = false
  → returns { success: true, data: null, fromAgent: false }
  → setMaterialIntelligenceFromBridge(null)
  → mi = null ?? intel.materialIntelligence  // legacy data
```

### Scenario 2: Bridge/Agent throws

```
bridge.getMaterialIntelligence('...')
  → safeCall catches error
  → console.error(...)
  → fallbackToLegacy(...)
  → returns { success: false, data: null }
  → setMaterialIntelligenceFromBridge(null)
  → mi = null ?? intel.materialIntelligence  // legacy data
```

### Scenario 3: No real customer data (mock)

```
HomeAIInsightAgent.deriveMaterialIntelligence()
  → hasRealData = false
  → returns MaterialIntelligence with all "—" values
  → source: 'default'
```

---

## Validation results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ 0 errores nuevos (solo 2 pre-existentes) |
| 2 | **W9 conectado a HomeAIInsightAgent** | ✅ vía HomeBridge.getMaterialIntelligence() |
| 3 | **Fallback funciona** | ✅ `mi = materialIntelligenceFromBridge ?? intel.materialIntelligence` |
| 4 | **Misma UX** | ✅ Misma card, mismo layout, mismos colores |
| 5 | **W8 intacto** | ✅ Solo W9 materialIntelligence rendering cambiado |
| 6 | **Reusa flag existente** | ✅ `HOME_AI_INSIGHT_ENABLED` (no new flag needed) |
| 7 | **Failsafe pattern** | ✅ safeCall + fallbackToLegacy + mi fallback |
| 8 | **No database** | ✅ InMemory repos only |
| 9 | **No localStorage/fetch** | ✅ Solo DI inyectable |

---

## Files changed (Phase D-2)

| Archivo | Cambio | Líneas tocadas |
|---------|--------|:--------------:|
| `src/bridges/HomeBridge.ts` | +MaterialIntelligence import, +getMaterialIntelligence() method | ~15 |
| `src/app/page.tsx` | +state, +useEffect, +mi computed, `intel.materialIntelligence.*` → `mi.*` | ~15 |

---

## Rollback instructions

### Full rollback

1. **page.tsx**:
   - Remove `materialIntelligenceFromBridge` state (lines 694-701)
   - Remove W9 bridge useEffect (lines 913-932)
   - Remove `const mi = ...` (line 1099-1100)
   - Revert `mi.*` → `intel.materialIntelligence.*` in W9 rendering (lines 1502-1528)
2. **HomeBridge.ts**:
   - Remove `MaterialIntelligence` from import
   - Remove `getMaterialIntelligence()` method

### Quick rollback (flag only)

Set `HOME_AI_INSIGHT_ENABLED: false` in `featureFlags.ts` → bridge stops routing → page falls back to `intel.materialIntelligence` → legacy inline data.
