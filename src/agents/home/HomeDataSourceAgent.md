# HomeDataSourceAgent

## Propósito
Mapear los widgets del Home a sus fuentes de datos reales o futuras. Clasificar cada fuente como mock, localStorage, API, archivo JSON, o repositorio futuro.

## Responsabilidades
- Identificar si los datos vienen de mock, localStorage, Meta, WhatsApp, in-memory o repositorio futuro
- NO hacer fetch directamente — solo devolver metadatos de fuente
- Clasificar cada fuente de datos por tipo y calidad
- Detectar fuentes desconectadas o no implementadas
- Recomendar qué repositorio debería usar cada widget en el futuro

## Inputs
- Lista de widgets del Home (desde HOME_WIDGET_MAP.md)
- Mapa de fuentes de datos actual (desde HOME_DISCOVERY_REPORT.md)

## Outputs
- Mapa de fuentes de datos: `{ widgetId: string, source: DataSourceType, isMock: boolean, quality: 'real'|'mock'|'partial', recommendedRepository: string }`
- Lista de fuentes desconectadas
- Recomendaciones de repositorio por widget

## Dependencias
- HomeOrchestratorAgent (conceptual)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe hacer llamadas API
- NO debe leer archivos directamente
- NO debe modificar la UI
- NO debe modificar datos

## Integración con repositorios futuros
Recomendará qué repositorio (AppointmentRepository, ClientRepository, IntelligenceRepository, PlatformHealthRepository) debe usar cada widget.

## Integración con Intelligence futura
Identificará qué fuentes de datos deberían estar conectadas al pipeline de Intelligence.

## Widgets relacionados (de HOME_WIDGET_MAP.md)
- Todos los widgets W1-W15 tienen fuentes de datos mapeadas

## Estado actual
Foundation skeleton — esperando implementación de adapters y repositorios.
