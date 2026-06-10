# Phase F-6 — Intelligence Surface

**Fecha:** 2026-05-30T03:44 UTC
**Checkpoint:** 39 → 40
**Estado:** ✅ Completado

---

## 1. Resumen

Conexión de la IntelligenceLayer con HomeBridge a través del método `getIntelligenceInsights()`. Se añadió feature flag `HOME_INTELLIGENCE_ENABLED` (default: `true`). El bridge expone insights de negocio categorizados al dashboard.

## 2. Cambios realizados

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/config/featureFlags.ts` | + `HOME_INTELLIGENCE_ENABLED` flag (9 lines added) |
| `src/bridges/HomeBridge.ts` | + import de `IntelligenceLayer`, + method `getIntelligenceInsights()`, + flag mapping (12 lines added) |

### No creados nuevos
Phase F-6 es una capa de integración — no se crearon nuevos archivos fuente.

### Feature flag

| Flag | Default | Propósito |
|------|:-------:|-----------|
| `HOME_INTELLIGENCE_ENABLED` | `true` | Habilita `getIntelligenceInsights()` vía bridge |

### Bridge method

```typescript
async getIntelligenceInsights(): Promise<BridgeResult<Insight[]>>
```

- Llama a `intelligenceLayer.serve()` con failsafe
- Retorna `BridgeResult<Insight[]>` con `fromAgent: true`
- Cuando deshabilitado: retorna `{ data: null, fromAgent: false }`
- En error: retorna `{ success: false, data: null, error }`

### Ruta completa de datos

```
EventBus
  ├── AppointmentSelectionConsumer.getSnapshot()
  ├── ClientArrivalConsumer.getSnapshot()
  └── RecommendationEngine.generate()
        └── Recommendation[]
              └── IntelligenceLayer.serve()
                    └── Insight[]
                          └── HomeBridge.getIntelligenceInsights()
                                └── BridgeResult<Insight[]>
                                      ├── success: true, data: Insight[]
                                      ├── success: false, data: null (failsafe)
                                      └── featureFlag disabled: data: null
```

## 3. Validación

| Check | Resultado |
|-------|-----------|
| Flag añadido `HOME_INTELLIGENCE_ENABLED` | ✅ Default `true`, type-safe en FeatureFlags |
| Bridge method creado `getIntelligenceInsights()` | ✅ safeCall con failsafe |
| Flag deshabilitado | ✅ Retorna `{ data: null, fromAgent: false }` |
| Flag habilitado con datos | ✅ 4 insights categorizados |
| Flag habilitado vacío | ✅ Retorna `[]` |
| Determinismo | ✅ Mismo input → mismo output |
| Sin cambios UI | ✅ page.tsx no tocado |
| Sin nuevos archivos fuente | ✅ Solo modificaciones |

## 4. Próximo paso

**Phase F: UI Integration** — Consumir insights del bridge en el Home dashboard (widget de recomendaciones).
