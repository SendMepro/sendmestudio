# Phase F-1 — HomeLearningAgent Event Store Foundation

**Fecha:** 2026-05-30T03:18 UTC
**Checkpoint:** 34 → 35
**Estado:** ✅ Completado

---

## 1. Resumen

Creación del `LearningEventRepository` como almacén de eventos persistente para `HomeLearningAgent`. Los eventos de aprendizaje ahora se escriben a `localStorage` usando el adapter pattern existente. El agente `HomeLearningAgent.enqueueEvent()` persiste cada evento al repositorio además de mantener su cola en memoria.

## 2. Cambios realizados

### Nuevo archivo
- **`src/repositories/LearningEventRepository.ts`** (69 líneas)
  - `addEvent(event)` — Añade evento a localStorage, con cap de 500 eventos
  - `getEvents()` — Retorna todos los eventos (más recientes primero)
  - `getEventsByType(type)` — Filtra por tipo de evento
  - `getEventsByClient(clientId)` — Filtra por ID de cliente
  - `getEventsBySource(source)` — Filtra por origen (ej: `"HomeLearningAgent:W4-AppointmentFlow"`)
  - `clearEvents()` — Elimina todos los eventos persistidos
  - Usa `LocalStorageAdapter` (singleton existente)
  - Storage key: `home:learning-events`
  - Singleton exportado para uso app-wide

### Archivo modificado
- **`src/agents/home/HomeLearningAgent.ts`**
  - Importa `learningEventRepository`
  - `'appointment_selected'` añadido al type union `LearningEventType` (corrige error TS pre-existente en HomeBridge.ts)
  - `enqueueEvent()` ahora persiste al repositorio via `learningEventRepository.addEvent(event)`
  - Failsafe try/catch — el evento siempre se encola en memoria aunque falle la persistencia

## 3. Validación

| Check | Resultado |
|-------|-----------|
| `appointment_selected` signal funciona | ✅ TypeScript — error de tipo corregido |
| `client_arrived` signal funciona | ✅ Ya en `LearningEventType`, sin cambios |
| HomeLearningAgent persiste eventos | ✅ `enqueueEvent()` → `learningEventRepository.addEvent()` |
| Sin cambios UI | ✅ No se tocó page.tsx ni componentes home |
| Sin nuevos errores TS | ✅ 2 errores pre-existentes (inbox ref, emit type) — error de bridge eliminado |
| Sin Supabase/Prisma/SQL | ✅ localStorage + adapter pattern únicamente |

## 4. Arquitectura

```
page.tsx
  └── emitAppointmentSelected()
        └── HomeBridge.enqueueAppointmentEvent()
              └── HomeLearningAgent.buildLearningEvent()
                    └── HomeLearningAgent.enqueueEvent()
                          ├── eventQueue.push(event)      ← in-memory
                          └── learningEventRepository.addEvent(event)  ← localStorage
                                └── localStorageAdapter.setJSON('home:learning-events', events)
```

## 5. Detalles técnicos

- **Storage key:** `home:learning-events`
- **Capacidad máxima:** 500 eventos (los más antiguos se descartan automáticamente)
- **Adapter:** `LocalStorageAdapter` (singleton, SSR-safe, getJSON/setJSON)
- **Formato de evento:** `LearningEvent` — id, type, section, source, clientId, timestamp, data, metadata
- **Failsafe:** Si localStorage falla (lleno, deshabilitado, SSR), el evento sigue en memoria

## 6. Próximo paso

**Phase F-2: Event Bus** — Sistema de publicación/suscripción para eventos de aprendizaje.
