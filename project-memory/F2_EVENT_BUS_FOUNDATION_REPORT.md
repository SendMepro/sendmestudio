# Phase F-2 — Event Bus Foundation

**Fecha:** 2026-05-30T03:22 UTC
**Checkpoint:** 35 → 36
**Estado:** ✅ Completado

---

## 1. Resumen

Creación del `EventBus` — sistema central de publicación/suscripción in-memory para el pipeline de inteligencia del Emotional Salon. `HomeLearningAgent.enqueueEvent()` ahora emite eventos a través del EventBus después de persistirlos. `LearningEventRepository` se suscribe automáticamente al EventBus para recibir eventos de cualquier fuente.

## 2. Cambios realizados

### Nuevo archivo
- **`src/agents/home/EventBus.ts`** (77 líneas)
  - `subscribe(eventType, callback)` — Suscripción a un tipo de evento, retorna función de unsubscribe
  - `unsubscribe(eventType, callback)` — Elimina una suscripción específica
  - `emit(eventType, payload)` — Emite evento a todos los suscriptores (async-safe)
  - `getSubscribers(eventType)` — Inspección de suscriptores
  - Singleton `eventBus` exportado para uso app-wide

### Archivos modificados
- **`src/agents/home/HomeLearningAgent.ts`**
  - Importa `eventBus` de `./EventBus`
  - `enqueueEvent()` ahora emite `eventBus.emit(event.type, event)` después de persistir
  - Failsafe try/catch — el evento siempre se encola y persiste aunque falle la emisión

- **`src/repositories/LearningEventRepository.ts`**
  - Importa `eventBus` de `../agents/home/EventBus`
  - Nuevo método `init()` — se suscribe a los 13 tipos de `LearningEventType`
  - Singleton `learningEventRepository.init()` se llama automáticamente al importar

## 3. Arquitectura

```
page.tsx
  └── emitAppointmentSelected()
        └── HomeBridge.enqueueAppointmentEvent()
              └── HomeLearningAgent.buildLearningEvent()
                    └── HomeLearningAgent.enqueueEvent()
                          ├── eventQueue.push(event)              ← in-memory
                          ├── learningEventRepository.addEvent()  ← localStorage (direct)
                          └── eventBus.emit(event.type, event)    ← pub/sub
                                └── LearningEventRepository.init()
                                      └── (subscribed callbacks)
                                            └── .addEvent(event)  ← localStorage (via bus)
```

## 4. Validación

| Check | Resultado |
|-------|-----------|
| EventBus creado | ✅ subscribe, unsubscribe, emit, getSubscribers |
| HomeLearningAgent emite por EventBus | ✅ `enqueueEvent()` → `eventBus.emit(event.type, event)` |
| LearningEventRepository recibe eventos | ✅ `init()` se suscribe a 13 tipos de evento |
| `appointment_selected` signal funciona | ✅ HomeBridge → HomeLearningAgent → EventBus + persist |
| `client_arrived` signal funciona | ✅ Ya en LearningEventType, mismo flujo |
| Sin cambios UI | ✅ page.tsx, componentes home no tocados |
| TypeScript — 0 errores nuevos | ✅ 2 pre-existing (inbox ref, emit type) |
| Sin database | ✅ In-memory + localStorage adapter |

## 5. Detalles técnicos

- **EventBus:** In-memory, async-safe, singleton
- **Suscripción automática:** `LearningEventRepository.init()` subscribe a todos los `LearningEventType`
- **Failsafe doble:** Si EventBus.emit() falla, el evento sigue encolado y persistido
- **Decoupling:** Cualquier fuente puede emitir eventos al bus; cualquier consumidor puede suscribirse

## 6. Próximo paso

**Phase F-3: Intelligence Consumers** — Consumidores que procesan eventos del EventBus (análisis, métricas, alertas).
