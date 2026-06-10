# W4_LEARNING_SIGNALS_REPORT.md — Phase B-4

## Resumen

**Fecha:** 2026-05-30T01:15 UTC
**Fase:** Phase B-4 — W4 Appointment Flow → Learning Signals
**Checkpoint:** 15 ✅
**Estado:** ✅ Completado

Primera fase de señalización de Intelligence desde el Home. W4 (Appointment Flow List) ahora emite eventos `appointment_selected` a `HomeLearningAgent` cuando un appointment es seleccionado. No es una migración de repositorio — es una capa de señalización aditiva.

---

## Files Modified

| Archivo | Tipo | Cambio |
|---------|:----:|--------|
| `src/bridges/HomeBridge.ts` | Bridge | +enqueueAppointmentEvent() method (+52 líneas) |
| `src/app/page.tsx` | UI | +lastSelectionRef, +emitAppointmentSelected helper, +bridge call en onClick/onKeyDown, +useEffect para evento inicial |

---

## Event Flow

```
User clicks appointment card
│
├──► setSelectedAppointmentId(item.id)     ← existing (UI selection)
│
└──► emitAppointmentSelected(item)         ← NEW: Phase B-4
     │
     ├── dedup check (lastSelectionRef === item.id → skip)
     │
     ├── derive serviceCategory from service name
     │   ├── "balayage|color|tinte|mechas" → "coloracion"
     │   ├── "corte|peinado"               → "corte"
     │   ├── "tratamiento|olaplex|ritual"  → "tratamiento"
     │   ├── "keratina|alisado"            → "alisado"
     │   └── otherwise                     → "general"
     │
     ├── derive priceTier from service name
     │   ├── "balayage|olaplex|premium"    → "premium"
     │   ├── "corte|peinado"               → "basico"
     │   └── otherwise                     → "estandar"
     │
     ├── resolve stylist name
     │   ├── item.stylist (real API)       → fallback
     │   └── item.stylistName (mock)       → fallback
     │
     └── HomeBridge.enqueueAppointmentEvent()
          ├── isAgentEnabled('HomeLearningAgent') → true (flag enabled)
          ├── buildLearningEvent('appointment_selected')
          ├── enqueueEvent(event)
          └── catch → console.warn (never throws)
```

## Event Payload

```typescript
{
  // HomeLearningEvent fields (auto-generated):
  id: "learning-event-1-1680000000000",
  type: "appointment_selected",
  section: "home",
  source: "HomeLearningAgent:W4-AppointmentFlow",
  clientId: "ana-lopez",
  timestamp: "2026-05-30T01:15:00.000Z",

  // Data payload:
  data: {
    appointmentId: "ana-lopez",
    clientName: "Ana López",
    service: "Balayage Olaplex",
    serviceCategory: "coloracion",
    stylist: "Martina Salas",
    priceTier: "premium",
    priorityLabel: "Cliente prioritaria",
    timeSlot: "10:00",
    status: "En curso",
    isMock: false,
  },

  // Metadata:
  metadata: {
    isMock: false,
    confidence?: number,
    sourceWidget: "Appointment Flow",
    sessionId: "session-1680000000000",
  },
}
```

## Dedup Mechanism

- `lastSelectionRef` (useRef) stores the last appointment ID
- If the same ID is emitted again, the event is skipped
- Prevents duplicate events from:
  - Multiple renders triggering `liveAppointments.length` effect
  - Rapid double-clicks
  - Keyboard + mouse mixing
- New selection (different ID) always passes through

## Initial Emission

A `useEffect` watches `liveAppointments.length` to emit the initial selection once the data settles:

```typescript
useEffect(() => {
  if (liveAppointments.length > 0) {
    const initial = liveAppointments.find((item) => item.id === selectedAppointmentId) ?? liveAppointments[0];
    if (initial) emitAppointmentSelected(initial);
  }
}, [liveAppointments.length]);
```

## Rollback

| Escenario | Acción |
|-----------|--------|
| Eventos no deseados | `HOME_LEARNING_ENABLED: false` → bridge no-op → eventos silenciados |
| Debug excesivo | Comentar `emitAppointmentSelected(item)` en onClick/onKeyDown |
| Rollback completo | Revert cambios en `HomeBridge.ts` y `page.tsx` |

## Validation Results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **Appointment selection still works** | ✅ `setSelectedAppointmentId` called first, before bridge |
| 2 | **Dossier still renders** | ✅ No changes to `selectedAppointment` derivation or dossier logic |
| 3 | **No UI changes** | ✅ Zero CSS changes, zero layout changes, zero new components |
| 4 | **Event emitted once per selection** | ✅ `lastSelectionRef` dedup — same ID skipped |
| 5 | **No duplicate events on rapid clicks** | ✅ Dedup check before bridge call |
| 6 | **Initial event emitted on mount** | ✅ useEffect on `liveAppointments.length` |
| 7 | **Keyboard selection works** | ✅ `onKeyDown` handler also calls `emitAppointmentSelected` |
| 8 | **Mock vs real distinguished** | ✅ `isMock` flag in every event payload |
| 9 | **Service category derived correctly** | ✅ Matches keyword patterns for salon services |
| 10 | **No W5/W6/W7/W8-W15 changes** | ✅ No tocados |
| 11 | **No Messages/Campaigns/Meta changes** | ✅ No tocados |
| 12 | **No repository created** | ✅ This is signal-only (additive) |
| 13 | **Compilación TypeScript** | ✅ Solo error pre-existente en inbox |
| 14 | **Failsafe: never throws** | ✅ Try/catch en bridge → console.warn |

## Signal Status Summary

| Widget | Signal | Status |
|--------|--------|:------:|
| W11 | `client_arrived` | ✅ Flowing (Phase 2.5) |
| **W4** | **`appointment_selected`** | ✅ **Flowing (Phase B-4)** |
| W3 | *weather_viewed* | ⏳ Future |
| W5 | *ai_recommendation_shown* | ⏳ Future |
| W6 | *platform_health_changed* | ⏳ Future |
| W7 | *kpi_metrics_viewed* | ⏳ Future |
| W8-W14 | *dossier_signals* | ⏳ Phase D |

## Files Modified (total lines change)

| File | Added | Removed | Net |
|------|:-----:|:-------:|:---:|
| `src/bridges/HomeBridge.ts` | ~52 | 0 | +52 |
| `src/app/page.tsx` | ~55 | 0 | +55 |
| **Total** | **~107** | **0** | **+107** |
