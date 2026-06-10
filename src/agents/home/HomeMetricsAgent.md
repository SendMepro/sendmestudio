# HomeMetricsAgent

## Propósito
Calcular métricas reales del Home dashboard a partir de datos de citas del AppointmentRepository. Reemplazar los KPIs hardcodeados (W7) con valores calculados dinámicamente desde datos reales (completados, cancelados, clientes activos, ticket promedio, retención, recompra).

## Responsabilidades
- Calcular total de citas y su desglose por estado
- Identificar clientes activos en el período actual
- Calcular ticket promedio de servicios realizados
- Medir tasa de retención y recompra
- Producir un MetricsSnapshot con todas las métricas consolidadas
- NO modificar la UI ni los KPIs actuales
- NO acceder directamente a localStorage, fetch, o base de datos
- NO almacenar datos directamente

## Inputs
- AppointmentRepository (vía método getAppointments, getCompletedAppointments, etc.)

## Outputs
- MetricsSnapshot: estructura con todas las métricas calculadas

## Dependencias
- AppointmentRepository (Phase C-0)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe importar base de datos
- NO debe modificar la UI
- NO debe reemplazar KpiMetricsRepository ni W7
- NO debe importar nada de page.tsx

## Integración futura
- W7 KPI Metrics Cards consumirá este agente vía HomeBridge
- HomeLearningAgent recibirá señales de métricas calculadas
- HomeOrchestratorAgent coordinará la agregación de métricas

## Fórmulas de métricas

| Métrica | Fórmula | Fuente |
|---------|---------|--------|
| totalAppointments | `count(all)` | AppointmentRepository.getAppointments() |
| completedAppointments | `count(status === complet* OR tone === done)` | getCompletedAppointments() |
| cancelledAppointments | `count(status === cancel* OR cancelled)` | getAppointments() filter |
| activeClients | `unique(client)` completados en el período | getCompletedAppointments() |
| averageTicket | `avg(price estimate)` from completed | getCompletedAppointments() |
| retentionRate | `appointments(client) >= 2 / total clients` | getAppointmentsByClient() |
| repurchaseRate | `unique clients returning / total unique clients` | getCompletedAppointments() |
