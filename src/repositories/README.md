# src/repositories/

## Propósito
Capa de abstracción de datos para los agentes. Los repositorios se comunican con los adapters de almacenamiento y exponen interfaces limpias (get, set, find, delete) para los agentes.

## Arquitectura
```
Agents → Repositories → Storage Adapters → { InMemory | LocalStorage | Future Database }
```

## Repositorios planificados
- `AppointmentRepository.ts` — Citas y su estado
- `ClientRepository.ts` — Perfiles de clientes, preferencias, historial
- `IntelligenceRepository.ts` — Eventos de aprendizaje, insights
- `PlatformHealthRepository.ts` — Estado de salud de integraciones
- `ConversationRepository.ts` — Mensajes y conversaciones (futuro)
- `CampaignRepository.ts` — Campañas y plantillas (futuro)

## Regla
Los agentes NUNCA importan localStorage, fetch, o DatabaseClient. Siempre pasan por repositorios.

## Estado actual
Foundation folder — empty, awaiting implementation in Phase 2.3+.
