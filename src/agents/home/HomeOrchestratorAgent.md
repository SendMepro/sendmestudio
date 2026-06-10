# HomeOrchestratorAgent

## Propósito
Coordinar la sección Home del dashboard, actuando como punto de entrada único para la UI de Home. Orquesta la comunicación entre HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent y HomeLearningAgent.

## Responsabilidades
- Coordinar el flujo de datos del Home dashboard
- Llamar conceptualmente a HomeDataSourceAgent para mapear fuentes de datos
- Llamar conceptualmente a HomeInspectorAgent para detectar problemas
- Llamar conceptualmente a HomeHealthCheckAgent para verificar salud
- Llamar conceptualmente a HomeLearningAgent para recolectar señales de aprendizaje
- Proveer un punto de entrada único futuro para la UI de Home

## Inputs
- Signals de widgets del Home (desde la UI en el futuro)
- Reportes de HomeInspectorAgent
- Reportes de HomeHealthCheckAgent
- Mapa de fuentes de HomeDataSourceAgent
- Eventos de aprendizaje de HomeLearningAgent

## Outputs
- Dashboard overview unificado
- Estado de inspección del Home
- Estado de salud del Home
- Señales de aprendizaje consolidadas
- Próximas acciones recomendadas

## Dependencias
- HomeDataSourceAgent (conceptual)
- HomeInspectorAgent (conceptual)
- HomeHealthCheckAgent (conceptual)
- HomeLearningAgent (conceptual)
- EmotionalSalonOrchestrator (futuro)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe importar base de datos
- NO debe modificar la UI directamente
- NO debe reemplazar la lógica de negocio del Home
- NO debe acceder a WhatsApp o Meta APIs

## Integración con repositorios futuros
Este agente está diseñado para recibir repositorios inyectados (AppointmentRepository, ClientRepository, IntelligenceRepository) cuando estén implementados. No debe instanciarlos directamente.

## Integración con Intelligence futura
Este agente orquestará el HomeLearningAgent para que los datos del dashboard fluyan hacia Intelligence a través del IntelligenceRepository.

## Widgets relacionados (de HOME_WIDGET_MAP.md)
- W1-W15: Todos los widgets — este es el orquestador central

## Estado actual
Foundation skeleton — no conectado a la UI. Esperando fase de integración.
