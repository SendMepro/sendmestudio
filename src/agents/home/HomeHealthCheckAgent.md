# HomeHealthCheckAgent

## Propósito
Verificar que la sección Home sea estable y esté lista para conectarse a los repositorios y al pipeline de Intelligence.

## Responsabilidades
- Validar dependencias del Home conceptualmente
- Validar que los widgets requeridos existan (basado en el discovery report)
- Validar que no haya integraciones directas inseguras (localStorage, fetch directo)
- Validar que Home pueda conectarse a repositorios futuros
- Generar un reporte de salud general

## Inputs
- Reporte de inspección (desde HomeInspectorAgent)
- Mapa de fuentes (desde HomeDataSourceAgent)
- Lista de widgets esperados (15 desde HOME_WIDGET_MAP.md)

## Outputs
- Reporte de salud general
- Estado de readiness de widgets
- Estado de readiness de datos
- Estado de readiness de Intelligence
- Resumen ejecutivo de salud

## Dependencias
- HomeOrchestratorAgent (conceptual)
- HomeInspectorAgent (conceptual)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe modificar la UI
- NO debe modificar datos
- NO debe ejecutar cambios — solo verificar y reportar

## Integración con repositorios futuros
Verificará que los repositorios (AppointmentRepository, ClientRepository, etc.) estén disponibles y configurados correctamente.

## Integración con Intelligence futura
Verificará que el pipeline de Intelligence (IntelligenceRepository, HomeLearningAgent) esté correctamente conectado.

## Widgets relacionados (de HOME_WIDGET_MAP.md)
- W4: Appointment Flow List — debe tener loading/error states
- W6: Platform Health — debe migrar de localStorage a repositorio
- W7: KPI Metrics — debe obtener datos reales
- W8-W14: Dossier sections — deben tener datos reales o estados "en construcción"

## Estado actual
Foundation skeleton — esperando conexión a repositorios y pipeline de Intelligence.
