# AGENT_ARCHITECTURE_MAP.md

## Arquitectura de Agentes para Emotional Salon

```
┌─────────────────────────────────────────────────────────────┐
│                   EMOTIONAL SALON SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                 skills/emotional-salon/                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          EmotionalSalonOrchestrator                   │   │
│  │  - Coordina todos los agentes                         │   │
│  │  - Define flujos de ejecución                         │   │
│  │  - Conoce el registry completo                        │   │
│  └──────────────┬───────────────────────────────────────┘   │
├─────────────────┼───────────────────────────────────────────┤
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               AgentRegistry                           │   │
│  │  - Registro central de agentes                        │   │
│  │  - Consulta de agentes por sección/tipo               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ AgentInspector│  │ CuratorAgent │  │  RecoveryAgent     │  │
│  │ - Inspecciona │  │ - Checkpoints│  │  - Restauración   │  │
│  │ - Reporta     │  │ - Validación │  │  - Rollback       │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              HealthCheckAgent                         │   │
│  │  - Verifica build, lint, rutas, integraciones         │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │   HOME       │   │  MESSAGES    │   │   CAMPAIGNS       │  │
│  │  ──────────  │   │  ──────────  │   │  ───────────     │  │
│  │ Orchestrator │   │ Orchestrator │   │ Orchestrator     │  │
│  │ Inspector    │   │ Inspector    │   │ AudienceAgent    │  │
│  │ DataSource   │   │ IntentDetect │   │ TemplateValidate │  │
│  │ HealthCheck  │   │ DraftResp    │   │ ComplianceAgent  │  │
│  │ Learning     │   │ MetaGuard    │   │ DeliveryMonitor  │  │
│  │              │   │ MemoryAgent  │   │ LearningAgent    │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬──────────┘  │
│         │                 │                    │              │
│         └─────────────────┼────────────────────┘              │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               INTELLIGENCE (FUTURO)                   │   │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────────┐  │   │
│  │  │ ClientProf │ │ Preference   │ │ Opportunity    │  │   │
│  │  │ ileAgent   │ │ MiningAgent  │ │ DetectionAgent │  │   │
│  │  └────────────┘ └──────────────┘ └────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │          SalonTrendsAgent                     │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    SERVICES                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │   │
│  │  │ Meta API  │  │ WhatsApp │  │    Database        │  │   │
│  │  │           │  │ Cloud API│  │  (JSON/FS local)   │  │   │
│  │  └──────────┘  └──────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Ejecución Típico

### Inicio del Sistema
```
1. EmotionalSalonOrchestrator.init()
2.   → AgentRegistry.loadAll()
3.   → HealthCheckAgent.run()
4.   → Report: sistema OK / sistema inestable
```

### Recepción de Mensaje
```
1. Webhook recibe mensaje de WhatsApp
2. ReceptionOrchestratorAgent.process(message)
3.   → IntentDetectionAgent.detect(message) → "booking"
4.   → DraftResponseAgent.draft(message, intent) → "¿Te gustaría agendar..."
5.   → MetaReplyGuardAgent.validate(draft) → safe/block
6.   → Si safe: enviar respuesta
7.   → ConversationMemoryAgent.extract(message) → Intelligence
```

### Ciclo de Campaña
```
1. CampaignOrchestratorAgent.createCampaign(params)
2.   → AudienceAgent.buildSegment(criteria) → segment list
3.   → TemplateValidationAgent.validate(template) → compatible/needs approval
4.   → CampaignComplianceAgent.check(segment, campaign) → passed/blocked
5.   → DeliveryMonitorAgent.track(campaignId) → stats
6.   → CampaignLearningAgent.extract(campaignId) → Intelligence
```

## Convención de Nombres
- Archivos de código: `NombreAgent.ts`
- Archivos de documentación: `NombreAgent.md`
- Interfaces: `INombreAgent`
- Tipos de eventos: `NombreAgentEvent`
