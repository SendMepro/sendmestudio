# src/adapters/

## Propósito
Capa de almacenamiento para los repositorios. Los adapters implementan interfaces de almacenamiento concretas (InMemory, localStorage, o futura Database) que los repositorios usan sin conocer detalles de implementación.

## Arquitectura
```
Repositories → Storage Adapters → { InMemory | LocalStorage | Future Database }
```

## Adapters planificados
- `InMemoryAdapter.ts` — Almacenamiento en memoria volátil (pérdida al recargar). Ideal para testing y dev.
- `LocalStorageAdapter.ts` — Almacenamiento persistente en localStorage del navegador. Para producción sin backend.
- `DatabaseAdapter.ts` — FUTURO: Para migración a servidor (PostgreSQL, Supabase, SQLite, etc.)

## Regla
Los agentes NUNCA deben importar localStorage, fetch, o DatabaseClient directamente. Solo los repositorios se comunican con adapters.

## Estado actual
Foundation folder — empty, awaiting implementation in Phase 2.3+.
