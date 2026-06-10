"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import styles from "./campaigns.module.css";
import {
  Send,
  CheckCircle,
  X,
  SmilePlus,
  Sparkles,
  Palette,
  Camera,
  MessageSquareText,
  Lightbulb,
  ClipboardCopy,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Radio,
  Clock,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  PencilLine,
  UserCheck,
  Smartphone,
  Eye,
  Save,
  Trash2,
  MoreHorizontal,
  Edit3,
  Copy,
  ChevronDown,
  Phone,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   Demo data (internal only — not shown as mock UI)
   ══════════════════════════════════════════════════════════ */

const DEMO_TITLE = "Ritual Balayage Lumiere";
const DEMO_SUBTITLE = "Campaña premium · Reactivación clientas balayage";
const DEMO_BODY = `Hola {{nombre}} ✨

Este mes abrimos cupos limitados para nuestro Ritual Balayage Lumiere — iluminación suave con acabado glossy que dura hasta 8 semanas.

¿Te gustaría que revisemos horarios disponibles para esta semana?

💜 Incluye:
• Diagnóstico capilar personalizado
• Balayage con técnica airtouch
• Brillo gloss sellador
• Peinado de salida`;

const AUDIENCE_SEGMENTS = [
  { label: "Balayage recurrente", contacts: 42, affinity: "85%" },
  { label: "Clientas premium", contacts: 28, affinity: "72%" },
  { label: "Nuevas captaciones", contacts: 18, affinity: "54%" },
  { label: "Reactivación 90d", contacts: 32, affinity: "63%" },
];

/* ── Segment definitions for Audience Selector ── */

/* ═══════════════════════════════════════════════════
   Types for imported audiences
   ═══════════════════════════════════════════════════ */
interface ImportedContact {
  name: string;
  phone: string;
}

interface SavedAudience {
  id: string;
  name: string;
  contacts: ImportedContact[];
  totalContacts: number;
  validWhatsapp: number;
  invalidWhatsapp: number;
  createdAt: string;
}

/* ── Audience model ── */
interface CampaignMetrics {
  sent: number;
  failed: number;
  replies: number;
  bookings: number;
}

interface CampaignAudience {
  segments: string[];   // segment IDs
  totalContacts: number;
  whatsappValid: number;
  invalidWhatsapp: number;
}

const NO_AUDIENCE: CampaignAudience = {
  segments: [],
  totalContacts: 0,
  whatsappValid: 0,
  invalidWhatsapp: 0,
};

// TODO: connect customer-memory for real segment counts
function getSegmentCount(segmentId: string, savedAudiences: SavedAudience[]): number {
  const audience = savedAudiences.find((a) => a.id === segmentId);
  return audience?.totalContacts ?? 0;
}

function computeAudience(segments: string[], savedAudiences: SavedAudience[]): CampaignAudience {
  let totalContacts = 0;
  let whatsappValid = 0;
  let invalidWhatsapp = 0;

  for (const id of segments) {
    const audience = savedAudiences.find((a) => a.id === id);
    if (audience) {
      totalContacts += audience.totalContacts;
      whatsappValid += audience.validWhatsapp;
      invalidWhatsapp += audience.invalidWhatsapp;
    }
  }

  return { segments, totalContacts, whatsappValid, invalidWhatsapp };
}

/* ── Campaign Readiness ── */
interface CampaignReadiness {
  hasText: boolean;
  hasAudience: boolean;
  hasChannel: boolean;
  hasSchedule: boolean;
  score: number; // 0–100
  status: "incomplete" | "ready_to_prepare" | "prepared";
  missing: string[];
}

function getCampaignReadiness(campaign: Campaign, bodyText: string): CampaignReadiness {
  const hasText = bodyText.trim().length > 20;
  const hasAudience = (campaign.audience?.totalContacts ?? 0) > 0;
  const hasChannel = Boolean(campaign.prep?.canal || campaign.type);
  const hasSchedule = Boolean(campaign.prep?.fecha && campaign.prep?.hora);

  const checks = [hasText, hasAudience, hasChannel];
  const done = checks.filter(Boolean).length;
  const score = Math.round((done / checks.length) * 100);

  const missing: string[] = [];
  if (!hasText) missing.push("texto");
  if (!hasAudience) missing.push("audiencia");
  if (!hasChannel) missing.push("canal");

  let status: CampaignReadiness["status"];
  if (campaign.status === "prepared" || campaign.status === "ready" || campaign.status === "sent_demo") {
    status = "prepared";
  } else if (hasText && hasAudience && hasChannel) {
    status = "ready_to_prepare";
  } else {
    status = "incomplete";
  }

  return { hasText, hasAudience, hasChannel, hasSchedule, score, status, missing };
}

const CANALES_WA = ["WhatsApp"];
const CANALES_SOCIAL = ["Instagram", "Facebook"];
const ALL_CANALES = [...CANALES_WA, ...CANALES_SOCIAL];

const QUICK_EMOJIS = ["✨","💜","🌿","💇‍♀️","📅","🤍","🌸","🌟","🎀","💫","😊","🙌"];

/* ── Menu item style for audience actions ── */
const menuItemStyle: React.CSSProperties = {
  display:"flex",alignItems:"center",gap:8,
  width:"100%",padding:"8px 14px",
  border:"none",background:"transparent",
  fontSize:13,fontWeight:600,color:"#1e0a3c",
  cursor:"pointer",fontFamily:"inherit",
  transition:"background .12s",
};

/* ── IA version generators — 3 estilos distintos ── */

function detectService(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("uña") || n.includes("nail") || n.includes("manicure") || n.includes("manos") || n.includes("pedicure")) return "uñas";
  if (n.includes("balayage") || n.includes("mechas") || n.includes("degradado") || n.includes("luces")) return "balayage";
  if (n.includes("botox") || n.includes("keratina") || n.includes("alisado") || n.includes("liso")) return "alisado";
  if (n.includes("corte") || n.includes("tijeras") || n.includes("estilo") || n.includes("look")) return "corte";
  if (n.includes("color") || n.includes("tinte") || n.includes("coloración") || n.includes("reflejos")) return "color";
  return "general";
}

/** Versión 1: Elegante / Premium — tono aspiracional, detalles de calidad */
function versionElegante(body: string, campaignName: string): string {
  const svc = detectService(campaignName);
  if (svc === "uñas") {
    return `Hola {{nombre}} ✨

Te escribimos de Salón Belleza para compartirte nuestra experiencia en cuidado de manos.

💅 *Experiencia Premium en Manicura*
Incluye:
• Diagnóstico personalizado de tus uñas
• Limpieza y preparación con productos profesionales
• Esmaltado de larga duración con acabado glossy
• Hidratación profunda de cutículas
• Asesoría de color según tu estilo

Agenda tu cita y regálate un momento de cuidado personal.

💜 Salón Belleza`;
  }
  if (svc === "balayage") {
    return `Hola {{nombre}} ✨

Este mes abrimos cupos exclusivos para nuestro *Ritual Balayage Lumiere* — iluminación suave con acabado glossy que dura hasta 8 semanas.

💆‍♀️ Incluye:
• Diagnóstico capilar personalizado
• Balayage con técnica airtouch
• Brillo gloss sellador
• Peinado de salida

¿Te gustaría que revisemos horarios disponibles para esta semana?

💜 Salón Belleza`;
  }
  if (svc === "alisado") {
    return `Hola {{nombre}} ✨

Tenemos una promoción especial en nuestro *Alisado Profesional* con resultados duraderos y acabado natural.

✨ Incluye:
• Diagnóstico capilar personalizado
• Alisado con productos profesionales
• Sello de hidratación profunda
• Brillo y manejabilidad garantizados

Agenda tu cita y luce un cabello espectacular.

💜 Salón Belleza`;
  }
  if (svc === "corte") {
    return `Hola {{nombre}} ✨

¿Buscas un cambio de look? Tenemos cupos esta semana con nuestros estilistas para un *Corte Personalizado*.

✂️ Incluye:
• Consulta de estilo personalizada
• Corte según tu tipo de cabello
• Peinado de salida
• Asesoría de productos

Agenda tu cita y transforma tu estilo.

💜 Salón Belleza`;
  }
  if (svc === "color") {
    return `Hola {{nombre}} ✨

Renueva tu look con nuestros servicios de *Coloración Profesional*.

🎨 Incluye:
• Consulta de color personalizada
• Aplicación de tinte profesional
• Tratamiento post-color
• Brillo y fijación de color

¿Te gustaría agendar una consulta de color sin costo?

💜 Salón Belleza`;
  }
  // Default elegante
  return body
    .replace(/Hola/g, "Querida")
    .replace(/cupos/g, "experiencias exclusivas")
    .replace(/disponibles/g, "reservados para ti")
    .replace(/horario/g, "momento especial")
    .replace(/¿Te gustaría/g, "¿Te encantaría");
}

/** Versión 2: Cercana / Conversacional — tono amigable, directo */
function versionCercana(body: string, campaignName: string): string {
  const svc = detectService(campaignName);
  if (svc === "uñas") {
    return `¡Hola {{nombre}}! 🙌

¿Sabías que tenemos cupos esta semana para mimar tus manos?

💅 *Manicura que te mereces*
• Limpieza y cuidado profesional
• Esmalte del color que más te guste
• Hidratación para unas manos suaves
• Resultado impecable que dura

Responde *SÍ* y te apartamos un horario 📅

¡Te esperamos! 💜`;
  }
  if (svc === "balayage") {
    return `¡Hola {{nombre}}! 🙌

¿Lista para un cambio sutil pero impactante? Tenemos cupos esta semana para *Balayage*.

💆‍♀️ Incluye:
• Técnica airtouch personalizada
• Brillo gloss para un acabado espectacular
• Peinado de salida

Responde *SÍ* y te mostramos los horarios disponibles 📅

¡Te esperamos! 💜`;
  }
  // Default cercano
  return `¡Hola {{nombre}}! 🙌

${body
  .replace(/Hola {{nombre}} ✨\n\n/g, "")
  .replace(/Incluye:/g, "Esto incluye:")
  .replace(/¿Te gustaría/g, "¿Te animas a")
  .replace(/\?$/, "?")}

Responde *SÍ* y te confirmamos 📅

¡Te esperamos! 💜`;
}

/** Versión 3: Urgente / Cupos limitados — escasez, acción rápida */
function versionUrgente(body: string, campaignName: string): string {
  const svc = detectService(campaignName);
  if (svc === "uñas") {
    return `⭐️ ⚡️ ÚLTIMOS CUPOS ⚡️ ⭐️

Hola {{nombre}},

Esta semana tenemos disponibles los últimos cupos para *Manicura Premium* en Salón Belleza.

💅 Incluye:
• Limpieza y preparación profesional
• Esmaltado con acabado brillante
• Cuidado de cutículas
• Resultado de salón

⏳ Solo quedan 3 cupos para esta semana.

Responde *QUIERO* y te reservamos tu espacio antes que se agoten 🔥

💜 Salón Belleza`;
  }
  if (svc === "balayage") {
    return `⭐️ ⚡️ ÚLTIMOS CUPOS ⚡️ ⭐️

Hola {{nombre}},

Esta semana solo tenemos 3 cupos disponibles para *Balayage Lumiere*.

💆‍♀️ Incluye:
• Técnica airtouch profesional
• Brillo gloss sellador
• Peinado de salida

⏳ Reserva tu espacio antes que se agoten.

Responde *YA* y te confirmamos horario 🔥

💜 Salón Belleza`;
  }
  // Default urgente
  return `⭐️ ⚡️ ÚLTIMOS CUPOS ⚡️ ⭐️

Hola {{nombre}},

${body
  .replace(/Hola {{nombre}} ✨\n\n/g, "")
  .replace(/disponibles/g, "limitados")
  .replace(/revisemos/g, "apartemos")
  .replace(/Agenda/g, "Asegura")
  .replace(/cita/g, "espacio")}

⏳ Solo quedan algunos cupos para esta semana.

Responde *YA* y te reservamos tu horario 🔥

💜 Salón Belleza`;
}

/**
 * Generate WhatsApp version using the selected campaign's name and body template.
 */
function whatsappVersion(body: string, campaignName: string): string {
  return `Hola {{nombre}} ✨

Te escribimos de *${campaignName}* — tenemos cupos especiales esta semana para ti.

👉 ¿Te gustaría agendar?

Responde *SÍ* y te confirmamos horario 📅

💜 Salón Belleza`;
}

/**
 * Generate Instagram version using the selected campaign's body template.
 */
function instagramVersion(body: string, campaignName: string): string {
  const hashtags = generateHashtags(campaignName);
  return `✨ ${campaignName.toUpperCase()} ✨

${body}

${hashtags}`;
}

/**
 * Generate relevant hashtags based on campaign name
 */
function generateHashtags(campaignName: string): string {
  const lower = campaignName.toLowerCase();
  const tags = ["SalonBelleza", "CuidadoPersonal"];
  if (lower.includes("uña") || lower.includes("nail") || lower.includes("manicure") || lower.includes("pedicure")) {
    tags.push("Uñas", "Manicure", "NailArt", "BellezaDeUñas");
  } else if (lower.includes("balayage") || lower.includes("mechas") || lower.includes("color")) {
    tags.push("Balayage", "Coloración", "Cabello", "Styling");
  } else {
    tags.push("Belleza", "Estilo");
  }
  return tags.map(t => `#${t.replace(/\s+/g, "")}`).join(" ");
}

/**
 * Generate a fresh idea text for the selected campaign.
 */
function newIdeaText(campaignName: string, body: string): string {
  return `🌸 *Nuevo mes, nuevo look* 🌸

Este mes en *${campaignName}*:
✅ Atención personalizada
✅ Productos profesionales
✅ Resultados garantizados

Agenda tu cita sin costo — solo 20 minutos.

👉 Responde *QUIERO* y te damos horario`;
}

/* ── Tone transformations ── */
type Tone = "lujo" | "cercano" | "promocional" | "educativo";
const TONES: { key: Tone; label: string }[] = [
  { key: "lujo", label: "Lujo" },
  { key: "cercano", label: "Cercano" },
  { key: "promocional", label: "Promocional" },
  { key: "educativo", label: "Educativo" },
];

function applyTone(text: string, tone: Tone): string {
  switch (tone) {
    case "lujo":
      return text
        .replace(/\bcupos\b/gi, "experiencias exclusivas")
        .replace(/\bcliente\b/gi, "invitada especial");
    case "cercano":
      return text
        .replace(/\bRitual\b/g, "nuestro ritual")
        .replace(/\bCampaña\b/g, "amiga")
        .replace(/\bIluminación\b/g, "ese brillo que te encanta");
    case "promocional":
      return text
        .replace(/\bhorarios disponibles\b/g, "15% OFF si agendas hoy")
        .replace(/\bdiagnóstico\b/g, "diagnóstico GRATIS");
    case "educativo":
      return text
        .replace(/\bacabado glossy\b/g, "acabado glossy (técnica de sellado con queratina)")
        .replace(/\b8 semanas\b/g, "8 semanas, dependiendo del tipo de cabello y rutina de cuidado");
    default:
      return text;
  }
}

type CampaignStatus = "draft" | "prepared" | "ready" | "sent_demo" | "scheduled";
type CampaignMode = "manual" | "ai";

/* ── Campaign model ── */
interface Campaign {
  id: string;
  name: string;
  type: "WhatsApp" | "Instagram" | "Facebook";
  body: string;
  mode: CampaignMode;
  status: CampaignStatus;
  prep: PrepData;
  readyToSend: boolean;
  aiSuggestions: string[];
  activeSuggestionIndex: number;
  audience?: CampaignAudience;
  metrics?: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Template database ── */

const SERVICE_TEMPLATES: Record<string, string> = {
  uñas: `Hola {{nombre}} ✨

Tenemos cupos disponibles esta semana para manicure y cuidado de uñas.

💅 Incluye:
• Limpieza y preparación de uñas
• Esmaltado tradicional o permanente
• Diseño delicado según tu estilo
• Hidratación de cutículas

¿Te gustaría que revisemos un horario disponible para ti?`,
  manicure: `Hola {{nombre}} ✨

Tenemos cupos disponibles esta semana para manicure y cuidado de uñas.

💅 Incluye:
• Limpieza y preparación de uñas
• Esmaltado tradicional o permanente
• Diseño delicado según tu estilo
• Hidratación de cutículas

¿Te gustaría que revisemos un horario disponible para ti?`,
  pedicure: `Hola {{nombre}} ✨

Este mes tenemos cupos para pedicure completo con cuidado profesional.

🦶 Incluye:
• Pedicura completa con exfoliación
• Corte y forma de uñas
• Hidratación profunda
• Esmaltado a elección

¿Te gustaría agendar tu cita esta semana?`,
  balayage: DEMO_BODY,
  "botox capilar": `Hola {{nombre}} ✨

Este mes tenemos promoción especial en nuestro tratamiento de Botox Capilar.

💆‍♀️ Incluye:
• Diagnóstico capilar personalizado
• Aplicación de keratina y nutrientes
• Sello de hidratación profunda
• Brillo y suavidad garantizados

¿Te gustaría que revisemos horarios disponibles para ti?`,
  corte: `Hola {{nombre}} ✨

¿Buscas un cambio de look? Tenemos cupos esta semana con nuestros estilistas.

✂️ Incluye:
• Consulta de estilo personalizada
• Corte según tu tipo de cabello
• Peinado de salida
• Asesoría de productos

Agenda tu cita y transforma tu estilo.`,
  coloración: `Hola {{nombre}} ✨

Renueva tu look con nuestros servicios de coloración profesional.

🎨 Incluye:
• Consulta de color personalizada
• Aplicación de tinte profesional
• Tratamiento post-color
• Brillo y fijación de color

¿Te gustaría agendar una consulta de color sin costo?`,
  alisado: `Hola {{nombre}} ✨

Tenemos promoción en alisado profesional con resultados duraderos.

✨ Incluye:
• Diagnóstico capilar
• Alisado con productos profesionales
• Sello de hidratación
• Brillo y manejabilidad

Agenda tu cita y luce un cabello liso espectacular.`,
};

const SERVICE_KEYWORDS: { keywords: string[]; service: string }[] = [
  { keywords: ["uñas", "uña", "manicure", "manos", "nail", "esmalte", "acrílico", "gelish"], service: "uñas" },
  { keywords: ["pedicure", "pedicura", "pies"], service: "pedicure" },
  { keywords: ["balayage", "mechas", "degradado", "luces"], service: "balayage" },
  { keywords: ["botox", "queratina", "nutrición", "hidratación capilar"], service: "botox capilar" },
  { keywords: ["corte", "cortar", "tijeras", "estilo", "look", "trasformar"], service: "corte" },
  { keywords: ["color", "tinte", "coloración", "matiz", "reflejos", "colorimetría"], service: "coloración" },
  { keywords: ["alisado", "liso", "plancha", "keratina", "brasileño"], service: "alisado" },
];

function detectServiceFromName(name: string): string | null {
  const lower = name.toLowerCase();
  for (const entry of SERVICE_KEYWORDS) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.service;
    }
  }
  return null;
}

function getDefaultBodyByCampaign(campaign: { name: string; type: string }): string {
  const service = detectServiceFromName(campaign.name);
  if (service && SERVICE_TEMPLATES[service]) {
    return SERVICE_TEMPLATES[service];
  }
  // Generic template
  return `Hola {{nombre}} ✨

Queremos invitarte a conocer nuestros servicios especiales en Salón Belleza.

🌸 Incluye:
• Atención personalizada
• Productos profesionales
• Resultados garantizados

¿Te gustaría agendar una cita esta semana?`;
}

interface PrepData {
  canal: string;
  fecha: string;
  hora: string;
  sendNow: boolean;
}

const DEFAULT_PREP: PrepData = {
  canal: "WhatsApp",
  fecha: "",
  hora: "",
  sendNow: true,
};

function makeDefaultCampaign(name: string, type: "WhatsApp" | "Instagram" | "Facebook"): Campaign {
  const body = getDefaultBodyByCampaign({ name, type });
  return {
    id: generateId(),
    name,
    type,
    body,
    mode: "manual",
    status: "draft",
    prep: { ...DEFAULT_PREP, canal: type },
    readyToSend: false,
    aiSuggestions: [],
    activeSuggestionIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: { sent: 0, failed: 0, replies: 0, bookings: 0 },
  };
}

const DEMO_CAMPAIGN: Campaign = makeDefaultCampaign(DEMO_TITLE, "WhatsApp");

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Configurando",
  prepared: "Preparada",
  ready: "Lista para revisión",
  sent_demo: "Enviada",
  scheduled: "Programada",
};

/* ══════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════ */
export default function CampaignsPage() {
  /* ── Multi-campaign state (source of truth) ── */
  const [campaigns, setCampaigns] = useState<Campaign[]>([DEMO_CAMPAIGN]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(DEMO_CAMPAIGN.id);
  /* ── Derived: currently selected campaign ── */
  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId) ?? campaigns[0];

  /* ── Editor UI state (synced from currentCampaign) ── */
  const [body, setBody] = useState(currentCampaign.body);
  const [prep, setPrep] = useState<PrepData>(currentCampaign.prep);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>(currentCampaign.status);
  const [readyToSend, setReadyToSend] = useState(currentCampaign.readyToSend);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(currentCampaign.aiSuggestions);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(currentCampaign.activeSuggestionIndex);
  /* ── Audience state (synced from currentCampaign) ── */
  const [audience, setAudience] = useState<CampaignAudience>(currentCampaign.audience ?? NO_AUDIENCE);
  /* ── Transient UI state ── */
  const [showEmoji, setShowEmoji] = useState(false);
  const [fontIdx, setFontIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<Tone>("lujo");
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [pendingSegments, setPendingSegments] = useState<string[]>(currentCampaign.audience?.segments ?? []);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignType, setNewCampaignType] = useState<"WhatsApp" | "Instagram" | "Facebook">("WhatsApp");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const MAX_AI_SUGGESTIONS = 3;
  const [userConfirmedReview, setUserConfirmedReview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const fontSizes = [15, 17];

  /* ── Imported Audiences state ── */
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportedContact[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importAudienceName, setImportAudienceName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Audience action menu state ── */
  const [openMenuAudienceId, setOpenMenuAudienceId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState<string | null>(null);
  const [duplicateValue, setDuplicateValue] = useState("");
  const [confirmDeleteAudienceId, setConfirmDeleteAudienceId] = useState<string | null>(null);

  /* ── Load saved audiences on mount ── */
  useEffect(() => {
    const loadAudiences = async () => {
      try {
        const res = await fetch("/api/audiences");
        const data = await res.json();
        if (data.ok && Array.isArray(data.audiences)) {
          setSavedAudiences(data.audiences);
        }
      } catch {
        // silent
      }
    };
    void loadAudiences();
  }, []);

  /* Derived */
  const isSocial = CANALES_SOCIAL.includes(prep.canal);
  const activeStatuses: CampaignStatus[] = ["draft", "prepared", "ready", "scheduled"];
  const activeCampaigns = useMemo(() => campaigns.filter(c => activeStatuses.includes(c.status)), [campaigns]);
  const isScheduledCampaign = useMemo(() =>
    campaignStatus === "scheduled" || (!!prep.fecha && !!prep.hora && !prep.sendNow),
    [campaignStatus, prep.fecha, prep.hora, prep.sendNow]
  );

  /** KPIs del mes — calculados de todas las campañas */
  const monthKpis = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthCampaigns = campaigns.filter(c => {
      const d = new Date(c.createdAt).getTime();
      return d >= startOfMonth.getTime() && d <= endOfMonth.getTime();
    });
    const campaignsThisMonth = monthCampaigns.length;
    const totalSent = monthCampaigns.reduce((sum, c) => sum + (c.metrics?.sent ?? 0), 0);
    const totalReplies = monthCampaigns.reduce((sum, c) => sum + (c.metrics?.replies ?? 0), 0);
    const totalBookings = monthCampaigns.reduce((sum, c) => sum + (c.metrics?.bookings ?? 0), 0);
    return { campaignsThisMonth, totalSent, totalReplies, totalBookings };
  }, [campaigns]);

  /* ── Cost tracking (después de monthKpis) ── */
  const COST_PER_TOKEN = 0.000002;
  const TOKENS_PER_GEN = 800;
  const COST_PER_WA_MSG = 0.005;
  const [iaGenerationsCount, setIaGenerationsCount] = useState(0);
  const iaTokensUsed = iaGenerationsCount * TOKENS_PER_GEN;
  const iaCostEst = parseFloat((iaTokensUsed * COST_PER_TOKEN).toFixed(4));
  const waMessagesSent = monthKpis.totalSent;
  const waCostEst = parseFloat((waMessagesSent * COST_PER_WA_MSG).toFixed(4));
  const totalCostEst = parseFloat((iaCostEst + waCostEst).toFixed(4));

  const modalTitle = isSocial ? "Preparar publicación" : isScheduledCampaign ? "Envío programado" : "Preparar envío";
  const modalSaveLabel = prep.sendNow ? "Enviar ahora" : isScheduledCampaign ? "Actualizar programación" : "Programar envío";
  const hasAudience = audience.totalContacts > 0;
  const audienceSegmentCount = audience.segments.length;
  /** Derive audience name(s) from segment IDs for display */
  const selectedAudienceName = useMemo(() => {
    if (!hasAudience || audience.segments.length === 0) return null;
    const names = audience.segments
      .map(id => savedAudiences.find(a => a.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return null;
    return names.join(", ");
  }, [audience.segments, savedAudiences, hasAudience]);
  const readiness = useMemo(() => getCampaignReadiness(currentCampaign, body), [currentCampaign, body]);
  const heroBtnLabel = readiness.status === "prepared"
    ? "Editar preparación"
    : readiness.status === "ready_to_prepare"
      ? "Preparar envío"
      : !readiness.hasAudience
        ? "Seleccionar audiencia"
        : !readiness.hasText
          ? "Escribir campaña"
          : "Preparar envío";

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  /* ── Persist current editor state back to campaigns array ── */
  const saveCurrentCampaign = useCallback((overrides?: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== selectedCampaignId) return c;
      return {
        ...c,
        ...overrides,
        body: overrides?.body ?? body,
        prep: overrides?.prep ?? prep,
        status: overrides?.status ?? campaignStatus,
        readyToSend: overrides?.readyToSend ?? readyToSend,
        aiSuggestions: overrides?.aiSuggestions ?? aiSuggestions,
        activeSuggestionIndex: overrides?.activeSuggestionIndex ?? activeSuggestionIndex,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [selectedCampaignId, body, prep, campaignStatus, aiSuggestions, activeSuggestionIndex]);

  /* ── Refs to avoid stale closures ── */
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const prepRef = useRef(prep);
  prepRef.current = prep;
  const campaignStatusRef = useRef(campaignStatus);
  campaignStatusRef.current = campaignStatus;
  const aiSuggestionsRef = useRef(aiSuggestions);
  aiSuggestionsRef.current = aiSuggestions;
  const activeSuggestionIndexRef = useRef(activeSuggestionIndex);
  activeSuggestionIndexRef.current = activeSuggestionIndex;
  const campaignsRef = useRef(campaigns);
  campaignsRef.current = campaigns;
  const selectedCampaignIdRef = useRef(selectedCampaignId);
  selectedCampaignIdRef.current = selectedCampaignId;
  const audienceRef = useRef(audience);
  audienceRef.current = audience;

  /* ── Auto-save body whenever user types ── */
  useEffect(() => {
    // Sync body changes into the campaigns array
    setCampaigns(prev => prev.map(c => {
      if (c.id !== selectedCampaignId) return c;
      if (c.body === bodyRef.current) return c;
      return { ...c, body: bodyRef.current, updatedAt: new Date().toISOString() };
    }));
  }, [body, selectedCampaignId]);

  /* ── Select campaign ── */
  const handleSelectCampaign = useCallback((campaignId: string) => {
    const currentId = selectedCampaignIdRef.current;
    if (campaignId === currentId) return;
    // 1) Save current state into the outgoing campaign
    setCampaigns(prev => prev.map(c => {
      if (c.id !== currentId) return c;
      return {
        ...c,
        body: bodyRef.current,
        prep: prepRef.current,
        status: campaignStatusRef.current,
        aiSuggestions: aiSuggestionsRef.current,
        activeSuggestionIndex: activeSuggestionIndexRef.current,
        audience: audienceRef.current.totalContacts > 0 ? audienceRef.current : undefined,
        updatedAt: new Date().toISOString(),
      };
    }));
    // 2) Find the target campaign (from ref to avoid stale closure)
    const target = campaignsRef.current.find(c => c.id === campaignId);
    if (!target) return;
    // 3) Load target state into editor
    setSelectedCampaignId(campaignId);
    setBody(target.body);
    setPrep(target.prep);
    setCampaignStatus(target.status);
    setReadyToSend(target.readyToSend);
    setAiSuggestions(target.aiSuggestions);
    setActiveSuggestionIndex(target.activeSuggestionIndex);
    setAudience(target.audience ?? NO_AUDIENCE);
    setTone("lujo");
    setCopied(false);

    console.log("[Campaigns] selectedCampaign:", target.name, target.id);
    console.log("[Campaigns] body loaded:", target.body.substring(0, 60) + "...");
    console.log("[Campaigns] aiSuggestions:", target.aiSuggestions.length, "items");
    console.log("[Campaigns] audience:", target.audience?.totalContacts ?? 0, "contacts,", target.audience?.segments.length ?? 0, "segments");
  }, []); // All deps via refs — stable callback

  /* ── Emoji ── */
  const insertEmoji = useCallback((emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBody((prev) => prev.slice(0, start) + emoji + prev.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
    setShowEmoji(false);
  }, []);

  /* ── Copy ── */
  const handleCopy = useCallback(async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      showToast("✅ Copiado al portapapeles");
      setTimeout(() => setCopied(false), 1500);
    } catch { /* fallback ignored */ }
  }, [body, showToast]);

  /* ── New Campaign Modal ── */
  const handleOpenNewCampaign = useCallback(() => {
    setNewCampaignName("");
    setNewCampaignType("WhatsApp");
    setShowNewCampaignModal(true);
  }, []);

  const handleCreateCampaign = useCallback(() => {
    const name = newCampaignName.trim() || `Campaña ${campaigns.length + 1}`;
    const newCampaign = makeDefaultCampaign(name, newCampaignType);
    setCampaigns(prev => [...prev, newCampaign]);
    // Select the new campaign (which also loads its body, prep, etc.)
    setSelectedCampaignId(newCampaign.id);
    setBody(newCampaign.body);
    setPrep(newCampaign.prep);
    setCampaignStatus(newCampaign.status);
    setReadyToSend(newCampaign.readyToSend);
    setAiSuggestions(newCampaign.aiSuggestions);
    setActiveSuggestionIndex(newCampaign.activeSuggestionIndex);
    setAudience(NO_AUDIENCE);
    setTone("lujo");
    setShowNewCampaignModal(false);
    console.log("[Campaigns] New campaign created:", newCampaign.id, newCampaign.name, "mode:", newCampaign.mode);
    showToast(`✅ Campaña "${name}" creada`);
  }, [newCampaignName, newCampaignType, campaigns.length, showToast]);

  /* ── Audience Selector handlers ── */
  const handleOpenAudienceModal = useCallback(() => {
    setPendingSegments(audience.segments);
    setShowAudienceModal(true);
  }, [audience.segments]);

  const handleToggleSegment = useCallback((segmentId: string) => {
    setPendingSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(s => s !== segmentId)
        : [...prev, segmentId]
    );
  }, []);

  const handleSaveAudience = useCallback(() => {
    const newAudience = pendingSegments.length > 0 ? computeAudience(pendingSegments, savedAudiences) : NO_AUDIENCE;
    setAudience(newAudience);
    // Immediately persist to campaigns array
    setCampaigns(prev => prev.map(c => {
      if (c.id !== selectedCampaignIdRef.current) return c;
      return {
        ...c,
        audience: newAudience.totalContacts > 0 ? newAudience : undefined,
        updatedAt: new Date().toISOString(),
      };
    }));
    // Also sync local prep state
    setShowAudienceModal(false);
    showToast(`👥 Audiencia guardada: ${newAudience.totalContacts} contactos`);
  }, [pendingSegments, showToast]);

  /* ── Audience CRUD actions ── */
  /** Rename: shows inline input */
  const handleOpenRename = useCallback((aud: SavedAudience) => {
    setRenameTarget(aud.id);
    setRenameValue(aud.name);
    setOpenMenuAudienceId(null);
  }, []);

  const handleConfirmRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const res = await fetch("/api/audiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renameTarget, name: renameValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedAudiences(prev => prev.map(a => a.id === renameTarget ? { ...a, name: renameValue.trim() } : a));
        showToast(`✅ Audiencia renombrada a "${renameValue.trim()}"`);
      } else throw new Error(data.error);
    } catch (err) {
      showToast(`❌ Error al renombrar: ${err instanceof Error ? err.message : "Error"}`);
    }
    setRenameTarget(null);
    setRenameValue("");
  }, [renameTarget, renameValue, showToast]);

  /** Duplicate: shows inline input for new name */
  const handleOpenDuplicate = useCallback((aud: SavedAudience) => {
    setDuplicateTarget(aud.id);
    setDuplicateValue(`${aud.name} (copia)`);
    setOpenMenuAudienceId(null);
  }, []);

  const handleConfirmDuplicate = useCallback(async () => {
    if (!duplicateTarget || !duplicateValue.trim()) return;
    try {
      const res = await fetch("/api/audiences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: duplicateTarget, name: duplicateValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedAudiences(prev => [...prev, data.audience]);
        showToast(`✅ Audiencia duplicada como "${data.audience.name}"`);
      } else throw new Error(data.error);
    } catch (err) {
      showToast(`❌ Error al duplicar: ${err instanceof Error ? err.message : "Error"}`);
    }
    setDuplicateTarget(null);
    setDuplicateValue("");
  }, [duplicateTarget, duplicateValue, showToast]);

  /** Delete: prompt with internal modal then remove */
  const handleAskDeleteAudience = useCallback((audId: string) => {
    setOpenMenuAudienceId(null);
    setConfirmDeleteAudienceId(audId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const audId = confirmDeleteAudienceId;
    if (!audId) return;
    setConfirmDeleteAudienceId(null);
    try {
      const res = await fetch("/api/audiences", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: audId }),
      });
      const data = await res.json();
      if (data.ok) {
        // If the deleted audience was selected, clear it from audience & pending
        setSavedAudiences(prev => {
          const removed = prev.find(a => a.id === audId);
          if (removed) {
            // Check if any campaign was using this audience
            setAudience(prevAud => {
              if (prevAud.segments.includes(audId)) {
                const newSegments = prevAud.segments.filter(s => s !== audId);
                if (newSegments.length === 0) return NO_AUDIENCE;
                return { ...prevAud, segments: newSegments };
              }
              return prevAud;
            });
            setPendingSegments(prev => prev.filter(s => s !== audId));
          }
          return prev.filter(a => a.id !== audId);
        });
        showToast("🗑️ Audiencia eliminada");
      } else throw new Error(data.error);
    } catch (err) {
      showToast(`❌ Error al eliminar: ${err instanceof Error ? err.message : "Error"}`);
    }
  }, [confirmDeleteAudienceId, showToast]);

  /* ── Computed validation for save button ── */
  const prepAllChecksOk = useMemo(() => {
    const c1 = audience.totalContacts > 0;
    const c2 = body.trim().length >= 20;
    const c3 = isSocial || userConfirmedReview;
    return c1 && c2 && c3;
  }, [audience.totalContacts, body, isSocial, userConfirmedReview]);

  /* ── Save preparation ── */
  const handleSavePrep = () => {
    if (!prepAllChecksOk) {
      const missing: string[] = [];
      if (audience.totalContacts === 0) missing.push("audiencia");
      if (body.trim().length < 20) missing.push("texto (mín. 20 caracteres)");
      if (!isSocial && !userConfirmedReview) missing.push("confirmación humana");
      showToast(`⚠️ Completa todos los requisitos: ${missing.join(", ")}`);
      return;
    }
    if (prep.sendNow) {
      // Enviar ahora: guarda como "prepared" y readyToSend = true
      const newStatus: CampaignStatus = "prepared";
      setCampaignStatus(newStatus);
      setReadyToSend(true);
      saveCurrentCampaign({ status: newStatus, readyToSend: true, prep: { ...prep, fecha: "", hora: "" } });
      setShowPrepModal(false);
      showToast("✅ Campaña preparada. Presiona 'Enviar' para enviar a tu audiencia.");
    } else {
      // Programar envío: requiere fecha y hora
      if (!prep.fecha || !prep.hora) {
        showToast("⚠️ Selecciona fecha y hora para programar el envío");
        return;
      }
      const newStatus: CampaignStatus = "scheduled";
      setCampaignStatus(newStatus);
      saveCurrentCampaign({ status: newStatus });
      setShowPrepModal(false);
      showToast(`📅 Campaña programada para ${prep.fecha} a las ${prep.hora}`);
    }
  };

  /* ── Cancel scheduled campaign ── */
  const handleCancelScheduled = useCallback(() => {
    setCampaignStatus("prepared");
    setReadyToSend(true);
    setPrep(p => ({ ...p, fecha: "", hora: "", sendNow: true }));
    saveCurrentCampaign({ status: "prepared", readyToSend: true, prep: { ...prep, fecha: "", hora: "", sendNow: true } });
    setShowPrepModal(false);
    showToast("✅ Envío programado cancelado. La campaña vuelve a estado Preparada.");
  }, [prep, saveCurrentCampaign, showToast]);

  /* ── Hero action button (contextual) ── */
  const handleHeroAction = useCallback(() => {
    if (readiness.status === "prepared") {
      setShowPrepModal(true);
      return;
    }
    if (!readiness.hasAudience) {
      handleOpenAudienceModal();
      return;
    }
    if (!readiness.hasText) {
      textareaRef.current?.focus();
      showToast("✍️ Escribe el mensaje de la campaña antes de preparar.");
      return;
    }
    // ready_to_prepare — open prep modal
    setShowPrepModal(true);
  }, [readiness, handleOpenAudienceModal, showToast]);

  /* ── Send campaign (real WhatsApp) ── */
  const handleSendCampaign = useCallback(async () => {
    if (sendState === "loading") return;
    if (!readyToSend || campaignStatus !== "prepared") {
      showToast("⚠️ Completa la preparación antes de enviar");
      return;
    }
    // Double confirm for safety
    if (!window.confirm("¿Estás segura de enviar esta campaña a toda la audiencia?\n\nEsta acción no se puede deshacer.")) return;

    setSendState("loading");
    setSendError(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      setSendState("success");
      setCampaignStatus("sent_demo");
      setReadyToSend(false);
      saveCurrentCampaign({ status: "sent_demo", readyToSend: false });
      showToast("📨 Campaña enviada exitosamente");
      setTimeout(() => setSendState("idle"), 4000);
    } catch (err) {
      setSendState("error");
      const message = err instanceof Error ? err.message : "Error de conexión";
      setSendError(message);
      showToast(`❌ ${message}`);
    }
  }, [sendState, readyToSend, campaignStatus, saveCurrentCampaign, showToast]);

  /* ── CSV File Import ── */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      showToast("❌ El archivo debe tener al menos un encabezado y un contacto");
      return;
    }

    // Parse header to find name and phone columns
    const header = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
    const nameIdx = header.findIndex((h) => ["nombre", "name", "firstname", "first_name", "cliente", "contacto"].includes(h));
    const phoneIdx = header.findIndex((h) => ["telefono", "teléfono", "phone", "celular", "movil", "móvil", "whatsapp", "cel"].includes(h));

    if (phoneIdx === -1) {
      showToast("❌ No se encontró columna de teléfono. Busca: teléfono, phone, whatsapp");
      return;
    }

    const contacts: ImportedContact[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;\t]/);
      const name = nameIdx >= 0 ? (cols[nameIdx]?.trim() || "") : "";
      const phone = (cols[phoneIdx]?.trim() || "").replace(/[^\d+]/g, "");
      if (phone) {
        contacts.push({ name, phone });
      }
    }

    if (contacts.length === 0) {
      showToast("❌ No se encontraron contactos válidos en el archivo");
      return;
    }

    setImportPreview(contacts);
    setImportFileName(file.name);
    setImportAudienceName(file.name.replace(/\.(csv|xlsx|txt)$/i, ""));
    setShowImportModal(true);
  }, [showToast]);

  const handleConfirmImport = useCallback(async () => {
    if (importPreview.length === 0 || !importAudienceName.trim()) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: importAudienceName.trim(),
          contacts: importPreview,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      // Refresh audiences list
      const listRes = await fetch("/api/audiences");
      const listData = await listRes.json();
      if (listData.ok && Array.isArray(listData.audiences)) {
        setSavedAudiences(listData.audiences);
      }

      // Auto-select the new audience
      setPendingSegments([data.audience.id]);
      setShowImportModal(false);
      setImportPreview([]);
      setImportAudienceName("");
      showToast(`✅ Audiencia "${data.audience.name}" guardada (${data.audience.totalContacts} contactos)`);
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : "Error al importar"}`);
    } finally {
      setIsImporting(false);
    }
  }, [importPreview, importAudienceName, showToast]);

  /* ── AI Improve with 3 real versions ── */
  const handleGenerateCampaignAISuggestions = useCallback(() => {
    if (isGeneratingAI || aiSuggestions.length >= MAX_AI_SUGGESTIONS) return;
    setIsGeneratingAI(true);

    // Simulate slight delay for UX
    setTimeout(() => {
      const campaignName = campaignsRef.current.find(c => c.id === selectedCampaignIdRef.current)?.name || "";
      const currentBody = bodyRef.current;

      const variants = [
        versionElegante(currentBody, campaignName),
        versionCercana(currentBody, campaignName),
        versionUrgente(currentBody, campaignName),
      ];

      setAiSuggestions(variants);
      setActiveSuggestionIndex(0);
      setBody(variants[0]);
      setIsGeneratingAI(false);
      setIaGenerationsCount(prev => prev + 1); // track cost
      // Mark campaign as ai mode and persist the suggestions
      saveCurrentCampaign({
        mode: "ai",
        aiSuggestions: variants,
        activeSuggestionIndex: 0,
        body: variants[0],
      });
      showToast("✨ 3 versiones generadas: Elegante · Cercana · Urgente");
    }, 400);
  }, [isGeneratingAI, aiSuggestions.length, saveCurrentCampaign, showToast]);

  const handlePrevSuggestion = useCallback(() => {
    setActiveSuggestionIndex((prev) => {
      const next = Math.max(0, prev - 1);
      setBody(aiSuggestions[next]);
      return next;
    });
  }, [aiSuggestions]);

  const handleNextSuggestion = useCallback(() => {
    setActiveSuggestionIndex((prev) => {
      const next = Math.min(aiSuggestions.length - 1, prev + 1);
      setBody(aiSuggestions[next]);
      return next;
    });
  }, [aiSuggestions]);

  return (
    <AppShell>
      <div className={styles.campaignsWrap}>
        <div className={styles.campaignsPage}>

          {/* ═══ LEFT — Sidebar ═══ */}
          <div className={styles.sidebarCol}>
            <div className={styles.narrativesPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.headerTop}>
                  <div className={styles.sidebarLogoWrap}><span>CM</span></div>
                  <span className={styles.campaignsHeader}>Campañas</span>
                  <button className={styles.addButton} type="button" title="Crear campaña" onClick={handleOpenNewCampaign}>+</button>
                </div>
              </div>
            </div>

              {/* Campaign list — scrollable */}
              <div className={styles.campaignListScroll}>
                {activeCampaigns.map(c => {
                  const isScheduled = (c.status === "scheduled") || (!!c.prep.fecha && !!c.prep.hora && !c.prep.sendNow);
                  return (
                  <div key={c.id}
                    className={`${styles.campaignCard} ${selectedCampaignId === c.id ? styles.campaignCardActive : styles.campaignCardInactive} ${isScheduled ? styles.campaignCardScheduled : ""}`}
                    data-selected={selectedCampaignId === c.id ? "true" : undefined}
                    style={{position:"relative", cursor:"pointer"}}
                    onClick={() => handleSelectCampaign(c.id)}>
                    <div className={styles.campaignCardTop}>
                      <span className={styles.campaignCardName}>{c.name}</span>
                      <span className={styles.campaignCardStatus} data-status={c.status}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <div className={styles.campaignCardDesc} suppressHydrationWarning>
                      {(() => {
                        const isScheduled = (c.status === "scheduled") || (!!c.prep.fecha && !!c.prep.hora && !c.prep.sendNow);
                        if (isScheduled) {
                          const d = c.prep.fecha && c.prep.hora ? new Date(`${c.prep.fecha}T${c.prep.hora}`) : null;
                          if (d) {
                            const dateStr = d.toLocaleDateString();
                            const timeStr = d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
                            return <>🕒 Programada {dateStr}  {timeStr}</>;
                          }
                          return <>🕒 Programada</>;
                        }
                        const created = new Date(c.createdAt);
                        const dateStr = created.toLocaleDateString();
                        const timeStr = created.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
                        return <>Creada {dateStr}  {timeStr}</>;
                      })()}
                    </div>
                    <div className={styles.campaignCardMeta}>
                      <span>Tipo: {c.type}</span>
                    </div>
                    {c.status !== "draft" && (
                      <button type="button" title="Editar preparación"
                        onClick={(e) => { e.stopPropagation(); setShowPrepModal(true); }}
                        className={styles.editPrepButton}>
                        <PencilLine size={14} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>

            {/* Bottom-fixed block: import + KPIs */}
            <div className={styles.sidebarBottomFixed}>
              <div className={styles.importArea}
                onClick={() => fileInputRef.current?.click()}
                style={{cursor:"pointer"}}>
                <div className={styles.importIconWrap}>
                  <Upload size={20} strokeWidth={1.5} />
                </div>
                <span className={styles.importLabel}>Subir CSV / XLSX / WhatsApp list</span>
                <span className={styles.importBadge} style={{color:"#5cb85c",background:"rgba(92,184,92,0.1)"}}>Subir archivo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.txt"
                  style={{display:"none"}}
                  onChange={handleFileSelect}
                />
              </div>

              <div className={styles.leftKpiStrip}>
                <div className={styles.leftKpiCell} data-accent="true">
                  <span className={styles.leftKpiVal} data-long={audience.totalContacts > 99 ? "true" : undefined}>
                    {readiness.hasAudience ? audience.totalContacts : "0"}
                  </span>
                  <span className={styles.leftKpiLabel}>Audiencia</span>
                </div>
                <div className={styles.leftKpiCell} data-accent="true" data-compact="true">
                  <span className={styles.leftKpiVal} data-long={audience.whatsappValid > 99 ? "true" : undefined}>
                    {readiness.hasAudience ? audience.whatsappValid : "0"}
                  </span>
                  <span className={styles.leftKpiLabel}>WhatsApp</span>
                </div>
                <div className={styles.leftKpiCell} data-compact="true">
                  <span className={styles.leftKpiVal}>—</span>
                  <span className={styles.leftKpiLabel}>Respuestas</span>
                </div>
                <div className={styles.leftKpiCell} data-compact="true">
                  <span className={styles.leftKpiVal}>—</span>
                  <span className={styles.leftKpiLabel}>Reservas</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ CENTER — Editor ═══ */}
          <div className={styles.editorPanel}>
            <div className={styles.editorHero}>
              <div className={styles.heroCover}
                style={{backgroundImage:"url(https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=85&auto=format&fit=crop)"}} />
              <div className={styles.heroOverlay} />
              <div className={styles.campaignHeroContent}>
                <div className={styles.heroTextGroup}>
                  <input className={styles.heroTitle} value={currentCampaign.name} readOnly />
                  <div className={styles.headerMeta}>
                    <div className={styles.heroMetaRow}>
                      <span className={styles.heroMetaItem}>
                        Canal:{' '}
                        <span className={styles.heroMetaVal}>
                          {CANALES_SOCIAL.includes(prep.canal) ? `${prep.canal} (Próximamente)` : prep.canal || "Sin definir"}
                        </span>
                      </span>
                      <span className={styles.heroMetaItem}>
                        Audiencia:{' '}
                        <span className={styles.heroMetaVal}>
                          {selectedAudienceName || "Sin seleccionar"}
                        </span>
                      </span>
                    </div>
                    <div className={styles.heroMetaRow}>
                      <span className={styles.heroMetaItem}>
                        Campaña:{' '}
                        <span className={styles.heroMetaVal}>{currentCampaign.name}</span>
                      </span>
                    </div>
                    <div className={styles.heroMetaRow}>
                      <span className={styles.heroMetaItem}>
                        Fecha:{' '}
                        <span className={styles.heroMetaVal}>
                          {prep.fecha && !prep.sendNow ? prep.fecha : "Hoy"}
                        </span>
                      </span>
                      <span className={styles.heroMetaItem}>
                        Hora:{' '}
                        <span className={styles.heroMetaVal}>
                          {prep.hora && !prep.sendNow ? prep.hora : "Ahora"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.heroActions}>
                  {/* Botón principal: Preparar envío */}
                  <button className={styles.scheduleButton} type="button"
                    onClick={handleHeroAction}>
                    <Send size={12} strokeWidth={1.8} />
                    <span>{heroBtnLabel}</span>
                  </button>

                  {/* Botón Enviar — gris cuando bloqueado, dorado cuando listo */}
                  <button className={styles.scheduleButton} type="button"
                    style={{
                      background: sendState === "error"
                        ? "linear-gradient(135deg,#ef4444,#dc2626)"
                        : sendState === "success"
                          ? "linear-gradient(135deg,#22c55e,#16a34a)"
                          : sendState === "loading"
                            ? "linear-gradient(135deg,#3b82f6,#2563eb)"
                            : readyToSend && campaignStatus === "prepared"
                              ? "linear-gradient(135deg,#d4a017,#f5c842)" /* Gold when ready */
                              : "linear-gradient(135deg,#b0b0b0,#888888)", /* Gray when blocked */
                      cursor: sendState === "loading" ? "wait" : readyToSend && campaignStatus === "prepared" ? "pointer" : "not-allowed",
                      opacity: sendState === "loading" ? 0.7 : readyToSend ? 1 : 0.6,
                    }}
                    onClick={readyToSend && campaignStatus === "prepared" && sendState !== "loading" ? handleSendCampaign : undefined}
                    disabled={sendState === "loading" || !readyToSend || campaignStatus !== "prepared"}
                    title={!readyToSend ? "Primero completa la preparación del envío" : "Enviar campaña"}>

                    {sendState === "loading" ? (
                      <Loader2 size={12} strokeWidth={1.8} style={{animation:"spin 1s linear infinite"}} />
                    ) : sendState === "success" ? (
                      <CheckCircle size={12} strokeWidth={1.8} />
                    ) : sendState === "error" ? (
                      <X size={12} strokeWidth={1.8} />
                    ) : (
                      <Send size={12} strokeWidth={1.8} />
                    )}

                    <span>{
                      sendState === "loading" ? "Enviando..."
                      : sendState === "success" ? "¡Enviado! 📨"
                      : sendState === "error" ? "Error reintentar"
                      : "Enviar"
                    }</span>
                  </button>
                  {sendError && sendState === "error" && (
                    <div style={{fontSize:11,color:"#ef4444",marginTop:4}}>{sendError}</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.editorCard}>
              <div className={styles.messageBox}>
                <div className={styles.editorSurface}>
                  <textarea
                    ref={textareaRef}
                    className={styles.editorTextarea}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={{fontSize:fontSizes[fontIdx]}}
                    placeholder="Escribe tu mensaje aquí..."
                  />

                  {/* AI suggestion pill control */}
                  <div className={styles.editorSuggestionControl}>
                    <button
                      type="button"
                      className={styles.editorSuggestionBtn}
                      onClick={handlePrevSuggestion}
                      disabled={aiSuggestions.length === 0 || activeSuggestionIndex === 0}
                      title="Sugerencia anterior"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className={styles.editorSuggestionCounter}>
                      {aiSuggestions.length > 0
                        ? `${activeSuggestionIndex + 1} / ${aiSuggestions.length}`
                    : "Sugerencias 0/3"}
                    </span>
                    <button
                      type="button"
                      className={styles.editorSuggestionBtn}
                      onClick={handleNextSuggestion}
                      disabled={aiSuggestions.length === 0 || activeSuggestionIndex === aiSuggestions.length - 1}
                      title="Siguiente sugerencia"
                    >
                      <ChevronRight size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.editorIaGenerateBtn}
                      onClick={handleGenerateCampaignAISuggestions}
                      disabled={isGeneratingAI || aiSuggestions.length >= MAX_AI_SUGGESTIONS}
                      title="Generar 3 sugerencias con IA"
                    >
                      {isGeneratingAI ? (
                        <Loader2 size={14} className={styles.editorAiSpin} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      Generar IA
                    </button>
                  </div>

                  {/* Emoji popover */}
                  {showEmoji && (
                    <div className={styles.editorAccentPopover}
                      onMouseLeave={() => setShowEmoji(false)}>
                      {QUICK_EMOJIS.map((emoji) => (
                        <button key={emoji} className={styles.editorAccentButton}
                          onClick={() => insertEmoji(emoji)} type="button">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ TOOLBAR (fuera de editorCard — bloque independiente) ═══ */}
            <div className={styles.editorToolbar}>
              {/* Left group: emoji, font size */}
              <div className={styles.editorActionGroup}>
                <button className={styles.editorActionButton}
                  onClick={() => setShowEmoji(!showEmoji)}
                  type="button" title="Emoji"
                  data-active={showEmoji ? "true" : undefined}>
                  <SmilePlus size={16} strokeWidth={1.8} />
                  <span style={{fontSize:10,fontWeight:700,marginLeft:1}}>Emoji</span>
                </button>
              <span className={styles.textSizeSeparator} />
              <button className={`${styles.textSizeButton} ${fontIdx === 0 ? styles.textSizeButtonActive : ""}`}
                onClick={() => setFontIdx(0)} type="button" title="Tamaño normal">
                A
              </button>
              <button className={`${styles.textSizeButton} ${fontIdx === 1 ? styles.textSizeButtonActive : ""}`}
                onClick={() => setFontIdx(1)} type="button" title="Texto más grande">
                A+
              </button>
            </div>

            {/* Center group: tone, templates */}
            <div className={styles.editorModeInline}>
              <div className={styles.actionSplitRow}>
                <button className={styles.iaToggleButton}
                  type="button"
                  onClick={() => {
                    const idx = TONES.findIndex(t => t.key === tone);
                    const next = TONES[(idx + 1) % TONES.length].key;
                    setTone(next);
                    setBody(applyTone(body, next));
                    showToast(`🎭 Tono: ${TONES.find(t => t.key === next)?.label}`);
                  }}
                  title="Cambiar tono">
                  <Palette size={12} strokeWidth={1.8} />
                  {TONES.find(t => t.key === tone)?.label || "Tono"}
                </button>
                <button className={styles.iaToggleButton} type="button"
                  onClick={() => { setBody(instagramVersion(body, currentCampaign.name)); showToast("📸 Formato Instagram aplicado"); }}
                  title="Formato Instagram con hashtags">
                  <Camera size={12} strokeWidth={1.8} />
                  Instagram
                </button>
                <button className={styles.iaToggleButton} type="button"
                  onClick={() => { setBody(whatsappVersion(body, currentCampaign.name)); showToast("💬 Formato WhatsApp aplicado"); }}
                  title="Formato WhatsApp con variables">
                  <MessageSquareText size={12} strokeWidth={1.8} />
                  WhatsApp
                </button>
                <button className={styles.iaToggleButton} type="button"
                  onClick={() => { setBody(newIdeaText(currentCampaign.name, body)); showToast("💡 Nueva idea generada"); }}
                  title="Generar nueva idea">
                  <Lightbulb size={12} strokeWidth={1.8} />
                  Nueva idea
                </button>
              </div>
            </div>

            {/* Right group: copy */}
            <div className={styles.editorActionGroup}>
              <button className={styles.editorActionButton} type="button"
                onClick={handleCopy}
                title="Copiar al portapapeles"
                style={{gap: 4}}>
                <ClipboardCopy size={14} strokeWidth={1.8} />
                <span style={{color: copied ? "#5cb85c" : undefined, fontSize: 11, fontWeight: 700}}>
                  {copied ? "Copiado ✓" : "Copiar"}
                </span>
              </button>
            </div>
          </div>
          </div>

          {/* ═══ RIGHT — Readiness + Audience panel ═══ */}
          <div className={styles.sideRail}>
            {/* Month KPIs — arriba */}
            <div className={styles.monthKpiPanel}>
              <h4 className={styles.summaryTitle}>ESTE MES</h4>
              <div className={styles.monthKpiGrid}>
                <div className={styles.monthKpiCard}>
                  <div className={styles.monthKpiIcon} style={{ background: "rgba(124,92,255,0.10)", color: "#7c5cff" }}>
                    <Send size={11} strokeWidth={2.2} />
                  </div>
                  <div className={styles.monthKpiInfo}>
                    <span className={styles.monthKpiValue}>{monthKpis.campaignsThisMonth}</span>
                    <span className={styles.monthKpiLabel}>Campañas</span>
                  </div>
                </div>
                <div className={styles.monthKpiCard}>
                  <div className={styles.monthKpiIcon} style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}>
                    <Users size={11} strokeWidth={2.2} />
                  </div>
                  <div className={styles.monthKpiInfo}>
                    <span className={styles.monthKpiValue}>{monthKpis.totalSent.toLocaleString()}</span>
                    <span className={styles.monthKpiLabel}>Enviadas</span>
                  </div>
                </div>
                <div className={styles.monthKpiCard}>
                  <div className={styles.monthKpiIcon} style={{ background: "rgba(59,130,246,0.10)", color: "#2563eb" }}>
                    <MessageSquareText size={11} strokeWidth={2.2} />
                  </div>
                  <div className={styles.monthKpiInfo}>
                    <span className={styles.monthKpiValue}>{monthKpis.totalReplies.toLocaleString()}</span>
                    <span className={styles.monthKpiLabel}>Respuestas</span>
                  </div>
                </div>
                <div className={styles.monthKpiCard}>
                  <div className={styles.monthKpiIcon} style={{ background: "rgba(234,179,8,0.12)", color: "#a16207" }}>
                    <Phone size={11} strokeWidth={2.2} />
                  </div>
                  <div className={styles.monthKpiInfo}>
                    <span className={styles.monthKpiValue}>{monthKpis.totalBookings.toLocaleString()}</span>
                    <span className={styles.monthKpiLabel}>Reservas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary — abajo */}
            <div className={styles.summaryPanel}>
              <h4 className={styles.summaryTitle}>RESUMEN</h4>

              {/* Estado */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Estado</span>
                <span className={styles.summaryStatus}>
                  {readiness.status === "prepared"
                    ? readyToSend
                      ? "Lista para enviar"
                      : "Preparada"
                    : !readiness.hasText
                      ? "Falta texto"
                      : !readiness.hasAudience
                        ? "Falta audiencia"
                        : !readiness.hasChannel
                          ? "Falta canal"
                          : "Lista para preparar"}
                </span>
              </div>

              {/* Progress bar */}
              <div className={styles.readinessProgressWrap}>
                <div className={styles.readinessProgressTrack}>
                  <div className={styles.readinessProgressBar}
                    style={{width:`${readiness.score}%`}} />
                </div>
                <span className={styles.readinessProgressLabel}>{readiness.score}%</span>
              </div>

              <div className={styles.summaryDivider} />

              {/* Checklist */}
              <div className={styles.readinessChecklist}>
                <div className={styles.readinessCheckItem}>
                  <span className={styles.readinessCheckIcon} data-ok={readiness.hasText ? "true" : undefined}>
                    {readiness.hasText ? "✓" : "□"}
                  </span>
                  <span className={styles.readinessCheckLabel}>Texto listo</span>
                </div>
                <div className={styles.readinessCheckItem}>
                  <span className={styles.readinessCheckIcon} data-ok={readiness.hasAudience ? "true" : undefined}>
                    {readiness.hasAudience ? "✓" : "□"}
                  </span>
                  <span className={styles.readinessCheckLabel}>Audiencia seleccionada</span>
                </div>
                <div className={styles.readinessCheckItem}>
                  <span className={styles.readinessCheckIcon} data-ok={readiness.hasChannel ? "true" : undefined}>
                    {readiness.hasChannel ? "✓" : "□"}
                  </span>
                  <span className={styles.readinessCheckLabel}>Canal definido</span>
                </div>
                <div className={styles.readinessCheckItem} data-optional="true">
                  <span className={styles.readinessCheckIcon} data-ok={readiness.hasSchedule ? "true" : undefined}>
                    {readiness.hasSchedule ? "✓" : "○"}
                  </span>
                  <span className={styles.readinessCheckLabel}>Programación opcional</span>
                </div>
              </div>

              <div className={styles.summaryDivider} />

              {/* Audiencia section */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Audiencia</span>

                {hasAudience ? (
                  <div className={styles.readinessAudienceInfo}>
                    {selectedAudienceName && (
                      <span className={styles.audienceNameTag}>{selectedAudienceName}</span>
                    )}
                    <span className={styles.audienceNameCount}>{audience.totalContacts} contacto{audience.totalContacts !== 1 ? "s" : ""}</span>
                    <span className={styles.readinessAudienceSub}>WhatsApp válido: {audience.whatsappValid}</span>
                  </div>
                ) : (
                  <span className={styles.readinessAudienceEmpty}>
                    Sin audiencia seleccionada
                  </span>
                )}
              </div>

              <button type="button"
                className={styles.audienceSelectBtn}
                onClick={handleOpenAudienceModal}>
                <UserCheck size={13} strokeWidth={1.8} />
                {hasAudience ? "Editar audiencia" : "Seleccionar audiencia"}
              </button>

              <div className={styles.summaryDivider} />

              {/* Resultado */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Resultado</span>
                <span className={styles.summaryValue}>
                  {campaignStatus === "sent_demo"
                    ? "Enviado"
                    : readiness.status === "prepared" && readyToSend
                      ? "Lista para enviar"
                      : readiness.status === "prepared"
                        ? "Preparado"
                        : "Pendiente de preparación"}
                </span>
              </div>
            </div>

            {/* ═══ Costos de Campaña ═══ */}
            <div className={styles.costPanel}>
              <h4 className={styles.summaryTitle}>COSTOS</h4>
              <div className={styles.costGrid}>
                <div className={styles.costRow}>
                  <span className={styles.costLabel}>🧠 Gen. IA</span>
                  <div className={styles.costRight}>
                    <span className={styles.costValue}>{iaGenerationsCount}</span>
                    <span className={styles.costEstimate}>${iaCostEst}</span>
                  </div>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costLabel}>📊 Tokens IA</span>
                  <div className={styles.costRight}>
                    <span className={styles.costValue}>{iaTokensUsed.toLocaleString()}</span>
                  </div>
                </div>
                <div className={styles.costRow}>
                  <span className={styles.costLabel}>💬 Msgs WA</span>
                  <div className={styles.costRight}>
                    <span className={styles.costValue}>{waMessagesSent}</span>
                    <span className={styles.costEstimate}>${waCostEst}</span>
                  </div>
                </div>
                <div className={styles.costDivider} />
                <div className={styles.costRow} style={{ fontWeight: 800 }}>
                  <span className={styles.costLabel}>💰 Total mes</span>
                  <span className={styles.costValue}>${totalCostEst}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MODAL — Preparar envío (SaaS premium)
          ════════════════════════════════════════════ */}
      {showPrepModal && (
        <div className={styles.prepOverlay}
          onClick={() => setShowPrepModal(false)}>
          <div className={styles.prepRoot}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.prepHeader}>
              <div className={styles.prepHeaderLeft}>
                <div className={styles.prepHeaderIcon}>
                  <Send size={14} strokeWidth={2} />
                </div>
                <div>
                  <h2 className={styles.prepTitle}>{modalTitle}</h2>
                  <p className={styles.prepSub}>
                    {isScheduledCampaign
                      ? ("Esta campaña será enviada el " + prep.fecha + " a las " + prep.hora)
                      : prep.sendNow
                        ? "Configura el canal y envía la campaña inmediatamente"
                        : "Configura el canal, horario y requisitos de tu campaña"}</p>
                </div>
              </div>
              <button className={styles.prepHeaderClose}
                onClick={() => setShowPrepModal(false)} type="button">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body — 2-column grid */}
            <div className={styles.prepBody}>

              {/* Canal */}
              <div className={styles.prepField}>
                <div className={styles.prepFieldLabel}>
                  <Radio size={12} strokeWidth={2.2} />
                  <span>Canal de envío</span>
                </div>
                <div className={styles.prepChips}>
                  {ALL_CANALES.map(c => {
                    const isDisabled = CANALES_SOCIAL.includes(c);
                    return (
                      <button key={c}
                        className={`${styles.prepChip} ${prep.canal === c ? styles.prepChipActive : ""} ${isDisabled ? styles.prepChipDisabled : ""}`}
                        onClick={() => { if (!isDisabled) setPrep(p => ({ ...p, canal: c })); }}
                        title={isDisabled ? "Próximamente" : c}
                        type="button"
                        disabled={isDisabled}>
                        <span className={styles.prepChipDot} data-active={prep.canal === c ? "true" : undefined} />
                        {c}
                        {isDisabled && <span className={styles.prepComingSoon}>Próximamente</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modo de envío: Ahora vs Programado */}
              <div className={styles.prepField}>
                <div className={styles.prepFieldLabel}>
                  <Radio size={12} strokeWidth={2.2} />
                  <span>Modo de envío</span>
                </div>
                <div className={styles.prepChips}>
                  {["Enviar ahora", "Programar envío"].map(m => (
                    <button key={m}
                      className={`${styles.prepChip} ${(prep.sendNow === true && m === "Enviar ahora") || (prep.sendNow === false && m === "Programar envío") ? styles.prepChipActive : ""}`}
                      onClick={() => setPrep(p => ({ ...p, sendNow: m === "Enviar ahora" }))}
                      type="button">
                      <span className={styles.prepChipDot} data-active={(prep.sendNow === true && m === "Enviar ahora") || (prep.sendNow === false && m === "Programar envío") ? "true" : undefined} />
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Programación — solo si "Programar envío" */}
              {prep.sendNow === false && (
                <div className={styles.prepFull}>
                  <div className={styles.prepField}>
                    <div className={styles.prepFieldLabel}>
                      <Calendar size={12} strokeWidth={2.2} />
                      <span>Programación</span>
                    </div>
                    <div className={styles.prepDateTimeRow}>
                      <div className={styles.prepDateField}>
                        <Calendar size={14} strokeWidth={1.5} className={styles.prepInputIcon} />
                        <input type="date" className={styles.prepInput}
                          value={prep.fecha}
                          onChange={e => setPrep(p => ({ ...p, fecha: e.target.value }))} />
                      </div>
                      <div className={styles.prepDateField}>
                        <Clock size={14} strokeWidth={1.5} className={styles.prepInputIcon} />
                        <input type="time" className={styles.prepInput}
                          value={prep.hora}
                          onChange={e => setPrep(p => ({ ...p, hora: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist — full width (automático, no editable) */}
              <div className={styles.prepFull}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <CheckSquare size={12} strokeWidth={2.2} />
                    <span>Checklist de preparación</span>
                  </div>
                  <div className={styles.prepCheckCard}>
                    {(() => {
                      const checks = [
                        { key: "audiencia", label: "Audiencia cargada", ok: audience.totalContacts > 0, desc: audience.totalContacts > 0 ? `${audience.totalContacts} contactos` : "Ninguna audiencia seleccionada" },
                        { key: "texto", label: "Texto listo", ok: body.trim().length >= 20, desc: body.trim().length >= 20 ? `${body.trim().length} caracteres` : "Mínimo 20 caracteres" },
                        ...(isSocial ? [] : [{ key: "template", label: "Template aprobado", ok: false, desc: "Pendiente de aprobación" }]),
                        ...(isSocial ? [] : [{ key: "confirmacion", label: "Confirmación humana", ok: userConfirmedReview, desc: userConfirmedReview ? "Revisión finalizada" : "Presiona 'Confirmar revisión'" }]),
                      ];
                      return checks.map(item => (
                        <div key={item.key} className={styles.prepCheckRow}
                          style={{cursor:"default",opacity:item.ok?1:0.7}}>
                          <div className={styles.prepCheckbox}>
                            <div className={styles.prepCheckVisual} data-checked={item.ok ? "true" : undefined}>
                              <CheckCircle size={10} strokeWidth={3} />
                            </div>
                          </div>
                          <div className={styles.prepCheckText}>
                            <span className={styles.prepCheckLabel}>{item.label}</span>
                            <span className={styles.prepCheckDesc} style={{color:item.ok?"rgba(91,84,108,0.5)":"#ef4444"}}>{item.desc}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Botón Confirmar revisión — solo si el resto de checks están OK */}
                  {!isSocial && body.trim().length >= 20 && audience.totalContacts > 0 && !userConfirmedReview && (
                    <button type="button"
                      onClick={() => setUserConfirmedReview(true)}
                      style={{
                        marginTop:10,width:"100%",height:36,
                        borderRadius:10,border:"1px solid rgba(124,92,255,0.3)",
                        background:"rgba(124,92,255,0.08)",color:"#7c5cff",
                        fontSize:13,fontWeight:700,cursor:"pointer",
                        fontFamily:"inherit",display:"flex",alignItems:"center",
                        justifyContent:"center",gap:6,
                      }}>
                      <UserCheck size={14} strokeWidth={1.8} />
                      Confirmar revisión humana
                    </button>
                  )}
                  {userConfirmedReview && (
                    <div style={{marginTop:8,fontSize:12,fontWeight:600,color:"#5cb85c",textAlign:"center"}}>
                      ✓ Revisión confirmada
                    </div>
                  )}
                </div>
              </div>

              {/* Note — full width */}
              <div className={styles.prepFull}>
                <div className={styles.prepNote}>
                  <AlertCircle size={12} strokeWidth={2} />
                  <p>{isSocial
                    ? "Preparación local. La IA ayuda a generar el texto, pero no se publica automáticamente en redes."
                    : prep.sendNow
                      ? "📨 La campaña se enviará inmediatamente a la audiencia seleccionada."
                      : "📅 La campaña se programará y enviará automáticamente en la fecha indicada."}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className={styles.prepFooter}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className={styles.prepBtnGhost}
                  onClick={() => setShowPrepModal(false)} type="button">Cancelar</button>
                {isScheduledCampaign && (
                  <button className={styles.prepBtnDanger}
                    onClick={handleCancelScheduled}
                    type="button">
                    Cancelar envío programado
                  </button>
                )}
              </div>
              <button className={styles.prepBtnPrimary}
                onClick={handleSavePrep}
                disabled={!prepAllChecksOk}
                style={{opacity: prepAllChecksOk ? 1 : 0.5, cursor: prepAllChecksOk ? "pointer" : "not-allowed"}}
                type="button">
                <Send size={13} strokeWidth={2} />
                {modalSaveLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL — Seleccionar audiencia (desde audiencias guardadas)
          ════════════════════════════════════════════ */}
      {showAudienceModal && (
        <div className={styles.prepOverlay}
          onClick={() => setShowAudienceModal(false)}>
          <div className={styles.prepRoot}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.prepHeader}>
              <div className={styles.prepHeaderLeft}>
                <div className={styles.prepHeaderIcon}>
                  <Users size={14} strokeWidth={2} />
                </div>
                <div>
                  <h2 className={styles.prepTitle}>Seleccionar audiencia</h2>
                  <p className={styles.prepSub}>Elige una audiencia importada para esta campaña</p>
                </div>
              </div>
              <button className={styles.prepHeaderClose}
                onClick={() => setShowAudienceModal(false)} type="button">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.prepBody}>
              <div className={styles.prepFull}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <Users size={12} strokeWidth={2.2} />
                    <span>Audiencias guardadas</span>
                  </div>
                  {savedAudiences.length === 0 ? (
                    <div style={{padding:"24px 0",textAlign:"center",color:"#888"}}>
                      <p style={{fontSize:14,fontWeight:600,marginBottom:4}}>No hay audiencias guardadas</p>
                      <p style={{fontSize:12}}>Sube un CSV o XLSX desde el panel lateral para crear una audiencia.</p>
                    </div>
                  ) : (
                    <div className={styles.audienceSegmentList}>
                      {savedAudiences.map((aud) => {
                        const checked = pendingSegments.includes(aud.id);
                        const isRenaming = renameTarget === aud.id;
                        const isDuplicating = duplicateTarget === aud.id;
                        return (
                          <div key={aud.id} style={{position:"relative"}}>
                            {/* Rename inline input */}
                            {isRenaming ? (
                              <div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0"}}>
                                <input type="text"
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  autoFocus
                                  onKeyDown={e => { if (e.key === "Enter") handleConfirmRename(); if (e.key === "Escape") setRenameTarget(null); }}
                                  style={{
                                    flex:1,padding:"6px 10px",borderRadius:8,
                                    border:"1px solid rgba(124,92,255,0.4)",fontSize:13,
                                    fontWeight:600,color:"#1e0a3c",background:"#fff",
                                    outline:"none",fontFamily:"inherit",
                                  }}
                                />
                                <button onClick={handleConfirmRename}
                                  style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#7c5cff",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                                  Guardar
                                </button>
                                <button onClick={() => setRenameTarget(null)}
                                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid rgba(200,180,240,0.5)",background:"#fff",color:"#888",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                                  Cancelar
                                </button>
                              </div>
                            ) : isDuplicating ? (
                              <div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0"}}>
                                <input type="text"
                                  value={duplicateValue}
                                  onChange={e => setDuplicateValue(e.target.value)}
                                  autoFocus
                                  onKeyDown={e => { if (e.key === "Enter") handleConfirmDuplicate(); if (e.key === "Escape") setDuplicateTarget(null); }}
                                  style={{
                                    flex:1,padding:"6px 10px",borderRadius:8,
                                    border:"1px solid rgba(124,92,255,0.4)",fontSize:13,
                                    fontWeight:600,color:"#1e0a3c",background:"#fff",
                                    outline:"none",fontFamily:"inherit",
                                  }}
                                />
                                <button onClick={handleConfirmDuplicate}
                                  style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#7c5cff",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                                  Duplicar
                                </button>
                                <button onClick={() => setDuplicateTarget(null)}
                                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid rgba(200,180,240,0.5)",background:"#fff",color:"#888",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <label className={styles.audienceSegmentRow}
                                data-checked={checked ? "true" : undefined}
                                onClick={() => handleToggleSegment(aud.id)}>
                                <div className={styles.prepCheckbox}>
                                  <input type="checkbox" checked={checked} readOnly />
                                  <div className={styles.prepCheckVisual} data-checked={checked ? "true" : undefined}>
                                    <CheckCircle size={10} strokeWidth={3} />
                                  </div>
                                </div>
                                <div className={styles.audienceSegmentInfo}>
                                  <span className={styles.audienceSegmentLabel}>{aud.name}</span>
                                  <span className={styles.audienceSegmentCount}>
                                    {aud.totalContacts} contactos · {aud.validWhatsapp} WhatsApp válido
                                  </span>
                                </div>
                                {/* Menu button */}
                                <div style={{marginLeft:"auto",flexShrink:0}}>
                                  <button type="button"
                                    ref={el => { if (el && openMenuAudienceId === aud.id) menuButtonRef.current = el; }}
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuAudienceId(openMenuAudienceId === aud.id ? null : aud.id); }}
                                    style={{
                                      width:28,height:28,borderRadius:8,
                                      border:"1px solid rgba(200,180,240,0.3)",
                                      background: openMenuAudienceId === aud.id ? "rgba(124,92,255,0.1)" : "transparent",
                                      color:"#7c5cff",cursor:"pointer",
                                      display:"flex",alignItems:"center",justifyContent:"center",
                                      transition:"all .12s",
                                    }}>
                                    <MoreHorizontal size={14} strokeWidth={2} />
                                  </button>
                                  {/* Dropdown menu — position:fixed so it escapes the scroll container */}
                                  {openMenuAudienceId === aud.id && (() => {
                                    const btn = menuButtonRef.current;
                                    if (!btn) return null;
                                    const r = btn.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - r.bottom - 8;
                                    const openUp = spaceBelow < 140;
                                    return (
                                      <div style={{
                                        position:"fixed",
                                        right:window.innerWidth - r.right,
                                        top: openUp ? undefined : r.bottom + 4,
                                        bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
                                        zIndex:101,
                                        background:"#fff",borderRadius:10,
                                        border:"1px solid rgba(200,180,240,0.4)",
                                        boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
                                        minWidth:150,overflow:"hidden",
                                      }}>
                                        <button type="button"
                                          onClick={(e) => { e.stopPropagation(); handleOpenRename(aud); }}
                                          style={menuItemStyle}>
                                          <Edit3 size={13} strokeWidth={1.8} />
                                          Renombrar
                                        </button>
                                        <button type="button"
                                          onClick={(e) => { e.stopPropagation(); handleOpenDuplicate(aud); }}
                                          style={menuItemStyle}>
                                          <Copy size={13} strokeWidth={1.8} />
                                          Duplicar
                                        </button>
                                        <div style={{height:1,background:"rgba(200,180,240,0.2)",margin:"2px 0"}} />
                                        <button type="button"
                                          onClick={(e) => { e.stopPropagation(); handleAskDeleteAudience(aud.id); }}
                                          style={{...menuItemStyle,color:"#ef4444"}}>
                                          <Trash2 size={13} strokeWidth={1.8} />
                                          Eliminar
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </label>
                            )}
                            {/* Close menu on outside click */}
                            {openMenuAudienceId === aud.id && (
                              <div style={{position:"fixed",inset:0,zIndex:99}}
                                onClick={() => setOpenMenuAudienceId(null)} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {pendingSegments.length > 0 && (
                <div className={styles.prepFull}>
                  <div className={styles.audienceSummaryBox}>
                    <div className={styles.audienceSummaryStat}>
                      <span className={styles.audienceSummaryVal}>{computeAudience(pendingSegments, savedAudiences).totalContacts}</span>
                      <span className={styles.audienceSummaryLabel}>Contactos seleccionados</span>
                    </div>
                    <div className={styles.audienceSummaryStat}>
                      <span className={styles.audienceSummaryVal} style={{color:"#5cb85c"}}>{computeAudience(pendingSegments, savedAudiences).whatsappValid}</span>
                      <span className={styles.audienceSummaryLabel}>WhatsApp válido</span>
                    </div>
                    <div className={styles.audienceSummaryStat}>
                      <span className={styles.audienceSummaryVal} style={{color:"#d97706"}}>{computeAudience(pendingSegments, savedAudiences).invalidWhatsapp}</span>
                      <span className={styles.audienceSummaryLabel}>Sin WhatsApp</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.prepFooter}>
              <button className={styles.prepBtnGhost}
                onClick={() => setShowAudienceModal(false)} type="button">Cancelar</button>
              <button className={styles.prepBtnPrimary}
                onClick={handleSaveAudience} type="button">
                <Users size={13} strokeWidth={2} />
                Guardar audiencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL — Importar audiencia (preview CSV)
          ════════════════════════════════════════════ */}
      {showImportModal && (
        <div className={styles.prepOverlay}
          onClick={() => { if (!isImporting) { setShowImportModal(false); setImportPreview([]); } }}>
          <div className={styles.prepRoot}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.prepHeader}>
              <div className={styles.prepHeaderLeft}>
                <div className={styles.prepHeaderIcon}>
                  <Upload size={14} strokeWidth={2} />
                </div>
                <div>
                  <h2 className={styles.prepTitle}>Importar contactos</h2>
                  <p className={styles.prepSub}>
                    {importPreview.length} contactos detectados en <strong>{importFileName}</strong>
                  </p>
                </div>
              </div>
              <button className={styles.prepHeaderClose}
                onClick={() => { if (!isImporting) { setShowImportModal(false); setImportPreview([]); } }} type="button">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.prepBody}>
              {/* Nombre de audiencia */}
              <div className={styles.prepFull}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <FileText size={12} strokeWidth={2.2} />
                    <span>Nombre de la audiencia</span>
                  </div>
                  <input
                    className={styles.prepInput}
                    style={{width:"100%",marginTop:4}}
                    type="text"
                    value={importAudienceName}
                    onChange={(e) => setImportAudienceName(e.target.value)}
                    placeholder="Ej: Clientes Balayage Marzo"
                    disabled={isImporting}
                  />
                </div>
              </div>

              {/* Preview table */}
              <div className={styles.prepFull} style={{maxHeight:300,overflowY:"auto"}}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <Eye size={12} strokeWidth={2.2} />
                    <span>Vista previa ({importPreview.length} contactos)</span>
                  </div>
                  <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                    {importPreview.slice(0, 50).map((contact, idx) => {
                      const valid = contact.phone.replace(/[^\d]/g, "").length >= 10;
                      return (
                        <div key={idx} style={{
                          display:"flex",justifyContent:"space-between",
                          padding:"6px 10px",borderRadius:8,
                          background: valid ? "rgba(92,184,92,0.05)" : "rgba(239,68,68,0.05)",
                          fontSize:13,
                        }}>
                          <span style={{fontWeight:600,color:"#1e0a3c"}}>{contact.name || "Sin nombre"}</span>
                          <span style={{color: valid ? "#5cb85c" : "#ef4444",fontWeight:600}}>
                            {contact.phone} {valid ? "✓" : "✗"}
                          </span>
                        </div>
                      );
                    })}
                    {importPreview.length > 50 && (
                      <div style={{textAlign:"center",color:"#888",fontSize:12,padding:8}}>
                        ... y {importPreview.length - 50} contactos más
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className={styles.prepFull}>
                <div className={styles.audienceSummaryBox}>
                  <div className={styles.audienceSummaryStat}>
                    <span className={styles.audienceSummaryVal}>{importPreview.length}</span>
                    <span className={styles.audienceSummaryLabel}>Contactos</span>
                  </div>
                  <div className={styles.audienceSummaryStat}>
                    <span className={styles.audienceSummaryVal} style={{color:"#5cb85c"}}>
                      {importPreview.filter((c) => c.phone.replace(/[^\d]/g, "").length >= 10).length}
                    </span>
                    <span className={styles.audienceSummaryLabel}>WhatsApp válido</span>
                  </div>
                  <div className={styles.audienceSummaryStat}>
                    <span className={styles.audienceSummaryVal} style={{color:"#d97706"}}>
                      {importPreview.filter((c) => c.phone.replace(/[^\d]/g, "").length < 10).length}
                    </span>
                    <span className={styles.audienceSummaryLabel}>Sin WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.prepFooter}>
              <button className={styles.prepBtnGhost}
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                disabled={isImporting} type="button">Cancelar</button>
              <button className={styles.prepBtnPrimary}
                onClick={handleConfirmImport}
                disabled={isImporting || !importAudienceName.trim()}
                type="button">
                {isImporting ? (
                  <Loader2 size={13} style={{animation:"spin 1s linear infinite"}} />
                ) : (
                  <Save size={13} strokeWidth={2} />
                )}
                {isImporting ? "Guardando..." : "Guardar audiencia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL — Nueva campaña
          ════════════════════════════════════════════ */}
      {showNewCampaignModal && (
        <div className={styles.prepOverlay}
          onClick={() => setShowNewCampaignModal(false)}>
          <div className={styles.prepRoot}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.prepHeader}>
              <div className={styles.prepHeaderLeft}>
                <div className={styles.prepHeaderIcon}>
                  <FileText size={14} strokeWidth={2} />
                </div>
                <div>
                  <h2 className={styles.prepTitle}>Nueva campaña</h2>
                  <p className={styles.prepSub}>Crea una campaña nueva para tu salón</p>
                </div>
              </div>
              <button className={styles.prepHeaderClose}
                onClick={() => setShowNewCampaignModal(false)} type="button">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.prepBody}>

              {/* Nombre campaña */}
              <div className={styles.prepFull}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <FileText size={12} strokeWidth={2.2} />
                    <span>Nombre campaña</span>
                  </div>
                  <input type="text" className={styles.prepInput}
                    placeholder="Ej: Reactivación Verano 2026"
                    value={newCampaignName}
                    onChange={e => setNewCampaignName(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleCreateCampaign(); }}
                    style={{width:"100%", marginTop:6}} />
                </div>
              </div>

              {/* Tipo */}
              <div className={styles.prepFull}>
                <div className={styles.prepField}>
                  <div className={styles.prepFieldLabel}>
                    <Radio size={12} strokeWidth={2.2} />
                    <span>Tipo</span>
                  </div>
                  <div className={styles.prepChips} style={{marginTop:8}}>
                    {(["WhatsApp", "Instagram", "Facebook"] as const).map(t => (
                      <button key={t}
                        className={`${styles.prepChip} ${newCampaignType === t ? styles.prepChipActive : ""}`}
                        onClick={() => setNewCampaignType(t)}
                        type="button">
                        <span className={styles.prepChipDot} data-active={newCampaignType === t ? "true" : undefined} />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className={styles.prepFooter}>
              <button className={styles.prepBtnGhost}
                onClick={() => setShowNewCampaignModal(false)} type="button">Cancelar</button>
              <button className={styles.prepBtnPrimary}
                onClick={handleCreateCampaign} type="button">
                <Send size={13} strokeWidth={2} />
                Crear campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM — Eliminar audiencia ═══ */}
      {confirmDeleteAudienceId && (
        <div className={styles.prepOverlay}
          onClick={() => setConfirmDeleteAudienceId(null)}>
          <div className={styles.confirmRoot}
            onClick={(e) => e.stopPropagation()}>

            <div className={styles.confirmHeader}>
              <div className={styles.confirmIcon}>
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <h2 className={styles.confirmTitle}>Eliminar audiencia</h2>
            </div>

            <div className={styles.confirmBody}>
              <p className={styles.confirmMessage}>
                ¿Seguro que quieres eliminar esta audiencia? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className={styles.confirmActions}>
              <button className={styles.prepBtnGhost}
                onClick={() => setConfirmDeleteAudienceId(null)} type="button">
                Cancelar
              </button>
              <button className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete} type="button">
                <Trash2 size={13} strokeWidth={2} />
                Eliminar audiencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast notification ═══ */}
      {toast && (
        <div className={styles.toastFeedback}>
          {toast}
        </div>
      )}
    </AppShell>
  );
}
