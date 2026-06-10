# W12_AI_ALERTS_MIGRATION_REPORT.md — Phase D-4

## Resumen

**Fecha:** 2026-05-30T02:09 UTC
**Fase:** Phase D-4 — W12 AI Alerts Migration
**Checkpoint:** 23 ✅
**Estado:** ✅ Completado

Migración del widget W12 (Alertas IA / AI Alerts) para consumir datos desde `HomeAIInsightAgent` via `HomeBridge`, con fallback al inline `clientIntelligence.aiAlerts`.

---

## Old Source (antes de la migración)

### page.tsx — W12 data sources

```
intel = getClientIntelligence(selectedAppointment)
  → appointment.clientIntelligence (inline hardcoded data on each appointment object)
  → defaultClientIntelligence (fallback)

aiAlerts = intel.aiAlerts  → string[]
  → e.g. ["Sensible a la demora en lavado / ...", "Alta receptividad a Olaplex / ...", ...]
```

### page.tsx — W12 rendering (líneas 1636-1653)

```
intel.aiAlerts.map((alert: string, idx) => (
  <li><span className="aiAlertBullet" /><p>{renderBilingual(alert)}</p></li>
))
```

---

## New Source (después de la migración)

### Bridge flow

```
page.tsx useEffect (on selectedAppointmentId change)
  → new HomeBridge()
  → bridge.getAIAlerts(appointmentId)
    → safeCall('HomeAIInsightAgent', agentFn, 'HOME_AI_INSIGHT_ENABLED')
      → agent.generateClientInsights(appointmentId)
        → clientRepo.getClientByAppointment(appointmentId)
        → appointmentRepo.getAppointmentById(appointmentId)
        → deriveAlerts(profile, completed, hasRealData)
          → returns AIAlert[] (objects with severity, message, category)
      → map each AIAlert → .message (returns string[])
  → setAiAlertsFromBridge(result.data)

Render:
  alerts = aiAlertsFromBridge ?? intel.aiAlerts
  → alerts.map((alert: string, idx) => ...)  // same as before
```

### Bridge adapter

`getAIAlerts()` extracts `.message` from each `AIAlert` object to return `string[]` — matching the existing rendering that expects simple strings.

### Alert derivation rules

| Condition | Severity | Category | Message |
|-----------|:--------:|:--------:|---------|
| >1 cancelled appointment | medium | risk | "{count} cancelaciones registradas — evaluar patrón / ..." |
| No service ≥$120K and ≥2 completed | high | opportunity | "Cliente con potencial de upgrade a servicios premium / ..." |
| >60 days since last visit | critical | engagement | "{days} días sin visita — riesgo de pérdida / ..." |
| No WhatsApp consent, has phone | low | behavior | "Sin consentimiento WhatsApp — limitaciones de comunicación / ..." |
| No issues detected | low | behavior | "Cliente estable — sin alertas / ..." |
| No real data | low | behavior | "Sin datos suficientes para generar alertas / ..." |

---

## Validation results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ 0 errores nuevos (solo 2 pre-existentes) |
| 2 | **W12 conectado a HomeAIInsightAgent** | ✅ vía HomeBridge.getAIAlerts() |
| 3 | **Fallback funciona** | ✅ `alerts = aiAlertsFromBridge ?? intel.aiAlerts` |
| 4 | **Misma UX** | ✅ Misma lista, mismo layout, mismos colores |
| 5 | **Compatibilidad de tipos** | ✅ Bridge devuelve `string[]` igual que legacy |
| 6 | **W8-W10, W13-W14 intactos** | ✅ Solo W12 AI Alerts cambiado |
| 7 | **Reusa flag existente** | ✅ `HOME_AI_INSIGHT_ENABLED` |

---

## Files changed (Phase D-4)

| Archivo | Cambio |
|---------|--------|
| `src/bridges/HomeBridge.ts` | +`getAIAlerts()` bridge method (returns `string[]` from `AIAlert.message`) |
| `src/app/page.tsx` | +state, +useEffect, +`alerts` computed, `intel.aiAlerts` → `alerts` en W12 |

---

## Rollback

1. **page.tsx**: Remove state + useEffect; revert `alerts` → `intel.aiAlerts`
2. **HomeBridge.ts**: Remove `getAIAlerts()` method
