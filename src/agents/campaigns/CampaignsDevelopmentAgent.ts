/* ═══════════════════════════════════════════════════════════════
   CampaignsDevelopmentAgent — Auditoría / Análisis / Dirección
   ═══════════════════════════════════════════════════════════════
   Este agente NO envía campañas.
   Este agente NO responde clientes.
   Este agente NO toca Meta / WhatsApp real.

   Este agente analiza el módulo Campaigns, audita su estado,
   identifica problemas y recomienda próximos pasos.

   Uso:
     import { createCampaignsDevelopmentReport } from "@/agents/campaigns/CampaignsDevelopmentAgent";
     const report = createCampaignsDevelopmentReport();
   ═══════════════════════════════════════════════════════════════ */

export type CampaignsDevelopmentFinding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "logic"
    | "ui"
    | "ux"
    | "data"
    | "ai"
    | "whatsapp"
    | "meta"
    | "kpi"
    | "flow"
    | "architecture";
  title: string;
  description: string;
  evidence?: string[];
  recommendation: string;
  files?: string[];
};

export type CampaignsDevelopmentReport = {
  module: "campaigns";
  generatedAt: string;
  summary: string;
  currentState: {
    isConnectedToWhatsApp: boolean;
    isUsingRealAI: boolean;
    hasRealAudience: boolean;
    hasPersistence: boolean;
    hasScheduling: boolean;
    hasMetrics: boolean;
  };
  recommendedKPIs: {
    label: string;
    description: string;
    source: "real" | "planned" | "placeholder";
  }[];
  missingFlowSteps: string[];
  findings: CampaignsDevelopmentFinding[];
  nextActions: string[];
};

/* ── Static analysis of src/app/campaigns/page.tsx ── */
// This is a lightweight audit based on known module structure.
// In a full implementation, the agent could load file contents at runtime.

const KNOWN_FILES = [
  "src/app/campaigns/page.tsx",
  "src/app/campaigns/campaigns.module.css",
];

const HARDCODED_TEMPLATE_FUNCTIONS = [
  "improveText",
  "whatsappVersion",
  "instagramVersion",
  "newIdeaText",
];

const UI_BUTTONS_WITH_PLACEHOLDER_LOGIC = [
  "Instagram format button → no real Instagram API",
  "WhatsApp format button → only text transform, no send",
  "Nueva idea button → local template, no AI",
  "Tono cycle → simple text replace, no AI tone analysis",
  "Enviar prueba → simulated, no real WhatsApp send",
  "Preparar envío → saves local state only",
  "Generar IA → setTimeout mock, no real AI",
  "Subir CSV/XLSX → disabled, 'Próximamente'",
];

const MISSING_CONNECTIONS = [
  "/api/whatsapp/send",
  "sender.ts / CampaignSender",
  "runAI('campaign_strategy')",
  "Audiencia real desde DB/clientes",
  "Historial de envíos",
  "Métricas post-campaña (entregados, leídos, respondieron, reservaron)",
];

/* ── Factory ── */

export function createCampaignsDevelopmentReport(): CampaignsDevelopmentReport {
  const now = new Date().toISOString();

  const findings: CampaignsDevelopmentFinding[] = [
    {
      id: "CAMP-001",
      severity: "high",
      category: "logic",
      title: "IA template functions still use hardcoded campaign context",
      description:
        "Functions like improveText, instagramVersion, and newIdeaText were recently fixed to accept campaign params, but they still operate on local string transforms only. No real AI or LLM is called.",
      evidence: [
        "improveText() does simple .replace() with balayage-specific words like 'acabado glossy'",
        "instagramVersion() generates hashtags based on campaign name but uses fixed body formatting",
        "newIdeaText() generates a generic template regardless of campaign service",
        "No call to runAI('campaign_strategy') or any external AI endpoint",
      ],
      recommendation:
        "Connect each template generator to runAI('campaign_strategy') so suggestions are truly AI-generated per campaign context.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-002",
      severity: "critical",
      category: "whatsapp",
      title: "No connection to /api/whatsapp/send",
      description:
        "The Campaigns module has no real WhatsApp sending capability. The 'Enviar prueba' button simulates a send by updating local state to 'sent_demo'. No HTTP call is made.",
      evidence: [
        "handleSendDemo() only calls setCampaignStatus('sent_demo') + showToast",
        "No fetch() or axios call to any WhatsApp endpoint",
        "No integration with sender.ts or CampaignSender",
      ],
      recommendation:
        "Connect 'Enviar prueba' to /api/whatsapp/send with a real test contact. Connect real send after audiencia is loaded.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-003",
      severity: "high",
      category: "ai",
      title: "AI suggestion generation is a mock setTimeout",
      description:
        "handleGenerateCampaignAISuggestions uses setTimeout(500ms) with local string transforms. No real AI model is invoked. Suggestions are deterministic, not contextual.",
      evidence: [
        "setTimeout(() => { ... }, 500) — artificial delay with no real fetch",
        "Variants are generated by chaining improveText() + applyTone()",
        "MAX_AI_SUGGESTIONS = 3 is hardcoded",
      ],
      recommendation:
        "Replace with a real call to runAI('campaign_strategy') or the ai-router endpoint, passing campaign name, type, and current body as context.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-004",
      severity: "critical",
      category: "data",
      title: "No real audience data connected",
      description:
        "AUDIENCE_SEGMENTS is a hardcoded demo array with 4 segments. There is no connection to a real client database, no loading from /api/customers or similar.",
      evidence: [
        "const AUDIENCE_SEGMENTS = [{ label: 'Balayage recurrente', contacts: 42, ... }] — hardcoded",
        "totalAudiencia = AUDIENCE_SEGMENTS.reduce() — derived from fake data",
        "No fetch() for real audience data",
      ],
      recommendation:
        "Replace AUDIENCE_SEGMENTS with a real API call to fetch customer segments from the salon's database. Allow user to select/deselect segments.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-005",
      severity: "medium",
      category: "flow",
      title: "Missing multiple flow steps",
      description:
        "The campaign flow is incomplete. Critical steps like selecting real audience, validating opt-in, preview per contact, scheduling, and measuring results are absent.",
      evidence: [
        "No audience selector UI — only hardcoded segments in summary panel",
        "No opt-in validation step before sending",
        "No per-contact preview of personalized message",
        "No send scheduling UI beyond date/time inputs in prep modal",
        "No metrics dashboard after send",
      ],
      recommendation:
        "Implement the full campaign flow: create → select audience → choose channel → write text → generate AI → prepare → validate opt-in → preview → test → schedule → send → measure.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-006",
      severity: "high",
      category: "architecture",
      title: "No persistence layer for campaign history",
      description:
        "Campaigns only live in React useState. They are not persisted to any backend. Page refresh loses all campaigns.",
      evidence: [
        "const [campaigns, setCampaigns] = useState<Campaign[]>([DEMO_CAMPAIGN]) — in-memory only",
        "No localStorage, IndexedDB, or API persistence",
        "No /api/campaigns CRUD endpoint called",
      ],
      recommendation:
        "Create a /api/campaigns endpoint (GET/POST/PUT/DELETE) and save/load campaigns from a database or file. Consider localStorage as a temporary fallback.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-007",
      severity: "medium",
      category: "whatsapp",
      title: "WhatsApp Business API requirements not addressed",
      description:
        "Real WhatsApp campaigns require approved templates, opt-in validation, and rate limiting. None of these are handled.",
      evidence: [
        "templateAprobado checkbox exists but has no real verification against Meta",
        "No opt-in check before sending",
        "No rate-limit awareness",
        "No message template review workflow",
      ],
      recommendation:
        "Add template submission/review flow, opt-in validation per contact, and rate-limit handling before enabling real sends.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-008",
      severity: "medium",
      category: "kpi",
      title: "No post-campaign metrics",
      description:
        "After a campaign is 'sent', there is no way to track deliveries, reads, replies, or bookings. The summary panel shows static placeholder data only.",
      evidence: [
        "Summary panel shows 'Pendiente' as default result",
        "No API integration with WhatsApp analytics",
        "No conversion tracking",
      ],
      recommendation:
        "After sending, fetch delivery/read/reply stats from WhatsApp Business API. Track bookings via webhook. Display in a post-campaign metrics view.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-009",
      severity: "low",
      category: "ux",
      title: "UI buttons exist without real backend logic",
      description:
        "Several UI buttons are wired to placeholder or simulated actions. While acceptable for prototyping, they mislead about real capabilities.",
      evidence: [
        "Import CSV area shows 'Próximamente' badge — disabled",
        "Instagram/Facebook channel selection has no real posting logic",
        "Tone cycle only does text replacement, not contextual AI tone shift",
      ],
      recommendation:
        "Either implement real backend connections or label clearly as 'Simulación' / 'Próximamente' to set user expectations.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-010",
      severity: "low",
      category: "ui",
      title: "Hero image is a hardcoded Unsplash URL",
      description:
        "The campaign hero uses a fixed Unsplash image URL. It should be dynamic per campaign or configurable.",
      evidence: [
        "style={{backgroundImage:'url(https://images.unsplash.com/photo-...)'}} — hardcoded",
      ],
      recommendation:
        "Make hero image configurable per campaign or derive it from the campaign service type (e.g., uñas → nails image, balayage → hair image).",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-011",
      severity: "high",
      category: "flow",
      title: "Campaign has no audience selected",
      description:
        "A campaign without an audience cannot be sent. The new Audience Selector exists but campaigns can still be in 'prepared' state without audience assigned. The system should enforce: text + audience = ready to prepare.",
      evidence: [
        "handleSavePrep sets status to 'prepared' regardless of whether audience is selected",
        "campaign.audience may be undefined for any campaign",
        "No validation prevents preparing a campaign without audience",
      ],
      recommendation:
        "Add validation in handleSavePrep: require both body.trim().length > 0 and audience.totalContacts > 0 before allowing status change to 'prepared'. Show a toast or error message explaining what's missing.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-012",
      severity: "medium",
      category: "kpi",
      title: "Readiness score is computed but not persisted or tracked over time",
      description:
        "getCampaignReadiness() computes a readiness score per campaign, but this data is not stored or reported anywhere. The CampaignsDevelopmentAgent could surface readiness metrics per campaign.",
      evidence: [
        "getCampaignReadiness() returns hasText, hasAudience, hasChannel, hasSchedule, score, status, missing",
        "readiness score only used for UI rendering, never logged or analyzed",
        "No historical tracking of readiness improvements",
      ],
      recommendation:
        "Surface readiness metrics in this report: log readiness score per campaign, and track how many campaigns are ready_to_prepare vs prepared vs incomplete.",
      files: ["src/app/campaigns/page.tsx"],
    },
    {
      id: "CAMP-013",
      severity: "medium",
      category: "data",
      title: "Hardcoded '120 contactos' removed — audience now comes from campaign state",
      description:
        "The old summary panel showed hardcoded '120 contactos' (from AUDIENCE_SEGMENTS demo data) regardless of actual audience state. This was fixed: the right rail now reads audience exclusively from selectedCampaign.audience. The sidebar stats also reflect real audience state (0 / actual count).",
      evidence: [
        "totalAudiencia variable removed — no more hardcoded sum",
        "Right rail now shows audience from selectedCampaign.audience",
        "Sidebar shows '0' when no audience, real count when selected",
      ],
      recommendation:
        "Continue to use selectedCampaign.audience as the single source of truth. When real CRM is connected, replace mock segment counts via the customer-memory API.",
      files: ["src/app/campaigns/page.tsx"],
    },
  ];

  const recommendedKPIs = [
    {
      label: "Audiencia total",
      description: "Total de contactos elegibles para campañas",
      source: "planned" as const,
    },
    {
      label: "Contactos con WhatsApp válido",
      description: "Contactos con número de WhatsApp verificado y opt-in activo",
      source: "planned" as const,
    },
    {
      label: "Entregados",
      description: "Mensajes entregados exitosamente en WhatsApp",
      source: "planned" as const,
    },
    {
      label: "Leídos",
      description: "Mensajes marcados como leídos (check azul doble)",
      source: "planned" as const,
    },
    {
      label: "Respondieron",
      description: "Contactos que respondieron al mensaje",
      source: "planned" as const,
    },
    {
      label: "Reservaron",
      description: "Contactos que agendaron una cita post-campaña",
      source: "planned" as const,
    },
    {
      label: "Ingresos estimados",
      description: "Ingresos generados atribuibles a la campaña",
      source: "planned" as const,
    },
    {
      label: "Conversión campaña → reserva",
      description: "Porcentaje de contactos que reservaron vs. alcanzados",
      source: "planned" as const,
    },
    {
      label: "Campañas activas",
      description: "Campañas en estado 'prepared' o 'ready'",
      source: "planned" as const,
    },
    {
      label: "Campañas preparadas",
      description: "Campañas con preparación completa lista para revisión",
      source: "planned" as const,
    },
    {
      label: "Templates pendientes",
      description: "Templates de WhatsApp pendientes de aprobación por Meta",
      source: "planned" as const,
    },
    {
      label: "Segmento principal",
      description: "Segmento de audiencia más grande seleccionado en campañas activas",
      source: "planned" as const,
    },
  ];

  const missingFlowSteps = [
    "Crear campaña real con nombre y tipo",
    "Seleccionar audiencia real desde base de datos de clientes",
    "Elegir canal (WhatsApp / Instagram / Facebook)",
    "Redactar texto con asistencia IA real",
    "Generar 3 sugerencias IA reales por campaña",
    "Alcanzar readiness status 'ready_to_prepare' (texto + audiencia + canal)",
    "Preparar envío con template y segmento",
    "Validar opt-in de cada contacto antes de enviar",
    "Vista previa del mensaje personalizado por contacto",
    "Enviar prueba a un contacto de test",
    "Programar envío masivo con fecha y hora",
    "Enviar campaña real a todo el segmento",
    "Medir entregados / leídos / respuestas / reservas",
  ];

  const nextActions = [
    "Corregir estado por campaña (asegurar que cada campaña tenga body, prep, aiSuggestions propios)",
    "Marcar campaña seleccionada visualmente en la sidebar",
    "Guardar body por campaña (sincronización bidireccional)",
    "Crear selector de audiencia real conectado a /api/customers o similar",
    "Conectar Campaigns a runAI('campaign_strategy') para generación real de textos",
    "Conectar envío WhatsApp real después de tener audiencia real y templates aprobados",
    "Crear endpoint /api/agents/campaigns-development para consultar este reporte",
    "Implementar persistencia de campañas (API + DB o al menos localStorage)",
    "Agregar vista de métricas post-campaña",
    "Agregar flujo de aprobación de templates WhatsApp",
    "Persistir readiness score por campaña para tracking histórico",
  ];

  const summary =
    "El módulo Campaigns tiene una UI funcional con multi-campaña, selección visual, " +
    "sincronización de cuerpo por campaña, y estructura de preparación de envío. " +
    "Sin embargo, carece de conexión a WhatsApp real, IA real, audiencia real, " +
    "persistencia, y métricas post-campaña. Es un prototipo funcional listo para " +
    "conectarse con los sistemas reales del salón.";

  return {
    module: "campaigns",
    generatedAt: now,
    summary,
    currentState: {
      isConnectedToWhatsApp: false,
      isUsingRealAI: false,
      hasRealAudience: false,
      hasPersistence: false,
      hasScheduling: false,
      hasMetrics: false,
    },
    recommendedKPIs,
    missingFlowSteps,
    findings,
    nextActions,
  };
}
