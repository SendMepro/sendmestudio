# W13_AI_RECOMMENDATION_MIGRATION_REPORT.md — Phase D-5

## Resumen

**Fecha:** 2026-05-30T02:13 UTC
**Fase:** Phase D-5 — W13 AI Recommendation Migration
**Checkpoint:** 24 ✅
**Estado:** ✅ Completado

Migración del widget W13 (Recomendación IA / AI Recommendation) para consumir datos desde `HomeAIInsightAgent` via `HomeBridge`, con fallback al inline `clientIntelligence.aiRecommendations`.

---

## Old Source (antes de la migración)

### page.tsx — W13 data sources

```
intel = getClientIntelligence(selectedAppointment)
  → appointment.clientIntelligence (inline hardcoded data on each appointment object)
  → defaultClientIntelligence (fallback)

aiRecommendations = intel.aiRecommendations → string[]
  → e.g. ["Ofrecer upgrade Olaplex / ...", "Validar el brillo / ...", "Mantener silencio relajante / ..."]
```

### page.tsx — W13 rendering (líneas 1680-1698)

```
intel.aiRecommendations.map((rec: string, idx) => (
  <li><ChevronRight /> <p>{renderBilingual(rec)}</p></li>
))
```

---

## New Source (después de la migración)

### Bridge flow

```
page.tsx useEffect (on selectedAppointmentId change)
  → new HomeBridge()
  → bridge.getAIRecommendations(appointmentId)
    → safeCall('HomeAIInsightAgent', agentFn, 'HOME_AI_INSIGHT_ENABLED')
      → agent.generateClientInsights(appointmentId)
        → clientRepo.getClientByAppointment(appointmentId)
        → appointmentRepo.getAppointmentById(appointmentId)
        → deriveRecommendations(profile, completed, currentAppointment, hasRealData)
          → returns AIRecommendation[] (objects with priority, action, reason, estimatedImpact)
      → map each AIRecommendation → .action (returns string[])
  → setAiRecommendationsFromBridge(result.data)

Render:
  recs = aiRecommendationsFromBridge ?? intel.aiRecommendations
  → recs.map((rec: string, idx) => ...)  // same as before
```

### Bridge adapter

`getAIRecommendations()` extracts `.action` from each `AIRecommendation` object to return `string[]` — matching the existing rendering that expects simple strings.

### Recommendation derivation rules

| Condition | Priority | Action | Reason | Impact |
|-----------|:--------:|--------|--------|--------|
| Has favorite services | high | `Ofrecer renovación de {topService}` | Servicio favorito recurrente | +$price CLP |
| Has corte service history | medium | `Ofrecer tratamiento capilar complementario` | Corte client — high treatment acceptance | +$45.000 a $96.000 CLP |
| 45-60 days since last visit | high | `Enviar recordatorio de mantenimiento` | Re-engagement window | Alta probabilidad de retorno |
| No recommendations match | medium | `Realizar diagnóstico completo en próxima visita` | Build preference baseline | — |
| No real data | medium | `Recopilar datos de servicio para generar recomendaciones` | Insufficient history | — |

---

## Validation results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ 0 errores nuevos (solo 2 pre-existentes) |
| 2 | **W13 conectado a HomeAIInsightAgent** | ✅ vía HomeBridge.getAIRecommendations() |
| 3 | **Fallback funciona** | ✅ `recs = aiRecommendationsFromBridge ?? intel.aiRecommendations` |
| 4 | **Misma UX** | ✅ Misma lista, mismo layout, mismos colores |
| 5 | **Compatibilidad de tipos** | ✅ Bridge devuelve `string[]` igual que legacy |
| 6 | **W8-W12, W14 intactos** | ✅ Solo W13 AI Recommendation cambiado |
| 7 | **Reusa flag existente** | ✅ `HOME_AI_INSIGHT_ENABLED` |

---

## Files changed (Phase D-5)

| Archivo | Cambio |
|---------|--------|
| `src/bridges/HomeBridge.ts` | +`getAIRecommendations()` bridge method (returns `string[]` from `AIRecommendation.action`) |
| `src/app/page.tsx` | +state, +useEffect, +`recs` computed, `intel.aiRecommendations` → `recs` en W13 |

---

## Rollback

1. **page.tsx**: Remove state + useEffect; revert `recs` → `intel.aiRecommendations`
2. **HomeBridge.ts**: Remove `getAIRecommendations()` method
