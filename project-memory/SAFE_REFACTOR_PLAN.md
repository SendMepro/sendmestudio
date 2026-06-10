# SAFE_REFACTOR_PLAN.md

## Estrategia General

Refactorizar el proyecto **Salon_Belleza** hacia una arquitectura basada en agentes, **sin romper la funcionalidad existente**.

## Principios
1. **No reescribir** secciones funcionales (Home, Inbox, Campaigns)
2. **Solo agregar** una capa de agentes encima del código existente
3. **Validar después de cada cambio**
4. **Revertir** si algo falla

## Fases del Refactor

### Fase 0: Inspección y Preparación ← **ESTAMOS AQUÍ**
- ✅ Inspeccionar estructura completa
- ✅ Crear `project-memory/` con archivos de memoria
- ✅ Documentar estado actual
- ✅ Crear Checkpoint 0

### Fase 1: Agentes del Sistema (System Agents)
Objetivo: Crear la infraestructura base de agentes.
- Crear `src/agents/system/AgentRegistry.ts`
- Crear `src/agents/system/AgentInspector.ts`
- Crear `src/agents/system/CuratorAgent.ts`
- Crear `src/agents/system/RecoveryAgent.ts`
- Crear `src/agents/system/HealthCheckAgent.ts`
- Crear archivos `.md` para documentación
- **Validar**: HealthCheckAgent corre y reporta OK
- **Checkpoint 1**

### Fase 2: Master Skill / Orchestrator
Objetivo: Crear el orquestador principal.
- Crear `src/skills/emotional-salon/skill.md`
- Crear `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts`
- Crear `src/skills/emotional-salon/EmotionalSalonOrchestrator.md`
- Crear `src/skills/emotional-salon/registry.json`
- **Validar**: Orchestrator puede listar agentes registrados
- **Checkpoint 2**

### Fase 3: Agentes de Home
Objetivo: Agregar capa de agentes sobre Home sin modificarlo.
- Crear `src/agents/home/HomeOrchestratorAgent.ts`
- Crear `src/agents/home/HomeInspectorAgent.ts`
- Crear `src/agents/home/HomeDataSourceAgent.ts`
- Crear `src/agents/home/HomeHealthCheckAgent.ts`
- Crear `src/agents/home/HomeLearningAgent.ts`
- **Validar**: HealthCheckAgent verifica que Home sigue funcionando
- **Checkpoint 3**

### Fase 4: Agentes de Messages / Reception
Objetivo: Agregar capa de agentes sobre Inbox.
- Crear `src/agents/messages/ReceptionOrchestratorAgent.ts`
- Crear `src/agents/messages/ConversationInspectorAgent.ts`
- Crear `src/agents/messages/IntentDetectionAgent.ts`
- Crear `src/agents/messages/DraftResponseAgent.ts`
- Crear `src/agents/messages/MetaReplyGuardAgent.ts`
- Crear `src/agents/messages/ConversationMemoryAgent.ts`
- **Validar**: HealthCheckAgent verifica Inbox y webhook
- **Checkpoint 4**

### Fase 5: Agentes de Campaigns
Objetivo: Agregar capa de agentes sobre Campaigns.
- Crear `src/agents/campaigns/CampaignOrchestratorAgent.ts`
- Crear `src/agents/campaigns/AudienceAgent.ts`
- Crear `src/agents/campaigns/TemplateValidationAgent.ts`
- Crear `src/agents/campaigns/CampaignComplianceAgent.ts`
- Crear `src/agents/campaigns/DeliveryMonitorAgent.ts`
- Crear `src/agents/campaigns/CampaignLearningAgent.ts`
- **Validar**: HealthCheckAgent verifica Campaigns
- **Checkpoint 5**

### Fase 6: Conectar Agentes con UI (Integración)
Objetivo: Conectar agentes con las páginas existentes.
- **SIN MODIFICAR** el código existente de las páginas
- Crear hooks/composables que usen los agentes
- Inyectar datos de agentes como props
- **Validar**: App sigue funcionando, Home/Inbox/Campaigns sin cambios
- **Checkpoint 6**

### Fase 7: Agentes de Intelligence (Futuro)
Objetivo: Crear el sistema de inteligencia.
- Solo después de que las fases 1-6 estén estables
- Crear `src/agents/intelligence/`
- Conectar Learning Agents de cada sección

## Rollback Strategy
1. Si un cambio rompe algo, RecoveryAgent:
   a. Lee CHECKPOINTS.md para encontrar el último estable
   b. Restaura archivos desde el checkpoint
   c. Reporta qué cambio causó el error
2. Cada checkpoint incluye:
   - Lista de archivos en ese estado
   - Estado de cada sección (Home, Inbox, Campaigns)
   - Resultado de HealthCheck

## Validación Post-Cambio
Después de cada cambio ejecutar:
1. `npm run build` (o lint al menos)
2. Verificar Home renderiza
3. Verificar Inbox renderiza
4. Verificar Campaigns renderiza
5. Verificar webhook no roto
