# HomeLearningAgent

## Propósito
Preparar los datos del Home dashboard para el sistema Emotional Salon Intelligence. Definir eventos de aprendizaje, extraer insights de cliente/negocio de las señales del Home, y estructurarlos para el pipeline futuro de Intelligence.

## Responsabilidades
- Definir eventos de aprendizaje (LearningEvent)
- Extraer señales de aprendizaje de los widgets del Home
- Clasificar tipos de insight (preferencia, comportamiento, oportunidad, tendencia)
- Estructurar eventos para el IntelligenceRepository futuro
- NO almacenar datos directamente
- NO usar base de datos directamente

## Inputs
- Estado actual del Home (desde HomeOrchestratorAgent)
- Datos de widgets (citas, preferencias, comportamiento, LTV, alertas, recomendaciones)
- Señales de interacción del usuario (futuro)

## Outputs
- Eventos de aprendizaje estructurados (LearningEvent[])
- Insights clasificados por tipo
- Resumen de aprendizaje
- Datos listos para IntelligenceRepository

## Dependencias
- HomeOrchestratorAgent (conceptual)
- EmotionalSalonOrchestrator (futuro)
- IntelligenceRepository (futuro)

## Lo que NO debe hacer
- NO debe importar localStorage
- NO debe importar fetch
- NO debe importar base de datos
- NO debe almacenar datos directamente
- NO debe modificar la UI
- NO debe reemplazar la lógica de negocio del Home
- NO debe hacer llamadas API directamente

## Integración con repositorios futuros
Usará IntelligenceRepository.pushEvent() para encolar eventos de aprendizaje. Cuando Intelligence esté lista, leerá del mismo repositorio.

## Integración con Intelligence futura
Este es el puente principal entre Home e Intelligence. Todos los datos que deben fluir hacia Intelligence pasan por este agente:
- Preferencias de cliente (W8, W9, W14)
- Solicitudes de servicio (W4)
- Patrones de cancelación (W4, W12)
- Historia de citas (W4, W10, W14)
- Objeciones (W12)
- Oportunidades de retención (W13)
- Oportunidades de upsell (W13, W5, W2)
- Comportamiento de llegada (W11)
- Salud de plataforma (W6)

## LearningEvent Type (definido en INTELLIGENCE_PIPELINE_PROPOSAL.md)

```typescript
type LearningEventType =
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'client_arrived'
  | 'client_preference_detected'
  | 'service_selected'
  | 'ai_recommendation_shown'
  | 'ai_recommendation_accepted'
  | 'upsell_opportunity_detected'
  | 'retention_risk_detected'
  | 'platform_health_changed'
  | 'campaign_template_rejected';
```

## Widgets relacionados (de HOME_WIDGET_MAP.md)
- W2: Header Feed — tips que podrían ser generados por Intelligence
- W4: Appointment Flow — servicio seleccionado, estado de cita
- W5: Client Focus — recomendaciones mostradas/aceptadas
- W6: Platform Health — cambios en salud de plataforma
- W8: Emotional Profile — preferencias emocionales
- W9: Material Intelligence — preferencias de materiales
- W10: Customer LTV — valor de cliente
- W11: Arrival Behavior — comportamiento de llegada
- W12: AI Alerts — alertas y riesgos
- W13: AI Recommendation — recomendaciones y oportunidades
- W14: Technical History — historial técnico

## Estado actual
Foundation skeleton — esperando implementación de IntelligenceRepository y pipeline de eventos.
