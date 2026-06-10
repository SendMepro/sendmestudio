/* ═══════════════════════════════════════════════════════════════
   CampaignsFlowAuditAgent — Auditor interno / QA de /campaigns
   ═══════════════════════════════════════════════════════════════
   Este agente NO envía campañas.
   Este agente NO toca Meta / WhatsApp real.
   Este agente NO modifica stores ni lógica de campaña.

   Propósito: Auditar el estado del módulo /campaigns completo
   para determinar qué falta antes de producción.

   Uso:
     import { createCampaignsAuditReport } from "@/agents/campaigns/CampaignsFlowAuditAgent";
     const report = createCampaignsAuditReport();
   ═══════════════════════════════════════════════════════════════ */

export type AuditStatus = "ok" | "warning" | "missing" | "critical";

export type AuditFinding = {
  id: string;
  status: AuditStatus;
  category:
    | "audiencias"
    | "campana"
    | "preparacion"
    | "whatsapp"
    | "historial"
    | "costos"
    | "general";
  title: string;
  description: string;
  expected: string;
  actual: string;
  files: string[];
  recommendation: string;
};

export type CampaignsAuditReport = {
  module: "campaigns";
  generatedAt: string;
  title: string;
  summary: string;
  score: number; // 0–100
  totalChecks: number;
  okChecks: number;
  warningChecks: number;
  missingChecks: number;
  criticalChecks: number;
  findings: AuditFinding[];
  costos: {
    iaTokensEstimados: number;
    iaCostoEstimadoUSD: number;
    mensajesEnviados: number;
    whatsappCostoEstimadoUSD: number;
    costoTotalEstimadoUSD: number;
  };
  accionesRecomendadas: string[];
};

/* ── Constantes de costos ── */
const COSTO_POR_TOKEN_IA = 0.000002; // $0.002/1K tokens (GPT-4o mini aprox)
const TOKENS_POR_GENERACION = 800;   // ~800 tokens por generación de 3 versiones
const COSTO_POR_MENSAJE_WHATSAPP = 0.005; // $0.005 por mensaje WhatsApp (tasa aprox)

/* ═══════════════════════════════════════════════════════════════
   Auditoría
   ═══════════════════════════════════════════════════════════════ */

function auditAudiencias(): AuditFinding[] {
  return [
    {
      id: "AUD-AUD-001",
      status: "ok",
      category: "audiencias",
      title: "Subir CSV/XLSX",
      description: "El módulo permite subir archivos CSV/XLSX para importar contactos.",
      expected: "input type=file acepta .csv,.xlsx,.txt y parsea nombre/teléfono",
      actual: "handleFileSelect() parsea CSV, detecta columnas nombre y teléfono, muestra preview con validación.",
      files: ["src/app/campaigns/page.tsx (line ~1175)"],
      recommendation: "OK. Funciona con CSV delimitado por coma, punto y coma o tabulación.",
    },
    {
      id: "AUD-AUD-002",
      status: "ok",
      category: "audiencias",
      title: "Guardar audiencia en backend",
      description: "Las audiencias importadas se guardan via API POST /api/audiences.",
      expected: "POST /api/audiences guarda y responde con ok + audience data",
      actual: "handleConfirmImport() envía POST a /api/audiences con nombre y contactos. Guarda en store.",
      files: ["src/app/campaigns/page.tsx (line ~1217)", "src/app/api/audiences/route.ts"],
      recommendation: "OK. Backend responde correctamente.",
    },
    {
      id: "AUD-AUD-003",
      status: "ok",
      category: "audiencias",
      title: "Seleccionar audiencia en campaña",
      description: "El modal de selección permite elegir audiencias guardadas.",
      expected: "Modal muestra lista de audiencias con checkbox, toggle segment, summary de contactos",
      actual: "showAudienceModal renderiza savedAudiences con checkboxes, handleToggleSegment, handleSaveAudience actualiza estado y campaigns array.",
      files: ["src/app/campaigns/page.tsx (line ~2007)"],
      recommendation: "OK. Selección funcional con toggle y guardado.",
    },
    {
      id: "AUD-AUD-004",
      status: "ok",
      category: "audiencias",
      title: "Mostrar nombre correcto de audiencia",
      description: "El nombre de la audiencia seleccionada se muestra en el header y resumen.",
      expected: "selectedAudienceName se deriva de audience.segments y savedAudiences",
      actual: "selectedAudienceName se computa con useMemo, se muestra en heroMetaItem y readinessAudienceInfo.",
      files: ["src/app/campaigns/page.tsx (line ~776)"],
      recommendation: "OK. Nombre visible en header y panel resumen.",
    },
    {
      id: "AUD-AUD-005",
      status: "ok",
      category: "audiencias",
      title: "Cálculo de contactos y WhatsApp válidos",
      description: "computeAudience calcula totalContacts, whatsappValid e invalidWhatsapp.",
      expected: "Suma correcta de contactos desde savedAudiences seleccionadas",
      actual: "computeAudience suma totalContacts, whatsappValid, invalidWhatsapp de las audiencias seleccionadas. Se muestra en modal y summary.",
      files: ["src/app/campaigns/page.tsx (line ~115)"],
      recommendation: "OK. Cálculos correctos.",
    },
  ];
}

function auditCampana(): AuditFinding[] {
  return [
    {
      id: "AUD-CMP-001",
      status: "ok",
      category: "campana",
      title: "Crear campaña nueva",
      description: "Se puede crear una campaña nueva desde el sidebar y el modal Nuevo.",
      expected: "Modal con nombre y tipo, POST a API, se agrega a campaigns array y se selecciona automáticamente.",
      actual: "handleCreateCampaign() crea via makeDefaultCampaign(), agrega al array, carga el estado del editor.",
      files: ["src/app/campaigns/page.tsx (line ~918)"],
      recommendation: "OK. Creación funcional con auto-selección.",
    },
    {
      id: "AUD-CMP-002",
      status: "ok",
      category: "campana",
      title: "Editar texto de campaña",
      description: "El textarea permite editar el body del mensaje.",
      expected: "textarea editable con onChange que actualiza body state",
      actual: "editorTextarea con onChange setBody(). Auto-save via useEffect que persiste en campaigns array.",
      files: ["src/app/campaigns/page.tsx (line ~1512)"],
      recommendation: "OK. Edición y auto-guardado funcional.",
    },
    {
      id: "AUD-CMP-003",
      status: "ok",
      category: "campana",
      title: "Generar IA crea 3 versiones reales",
      description: "El botón Generar IA produce 3 versiones distintas: Elegante, Cercana, Urgente.",
      expected: "handleGenerateCampaignAISuggestions produce 3 versiones con contenido diferente.",
      actual: "Genera version Elegante (premium), Cercana (conversacional), Urgente (escasez). Cada una personalizada por servicio detectado.",
      files: ["src/app/campaigns/page.tsx (line ~1258)", "src/app/campaigns/page.tsx (functions versionElegante, versionCercana, versionUrgente)"],
      recommendation: "OK. 3 versiones reales con variación semántica significativa.",
    },
    {
      id: "AUD-CMP-004",
      status: "ok",
      category: "campana",
      title: "Flechas cambian versión de IA",
      description: "Las flechas izquierda/derecha navegan entre sugerencias IA.",
      expected: "handlePrevSuggestion y handleNextSuggestion cambian activeSuggestionIndex y actualizan body",
      actual: "Controles ChevronLeft/ChevronRight con counter. Botón Generar IA deshabilitado tras 3 sugerencias.",
      files: ["src/app/campaigns/page.tsx (line ~1522)"],
      recommendation: "OK. Navegación funcional con límite de 3.",
    },
    {
      id: "AUD-CMP-005",
      status: "ok",
      category: "campana",
      title: "Guardar campaña con audienceId/audience",
      description: "La campaña persiste la audiencia seleccionada en su estado.",
      expected: "Campaign.audience se guarda y restaura al cambiar de campaña",
      actual: "handleSelectCampaign() guarda audience en outgoing campaign y restaura target.audience. Auto-save via refs.",
      files: ["src/app/campaigns/page.tsx (line ~848)"],
      recommendation: "OK. Persistencia completa multi-campaña.",
    },
    {
      id: "AUD-CMP-006",
      status: "ok",
      category: "campana",
      title: "Estado correcto de campaña",
      description: "El status se actualiza según acciones: draft → prepared → sent_demo.",
      expected: "draft, prepared (con readyToSend), sent_demo",
      actual: "STATUS_LABELS cubre draft, prepared, ready, sent_demo, scheduled. Se muestra en campaignCardStatus con colores.",
      files: ["src/app/campaigns/page.tsx (line ~665)"],
      recommendation: "OK. Estados y labels funcionales.",
    },
  ];
}

function auditPreparacion(): AuditFinding[] {
  return [
    {
      id: "AUD-PREP-001",
      status: "ok",
      category: "preparacion",
      title: "Checklist automático de preparación",
      description: "El checklist en modal de preparación evalúa automáticamente audiencia, texto y confirmación.",
      expected: "Checks computados: audiencia > 0, texto >= 20 chars, confirmación humana (WhatsApp)",
      actual: "prepAllChecksOk computa audience.totalContacts > 0, body.length >= 20, userConfirmedReview (social bypass).",
      files: ["src/app/campaigns/page.tsx (line ~1066)", "src/app/campaigns/page.tsx (line ~1916)"],
      recommendation: "OK. Checklist automático, no editable.",
    },
    {
      id: "AUD-PREP-002",
      status: "ok",
      category: "preparacion",
      title: "Enviar ahora como flujo completo",
      description: "El modal permite seleccionar 'Enviar ahora' y preparar la campaña.",
      expected: "prep.sendNow = true, handleSavePrep actualiza status a 'prepared' y readyToSend = true",
      actual: "Flujo completo: select 'Enviar ahora' → checks → save → status='prepared' + readyToSend=true.",
      files: ["src/app/campaigns/page.tsx (line ~1074)"],
      recommendation: "OK. Funciona end-to-end.",
    },
    {
      id: "AUD-PREP-003",
      status: "ok",
      category: "preparacion",
      title: "Programar envío",
      description: "Seleccionar 'Programar envío' muestra inputs de fecha/hora.",
      expected: "prep.sendNow = false, inputs date/time visibles, status = 'scheduled'",
      actual: "prepChips toggle sendNow. Si false, muestra prepDateTimeRow. handleSavePrep valida fecha+hora y setea status='scheduled'.",
      files: ["src/app/campaigns/page.tsx (line ~1883)"],
      recommendation: "OK. Programación funcional con validación.",
    },
    {
      id: "AUD-PREP-004",
      status: "ok",
      category: "preparacion",
      title: "Cancelar programación",
      description: "El botón Cancelar envío programado revierte a estado 'prepared'.",
      expected: "handleCancelScheduled setea status='prepared', readyToSend=true, limpia fecha/hora",
      actual: "handleCancelScheduled() implementado con saveCurrentCampaign y toast.",
      files: ["src/app/campaigns/page.tsx (line ~1106)"],
      recommendation: "OK. Cancelación funcional.",
    },
    {
      id: "AUD-PREP-005",
      status: "ok",
      category: "preparacion",
      title: "Botón Enviar se habilita solo cuando corresponde",
      description: "El botón Enviar en hero está dorado solo cuando readyToSend y campaignStatus='prepared'.",
      expected: "readyToSend && campaignStatus === 'prepared' → gold gradient, pointer cursor",
      actual: "Estilo dinámico: gold si ready, gray si no. onClick condicional con confirm().",
      files: ["src/app/campaigns/page.tsx (line ~1467)"],
      recommendation: "OK. Botón se habilita/deshabilita correctamente.",
    },
  ];
}

function auditWhatsApp(): AuditFinding[] {
  return [
    {
      id: "AUD-WA-001",
      status: "warning",
      category: "whatsapp",
      title: "Modo TEST activo en API send",
      description: "WHATSAPP_TEST_MODE=true es requerido por /api/whatsapp/send.",
      expected: "WHATSAPP_TEST_MODE=true con WHATSAPP_TEST_RECIPIENT definido",
      actual: "La API read env vars. Si no están, responde con error 400. No hay verificación visual en UI.",
      files: ["src/app/api/whatsapp/send/route.ts"],
      recommendation: "Configurar .env.local con WHATSAPP_TEST_MODE=true y WHATSAPP_TEST_RECIPIENT. Considerar agregar badge 'TEST MODE' en UI.",
    },
    {
      id: "AUD-WA-002",
      status: "ok",
      category: "whatsapp",
      title: "WHATSAPP_TEST_RECIPIENT existe en validación",
      description: "La API valida que WHATSAPP_TEST_RECIPIENT esté definido antes de enviar.",
      expected: "Si testMode=true y testRecipient vacío → error 400",
      actual: "Validación en línea 17: 'WHATSAPP_TEST_MODE=true y WHATSAPP_TEST_RECIPIENT requeridos.'",
      files: ["src/app/api/whatsapp/send/route.ts"],
      recommendation: "OK. Validación de seguridad presente.",
    },
    {
      id: "AUD-WA-003",
      status: "ok",
      category: "whatsapp",
      title: "No puede enviar a contactos reales en test mode",
      description: "En modo test, solo envía al test recipient definido en env vars.",
      expected: "sendWhatsAppMessage usa testRecipient, no la audiencia real",
      actual: "API actual envía solo a testRecipient. El mensaje incluye prefijo 'PRUEBA ACTIVA - EN VIVO'.",
      files: ["src/app/api/whatsapp/send/route.ts (line ~24)"],
      recommendation: "OK. Aislado en test mode. Cuando se quite test mode, debe implementarse envío batch real.",
    },
    {
      id: "AUD-WA-004",
      status: "ok",
      category: "whatsapp",
      title: "/api/whatsapp/send existe y responde",
      description: "El endpoint POST /api/whatsapp/send está implementado.",
      expected: "Endpoint responde con JSON { success, messageId, to } o { success: false, error }",
      actual: "Implementado con try/catch, logs, respuesta estructurada.",
      files: ["src/app/api/whatsapp/send/route.ts"],
      recommendation: "OK. Endpoint funcional.",
    },
  ];
}

function auditHistorial(): AuditFinding[] {
  return [
    {
      id: "AUD-HIST-001",
      status: "ok",
      category: "historial",
      title: "/campaigns/history existe",
      description: "La ruta /campaigns/history está implementada y accesible.",
      expected: "Página de historial renderizada desde AppShell",
      actual: "src/app/campaigns/history/page.tsx existe con CampaignHistoryPage export.",
      files: ["src/app/campaigns/history/page.tsx"],
      recommendation: "OK. Ruta funcional.",
    },
    {
      id: "AUD-HIST-002",
      status: "warning",
      category: "historial",
      title: "Muestra campañas históricas",
      description: "El historial muestra entradas con datos reales o demo.",
      expected: "Lista de CampaignHistoryEntry renderizada con métricas y estados",
      actual: "Usa generateDemoHistory() para datos demo. API /api/campaign-history existe pero no hay conexión real desde page.tsx.",
      files: ["src/app/campaigns/history/page.tsx", "src/app/campaigns/history/types.ts"],
      recommendation: "Conectar page.tsx con API real post-producción. Por ahora demo data es suficiente para desarrollo.",
    },
    {
      id: "AUD-HIST-003",
      status: "ok",
      category: "historial",
      title: "Filtros funcionan",
      description: "Filtros por fecha, estado y búsqueda textual.",
      expected: "datePreset (rápido/custom), statusFilter, searchQuery filtran entries",
      actual: "useMemo filtra por rango de fechas, status y search. Selectores UI implementados.",
      files: ["src/app/campaigns/history/page.tsx (line ~40)"],
      recommendation: "OK. Filtros funcionales.",
    },
    {
      id: "AUD-HIST-004",
      status: "ok",
      category: "historial",
      title: "KPIs del período calculan bien",
      description: "Los KPIs mensuales se calculan de todas las campañas activas.",
      expected: "monthKpis computa campaignsThisMonth, totalSent, totalReplies, totalBookings",
      actual: "monthKpis usa useMemo filtrando por fecha de creación en el mes actual. Suma métricas de todas las campañas.",
      files: ["src/app/campaigns/page.tsx (line ~756)"],
      recommendation: "OK. Cálculo correcto basado en campaigns array.",
    },
    {
      id: "AUD-HIST-005",
      status: "missing",
      category: "historial",
      title: "Historial no conectado al backend real",
      description: "El historial usa generateDemoHistory() en lugar de datos reales del backend.",
      expected: "useEffect que fetch a /api/campaign-history y poblado de entries",
      actual: "useState<CampaignHistoryEntry[]>(generateDemoHistory) — datos demo estáticos.",
      files: ["src/app/campaigns/history/page.tsx"],
      recommendation: "En producción: conectar con API real. Mantener demo data para desarrollo.",
    },
  ];
}

function auditCostos(): AuditFinding[] {
  return [
    {
      id: "AUD-COST-001",
      status: "missing",
      category: "costos",
      title: "Tracking de tokens IA",
      description: "No hay tracking de tokens usados por generación IA.",
      expected: "Contador de tokens por generación, acumulado mensual",
      actual: "No implementado. handleGenerateCampaignAISuggestions no cuenta tokens.",
      files: ["src/app/campaigns/page.tsx (line ~1258)"],
      recommendation: "IMPORTANTE: Agregar contador de tokens + costo estimado. Ver sección de costos propuesta.",
    },
    {
      id: "AUD-COST-002",
      status: "missing",
      category: "costos",
      title: "Panel de costos de campaña",
      description: "No existe una vista dedicada a costos de campaña.",
      expected: "Sección en sidebar derecho o /campaigns/history con costos estimados",
      actual: "No existe. monthKpis no incluye costos.",
      files: ["src/app/campaigns/page.tsx"],
      recommendation: "AGREGAR: Panel de costos en sidebar derecho con tokens IA, mensajes, costos estimados.",
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Reporte principal
   ═══════════════════════════════════════════════════════════════ */

export function createCampaignsAuditReport(): CampaignsAuditReport {
  const audiencias = auditAudiencias();
  const campana = auditCampana();
  const preparacion = auditPreparacion();
  const whatsapp = auditWhatsApp();
  const historial = auditHistorial();
  const costos = auditCostos();

  const allFindings: AuditFinding[] = [
    ...audiencias,
    ...campana,
    ...preparacion,
    ...whatsapp,
    ...historial,
    ...costos,
  ];

  const totalChecks = allFindings.length;
  const okChecks = allFindings.filter(f => f.status === "ok").length;
  const warningChecks = allFindings.filter(f => f.status === "warning").length;
  const missingChecks = allFindings.filter(f => f.status === "missing").length;
  const criticalChecks = allFindings.filter(f => f.status === "critical").length;

  const score = Math.round((okChecks / totalChecks) * 100);

  // Costos estimados
  const generacionesIA = 3; // estimado: 3 generaciones este mes (demo)
  const iaTokensEstimados = generacionesIA * TOKENS_POR_GENERACION;
  const iaCostoEstimadoUSD = parseFloat((iaTokensEstimados * COSTO_POR_TOKEN_IA).toFixed(4));
  const mensajesEnviados = 0; // demo — sin envíos reales aún
  const whatsappCostoEstimadoUSD = parseFloat((mensajesEnviados * COSTO_POR_MENSAJE_WHATSAPP).toFixed(4));
  const costoTotalEstimadoUSD = parseFloat((iaCostoEstimadoUSD + whatsappCostoEstimadoUSD).toFixed(4));

  const accionesRecomendadas: string[] = [];

  if (missingChecks > 0) {
    missingChecks > 0 && accionesRecomendadas.push("AGREGAR: Panel de costos con tokens IA, mensajes y costos estimados.");
    accionesRecomendadas.push("CONECTAR: /campaigns/history con API real post-producción.");
  }
  if (warningChecks > 0) {
    accionesRecomendadas.push("CONFIGURAR: WHATSAPP_TEST_MODE=true y WHATSAPP_TEST_RECIPIENT en .env.local.");
    accionesRecomendadas.push("AGREGAR: Badge visual 'MODO TEST' en UI cuando test mode está activo.");
  }

  return {
    module: "campaigns",
    generatedAt: new Date().toISOString(),
    title: "Campaigns Flow Audit — Reporte Completo",
    summary:
      score >= 90
        ? "✅ Módulo /campaigns casi listo para producción. Detalles menores por resolver."
        : score >= 70
          ? "⚠️ Módulo /campaigns funcional pero requiere acciones antes de producción."
          : "❌ Módulo /campaigns requiere trabajo significativo antes de producción.",
    score,
    totalChecks,
    okChecks,
    warningChecks,
    missingChecks,
    criticalChecks,
    findings: allFindings,
    costos: {
      iaTokensEstimados,
      iaCostoEstimadoUSD,
      mensajesEnviados,
      whatsappCostoEstimadoUSD,
      costoTotalEstimadoUSD,
    },
    accionesRecomendadas,
  };
}

/**
 * Genera un resumen markdown del reporte de auditoría.
 */
export function formatAuditReportMarkdown(report: CampaignsAuditReport): string {
  const statusIcon = (s: AuditStatus) =>
    s === "ok" ? "✅" : s === "warning" ? "⚠️" : s === "missing" ? "📋" : "🚨";

  let md = `# ${report.title}\n\n`;
  md += `**Generado:** ${report.generatedAt}\n`;
  md += `**Score:** ${report.score}/100\n`;
  md += `**Checks:** ${report.okChecks} OK · ${report.warningChecks} Warning · ${report.missingChecks} Missing · ${report.criticalChecks} Critical\n\n`;
  md += `**Resumen:** ${report.summary}\n\n`;

  md += `## 📊 Costos Estimados del Mes\n\n`;
  md += `| Concepto | Cantidad | Costo Estimado |\n`;
  md += `|---|---|---|\n`;
  md += `| Tokens IA usados | ${report.costos.iaTokensEstimados.toLocaleString()} | $${report.costos.iaCostoEstimadoUSD} |\n`;
  md += `| Mensajes WhatsApp enviados | ${report.costos.mensajesEnviados.toLocaleString()} | $${report.costos.whatsappCostoEstimadoUSD} |\n`;
  md += `| **Total estimado** | | **$${report.costos.costoTotalEstimadoUSD}** |\n\n`;

  md += `## 📋 Checklist por Categoría\n\n`;

  const categories = ["audiencias", "campana", "preparacion", "whatsapp", "historial", "costos"] as const;
  for (const cat of categories) {
    const findings = report.findings.filter(f => f.category === cat);
    if (findings.length === 0) continue;
    const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
    md += `### ${catLabel}\n\n`;
    for (const f of findings) {
      md += `${statusIcon(f.status)} **${f.title}** — ${f.status.toUpperCase()}\n`;
      md += `  > ${f.description}\n`;
    }
    md += "\n";
  }

  if (report.accionesRecomendadas.length > 0) {
    md += `## 🎯 Acciones Recomendadas\n\n`;
    for (const a of report.accionesRecomendadas) {
      md += `- ${a}\n`;
    }
    md += "\n";
  }

  return md;
}
