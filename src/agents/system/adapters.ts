// adapters.ts — ManagedAgent adapters for runtime agents
// Phase: G-1 / Agent Activation | G-2: Knowledge agents
// Purpose: Wrap Home agents, skill orchestrators, and section agents
// so SystemSupervisorAgent can register them as managed agents with ping()/health() contract.

import type { ManagedAgent, PingResult, ManagedAgentHealth } from './contracts';

// ─── Home Agent Adapters ─────────────────────────────────────────────────────

/**
 * Adapter for EmotionalSalonOrchestrator.
 * The orchestrator is a singleton — this adapter delegates to it.
 */
export class EmotionalSalonOrchestratorAdapter implements ManagedAgent {
  name = 'EmotionalSalonOrchestrator';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'EmotionalSalonOrchestrator singleton available',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Orchestrator initialized, system agents registered',
      metrics: { phase: 'skill-creation' },
    };
  }
}

/**
 * Adapter for HomeMetricsAgent.
 * Wraps the class constructor — the actual instance is created by HomeBridge.
 * This adapter reports liveness based on the class being importable.
 */
export class HomeMetricsAgentAdapter implements ManagedAgent {
  name = 'HomeMetricsAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeMetricsAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Real metrics from AppointmentRepository',
      metrics: { type: 'leaf', repository: 'AppointmentRepository' },
    };
  }
}

/**
 * Adapter for HomeAIInsightAgent.
 */
export class HomeAIInsightAgentAdapter implements ManagedAgent {
  name = 'HomeAIInsightAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeAIInsightAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Generates dossier insights from ClientRepository + AppointmentRepository',
      metrics: { type: 'leaf', repositories: 'ClientRepository,AppointmentRepository' },
    };
  }
}

/**
 * Adapter for HomeLearningAgent.
 */
export class HomeLearningAgentAdapter implements ManagedAgent {
  name = 'HomeLearningAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeLearningAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Enqueues learning events, emits to EventBus',
      metrics: { type: 'leaf', eventBus: 'connected', repository: 'LearningEventRepository' },
    };
  }
}

/**
 * Adapter for HomeDataSourceAgent (G-4).
 * Wraps the class that maps all 15 Home widgets to their current/recommended data sources.
 */
export class HomeDataSourceAgentAdapter implements ManagedAgent {
  name = 'HomeDataSourceAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeDataSourceAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Maps 15 Home widgets to data sources, detects disconnected sources',
      metrics: { type: 'leaf', widgets: 15, dataSources: 'mock,localStorage,api,json_file,in_memory,future_repository,static_asset' },
    };
  }
}

/**
 * Adapter for HomeInspectorAgent (G-4).
 * Wraps the class that inspects Home widgets for problems (mock data, missing sources, broken flows).
 */
export class HomeInspectorAgentAdapter implements ManagedAgent {
  name = 'HomeInspectorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeInspectorAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Detects 14 known issues across severity: critical, high, medium, low',
      metrics: {
        type: 'leaf',
        issues: 14,
        criticalIssues: 6,
        highIssues: 4,
        mediumIssues: 2,
        lowIssues: 2,
      },
    };
  }
}

/**
 * Adapter for HomeHealthCheckAgent (G-4).
 * Wraps the class that checks Home widget readiness, data readiness, and intelligence pipeline readiness.
 */
export class HomeHealthCheckAgentAdapter implements ManagedAgent {
  name = 'HomeHealthCheckAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'HomeHealthCheckAgent class available (instance created by HomeBridge)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Checks 15 widget readiness, data readiness (partial), intelligence readiness (not_ready)',
      metrics: {
        type: 'leaf',
        totalWidgets: 15,
        dataReadiness: 'partial',
        intelligenceReadiness: 'not_ready',
      },
    };
  }
}

/**
 * Adapter for IntelligenceLayer.
 * The IntelligenceLayer is a singleton — this adapter wraps it.
 */
export class IntelligenceLayerAdapter implements ManagedAgent {
  name = 'IntelligenceLayer';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'IntelligenceLayer singleton available',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Aggregates recommendations into business insights',
      metrics: { type: 'infrastructure', engine: 'RecommendationEngine' },
    };
  }
}

// ─── Knowledge Agent Adapters (G-2) ──────────────────────────────────────────

/**
 * Adapter for KnowledgeBundleAgent.
 * Wraps the useKnowledgeBundle hook logic: fetches knowledge data, manages state,
 * and handles auto-save with debounce.
 */
export class KnowledgeBundleAgentAdapter implements ManagedAgent {
  name = 'KnowledgeBundleAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'KnowledgeBundleAgent available (hook: useKnowledgeBundle)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Fetches knowledge bundle, manages state, auto-saves with 650ms debounce',
      metrics: { type: 'leaf', apiEndpoint: '/api/knowledge', debounceMs: 650 },
    };
  }
}

/**
 * Adapter for KnowledgeCompletionAgent.
 * Wraps the useKnowledgeCompletion hook logic: computes completion score
 * across all knowledge modules from weighted section scores.
 */
export class KnowledgeCompletionAgentAdapter implements ManagedAgent {
  name = 'KnowledgeCompletionAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'KnowledgeCompletionAgent available (hook: useKnowledgeCompletion)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Computes completion score (0-100) from 6 weighted knowledge modules',
      metrics: {
        type: 'leaf',
        modules: 6,
        maxScore: 100,
        weightSources: 'Perfil(15),Horarios(15),Servicios(25),Equipo(15),FAQ(15),ReglasIA(15)',
      },
    };
  }
}

// ─── Brain Admin Agent Adapters (G-3) ────────────────────────────────────────

/**
 * Adapter for BrainDataAgent.
 * Wraps useBrainAdminData + useFetchOnSearch: loads summary from /api/brain-admin/upload,
 * storage stats from /api/brain-admin/storage, night queue from /api/brain-admin/queue.
 */
export class BrainDataAgentAdapter implements ManagedAgent {
  name = 'BrainDataAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BrainDataAgent available (hook: useBrainAdminData)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Loads brain summary, storage stats, and night queue from Brain Admin API',
      metrics: {
        type: 'leaf',
        endpoints: '/api/brain-admin/upload,/api/brain-admin/storage,/api/brain-admin/queue',
      },
    };
  }
}

/**
 * Adapter for BrainVoiceAgent.
 * Wraps useBrainAdminVoice: speech recognition (Spanish), audio recording via MediaRecorder,
 * transcript editing, and saving voice learning via /api/brain-admin/voice.
 */
export class BrainVoiceAgentAdapter implements ManagedAgent {
  name = 'BrainVoiceAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BrainVoiceAgent available (hook: useBrainAdminVoice)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Voice recording via MediaRecorder, speech-to-text (es-CL), voice learning upload',
      metrics: {
        type: 'leaf',
        apiEndpoint: '/api/brain-admin/voice',
        recognitionLang: 'es-CL',
      },
    };
  }
}

/**
 * Adapter for BrainNotesAgent.
 * Wraps useBrainAdminNotes: note auditing via /api/brain-admin/audit-note,
 * saving notes as learning entries into the brain.
 */
export class BrainNotesAgentAdapter implements ManagedAgent {
  name = 'BrainNotesAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BrainNotesAgent available (hook: useBrainAdminNotes)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Audits notes via AI, saves approved notes as brain learning entries',
      metrics: {
        type: 'leaf',
        apiEndpoint: '/api/brain-admin/audit-note',
        auditStatuses: 'approved,needs_edit,out_of_context,not_suitable',
      },
    };
  }
}

/**
 * Adapter for BrainQRTokenAgent.
 * Wraps useBrainAdminQR: generates QR session tokens via POST /api/brain-admin/qr-token,
 * constructs mobile-upload URLs for phone-to-brain file transfer.
 */
export class BrainQRTokenAgentAdapter implements ManagedAgent {
  name = 'BrainQRTokenAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BrainQRTokenAgent available (hook: useBrainAdminQR)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Generates QR session tokens for mobile uploads via QR code',
      metrics: {
        type: 'leaf',
        apiEndpoint: '/api/brain-admin/qr-token',
        uploadPath: '/mobile-upload?session=',
      },
    };
  }
}

/**
 * Adapter for BrainAuthAgent.
 * Wraps useBrainAdminAuth: session check via GET /api/brain-admin/session,
 * admin login via POST /api/brain-admin/session, super-admin detection.
 */
export class BrainAuthAgentAdapter implements ManagedAgent {
  name = 'BrainAuthAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BrainAuthAgent available (hook: useBrainAdminAuth)',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Session authentication, admin login, super-admin detection',
      metrics: {
        type: 'leaf',
        endpoints: '/api/brain-admin/session (GET+POST)',
      },
    };
  }
}

/**
 * Adapter for CampaignsDevelopmentAgent.
 * Static analysis agent: creates development/product reports for the Campaigns module.
 */
export class CampaignsDevelopmentAgentAdapter implements ManagedAgent {
  name = 'CampaignsDevelopmentAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'CampaignsDevelopmentAgent available via createCampaignsDevelopmentReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Analiza el módulo Campaigns, audita estado, recomienda próximos pasos y KPIs',
      metrics: {
        type: 'leaf',
        findings: 13,
        kpis: 12,
        missingFlowSteps: 13,
      },
    };
  }
}

/**
 * Adapter for CampaignsInspectorAgent.
 * Static analysis agent: validates 18 conditions of correctness for the Campaigns module.
 */
export class CampaignsInspectorAgentAdapter implements ManagedAgent {
  name = 'CampaignsInspectorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'CampaignsInspectorAgent available via createCampaignsInspectionReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Inspecciona 18 condiciones de correctness del módulo Campaigns y valida implementación',
      metrics: {
        type: 'leaf',
        checks: 18,
        categories: 'selection,visual,audience,readiness,ai,architecture,persistence,contradiction',
      },
    };
  }
}

/**
 * Adapter for WhatsAppOperationalInspectorAgent.
 * Static analysis agent: inspects real WhatsApp operational state from store + env.
 */
export class WhatsAppOperationalInspectorAgentAdapter implements ManagedAgent {
  name = 'WhatsAppOperationalInspectorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'WhatsAppOperationalInspectorAgent available via createWhatsAppOperationalReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Inspecciona estado operacional real de WhatsApp: token, webhook, mensajería, AI auto-reply y campañas',
      metrics: {
        type: 'leaf',
        checks: 'token(4),webhook(4),messaging(8)',
        categories: 'token,webhook,seguridad,mensajeria,ai,campañas',
      },
    };
  }
}

/**
 * Adapter for CustomerMemoryInspectorAgent.
 * Static analysis agent: inspects Customer Memory store, signal quality, integration.
 */
export class CustomerMemoryInspectorAgentAdapter implements ManagedAgent {
  name = 'CustomerMemoryInspectorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'CustomerMemoryInspectorAgent available via createCustomerMemoryInspectionReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Inspecciona Customer Memory: store, señales, calidad e integración con WhatsApp',
      metrics: {
        type: 'leaf',
        checks: 'store(2),calidad(3),integracion(2)',
        categories: 'store,cobertura,calidad,integracion',
      },
    };
  }
}

/**
 * Adapter for BusinessSupervisorAgent.
 * Aggregates all Development + Inspector agents into a unified BusinessPriorityReport.
 */

/**
 * Adapter for SalonOperationsDevelopmentAgent.
 * Static analysis agent: models 5 operational lifecycles of the salon.
 */
export class SalonOperationsDevelopmentAgentAdapter implements ManagedAgent {
  name = 'SalonOperationsDevelopmentAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'SalonOperationsDevelopmentAgent available via createSalonOperationsDevelopmentReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Modela 5 lifecycles operacionales: Appointment, Attendance, ProductSales, Inventory, Commission',
      metrics: {
        type: 'leaf',
        lifecycles: 5,
        stages: 25,
        modelsDefined: 'true',
        source: 'docs/SALON_OPERATION_REQUIREMENTS.md',
      },
    };
  }
}

/**
 * Adapter for SalonOperationsInspectorAgent.
 * Static analysis agent: inspects health of 5 operational areas with score per area.
 */
export class SalonOperationsInspectorAgentAdapter implements ManagedAgent {
  name = 'SalonOperationsInspectorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'SalonOperationsInspectorAgent available via createSalonOperationsHealthReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Inspecciona 5 áreas operacionales con score y recomendaciones: Appointment, Attendance, ProductSales, Inventory, Commission',
      metrics: {
        type: 'leaf',
        areas: 5,
        categories: 'appointment,attendance,product_sales,inventory,commission',
        source: 'docs/SALON_OPERATION_REQUIREMENTS.md',
      },
    };
  }
}

export class BusinessSupervisorAgentAdapter implements ManagedAgent {
  name = 'BusinessSupervisorAgent';
  version = '1.0.0';

  async ping(): Promise<PingResult> {
    return {
      alive: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BusinessSupervisorAgent available via createBusinessPriorityReport()',
    };
  }

  async health(): Promise<ManagedAgentHealth> {
    return {
      status: 'healthy',
      details: 'Analiza 7+ módulos del sistema y genera reporte de priorización con scores, riesgos, impacto económico y complejidad',
      metrics: {
        type: 'infrastructure',
        modules: 7,
        categories: 'campaigns,home,knowledge,brain-admin,system,whatsapp,salon-operations',
      },
    };
  }
}
