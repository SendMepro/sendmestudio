# HomeInspectorAgent

## Propósito
Inspeccionar los widgets del Home dashboard y detectar problemas de datos, fuentes faltantes, flujos rotos y widgets que deberían alimentar Intelligence.

## Responsabilidades
- Inspeccionar todos los widgets del Home
- Detectar widgets que usan datos mock
- Detectar fuentes de datos faltantes
- Detectar flujos de datos rotos
- Detectar widgets que deberían alimentar Intelligence pero no lo hacen
- Generar un resumen de inspección con issues priorizados

## Inputs
- Mapa de widgets (desde HOME_WIDGET_MAP.md)
- Mapa de fuentes de datos (desde HomeDataSourceAgent)
- Estado actual del Home (desde HomeOrchestratorAgent)

## Outputs
- Reporte de inspección con issues detectados
- Lista de widgets mock
- Lista de fuentes faltantes
- Lista de widgets críticos
- Resumen ejecutivo de inspección

## Dependencias
- HomeOrchestratorAgent (conceptual)
- HomeDataSourceAgent (conceptual)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe modificar la UI
- NO debe modificar datos
- NO debe ejecutar cambios — solo inspeccionar y reportar

## Integración con repositorios futuros
Usará AppointmentRepository y ClientRepository para verificar la disponibilidad real de datos (vs. datos mock).

## Integración con Intelligence futura
Identificará qué widgets del Home deberían estar alimentando Intelligence y reportará si lo están haciendo o no.

## Widgets relacionados (de HOME_WIDGET_MAP.md)
- W4: Appointment Flow List — riesgo ALTO
- W5: Client Focus Card — riesgo ALTO
- W7: KPI Metrics — riesgo ALTO
- W8: Emotional Profile — riesgo CRÍTICO
- W9: Material Intelligence — riesgo CRÍTICO
- W10: Customer LTV — riesgo CRÍTICO
- W12: AI Alerts — riesgo CRÍTICO
- W13: AI Recommendation — riesgo CRÍTICO
- W14: Technical History — riesgo CRÍTICO

## Estado actual
Foundation skeleton — no conectado a la UI ni a repositorios reales.
