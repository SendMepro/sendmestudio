// AgentRegistry — Central agent registry for the Emotional Salon system
// Phase: CP-96 / System Governance Phase 1
// Status: stable — added AgentCategory support

import type { AgentCategory, AgentLifecycleStatus } from './types';

export interface AgentDefinition {
  name: string;
  phase: string;
  status: 'active' | 'inactive' | 'pending';
  category: AgentCategory;
  lifecycleStatus?: AgentLifecycleStatus;
  dependencies: string[];
  inputs: string[];
  outputs: string[];
  description: string;
}

export interface AgentRecord extends AgentDefinition {
  registeredAt: string;
  updatedAt: string;
}

/**
 * All known agent definitions. Defined here so AgentRegistry is always
 * populated at module load time — no async initialization needed.
 * Imported by both the supervisor's initialize() and the API route
 * to ensure agents appear in all module contexts.
 */
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // ── System agents ──
  {
    name: 'AgentRegistry',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: [],
    inputs: ['registerAgent(agentDef)', 'getAgent(name)', 'listAgents(phase?, category?)'],
    outputs: ['agent record', 'agent list'],
    description: 'Central agent registry',
  },
  {
    name: 'AgentInspector',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['AgentRegistry'],
    inputs: ['inspect(path)'],
    outputs: ['InspectionReport'],
    description: 'Inspects project sections and registered agents',
  },
  {
    name: 'CuratorAgent',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['AgentRegistry'],
    inputs: ['createCheckpoint(id, desc, files, phase)', 'validateChange(change)'],
    outputs: ['Checkpoint', 'ChangeValidation'],
    description: 'Creates checkpoints and validates changes',
  },
  {
    name: 'RecoveryAgent',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['CuratorAgent', 'AgentRegistry'],
    inputs: ['restore(checkpointId)'],
    outputs: ['RecoveryReport'],
    description: 'Restores project to a stable checkpoint',
  },
  {
    name: 'HealthCheckAgent',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['AgentRegistry'],
    inputs: ['runChecks()'],
    outputs: ['AgentHealthReport'],
    description: 'Verifies build, lint, and route health',
  },
  {
    name: 'AgentLifecycleAgent',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['AgentRegistry'],
    inputs: ['activateAgent(name)', 'deactivateAgent(name)', 'getStatus(name)', 'listLifecycleAgents()'],
    outputs: ['LifecycleOperationResult', 'lifecycle status'],
    description: 'Manages agent lifecycle transitions',
  },
  {
    name: 'SystemSupervisorAgent',
    phase: 'system-agents-creation',
    status: 'active',
    category: 'system',
    dependencies: ['AgentRegistry', 'AgentInspector', 'HealthCheckAgent', 'CuratorAgent', 'RecoveryAgent'],
    inputs: ['initialize()', 'getReport()', 'pingAll()', 'getHeartbeat(name)', 'registerManagedAgent(agent)', 'runInspection(path)', 'runHealthCheck()', 'runRecovery(id)'],
    outputs: ['SupervisorReport', 'AgentHeartbeat', 'PingResult'],
    description: 'Top-level runtime guardian of the entire agent ecosystem',
  },
  // ── Runtime agents (G-1) ──
  {
    name: 'EmotionalSalonOrchestrator',
    phase: 'skill-creation',
    status: 'active',
    category: 'skill',
    dependencies: ['AgentRegistry', 'AgentInspector', 'CuratorAgent', 'RecoveryAgent', 'HealthCheckAgent'],
    inputs: ['initialize()', 'routeSection(name)', 'runHealthCheck()', 'inspectSection(path)', 'getSystemStatus()'],
    outputs: ['SystemStatus', 'InspectionReport', 'AgentHealthReport'],
    description: 'Master coordination hub for the Emotional Salon platform',
  },
  {
    name: 'HomeMetricsAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['AppointmentRepository'],
    inputs: ['calculateMetrics()'],
    outputs: ['MetricsSnapshot'],
    description: 'Calculates real KPIs from AppointmentRepository data',
  },
  {
    name: 'HomeAIInsightAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['ClientRepository', 'AppointmentRepository'],
    inputs: ['generateClientInsights(appointmentId)'],
    outputs: ['ClientInsightsSnapshot'],
    description: 'Generates dossier insights (emotional profile, LTV, alerts, etc.)',
  },
  {
    name: 'HomeLearningAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['LearningEventRepository', 'EventBus'],
    inputs: ['enqueueEvent(event)', 'extractLearningSignals()', 'buildLearningEvent(type, source, data, clientId)'],
    outputs: ['LearningEvent', 'LearningSummary'],
    description: 'Collects learning signals and emits them to the EventBus',
  },
  {
    name: 'HomeDataSourceAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: [],
    inputs: ['mapDataSources()', 'getSourceForWidget(widgetId)', 'detectDisconnectedSources()', 'recommendRepositoryForWidget(widgetId)'],
    outputs: ['DataSourceInfo[]', 'DataSourceInfo | null'],
    description: 'Maps all 15 Home widgets to their current/recommended data sources',
  },
  {
    name: 'HomeInspectorAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['HomeDataSourceAgent'],
    inputs: ['inspectWidgets()', 'detectMockData()', 'detectMissingSources()', 'detectCriticalWidgets()', 'generateInspectionSummary()'],
    outputs: ['InspectionSummary', 'InspectionIssue[]'],
    description: 'Inspects Home widgets and detects problems (mock data, missing sources, broken flows)',
  },
  {
    name: 'HomeHealthCheckAgent',
    phase: 'home-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['HomeDataSourceAgent', 'HomeInspectorAgent', 'HomeHealthCheckAgent'],
    inputs: ['runHealthCheck()', 'getHealthSummary()', 'checkWidgetReadiness()', 'checkDataReadiness()', 'checkIntelligenceReadiness()'],
    outputs: ['HealthSummary', 'WidgetReadiness[]'],
    description: 'Checks Home section stability — widget readiness, data readiness, intelligence pipeline readiness',
  },
  {
    name: 'IntelligenceLayer',
    phase: 'intelligence',
    status: 'active',
    category: 'infrastructure',
    dependencies: ['RecommendationEngine'],
    inputs: ['serve()'],
    outputs: ['Insight[]'],
    description: 'Aggregates recommendations into business-categorized insights',
  },
  // ── Knowledge agents (G-2) ──
  {
    name: 'KnowledgeBundleAgent',
    phase: 'knowledge-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/knowledge (REST endpoint)'],
    inputs: ['fetch()', 'updateSection(key, value)', 'updateProfile(field, value)', 'updateService(index, patch)', 'updateStylist(index, patch)', 'updateFaq(index, patch)'],
    outputs: ['KnowledgeBundle', 'SaveState'],
    description: 'Fetches knowledge bundle, manages state, auto-saves with 650ms debounce',
  },
  {
    name: 'KnowledgeCompletionAgent',
    phase: 'knowledge-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['KnowledgeBundleAgent'],
    inputs: ['computeScore(knowledge)'],
    outputs: ['completion score (0-100)'],
    description: 'Computes completion score from 6 weighted knowledge modules',
  },
  // ── Brain Admin agents (G-3) ──
  {
    name: 'BrainDataAgent',
    phase: 'brain-admin-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/brain-admin/upload (REST endpoint)', '/api/brain-admin/storage', '/api/brain-admin/queue'],
    inputs: ['loadSummary()', 'loadStorageStats()', 'loadNightQueue()'],
    outputs: ['brain summary', 'storage stats', 'night queue'],
    description: 'Loads summary, storage stats, and night queue from Brain Admin API',
  },
  {
    name: 'BrainVoiceAgent',
    phase: 'brain-admin-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/brain-admin/voice (REST endpoint)', 'MediaRecorder API', 'SpeechRecognition API'],
    inputs: ['startVoiceRecording()', 'stopVoiceRecording()', 'saveVoiceLearning()', 'updateSuggestion(id, status)'],
    outputs: ['voice transcript', 'audio blob', 'learning entry'],
    description: 'Voice recording, speech-to-text (es-CL), and voice learning upload',
  },
  {
    name: 'BrainNotesAgent',
    phase: 'brain-admin-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/brain-admin/audit-note (REST endpoint)'],
    inputs: ['auditNote()', 'saveNote()'],
    outputs: ['AuditResult', 'learning entry'],
    description: 'Audits notes via AI and saves approved notes as brain learning',
  },
  {
    name: 'BrainQRTokenAgent',
    phase: 'brain-admin-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/brain-admin/qr-token (REST endpoint)'],
    inputs: ['generateQRToken()', 'closeQRModal()'],
    outputs: ['QR code URL', 'session token', 'short code'],
    description: 'Generates QR session tokens for mobile-to-brain file uploads',
  },
  {
    name: 'BrainAuthAgent',
    phase: 'brain-admin-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['/api/brain-admin/session (REST endpoint)'],
    inputs: ['checkSession()', 'handleLogin()'],
    outputs: ['authentication status', 'super-admin flag'],
    description: 'Session authentication, admin login, and super-admin detection',
  },
  // ── Campaigns agents ──
  {
    name: 'CampaignsDevelopmentAgent',
    phase: 'campaigns-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['CampaignsInspectorAgent'],
    inputs: ['createCampaignsDevelopmentReport()'],
    outputs: ['CampaignsDevelopmentReport'],
    description: 'Analiza el módulo Campaigns, audita su estado, identifica problemas y recomienda próximos pasos',
  },
  {
    name: 'CampaignsInspectorAgent',
    phase: 'campaigns-agents',
    status: 'active',
    category: 'leaf',
    dependencies: [],
    inputs: ['createCampaignsInspectionReport()'],
    outputs: ['CampaignsInspectionReport'],
    description: 'Inspecciona el estado real del módulo Campaigns y valida 18 condiciones de correctness',
  },
  // ── WhatsApp agents ──
  {
    name: 'WhatsAppOperationalInspectorAgent',
    phase: 'whatsapp-agents',
    status: 'active',
    category: 'leaf',
    dependencies: [],
    inputs: ['createWhatsAppOperationalReport()'],
    outputs: ['WhatsAppOperationalReport'],
    description: 'Inspecciona el estado operacional real de WhatsApp: token, webhook, mensajería, AI auto-reply, campañas y seguridad',
  },
  // ── Customer Memory agents ──
  {
    name: 'CustomerMemoryInspectorAgent',
    phase: 'customer-memory-agents',
    status: 'active',
    category: 'leaf',
    dependencies: [],
    inputs: ['createCustomerMemoryInspectionReport()'],
    outputs: ['CustomerMemoryInspectionReport'],
    description: 'Inspecciona el estado operacional de Customer Memory: store, calidad de señales, integración con WhatsApp',
  },
  // ── Salon Operations agents ──
  {
    name: 'SalonOperationsDevelopmentAgent',
    phase: 'salon-operations-agents',
    status: 'active',
    category: 'leaf',
    dependencies: ['SalonOperationsInspectorAgent'],
    inputs: ['createSalonOperationsDevelopmentReport()'],
    outputs: ['SalonOperationsDevelopmentReport'],
    description: 'Modela los 5 lifecycles operacionales del salón: Appointment, Attendance, ProductSales, Inventory, Commission',
  },
  {
    name: 'SalonOperationsInspectorAgent',
    phase: 'salon-operations-agents',
    status: 'active',
    category: 'leaf',
    dependencies: [],
    inputs: ['createSalonOperationsHealthReport()'],
    outputs: ['SalonOperationsHealthReport'],
    description: 'Inspecciona la salud de 5 áreas operacionales del salón con score, findings y recomendaciones',
  },
  // ── Business supervisor ──
  {
    name: 'BusinessSupervisorAgent',
    phase: 'business-supervisor',
    status: 'active',
    category: 'infrastructure',
    dependencies: ['CampaignsDevelopmentAgent', 'CampaignsInspectorAgent'],
    inputs: ['createBusinessPriorityReport()'],
    outputs: ['BusinessPriorityReport'],
    description: 'Consulta todos los agentes Development e Inspector y genera un reporte unificado de priorización de negocio con scores, riesgos, impacto económico y complejidad',
  },
];

class AgentRegistryInternal {
  private agents: Map<string, AgentRecord> = new Map();

  constructor() {
    // Auto-register all known agent definitions at construction time.
    // This ensures the registry is always populated regardless of module context
    // (Next.js App Router may load this module in separate bundles for
    // SSR renders vs API route handlers).
    for (const def of AGENT_DEFINITIONS) {
      this.registerAgent(def);
    }
  }

  registerAgent(def: AgentDefinition): { success: boolean; agent: AgentRecord } {
    const now = new Date().toISOString();
    const record: AgentRecord = { ...def, registeredAt: now, updatedAt: now };
    this.agents.set(def.name, record);
    return { success: true, agent: record };
  }

  getAgent(name: string): AgentRecord | undefined {
    return this.agents.get(name);
  }

  listAgents(phase?: string, category?: AgentCategory): AgentRecord[] {
    const all = Array.from(this.agents.values());
    let filtered = all;
    if (phase) filtered = filtered.filter((a) => a.phase === phase);
    if (category) filtered = filtered.filter((a) => a.category === category);
    return filtered;
  }

  updateAgentStatus(name: string, status: AgentDefinition['status']): boolean {
    const agent = this.agents.get(name);
    if (!agent) return false;
    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    return true;
  }

  get size(): number {
    return this.agents.size;
  }
}

export const AgentRegistry = new AgentRegistryInternal();
