# project-memory / AGENT_MAP.md

## Master Skill
| Skill | Rol | Status |
|-------|-----|--------|
| **EmotionalSalonOrchestrator** | Coordinación central de todas las secciones y agentes | ✅ Creado (foundation) |
| **AgentRegistry** | Registro central de todos los agentes | ✅ Creado |
| **AgentInspector** | Inspecciona cada sección del proyecto | ✅ Creado |
| **CuratorAgent** | Protege el proyecto, crea checkpoints, valida cambios | ✅ Creado |
| **RecoveryAgent** | Restaura checkpoint estable si hay fallo | ✅ Creado |
| **HealthCheckAgent** | Verifica build, lint, rutas principales | ✅ Creado |

| **AgentLifecycleAgent** | Gestión del ciclo de vida de todos los agentes | planned/created/active/inactive/deprecated/archived | LifecycleOperationResult | ✅ Creado |

## Infrastructure

| Component | Rol | Status |
|-----------|-----|--------|
| **HomeBridge** | Puente seguro entre Home dashboard y Home agents | ✅ Creado (Phase 2.4) + W8-W14 connect |
| **featureFlags** | Sistema central de feature flags (7 flags) | ✅ Creado (Phase 2.4) + HOME_AI_INSIGHT_ENABLED (D-1) |

## Agentes del Sistema

### System Agents (Fase 1 - Crear)
| Agente | Responsabilidad | Input | Output |
|--------|---------------|-------|--------|
| **AgentRegistry** | Registro central de todos los agentes | Agente nuevo, consulta | Confirmación, lista de agentes |
| **AgentInspector** | Inspecciona cada sección del proyecto | Path de sección | Reporte de inspección |
| **CuratorAgent** | Protege el proyecto, crea checkpoints, valida cambios | Cambio propuesto | Checkpoint, validación |
| **RecoveryAgent** | Restaura checkpoint estable si hay fallo | Error, checkpoint | Restauración, reporte |
| **HealthCheckAgent** | Verifica build, lint, rutas principales | Comando de verificación | Reporte de salud |
| **AgentLifecycleAgent** | Gestiona ciclo de vida de agentes | planned/created/active/inactive/deprecated/archived | LifecycleOperationResult |

### Home Agents (Fase 2.2)
| Agente | Responsabilidad | Input | Output | Estado |
|--------|---------------|-------|--------|--------|
| **HomeOrchestratorAgent** | Coordina datos y widgets del Home | Solicitud de datos | Datos agregados | ✅ Creado (Phase 2.2) |
| **HomeInspectorAgent** | Detecta widgets faltantes, datos rotos | Home actual | Reporte de problemas | ✅ Creado (Phase 2.2) |
| **HomeDataSourceAgent** | Detecta origen de datos del Home | Sección Home | Mapa de fuentes de datos | ✅ Creado (Phase 2.2) |
| **HomeHealthCheckAgent** | Verifica que Home renderice correctamente | Home renderizado | Estado de salud | ✅ Creado (Phase 2.2) |
| **HomeLearningAgent** | Envía insights a Intelligence | Datos de Home | Insights procesados | ✅ Creado (Phase 2.2) |
| **HomeMetricsAgent** | Calcula KPI reales desde AppointmentRepository | AppointmentRepository | MetricsSnapshot | ✅ Creado (Phase C-1) |
| **HomeAIInsightAgent** | Genera insights reales para dossier sections | ClientRepository + AppointmentRepository | Insights generados | ✅ Creado (Phase C-2) + Conectado W8, W9, W10, W12, W13, R:W14 |

### Messages / Reception Agents (Fase 3 - Crear)
| Agente | Responsabilidad | Input | Output |
|--------|---------------|-------|--------|
| **ReceptionOrchestratorAgent** | Coordina flujo de recepción de chats | Mensaje entrante | Respuesta coordinada |
| **ConversationInspectorAgent** | Detecta información faltante del cliente | Conversación | Reporte de insights |
| **IntentDetectionAgent** | Detecta intención del mensaje | Mensaje | Intención detectada |
| **DraftResponseAgent** | Crea respuestas sugeridas | Mensaje + intención | Borrador de respuesta |
| **MetaReplyGuardAgent** | Decide si auto-reply es seguro | Borrador de respuesta | Decisión safe/block |
| **ConversationMemoryAgent** | Extrae info útil para Intelligence | Conversación | Datos de aprendizaje |

### Campaign Agents (Fase 4 - Crear)
| Agente | Responsabilidad | Input | Output |
|--------|---------------|-------|--------|
| **CampaignOrchestratorAgent** | Coordina creación y envío de campañas | Parámetros de campaña | Campaña lista |
| **AudienceAgent** | Construye segmentos de clientes | Criterios de segmentación | Segmento validado |
| **TemplateValidationAgent** | Valida si necesita plantilla aprobada | Template propuesto | Validación |
| **CampaignComplianceAgent** | Valida opt-in, frecuencia, spam | Campaña + audiencia | Compliance check |
| **DeliveryMonitorAgent** | Monitorea entregas | ID de campaña | Estadísticas de entrega |
| **CampaignLearningAgent** | Envía resultados a Intelligence | Resultados de campaña | Insights |

### Intelligence Agents (Fase 5 - Futuro)
| Agente | Responsabilidad | Input | Output |
|--------|---------------|-------|--------|
| **IntelligenceOrchestratorAgent** | Coordina datos de inteligencia | Solicitud | Reporte de inteligencia |
| **ClientProfileAgent** | Construye perfiles de clientes | Interacciones | Perfil completo |
| **PreferenceMiningAgent** | Detecta preferencias | Datos de interacción | Preferencias detectadas |
| **OpportunityDetectionAgent** | Encuentra oportunidades (upsell, birthday, etc.) | Perfiles y eventos | Oportunidades |
| **SalonTrendsAgent** | Detecta tendencias del salón | Datos históricos | Reporte de tendencias |
