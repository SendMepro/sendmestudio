# AgentInspector

## Rol
Inspecciona agentes registrados y secciones del proyecto para verificar estructura, contratos dependencias y salud general del ecosistema.

## Responsabilidades
- Analizar archivos de una sección (pages, components, API routes) — legado
- Identificar dependencias importadas — legado
- Detectar problemas potenciales (archivos rotos, imports huérfanos) — legado
- **Inspeccionar agentes registrados en AgentRegistry** — nuevo
- **Detectar agentes sin código (`agentsWithoutCode`)** — nuevo
- **Detectar archivos `.ts` sin registro (`codeFilesWithoutRegistration`)** — nuevo
- **Verificar cumplimiento de contratos (`ping()`/`health()`)** — nuevo
- **Detectar dependencias rotas entre agentes** — nuevo
- **Inspeccionar agentes de una sección específica** — nuevo
- **Generar reporte estructurado de inspección unificado** — nuevo

## Input
- `inspect(path)` — ruta de la sección a inspeccionar (legado + agentes)
- `inspectSectionAgents(sectionName)` — nombre de sección para inspección focalizada

## Output
Reporte de inspección extendido:

```
{
  // Legacy
  section, files, dependencies, issues, health, inspectedAt,

  // Agent-level
  registryHealth: {
    registered, agentsWithCode,
    agentsWithoutCode: string[],       // registered but no .ts file
    codeFilesWithoutRegistration: []   // has .ts but not registered
  },
  sectionCompletion: {
    planned, created, active,
    missing: string[]                  // planned but no code file
  },
  dependencyIssues: [{
    agent, missingDependency
  }],
  contractCompliance: {
    total, withPing, withoutPing,
    withHealth, withoutHealth
  },
  agentDetails: [{
    name, category, status, lifecycleStatus,
    hasCodeFile, hasPingMethod, hasHealthMethod,
    dependencyIssues, health
  }]
}
```

## Métodos

### `inspect(sectionPath)`
Analiza un directorio del sistema de archivos y también cruza los agentes registrados. Retorna un `InspectionReport` unificado con datos de archivos + agentes.

### `inspectSectionAgents(sectionName)`
Inspecciona solo los agentes registrados en `AgentRegistry` que coinciden con una sección (por fase, categoría o nombre). Retorna detalles de agentes, cumplimiento de contratos, dependencias rotas y salud general de la sección.

## Dependencias
- AgentRegistry (para leer agentes registrados)
- `types.ts` (para `AgentCategory`)
- `node:fs` / `node:fs/promises` (para escanear archivos)
- `node:path` (para resolver rutas)

## Estados de salud por agente

| Condición | Health |
|-----------|--------|
| ✅ Tiene archivo `.ts`, dependencias intactas, `ping()`/`health()` presentes | `healthy` |
| ⚠️ Activo pero sin `ping()` o sin `health()` | `warning` |
| ❌ Sin archivo `.ts` o con dependencias rotas | `critical` |
