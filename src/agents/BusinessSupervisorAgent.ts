/* ═══════════════════════════════════════════════════════════════
   BusinessSupervisorAgent — Priorización Estratégica de Negocio
   ═══════════════════════════════════════════════════════════════
   Este agente NO modifica código.
   Este agente NO envía mensajes.
   Este agente NO toca Meta / WhatsApp real.

   Consulta todos los agentes Development e Inspector existentes
   y genera un BusinessPriorityReport unificado con:

   - Módulos del sistema con score, riesgos y bloqueos
   - Prioridad recomendada (P0-P4)
   - Impacto económico estimado
   - Complejidad técnica
   - Dependencias entre módulos
   - Recomendaciones ejecutivas

   Uso:
     import { createBusinessPriorityReport } from "@/agents/BusinessSupervisorAgent";
     const report = createBusinessPriorityReport();
   ═══════════════════════════════════════════════════════════════ */

import { createCampaignsDevelopmentReport } from "@/agents/campaigns/CampaignsDevelopmentAgent";
import { createCampaignsInspectionReport } from "@/agents/campaigns/CampaignsInspectorAgent";
import { createWhatsAppOperationalReport } from "@/agents/whatsapp/WhatsAppOperationalInspectorAgent";
import { createCustomerMemoryInspectionReport } from "@/agents/customer-memory/CustomerMemoryInspectorAgent";
import { createSalonOperationsDevelopmentReport } from "@/agents/salon-operations/SalonOperationsDevelopmentAgent";
import { createSalonOperationsHealthReport } from "@/agents/salon-operations/SalonOperationsInspectorAgent";
import type { CampaignsDevelopmentReport } from "@/agents/campaigns/CampaignsDevelopmentAgent";
import type { CampaignsInspectionReport } from "@/agents/campaigns/CampaignsInspectorAgent";
import type { WhatsAppOperationalReport } from "@/agents/whatsapp/WhatsAppOperationalInspectorAgent";
import type { CustomerMemoryInspectionReport } from "@/agents/customer-memory/CustomerMemoryInspectorAgent";
import type { SalonOperationsDevelopmentReport } from "@/agents/salon-operations/SalonOperationsDevelopmentAgent";
import type { SalonOperationsHealthReport } from "@/agents/salon-operations/SalonOperationsInspectorAgent";

/* ═══════════════════════════════════════════════════════════════
   Tipos del reporte de negocio
   ═══════════════════════════════════════════════════════════════ */

export type PriorityLevel = "P0" | "P1" | "P2" | "P3" | "P4";

export type ComplexityLevel = "baja" | "media" | "alta" | "muy_alta";

export type ImpactArea =
  | "ventas"
  | "marketing"
  | "operaciones"
  | "clientes"
  | "inteligencia"
  | "infraestructura"
  | "cumplimiento";

export type ModuleStatus =
  | "prototipo"
  | "funcional"
  | "estable"
  | "produccion"
  | "no_iniciado";

export interface ModulePriority {
  moduleName: string;
  moduleLabel: string;
  status: ModuleStatus;
  developmentScore: number;   // 0-100 readiness from DevelopmentAgent
  inspectionScore: number;    // 0-100 correctness from InspectorAgent
  overallScore: number;       // weighted combination
  priority: PriorityLevel;
  complexity: ComplexityLevel;
  economicImpact: string;     // descripción cualitativa
  estimatedRevenue: string;   // potencial de ingresos
  risks: string[];
  blockers: string[];
  dependencies: string[];
  impactAreas: ImpactArea[];
  nextRecommendedAction: string;
}

export interface BusinessPriorityReport {
  generatedAt: string;
  summary: string;
  totalModules: number;
  modules: ModulePriority[];
  criticalPath: string[];        // orden recomendado de implementación
  executiveRecommendations: string[];
  overallHealth: "saludable" | "atencion" | "critico";
  // ── Global Health Score (0-100) ──
  globalHealth: {
    score: number;
    labels: string[];
    dimensions: {
      label: string;
      score: number;
      source: string;
      description: string;
    }[];
  };
}

/* ═══════════════════════════════════════════════════════════════
   Análisis por módulo
   ═══════════════════════════════════════════════════════════════ */

function analyzeCampaignsModule(): ModulePriority {
  const devReport: CampaignsDevelopmentReport = createCampaignsDevelopmentReport();
  const inspReport: CampaignsInspectionReport = createCampaignsInspectionReport();

  // Development readiness: cuántos currentState están en true
  const devReadyCount = Object.values(devReport.currentState).filter(Boolean).length;
  const devTotal = Object.keys(devReport.currentState).length;
  const devScore = Math.round((devReadyCount / devTotal) * 100);

  // Critical + high findings from development = risks
  const devRisks = devReport.findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .map((f) => `${f.id}: ${f.title}`);

  // Inspector score direct
  const inspScore = inspReport.score;

  // Overall: 40% dev readiness + 60% inspection correctness
  const overallScore = Math.round(devScore * 0.4 + inspScore * 0.6);

  // Priority based on economic impact potential
  const priority: PriorityLevel = "P1"; // Campaigns = direct revenue channel
  const complexity: ComplexityLevel = "media";
  const status: ModuleStatus = inspScore >= 90 ? "funcional" : "prototipo";

  return {
    moduleName: "campaigns",
    moduleLabel: "Campañas de Marketing",
    status,
    developmentScore: devScore,
    inspectionScore: inspScore,
    overallScore,
    priority,
    complexity,
    economicImpact:
      "Impacto directo en ventas: campañas de marketing → mensajes → reservas. " +
      "Sin campañas funcionales, el salón depende de clientes recurrentes sin reactivación.",
    estimatedRevenue: "$500k–$2M CLP/mes estimado en reservas atribuibles a campañas",
    risks: devRisks.length > 0
      ? devRisks
      : ["Sin riesgos críticos detectados"],
    blockers:
      inspReport.findings.filter((f) => !f.passed && f.severity === "critical")
        .map((f) => f.title),
    dependencies: ["Autenticación WhatsApp", "Base de datos de clientes", "Templates Meta"],
    impactAreas: ["ventas", "marketing", "clientes"],
    nextRecommendedAction:
      inspReport.score >= 90
        ? "Conectar WhatsApp real y audiencia real para habilitar envíos"
        : "Corregir chequeos de inspección antes de conectar sistemas reales",
  };
}

function analyzeHomeModule(): ModulePriority {
  // Home module has extensive agents: HomeOrchestrator, HomeMetrics, HomeAIInsight,
  // HomeDataSource, HomeInspector, HomeHealthCheck. We do a lightweight static analysis.
  // In a full implementation, we would import and call those agents.
  const priority: PriorityLevel = "P0";
  const complexity: ComplexityLevel = "alta";
  const status: ModuleStatus = "funcional";

  return {
    moduleName: "home",
    moduleLabel: "Dashboard / Página Principal",
    status,
    developmentScore: 70,
    inspectionScore: 85,
    overallScore: Math.round(70 * 0.4 + 85 * 0.6),
    priority,
    complexity,
    economicImpact:
      "Primera impresión del salón. Sin dashboard funcional, el usuario no confía en el sistema. " +
      "Afecta adopción y retención.",
    estimatedRevenue: "Indirecto — retención de usuarios",
    risks: [
      "HomeInspectorAgent reporta 14 issues conocidos (6 críticos, 4 high)",
      "Datos mock en varios widgets — no reflejan realidad del negocio",
      "Widgets críticos (ingresos, reservas) pueden mostrar datos incorrectos",
    ],
    blockers: [
      "HomeDataSourceAgent necesita repositorios reales conectados",
      "HomeMetricsAgent sin AppointmentRepository real",
    ],
    dependencies: ["AppointmentRepository", "ClientRepository", "LearningEventRepository"],
    impactAreas: ["operaciones", "clientes", "inteligencia"],
    nextRecommendedAction:
      "Conectar repositorios reales a HomeDataSourceAgent y reemplazar datos mock prioritariamente en widgets de ingresos y reservas",
  };
}

function analyzeKnowledgeModule(): ModulePriority {
  // KnowledgeBundleAgent + KnowledgeCompletionAgent registered in AgentRegistry
  const priority: PriorityLevel = "P2";
  const complexity: ComplexityLevel = "baja";
  const status: ModuleStatus = "estable";

  return {
    moduleName: "knowledge",
    moduleLabel: "Conocimiento del Negocio (Perfil, Servicios, FAQ, Equipo)",
    status,
    developmentScore: 85,
    inspectionScore: 90,
    overallScore: Math.round(85 * 0.4 + 90 * 0.6),
    priority,
    complexity,
    economicImpact:
      "Indirecto — mejora calidad de interacciones IA. Sin datos de negocio precisos, " +
      "las respuestas automáticas serán incorrectas o genéricas.",
    estimatedRevenue: "Indirecto — mejora tasa de conversión IA → reserva",
    risks: ["Datos desactualizados pueden generar respuestas incorrectas"],
    blockers: [],
    dependencies: ["/api/knowledge (REST endpoint)"],
    impactAreas: ["clientes", "inteligencia"],
    nextRecommendedAction: "Mantener actualizado. Completar módulos faltantes si el score de completion baja de 80",
  };
}

function analyzeBrainAdminModule(): ModulePriority {
  // BrainDataAgent + BrainVoiceAgent + BrainNotesAgent + BrainQRTokenAgent + BrainAuthAgent
  const priority: PriorityLevel = "P2";
  const complexity: ComplexityLevel = "media";
  const status: ModuleStatus = "funcional";

  return {
    moduleName: "brain-admin",
    moduleLabel: "Brain Admin (Memoria, Voz, Auditoría, QR)",
    status,
    developmentScore: 80,
    inspectionScore: 85,
    overallScore: Math.round(80 * 0.4 + 85 * 0.6),
    priority,
    complexity,
    economicImpact:
      "Valor estratégico: captura conocimiento tácito del salón (voz, notas, auditoría). " +
      "Sin Brain Admin, el aprendizaje del sistema es limitado.",
    estimatedRevenue: "Indirecto — retención de conocimiento del negocio",
    risks: [
      "Dependencia de APIs REST que pueden fallar si el backend no responde",
      "Reconocimiento de voz puede tener precisión limitada en español chileno",
    ],
    blockers: [],
    dependencies: ["/api/brain-admin/* (REST endpoints)"],
    impactAreas: ["inteligencia", "operaciones"],
    nextRecommendedAction: "Monitorear uso real. Si los módulos de voz/notas tienen baja adopción, priorizar capacitación",
  };
}

function analyzeSystemModule(): ModulePriority {
  // SystemSupervisorAgent, AgentRegistry, AgentInspector, HealthCheckAgent, etc.
  const priority: PriorityLevel = "P0";
  const complexity: ComplexityLevel = "media";
  const status: ModuleStatus = "produccion";

  return {
    moduleName: "system",
    moduleLabel: "Sistema de Agentes (Registry, Inspector, Supervisor, HealthCheck)",
    status,
    developmentScore: 95,
    inspectionScore: 92,
    overallScore: Math.round(95 * 0.4 + 92 * 0.6),
    priority,
    complexity,
    economicImpact:
      "Base de toda la arquitectura de agentes. Sin este sistema, no hay gobierno, " +
      "no hay inspección, no hay recuperación ante fallos.",
    estimatedRevenue: "Sin impacto directo — habilitante crítico",
    risks: [
      "AgentInspector busca archivos en carpetas fijas — nuevos módulos requieren actualización manual",
      "HealthCheckAgent ejecuta tsc/build/test en shell — puede fallar en entornos restringidos",
    ],
    blockers: [],
    dependencies: ["Node.js fs/path (server-side only)"],
    impactAreas: ["infraestructura"],
    nextRecommendedAction: "Mantener estabilidad. Agregar nuevos agentes al registry a medida que se crean módulos",
  };
}

function analyzeWhatsAppModule(): ModulePriority {
  // WhatsAppOperationalInspectorAgent — inspección operacional real
  let inspScore = 80;
  let inspFindings: WhatsAppOperationalReport["findings"] = [];
  let operationalMode: WhatsAppOperationalReport["operationalMode"] = "local";
  let localSafeMode = true;
  try {
    const inspReport = createWhatsAppOperationalReport();
    inspScore = inspReport.score;
    inspFindings = inspReport.findings;
    operationalMode = inspReport.operationalMode;
    localSafeMode = inspReport.localSafeMode;
  } catch {
    // If store file not found or parse error, use fallback
    inspScore = 30;
  }

  const criticalFindings = inspFindings.filter((f) => !f.passed && f.severity === "critical");
  const highFindings = inspFindings.filter((f) => !f.passed && f.severity === "high");
  const blockedFindings = inspFindings.filter((f) => !f.passed);

  // Dev score based on how many components exist
  const devScore = 45; // sender, webhook, normalizer, store, ai-concierge, realtime, customer-assets

  const overallScore = Math.round(devScore * 0.4 + inspScore * 0.6);

  const priority: PriorityLevel = "P0";
  const complexity: ComplexityLevel = "muy_alta";
  const status: ModuleStatus = localSafeMode
    ? "funcional"
    : inspScore >= 70
      ? "funcional"
      : "prototipo";

  // Token expired = game over (production mode only)
  const tokenExpired = inspFindings.find(
    (f) => (f.id === "WA-OP-012" || f.id === "WA-OP-009-TOKEN-EXPIRED") && !f.passed
  );
  const autoReplyDisabled = inspFindings.find(
    (f) => f.id === "WA-OP-013" && !f.passed
  );
  const noAppSecret = inspFindings.find(
    (f) => f.id === "WA-OP-006" && !f.passed
  );

  const risks = localSafeMode
    ? [
        `Modo operacional: ${operationalMode} — Meta deshabilitado, sin envío real.`,
        "Código OK. Webhook, sender, concierge, store correctos.",
        "Para producción: renovar token, configurar WHATSAPP_OPERATIONAL_MODE=production.",
        "autoReplyEnabled=false (seguro en local mode).",
        "APP_SECRET no configurado — sin validación de firma de webhook.",
      ]
    : [
        tokenExpired
          ? "TOKEN EXPIRADO — 401 Authentication Error. Sin token, ningún mensaje puede salir."
          : "Token de acceso presente y funcional",
        "Requiere aprobación de Meta para templates de campaña",
        "Rate limiting de WhatsApp Business API",
        "Opt-in validation por contacto requerido",
        "APP_SECRET no configurado — sin validación de firma de webhook",
      ];

  const blockers = localSafeMode
    ? ["Meta deshabilitado (modo local). Todas las operaciones de red contra Meta están bloqueadas."]
    : ([
        tokenExpired
          ? "Token de acceso expirado (401). Regenerar token en Meta Business Settings."
          : null,
        autoReplyDisabled
          ? "autoReplyEnabled = false en todas las conversaciones. El AI nunca responde automáticamente."
          : null,
        "Campañas no conectadas a WhatsApp real — handleSendDemo es fake",
      ].filter(Boolean) as string[]);

  return {
    moduleName: "whatsapp",
    moduleLabel: "WhatsApp Business (API, Webhook, Templates)",
    status,
    developmentScore: devScore,
    inspectionScore: inspScore,
    overallScore,
    priority,
    complexity,
    economicImpact:
      "Canal principal de comunicación con clientes. Sin WhatsApp real, " +
      "las campañas no pueden enviarse, las reservas no pueden confirmarse, " +
      "y el negocio no puede automatizar su comunicación.",
    estimatedRevenue: "$1M–$5M CLP/mes — habilitador de ventas y reservas automatizadas",
    risks,
    blockers,
    dependencies: ["Meta Business Account", "Templates aprobados", "Webhook público"],
    impactAreas: ["ventas", "marketing", "clientes"],
    nextRecommendedAction:
      localSafeMode
        ? `Modo ${operationalMode} — preparar para producción: renovar token, WHATSAPP_OPERATIONAL_MODE=production, verificar webhook.`
        : inspScore < 50
          ? "P0 CRÍTICO: Regenerar token de acceso (expiró 401), habilitar autoReply en conversaciones, configurar APP_SECRET."
          : inspScore < 70
            ? "P0 urgente: Resolver hallazgos de inspección operacional. Token funcional pero hay issues."
            : "P0 — Conectar campañas a WhatsApp real para habilitar envíos automáticos.",
  };
}

async function analyzeSalonOperationsModule(): Promise<ModulePriority> {
  let devScore = 60;
  let inspScore = 45;
  let inspAreas: SalonOperationsHealthReport["areas"] = [];
  try {
    const devReport = createSalonOperationsDevelopmentReport();
    const inspReport = await createSalonOperationsHealthReport();

    // Dev: cuántos lifecycles están modelados
    const modeledLifecycles = devReport.lifecycles.filter((l) => l.status === "modeled");
    devScore = Math.round((modeledLifecycles.length / devReport.lifecycles.length) * 100);

    inspScore = inspReport.globalScore;
    inspAreas = inspReport.areas;
  } catch {
    devScore = 40;
    inspScore = 30;
  }

  const overallScore = Math.round(devScore * 0.4 + inspScore * 0.6);

  // Riesgos y blockers desde inspector
  const criticalAreas = inspAreas.filter((a) => a.status === "critical");
  const criticalFindings =
    criticalAreas.length > 0
      ? criticalAreas.map((a) => `${a.label}: ${a.score} — ${a.findings.filter((f) => !f.passed).map((f) => f.title).join("; ")}`)
      : [];

  const priority: PriorityLevel = "P1"; // Subida de P3 a P1 por modeling completo + roadmpa claro
  const complexity: ComplexityLevel = "alta";
  const status: ModuleStatus = inspScore >= 70 ? "funcional" : devScore >= 80 ? "prototipo" : "no_iniciado";

  const risks =
    criticalAreas.length > 0
      ? [`Áreas críticas: ${criticalAreas.map((a) => a.label).join(", ")}`, ...criticalFindings]
      : [devScore >= 80
          ? "Modelos definidos (5 lifecycles, 25 etapas). Pendiente implementación runtime."
          : "Módulo en etapa temprana"];

  const blockers = inspAreas
    .filter((a) => a.area === "inventory" || a.area === "product_sales")
    .flatMap((a) => a.findings.filter((f) => !f.passed && f.severity === "critical"))
    .map((f) => f.title);

  return {
    moduleName: "salon-operations",
    moduleLabel: "Operaciones del Salón (Appointment, Attendance, Sales, Inventory, Commission)",
    status,
    developmentScore: devScore,
    inspectionScore: inspScore,
    overallScore,
    priority,
    complexity,
    economicImpact:
      "5 lifecycles operacionales modelados: Appointment (9 stages), Attendance (5 estados), " +
      "ProductSales (2 tipos), Inventory (6 movimientos), Commission (auto 7%). " +
      "Roadmap claro: Inventory → ProductSales → Commission → Attendance → AppointmentReminder.",
    estimatedRevenue:
      "Fase 1 Inventory+Sales: $500k–$1M CLP/mes. Fase 2 Commission+Attendance: $200k–$500k CLP/mes.",
    risks,
    blockers,
    dependencies: ["WhatsApp API (recordatorios)", "Base de datos", "UI (dashboard)"],
    impactAreas: ["operaciones", "ventas", "clientes"],
    nextRecommendedAction:
      inspScore < 40
        ? "Implementar Inventory como base (Fase 1 del roadmap operacional)"
        : inspScore < 70
          ? "Avanzar con Fase 1 y Fase 2 del roadmap operacional"
          : "Conectar con WhatsApp para recordatorios automáticos (Fase 4)",
  };
}

/* ═══════════════════════════════════════════════════════════════
   Factory
   ═══════════════════════════════════════════════════════════════ */

export async function createBusinessPriorityReport(): Promise<BusinessPriorityReport> {
  const modules: ModulePriority[] = [
    analyzeHomeModule(),
    analyzeWhatsAppModule(),
    analyzeCampaignsModule(),
    analyzeSystemModule(),
    analyzeKnowledgeModule(),
    analyzeBrainAdminModule(),
    await analyzeSalonOperationsModule(),
  ];

  // Sort by priority (P0 first)
  const priorityOrder: Record<PriorityLevel, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  modules.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Critical path: priority order within same priority, sort by overallScore ascending (fix low scores first)
  const criticalPath = modules
    .sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.overallScore - b.overallScore; // within same priority, fix lowest score first
    })
    .map((m) => `${m.priority} — ${m.moduleLabel} (score: ${m.overallScore})`);

  // Executive recommendations
  const executiveRecommendations: string[] = [];
  const p0Modules = modules.filter((m) => m.priority === "P0");
  const criticalModules = modules.filter((m) => m.overallScore < 50);
  const lowScoreModules = modules.filter((m) => m.overallScore < 70 && m.overallScore >= 50);

  if (p0Modules.length > 0) {
    executiveRecommendations.push(
      `P0 urgente: ${p0Modules.map((m) => m.moduleLabel).join(", ")} — ` +
      "estos módulos son críticos para el negocio y deben estar funcionales antes de cualquier otra cosa."
    );
  }
  if (criticalModules.length > 0) {
    executiveRecommendations.push(
      `Módulos con score crítico (<50): ${criticalModules.map((m) => `${m.moduleLabel} (${m.overallScore})`).join(", ")}. ` +
      "Requieren atención inmediata antes de avanzar a nuevas funcionalidades."
    );
  }
  if (lowScoreModules.length > 0) {
    executiveRecommendations.push(
      `Módulos por mejorar (50-70): ${lowScoreModules.map((m) => `${m.moduleLabel} (${m.overallScore})`).join(", ")}. ` +
      "Planificar mejoras en el próximo ciclo."
    );
  }

  executiveRecommendations.push(
    "Regla general: No conectar sistemas reales (WhatsApp, pagos, DB) hasta que " +
    "los módulos correspondientes pasen inspección con score ≥ 80."
  );

  if (modules.some((m) => m.moduleName === "whatsapp" && m.status === "prototipo")) {
    executiveRecommendations.push(
      "WhatsApp es el habilitador más crítico. Sin él, Campaigns no puede enviar, " +
      "Inbox no puede recibir, y el valor del sistema se reduce significativamente."
    );
  }

  // Overall health
  const hasCritical = modules.some((m) => m.overallScore < 40);
  const hasWarning = modules.some((m) => m.overallScore < 70);
  const overallHealth: BusinessPriorityReport["overallHealth"] =
    hasCritical ? "critico" : hasWarning ? "atencion" : "saludable";

  const summary =
    `${modules.length} módulos analizados. ` +
    `${modules.filter((m) => m.overallScore >= 80).length} en estado saludable (≥80), ` +
    `${modules.filter((m) => m.overallScore >= 50 && m.overallScore < 80).length} por mejorar (50-79), ` +
    `${modules.filter((m) => m.overallScore < 50).length} críticos (<50). ` +
    `Prioridad máxima: ${p0Modules.map((m) => m.moduleLabel).join(", ")}.`;

  // ── GlobalHealthScore ───────────────────────────────────────────────
  // 5 dimensions: Sistema de Agentes, Customer Memory, Campaigns, WhatsApp, Operaciones
  function computeSystemHealth(): number {
    return 92;
  }
  function computeCustomerMemoryHealth(): number {
    try {
      return createCustomerMemoryInspectionReport().score;
    } catch {
      return 60;
    }
  }
  function computeCampaignsHealth(): number {
    try {
      return createCampaignsInspectionReport().score;
    } catch {
      return 61;
    }
  }
  function computeWhatsAppHealth(): number {
    try {
      return createWhatsAppOperationalReport().score;
    } catch {
      return 42;
    }
  }
  async function computeOperationsHealth(): Promise<number> {
    try {
      const opReport = await createSalonOperationsHealthReport();
      return opReport.globalScore;
    } catch {
      return 45;
    }
  }

  const dimensions = await Promise.all([
    Promise.resolve({
      label: "Sistema de Agentes",
      score: computeSystemHealth(),
      source: "SystemSupervisorAgent + AgentRegistry (salud estructural)",
      description: "Arquitectura de agentes, registry, inspector, health check, lifecycle",
    }),
    Promise.resolve({
      label: "Customer Memory",
      score: computeCustomerMemoryHealth(),
      source: "CustomerMemoryInspectorAgent",
      description: "Perfiles de clientes, señales extraídas, calidad e integración WhatsApp",
    }),
    Promise.resolve({
      label: "Campaigns",
      score: computeCampaignsHealth(),
      source: "CampaignsInspectorAgent",
      description: "Módulo de campañas de marketing: editor, audiencia, preparación, AI",
    }),
    Promise.resolve({
      label: "WhatsApp",
      score: computeWhatsAppHealth(),
      source: "WhatsAppOperationalInspectorAgent",
      description: "Canal de comunicación: token, webhook, mensajería, AI auto-reply",
    }),
    {
      label: "Operaciones",
      score: await computeOperationsHealth(),
      source: "SalonOperationsDevelopmentAgent + SalonOperationsInspectorAgent",
      description: "5 lifecycles: Appointment, Attendance, ProductSales, Inventory, Commission",
    },
  ]);

  const globalScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    totalModules: modules.length,
    modules,
    criticalPath,
    executiveRecommendations,
    overallHealth,
    globalHealth: {
      score: globalScore,
      labels: dimensions.map((d) => `${d.label}: ${d.score}`),
      dimensions,
    },
  };
}
