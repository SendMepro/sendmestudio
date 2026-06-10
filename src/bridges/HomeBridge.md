# src/bridges/HomeBridge.md

## Propósito
Capa de integración segura entre el Home dashboard (`src/app/page.tsx`) y los Home agents (`src/agents/home/`). HomeBridge actúa como intermediario que solo enruta peticiones a los agentes cuando los feature flags están activados, y siempre proporciona un fallback seguro si algo falla.

## Arquitectura

```
Home UI (src/app/page.tsx)
    │
    ▼
HomeBridge (src/bridges/HomeBridge.ts)
    │
    ├──► Feature Flag Check ──► DISABLED → return null (legacy code continues)
    │
    ├──► Feature Flag Check ──► ENABLED → route to agent
    │       │
    │       ├──► try → agent returns data → BridgeResult.success = true
    │       │
    │       └──► catch → fallbackToLegacy() → BridgeResult.success = false
    │
    └──► Caller (Home dashboard) uses BridgeResult:
         - success=true, data=result → use agent data
         - success=true, data=null → use legacy data (flag disabled)
         - success=false → use legacy data + log error
```

## Feature Flag Strategy

Todas las flags están en `src/config/featureFlags.ts` y por defecto son `false`:

| Flag | Propósito | Default |
|------|-----------|---------|
| `HOME_AGENTS_ENABLED` | Master switch para todos los agentes Home | `false` |
| `HOME_DATASOURCE_ENABLED` | Habilita HomeDataSourceAgent (read-only) | `false` |
| `HOME_INSPECTOR_ENABLED` | Habilita HomeInspectorAgent (read-only) | `false` |
| `HOME_HEALTHCHECK_ENABLED` | Habilita HomeHealthCheckAgent (read-only) | `false` |
| `HOME_LEARNING_ENABLED` | Habilita HomeLearningAgent (colección de señales) | `false` |
| `HOME_ORCHESTRATOR_ENABLED` | Habilita HomeOrchestratorAgent (fuente de datos primaria) | `false` |

**NINGUNA FLAG ESTÁ ACTIVADA.** El comportamiento del Home es exactamente el mismo que antes.

## Migration Strategy

El HomeBridge soporta migración incremental widget por widget:

1. **Fase A — Foundation**: Bridge creado, flags desactivados. Home no cambia.
2. **Fase B — Read-only agents**: Activar `HOME_DATASOURCE_ENABLED`, `HOME_INSPECTOR_ENABLED`, `HOME_HEALTHCHECK_ENABLED`. Los agentes solo leen, no modifican datos. Home sigue igual.
3. **Fase C — Learning**: Activar `HOME_LEARNING_ENABLED`. HomeLearningAgent recolecta señales. Home sigue igual.
4. **Fase D — Orchestrator**: Activar `HOME_ORCHESTRATOR_ENABLED`. El dashboard empieza a recibir datos del orquestador. Los widgets se migran uno por uno.
5. **Master switch**: `HOME_AGENTS_ENABLED` activa todo de una vez (para pruebas).

## Rollback Strategy

| Scenario | Acción | Impacto |
|----------|--------|---------|
| Widget no funciona con agente | Desactivar flag de ese widget | Home vuelve a datos legacy |
| Agente retorna datos incorrectos | Desactivar flag del agente | Home usa datos legacy |
| Bridge falla | try/catch captura error | Home usa datos legacy |
| Error de build | Revertir a checkpoint-6 | Todos los archivos nuevos son aditivos |
| Rollback completo | `resetFeatureFlags()` | Todas las flags vuelven a false |

## Failure Handling

Cada llamada del bridge sigue este patrón:

```
try {
    if (flagEnabled) {
        result = await agent.method();
        return { success: true, data: result, fromAgent: true };
    }
    return { success: true, data: null, fromAgent: false };
} catch (error) {
    fallbackToLegacy(agentName, error);
    return { success: false, data: null, error, fromAgent: true };
}
```

El caller (Home dashboard) siempre recibe un `BridgeResult<T>` seguro. Nunca crashea aunque el agente falle.

## Bridge Methods

| Método | Agente | Retorna | Uso futuro |
|--------|--------|---------|------------|
| `initialize()` | Todos | `boolean` | Inicializar bridge al montar Home |
| `isAgentEnabled(name)` | — | `boolean` | Verificar si un agente está habilitado |
| `getDataSource()` | HomeDataSourceAgent | `DataSourceInfo[]` | Mapa de fuentes de datos por widget |
| `runInspection()` | HomeInspectorAgent | `InspectionSummary` | Detección de problemas |
| `runHealthCheck()` | HomeHealthCheckAgent | `HealthSummary` | Verificación de salud |
| `collectLearningSignals()` | HomeLearningAgent | `LearningEvent[]` | Señales para Intelligence |
| `getDashboardOverview()` | HomeOrchestratorAgent | `DashboardOverview` | Vista unificada del dashboard |
| `getRecommendedActions()` | HomeOrchestratorAgent | `RecommendedAction[]` | Próximas acciones recomendadas |
| `getLearningSummary()` | HomeLearningAgent | `LearningSummary` | Resumen de señales recolectadas |

## Widget Migration Plan

El bridge soporta la migración definida en `HOME_MIGRATION_ORDER.md`:

| Phase | Widgets | Bridge Impact |
|-------|---------|--------------|
| A | W11 (Arrival) + read-only agents | Bridge crea conexiones pero no enruta datos |
| B | W4 (Appointment), W6 (Platform Health) | Bridge comienza a enrutar cuando flags se activen |
| C | W5, W7, W2, W3 | Bridge agrega endpoints según sea necesario |
| D | W8-W14 (Dossier completo) | Bridge enruta datos del dossier a través del orquestador |

## Dependencias

- `src/config/featureFlags.ts` — sistema de feature flags
- `src/agents/home/HomeOrchestratorAgent.ts` — coordinador del dashboard
- `src/agents/home/HomeDataSourceAgent.ts` — mapeador de fuentes
- `src/agents/home/HomeInspectorAgent.ts` — inspector de widgets
- `src/agents/home/HomeHealthCheckAgent.ts` — verificador de salud
- `src/agents/home/HomeLearningAgent.ts` — puente a Intelligence

## Estado actual
Foundation skeleton — creado pero no conectado al Home. Todas las flags desactivadas.
Checkpoint-6 creado.
