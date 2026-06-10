import type { WhatsAppInternalMessage } from "./store";
import { fuzzyIncludes, matchTextToServices, normalizeSearchText } from "../../lib/serviceMatcher";
import {
  getBookingContext,
  detectBookingSignal,
  updateBookingContext,
  updateBookingContextWithMeta,
  formatSlotSuggestions,
  formatBookingDate,
  type BookingSignal,
  type BookingAction,
} from "./booking-context";
import { runAI, hasDeepSeekConfig } from "../../../lib/ai-router";
import { buildCustomerContext } from "../../../agents/customer-context-agent";

export { hasDeepSeekConfig };

export type ConciergeIntent =
  | "balayage"
  | "color"
  | "corte"
  | "lavado"
  | "agenda"
  | "disponibilidad"
  | "precios"
  | "horarios"
  | "unknown";

export type ConciergeDecision = {
  canAutoReply: boolean;
  confidence: number;
  intent: ConciergeIntent;
  reply: string;
  safeguardReason?: string;
};

const safeguardPatterns = [
  "reclamo",
  "queja",
  "molesta",
  "molesto",
  "enojada",
  "enojado",
  "mal servicio",
  "devolucion",
  "devolución",
  "pago",
  "transferencia",
  "tarjeta",
  "abono",
  "reembolso",
  "urgente",
  "demanda",
  "alergia",
  "embarazo",
  "salud",
  "medico",
  "médico",
];

const intentRules: Array<{
  intent: ConciergeIntent;
  keywords: string[];
  confidence: number;
}> = [
  {
    intent: "balayage",
    keywords: ["balayage", "babylight", "mechas", "rubia", "rubio"],
    confidence: 0.9,
  },
  {
    intent: "color",
    keywords: ["color", "coloracion", "coloración", "tintura", "tono"],
    confidence: 0.82,
  },
  {
    intent: "agenda",
    keywords: ["agenda", "agendar", "reservar", "cita", "hora"],
    confidence: 0.8,
  },
  {
    intent: "corte",
    keywords: ["corte", "cortar", "cabello", "flequillo"],
    confidence: 0.84,
  },
  {
    intent: "lavado",
    keywords: ["lavado", "lavar", "brushing", "peinado"],
    confidence: 0.8,
  },
  {
    intent: "disponibilidad",
    keywords: ["disponible", "disponibilidad", "pueden", "tienen hora"],
    confidence: 0.78,
  },
  {
    intent: "precios",
    keywords: ["precio", "valor", "cuanto", "cuánto", "sale", "costo"],
    confidence: 0.76,
  },
  {
    intent: "horarios",
    keywords: ["horario", "abren", "cierran", "atienden"],
    confidence: 0.76,
  },
];

const serviceIntentRules = intentRules
  .filter((rule) => ["balayage", "color", "corte", "lavado"].includes(rule.intent))
  .map((rule) => ({
    id: rule.intent,
    keywords: rule.keywords,
    intent: rule.intent,
    confidence: rule.confidence,
  }));

function greetingFor() {
  return "Hola,";
}

function replyFor(intent: ConciergeIntent) {
  const greeting = greetingFor();

  if (intent === "balayage") {
    return `${greeting} que lindo. Para un balayage podemos orientarte con una referencia visual y recomendar el Ritual Signature para proteger brillo, suavidad y duracion del color. Si quieres, te ayudo a dejar una hora reservada.`;
  }

  if (intent === "color") {
    return `${greeting} perfecto. Para color trabajamos con diagnostico previo y una recomendacion personalizada de tono, cuidado y mantenimiento. Te puedo ayudar a revisar disponibilidad para tu visita.`;
  }

  if (intent === "corte") {
    return `${greeting} podemos ayudarte con corte de cabello. Revisamos el estilo que buscas y te orientamos con una recomendacion cuidada para que el resultado se sienta natural y elegante.`;
  }

  if (intent === "lavado") {
    return `${greeting} claro. Podemos ayudarte con lavado y preparar una experiencia suave, cuidada y con terminacion pulida. Si quieres, tambien podemos sumar brushing o tratamiento de hidratacion.`;
  }

  if (intent === "agenda" || intent === "disponibilidad") {
    return `${greeting} con gusto. Puedo ayudarte a coordinar una hora con el equipo y dejar la experiencia preparada con calma. Indicame que dia te acomoda y revisamos disponibilidad.`;
  }

  if (intent === "precios") {
    return `${greeting} los valores dependen del diagnostico, largo y tecnica. Para orientarte con precision, podemos revisar una referencia y proponerte la alternativa mas adecuada sin perder el acabado premium.`;
  }

  if (intent === "horarios") {
    return `${greeting} claro. Te ayudamos a coordinar dentro de los horarios disponibles del studio y a reservar una visita con el especialista adecuado.`;
  }

  return `${greeting} gracias por escribirnos. Te acompano con una respuesta breve y cuidada para avanzar con tu solicitud.`;
}

function bookingReplyFor(
  intent: ConciergeIntent,
  context: BookingSignal
): string {
  const greeting = greetingFor();
  const action = context.action ?? "new";

  // ── Cancel confirmation ──
  if (action === "cancel" && context.isConfirm) {
    return `${greeting} he cancelado tu cita. Si necesitas agendar una nueva, solo avísame.`;
  }

  // ── Cancel — ask for confirmation ──
  if (action === "cancel") {
    if (context.existingAppointmentId) {
      return `${greeting} entiendo que quieres cancelar tu cita. ¿Confirmas que deseas cancelarla?`;
    }
    return `${greeting} veo que quieres cancelar. ¿Me confirmas la cita que deseas cancelar?`;
  }

  // ── Reschedule ──
  if (action === "reschedule") {
    if (context.date && context.time && context.isConfirm) {
      const formatted = formatBookingDate(context.date);
      return `${greeting} perfecto, voy a reagendar tu cita para el ${formatted} a las ${context.time}. Dame un momento y confirmo.`;
    }
    if (context.date && !context.time) {
      const formatted = formatBookingDate(context.date);
      return `${greeting} excelente. Para reagendar al ${formatted}, ¿que horario te acomoda mejor?`;
    }
    if (context.time && !context.date) {
      return `${greeting} ok, ¿y que día te gustaría reagendar tu cita?`;
    }
    return `${greeting} claro, puedo ayudarte a cambiar tu cita. ¿Qué día y horario prefieres?`;
  }

  // User confirmed booking — move to book
  if (context.isConfirm && context.date && context.time) {
    const formatted = formatBookingDate(context.date);
    return `${greeting} perfecto, voy a reservar tu hora para el ${formatted} a las ${context.time}. Dame un momento y confirmo.`;
  }

  // We have date but still need time
  if (context.date && !context.time) {
    const formatted = formatBookingDate(context.date);
    return `${greeting} excelente. Para el ${formatted}, ¿que horario te acomoda mejor?`;
  }

  // We have time but still need date
  if (context.time && !context.date) {
    return `${greeting} ok, ¿y que dia te gustaria venir? Tenemos disponibilidad esta semana.`;
  }

  // We have service but need date
  if (context.service) {
    const serviceName = context.service.charAt(0).toUpperCase() + context.service.slice(1);
    return `${greeting} genial. ¿Que dia te gustaria agendar tu ${serviceName}?`;
  }

  // Generic: we know they want to book
  return `${greeting} con gusto te ayudo a agendar. ¿Que servicio te gustaria reservar y que dia prefieres?`;
}

export function generateConciergeDecision(
  message: WhatsAppInternalMessage
): ConciergeDecision {
  const text = normalizeSearchText(message.content);
  const safeguard = safeguardPatterns.find((pattern) => fuzzyIncludes(text, pattern));
  const greeting = greetingFor();

  if (safeguard) {
    return {
      canAutoReply: false,
      confidence: 0.25,
      intent: "unknown",
      reply: `${greeting} gracias por contarnos. Voy a dejar esto preparado para que el equipo lo revise con cuidado y te responda personalmente.`,
      safeguardReason: `sensitive:${safeguard}`,
    };
  }

  const serviceMatchId = matchTextToServices(text, serviceIntentRules)[0]?.id;
  const match =
    intentRules.find((rule) => rule.intent === serviceMatchId) ??
    intentRules.find((rule) => rule.keywords.some((keyword) => fuzzyIncludes(text, keyword)));

  if (!match) {
    return {
      canAutoReply: false,
      confidence: 0.35,
      intent: "unknown",
      reply: replyFor("unknown"),
      safeguardReason: "ambiguous",
    };
  }

  return {
    canAutoReply: match.confidence >= 0.74,
    confidence: match.confidence,
    intent: match.intent,
    reply: replyFor(match.intent),
  };
}

export type BookingDecision = {
  canAutoReply: boolean;
  confidence: number;
  reply: string;
  bookingSignal: BookingSignal;
  shouldBook: boolean;
};

export async function generateBookingConciergeDecision(
  message: WhatsAppInternalMessage
): Promise<BookingDecision> {
  const tenantId = message.tenantId;
  const context = await getBookingContext(message.conversationId, tenantId);
  const signal = detectBookingSignal(message, context);
  const prevStage = context?.stage ?? "idle";
  const text = normalizeSearchText(message.content);

  // Safety: check for safeguard keywords
  const safeguard = safeguardPatterns.find((pattern) => fuzzyIncludes(text, pattern));
  if (safeguard) {
    return {
      canAutoReply: false,
      confidence: 0.25,
      reply: `${greetingFor()} gracias por contarnos. Voy a dejar esto preparado para que el equipo lo revise con cuidado y te responda personalmente.`,
      bookingSignal: signal,
      shouldBook: false,
    };
  }

  // If negation — reset context and don't auto-reply booking
  if (
    prevStage !== "idle" &&
    signal.nextStage === "idle" &&
    signal.date === null &&
    signal.time === null &&
    signal.isConfirm === false
  ) {
    return {
      canAutoReply: false,
      confidence: 0.3,
      reply: `${greetingFor()} no hay problema, cuando quieras avisame y te ayudo con gusto.`,
      bookingSignal: signal,
      shouldBook: false,
    };
  }

  // ── Cancel action ──
  if (signal.action === "cancel") {
    await updateBookingContextWithMeta(message.conversationId, signal, tenantId);
    if (signal.isConfirm) {
      return {
        canAutoReply: true,
        confidence: 0.95,
        reply: bookingReplyFor("agenda", signal),
        bookingSignal: signal,
        shouldBook: false, // handled by webhook
      };
    }
    return {
      canAutoReply: true,
      confidence: 0.85,
      reply: bookingReplyFor("agenda", signal),
      bookingSignal: signal,
      shouldBook: false,
    };
  }

  // ── Reschedule action ──
  if (signal.action === "reschedule") {
    await updateBookingContextWithMeta(message.conversationId, signal, tenantId);
    if (signal.isConfirm && signal.date && signal.time) {
      return {
        canAutoReply: true,
        confidence: 0.95,
        reply: bookingReplyFor("agenda", signal),
        bookingSignal: signal,
        shouldBook: true, // triggers PATCH via webhook
      };
    }
    return {
      canAutoReply: true,
      confidence: 0.85,
      reply: bookingReplyFor("agenda", signal),
      bookingSignal: signal,
      shouldBook: false,
    };
  }

  // Confirmed booking — should book
  if (signal.isConfirm && signal.date && signal.time) {
    await updateBookingContextWithMeta(message.conversationId, signal, tenantId);
    return {
      canAutoReply: true,
      confidence: 0.9,
      reply: bookingReplyFor("agenda", signal),
      bookingSignal: signal,
      shouldBook: true,
    };
  }

  // Active booking flow — generate reply based on where we are
  if (
    signal.nextStage !== "idle" ||
    signal.date ||
    signal.time ||
    signal.service
  ) {
    await updateBookingContextWithMeta(message.conversationId, signal, tenantId);
    return {
      canAutoReply: true,
      confidence: 0.78,
      reply: bookingReplyFor("agenda", signal),
      bookingSignal: signal,
      shouldBook: false,
    };
  }

  // No booking signal — fall through to normal concierge
  return {
    canAutoReply: false,
    confidence: 0.3,
    reply: "",
    bookingSignal: signal,
    shouldBook: false,
  };
}

export async function generateDeepSeekConciergeReply(
  message: WhatsAppInternalMessage,
  decision: ConciergeDecision
): Promise<string> {
  // ── Inject customer memory context ──
  const memoryContext = await buildCustomerContext(message.phone);
  const augmentedPrompt = memoryContext
    ? `${memoryContext}\n\nCLIENT MESSAGE:\n${message.content}`
    : message.content;

  const result = await runAI("whatsapp_reply", augmentedPrompt, {
    intent: decision.intent,
    confidence: decision.confidence,
  });

  return result.content;
}

/**
 * Versión mejorada que inyecta conocimiento del tenant (servicios, FAQs, reglas)
 * desde Prisma para respuestas más precisas.
 * También acepta booking context opcional.
 */
export async function generateTenantAwareReply(
  message: WhatsAppInternalMessage,
  decision: ConciergeDecision,
  knowledge?: {
    services?: any[];
    faqs?: any[];
    salonProfile?: any;
    aiRules?: any;
    prompts?: any[];
  },
  bookingContext?: {
    service?: string | null;
    date?: string | null;
    time?: string | null;
    stage?: string | null;
    stylist?: string | null;
  } | null,
): Promise<string> {
  const memoryContext = await buildCustomerContext(message.phone, message.tenantId);

  // Build knowledge context block
  const knowledgeLines: string[] = [];

  if (knowledge?.salonProfile) {
    const sp = knowledge.salonProfile;
    if (sp.salonName) knowledgeLines.push(`Salón: ${sp.salonName}`);
    if (sp.address) knowledgeLines.push(`Dirección: ${sp.address}`);
    if (sp.city) knowledgeLines.push(`Ciudad: ${sp.city}`);
    if (sp.phone) knowledgeLines.push(`Teléfono: ${sp.phone}`);
    if (sp.instagram) knowledgeLines.push(`Instagram: ${sp.instagram}`);
    if (sp.shortDescription) knowledgeLines.push(`Descripción: ${sp.shortDescription}`);
    if (sp.mainPromise) knowledgeLines.push(`Promesa: ${sp.mainPromise}`);
    if (sp.brandTone) knowledgeLines.push(`Tono de marca: ${sp.brandTone}`);
  }

  if (knowledge?.services && knowledge.services.length > 0) {
    knowledgeLines.push("");
    knowledgeLines.push("SERVICIOS DISPONIBLES:");
    for (const svc of knowledge.services) {
      const priceStr = svc.priceFrom || svc.price
        ? `desde $${(svc.priceFrom || svc.price || 0).toLocaleString("es-CL")}`
        : "";
      const durationStr = svc.durationMinutes || svc.duration
        ? `${svc.durationMinutes || svc.duration} min`
        : "";
      knowledgeLines.push(
        `- ${svc.name}${priceStr ? " " + priceStr : ""}${durationStr ? " · " + durationStr : ""}`
      );
      if (svc.description) knowledgeLines.push(`  ${svc.description}`);
      if (svc.shortPitch) knowledgeLines.push(`  ${svc.shortPitch}`);
    }
  }

  if (knowledge?.aiRules && typeof knowledge.aiRules === "object") {
    const rules = knowledge.aiRules;
    knowledgeLines.push("");
    knowledgeLines.push("REGLAS DE IA:");
    if (rules.responseTone) knowledgeLines.push(`Tono: ${rules.responseTone}`);
    if (rules.forbiddenWords?.length > 0)
      knowledgeLines.push(`Palabras prohibidas: ${rules.forbiddenWords.join(", ")}`);
    if (rules.whenToSell) knowledgeLines.push(`Cuándo vender: ${rules.whenToSell}`);
    if (rules.whenNotToSell) knowledgeLines.push(`Cuándo NO vender: ${rules.whenNotToSell}`);
    if (rules.whenToAskHuman) knowledgeLines.push(`Cuándo derivar a humano: ${rules.whenToAskHuman}`);
  }

  if (knowledge?.faqs && knowledge.faqs.length > 0) {
    knowledgeLines.push("");
    knowledgeLines.push("FAQs / RESPUESTAS RÁPIDAS:");
    for (const faq of knowledge.faqs.slice(0, 5)) {
      if (faq.question && faq.answer) {
        knowledgeLines.push(`Q: ${faq.question}`);
        knowledgeLines.push(`A: ${faq.answer.substring(0, 200)}`);
      }
    }
    if (knowledge.faqs.length > 5) {
      knowledgeLines.push(`... y ${knowledge.faqs.length - 5} FAQs más`);
    }
  }

  const knowledgeBlock = knowledgeLines.length > 0
    ? `\n=== CONOCIMIENTO DEL NEGOCIO ===\n${knowledgeLines.join("\n")}\n===============================\n`
    : "";

  // ── Booking Context block ──
  const bookingLines: string[] = [];
  if (bookingContext && (bookingContext.service || bookingContext.date || bookingContext.time)) {
    bookingLines.push("");
    bookingLines.push("BOOKING CONTEXT:");
    if (bookingContext.stage) bookingLines.push(`Etapa: ${bookingContext.stage}`);
    if (bookingContext.service) bookingLines.push(`Servicio: ${bookingContext.service}`);
    if (bookingContext.date) bookingLines.push(`Fecha: ${bookingContext.date}`);
    if (bookingContext.time) bookingLines.push(`Hora: ${bookingContext.time}`);
    if (bookingContext.stylist) bookingLines.push(`Estilista: ${bookingContext.stylist}`);
  }
  const bookingBlock = bookingLines.length > 0
    ? `${bookingLines.join("\n")}\n`
    : "";

  const augmentedPrompt = [
    knowledgeBlock,
    memoryContext ? `${memoryContext}\n` : "",
    bookingBlock,
    `CLIENT MESSAGE:\n${message.content}`,
  ].filter(Boolean).join("\n");

  const result = await runAI("whatsapp_reply", augmentedPrompt, {
    intent: decision.intent,
    confidence: decision.confidence,
  });

  return result.content;
}
