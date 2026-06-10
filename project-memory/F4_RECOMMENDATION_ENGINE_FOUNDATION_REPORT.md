# Phase F-4 — Recommendation Engine Foundation

**Fecha:** 2026-05-30T03:34 UTC
**Checkpoint:** 37 → 38
**Estado:** ✅ Completado

---

## 1. Resumen

Creación del motor de recomendaciones determinista (sin LLM) que procesa datos de los Intelligence Consumers (Phase F-3) para generar sugerencias accionables. El motor usa reglas puras con umbrales configurables.

## 2. Cambios realizados

### Nuevos archivos

| Archivo | Líneas | Propósito |
|---------|:------:|-----------|
| `src/agents/home/recommendations/types.ts` | 28 | Tipos compartidos: `Recommendation`, `RecommendationType`, `RecommendationPriority`, `RecommendationCandidate` |
| `src/agents/home/recommendations/RecommendationEngine.ts` | 141 | Motor de reglas determinista con 6 reglas + singleton |

### Umbrales configurables

| Constante | Valor | Descripción |
|-----------|:-----:|-------------|
| `vipSelectionCount` | 3 | Cliente seleccionado ≥ este valor = VIP |
| `upsellSelectionCount` | 2 | Servicio seleccionado ≥ este valor = Upsell |
| `rebookingMinSelections` | 2 | Mínimo de selecciones para análisis de rebooking |
| `loyalArrivalCount` | 3 | Cliente con ≥ esta cantidad de llegadas = Fidelizado |
| `attentionSelectionThreshold` | 3 | Cliente con ≥ selecciones y 0 llegadas = Atención |

### Reglas implementadas (6)

| # | Regla | Consumidor | Recomendación | Prioridad |
|---|-------|-----------|---------------|-----------|
| 1 | `selectionsByClient[name] >= 3` | AppointmentSelectionConsumer | `vip` | high |
| 2 | `selectionsByService[name] >= 2` | AppointmentSelectionConsumer | `upsell` | medium |
| 3 | Selecciones ≥ 2 + 0 llegadas | Ambos | `rebooking` | medium |
| 4 | `arrivalsByClient[id] >= 3` | ClientArrivalConsumer | `vip` | high |
| 5 | Selecciones ≥ threshold + 0 llegadas | Ambos | `retention` | high |
| 6 | Total selecciones > 0 + total llegadas = 0 | Ambos | `attention` | low |

## 3. Arquitectura

```
EventBus
  ├── AppointmentSelectionConsumer   ← appointment_selected
  │     └── getSnapshot()
  ├── ClientArrivalConsumer          ← client_arrived
  │     └── getSnapshot()
  └── LearningEventRepository        ← persist
        └── getEvents()

RecommendationEngine.generate()
  ├── appointmentSelectionConsumer.getSnapshot()
  ├── clientArrivalConsumer.getSnapshot()
  └── → Recommendation[]
      (6 reglas deterministas, sin LLM)
```

## 4. Validación

| Check | Resultado |
|-------|-----------|
| RecommendationEngine creado | ✅ 141 líneas, 6 reglas, singletons |
| types.ts creado | ✅ 28 líneas, tipos completos |
| Reglas deterministas | ✅ Mismo input → mismo output |
| Caso vacío | ✅ Retorna `[]` sin errores |
| Solo arrivals | ✅ VIP detectado desde arrivals |
| Sin AI / LLM | ✅ 0 imports de OpenAI/Anthropic, 0 prompts |
| Sin cambios UI | ✅ page.tsx, componentes home no tocados |
| Consumidores funcionan | ✅ No modificados (AppointmentSelectionConsumer.ts, ClientArrivalConsumer.ts intactos) |
| Repository persiste | ✅ No modificado |
| Sin database | ✅ In-memory únicamente |

## 5. Próximo paso

**Phase F-5: Intelligence Layer** — Conexión de recommendation engine con el exterior (widgets, panel de recomendaciones, o superficie de UI).
