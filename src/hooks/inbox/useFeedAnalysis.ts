"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────

export type FeedSuggestion = {
  id: string;
  intent: string;
  intentKeywords: string[];
  label: string;
  suggestedReply: string;
  actions: FeedAction[];
};

export type FeedAction = "insert_reply" | "ask_photo" | "schedule" | "send_reference";

export type FeedTimelineItem = {
  id: string;
  suggestion: FeedSuggestion;
  detectedKeyword: string;
  timestamp: number;
  isNew?: boolean;
  isDismissed?: boolean;
  gradientPlayed?: boolean;
};

export type FeedAnalyticsState = "idle" | "analyzing" | "ready";

export type ChipEntry = {
  originalText: string;
  type: "service" | "time" | "day" | "availability" | "photo" | "price" | "booking" | "other";
};

export type CustomerProfile = {
  phone: string;
  firstName?: string;
  displayName?: string;
  tags: string[];
  interests: string[];
  requestedServices: string[];
  uploadedAssets: string[];
  lifecycleStage: string;
};

type KnowledgeService = {
  id: string;
  name: string;
  shortPitch?: string;
  priceFrom?: number;
  durationMinutes?: number;
  keywords: string[];
  upsells?: string[];
  suggestedReply?: string;
  supportCardText?: string;
};

type SupportFeedRule = {
  id: string;
  keywords: string[];
  cardTitle: string;
  serviceId?: string;
  replyInsertable?: string;
  upsellSuggestion?: string;
  referenceImage?: string;
};

// ── Feed Suggestions ────────────────────────────────────

const feedSuggestions: FeedSuggestion[] = [
  {
    id: "balayage",
    intent: "Balayage",
    intentKeywords: ["balayage", "mechas", "iluminar", "rubio", "color claro"],
    label: "Consulta de Balayage",
    suggestedReply:
      "Sí, trabajamos balayage con diagnóstico previo. ¿Podrías enviarnos una foto con luz natural para orientarte mejor sobre el resultado y cuidado? También podemos revisar disponibilidad si quieres agendar.",
    actions: ["insert_reply", "ask_photo", "schedule"],
  },
  {
    id: "hidratacion",
    intent: "Hidratación",
    intentKeywords: ["hidratacion", "hidratación", "seco", "frizz", "tratamiento", "opaco"],
    label: "Consulta de Hidratación",
    suggestedReply:
      "Sí, tenemos un ritual de hidratación que devuelve suavidad, brillo y movimiento al cabello. Tiene una duración de 75 minutos y valor desde $35.000. ¿Te gustaría agendar una hora?",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "corte",
    intent: "Corte",
    intentKeywords: ["corte", "capas", "flequillo", "textura", "cortar"],
    label: "Consulta de Corte",
    suggestedReply:
      "Podemos ayudarte con un corte personalizado según tu textura y objetivo. Recomendamos traer referencias visuales si buscas un cambio marcado. ¿Te gustaría agendar una evaluación?",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "olaplex",
    intent: "Olaplex",
    intentKeywords: ["olaplex", "reparación", "dañado", "quimico", "químico"],
    label: "Consulta de Olaplex",
    suggestedReply:
      "Sí, trabajamos Olaplex como tratamiento reconstructor. Se recomienda después de coloración o si el cabello está dañado. ¿Quieres agregarlo a tu próximo servicio?",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "color",
    intent: "Coloración",
    intentKeywords: ["color", "coloracion", "coloración", "tinte", "pintar", "matiz"],
    label: "Consulta de Color",
    suggestedReply:
      "Trabajamos coloración personalizada con diagnóstico previo. Te recomendamos llegar con el cabello limpio y seco para una evaluación precisa. ¿Te gustaría agendar?",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "reserva",
    intent: "Reserva",
    intentKeywords: ["reserva", "disponibilidad", "agendar", "horario", "turno", "jueves", "viernes", "semana", "cupo"],
    label: "Consulta de Reserva",
    suggestedReply:
      "Claro, podemos revisar disponibilidad. ¿Qué día y horario prefieres? Si es para un servicio específico, compártenos los detalles para asignarte con la estilista ideal.",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "precio",
    intent: "Precio / Presupuesto",
    intentKeywords: ["precio", "costo", "valor", "cuanto cuesta", "cuánto cuesta", "presupuesto", "tarifa"],
    label: "Consulta de Precio",
    suggestedReply:
      "Los valores varían según diagnóstico y largo. ¿Sabes qué servicio te interesa? Podemos darte una referencia y agendar una evaluación personalizada sin compromiso.",
    actions: ["insert_reply", "schedule"],
  },
  {
    id: "foto",
    intent: "Referencia visual",
    intentKeywords: ["foto", "referencia", "ver resultado", "antes después", "antes/despues", "imagen", "inspiración"],
    label: "Solicita Referencia Visual",
    suggestedReply:
      "Claro, podemos compartirte algunas referencias de trabajos similares para que tengas una idea del resultado. ¿Te sirve que te enviemos imágenes por aquí?",
    actions: ["insert_reply", "send_reference", "ask_photo"],
  },
  {
    id: "general",
    intent: "Consulta general",
    intentKeywords: [],
    label: "Consulta general",
    suggestedReply:
      "Gracias por escribirnos. Cuéntanos más sobre lo que necesitas y te orientamos con gusto sobre servicios, precios o disponibilidad.",
    actions: ["insert_reply"],
  },
];

// ── Action Labels ───────────────────────────────────────

export const feedActionLabels: Record<FeedAction, { label: string }> = {
  insert_reply: { label: "Insertar respuesta" },
  ask_photo: { label: "Pedir foto" },
  schedule: { label: "Agendar" },
  send_reference: { label: "Enviar referencia" },
};

// ── Keyword Index ───────────────────────────────────────

function buildKeywordIndex(): Map<string, FeedSuggestion> {
  const index = new Map<string, FeedSuggestion>();
  for (const s of feedSuggestions) {
    if (s.id === "general") continue;
    for (const kw of s.intentKeywords) {
      index.set(kw.toLowerCase(), s);
    }
  }
  return index;
}

export const keywordIndex = buildKeywordIndex();

// ── Draft Builder ────────────────────────────────────────

/** Draft lines for each keyword type */
const KEYWORD_DRAFT_LINES: Record<string, string[]> = {
  balayage: ["Para Balayage podemos orientarte mejor con una foto con luz natural."],
  hidratacion: ["Sí, tenemos un ritual de hidratación que devuelve suavidad y brillo."],
  hidratación: ["Sí, tenemos un ritual de hidratación que devuelve suavidad y brillo."],
  corte: ["Podemos ayudarte con un corte personalizado según tu textura y objetivo."],
  olaplex: ["Sí, trabajamos Olaplex como tratamiento reconstructor."],
  color: ["Trabajamos coloración personalizada con diagnóstico previo."],
  coloracion: ["Trabajamos coloración personalizada con diagnóstico previo."],
  coloración: ["Trabajamos coloración personalizada con diagnóstico previo."],
  reserva: ["También podemos dejarte una hora agendada si te acomoda."],
  disponibilidad: ["Podemos revisar disponibilidad y dejarte una hora agendada."],
  precio: ["Te podemos confirmar el valor según largo, técnica y diagnóstico previo."],
  foto: ["Si puedes, envíanos una foto con luz natural para revisar tu base actual."],
  horario: ["Podemos revisar horarios disponibles para agendarte."],
};

/**
 * Build an intelligent draft from accumulated chips.
 * selectedChips = Map of lowercased keyword → { originalText, type }
 */
export function buildSmartDraft(
  selectedChips: Map<string, ChipEntry>,
  conversationContext: string,
  clientName: string
): string {
  const hasService = (id: string) =>
    [...selectedChips.values()].some(
      (c) => c.originalText.toLowerCase() === id.toLowerCase()
    );

  const hasBalayage = hasService("balayage");
  const hasColor = hasService("color") || hasService("coloracion") || hasService("coloración") || hasService("tinte");
  const hasCorte = hasService("corte") || hasService("capas") || hasService("cortar");
  const hasHidratacion = hasService("hidratacion") || hasService("hidratación") || hasService("frizz") || hasService("tratamiento");
  const hasOlaplex = hasService("olaplex");
  const hasPhoto = hasService("foto") || hasService("referencia") || hasService("imagen");
  const hasPrice = hasService("precio") || hasService("costo") || hasService("valor") || hasService("presupuesto");
  const hasBooking = hasService("reserva") || hasService("agendar") || hasService("turno") || hasService("cupo");
  const hasAvailability = hasService("disponibilidad") || hasService("horario");

  const days = ["lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado", "domingo"];
  const timeChips = [...selectedChips.values()].filter((c) => c.type === "time");
  const dayChips = [...selectedChips.values()].filter((c) => c.type === "day");
  const dayText = dayChips.length > 0 ? dayChips[0].originalText.toLowerCase() : "";
  const timeText = timeChips.length > 0 ? timeChips[0].originalText : "";

  const serviceNames: string[] = [];
  if (hasBalayage) serviceNames.push("Balayage");
  if (hasColor) serviceNames.push("coloración");
  if (hasCorte) serviceNames.push("corte");
  if (hasHidratacion) serviceNames.push("hidratación");
  if (hasOlaplex) serviceNames.push("Olaplex");

  const primaryService = serviceNames.length > 0 ? serviceNames.join(" y ") : null;

  const loweredContext = conversationContext.toLowerCase();
  const hasGreeting = loweredContext.includes("hola") || loweredContext.includes("buenas") || loweredContext.includes("saludos");
  const isFirstResponse = !hasGreeting;

  const firstName = clientName.split(" ")[0];

  const parts: string[] = [];

  if (primaryService && hasAvailability && dayText && timeText) {
    if (isFirstResponse) {
      parts.push(`Hola, ${firstName} 😊`);
    }
    parts.push(`Sí, tenemos disponibilidad para ${primaryService} este ${dayText} a las ${timeText} 😊`);
    if (hasPhoto) {
      parts.push("Para orientarte mejor, puedes enviarnos una foto con luz natural.");
    }
    if (hasPrice) {
      parts.push("Te podemos confirmar el valor según largo, técnica y diagnóstico previo.");
    }
    parts.push("¿Te gustaría que te dejemos esa hora reservada?");
    return parts.join(" ");
  }

  if (primaryService && hasAvailability) {
    parts.push(`Sí, tenemos disponibilidad para ${primaryService}.`);
    if (dayText) {
      parts[parts.length - 1] = `Sí, tenemos disponibilidad para ${primaryService} este ${dayText}.`;
    }
    if (hasPhoto) {
      parts.push("Para orientarte mejor, puedes enviarnos una foto con luz natural.");
    }
    if (hasBooking) {
      parts.push("¿Te gustaría agendar una hora?");
    }
    return parts.join(" ");
  }

  if (primaryService) {
    const serviceTips: Record<string, string> = {
      balayage: "Para Balayage podemos orientarte mejor con una foto con luz natural.",
      coloración: "Trabajamos coloración personalizada con diagnóstico previo.",
      corte: "Podemos ayudarte con un corte personalizado según tu textura y objetivo.",
      hidratación: "Sí, tenemos un ritual de hidratación que devuelve suavidad y brillo.",
      olaplex: "Sí, trabajamos Olaplex como tratamiento reconstructor.",
    };

    const tipKey = primaryService.toLowerCase();
    const tip = Object.entries(serviceTips).find(([k]) => tipKey.includes(k))?.[1];

    if (tip) parts.push(tip);
    else parts.push(`Trabajamos ${primaryService} con diagnóstico previo personalizado.`);

    if (hasPhoto) parts.push("Si puedes, envíanos una foto con luz natural para revisar tu base actual.");
    if (hasBooking) parts.push("También podemos dejarte una hora agendada si te acomoda.");
    if (hasPrice) parts.push("Te podemos confirmar el valor según largo, técnica y diagnóstico previo.");

    return parts.join(" ");
  }

  if (hasAvailability || hasBooking) {
    if (dayText && timeText) {
      parts.push(`Tenemos disponibilidad este ${dayText} a las ${timeText}.`);
      parts.push("¿Te gustaría que te dejemos esa hora reservada?");
    } else {
      parts.push("Podemos revisar disponibilidad y dejarte una hora agendada.");
    }
    return parts.join(" ");
  }

  if (hasPhoto) {
    parts.push("Si puedes, envíanos una foto con luz natural para revisar tu base actual.");
    return parts.join(" ");
  }

  if (hasPrice) {
    if (isFirstResponse) {
      parts.push(`Hola, ${firstName} 😊`);
    }
    parts.push("Te podemos confirmar el valor según largo, técnica y diagnóstico previo. ¿Sabes qué servicio te interesa?");
    return parts.join(" ");
  }

  return "";
}

// ── Time Detection ──────────────────────────────────────

export type DetectedTime = {
  timeStr: string;
  chipText: string;
  dayStr?: string;
  fullMatch: string;
};

const TIME_REGEX = /\b(\d{1,2}):(\d{2})\b/gi;
const TIME_CONNECTOR_BEFORE = /(?:a\s+las|para\s+las|las)\s+$/i;
const DAY_NAMES = [
  "lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado", "domingo",
];
const DAY_ALIASES: Record<string, string> = {
  lunes: "lunes", martes: "martes", miércoles: "miércoles", miercoles: "miércoles",
  jueves: "jueves", viernes: "viernes", sábado: "sábado", sabado: "sábado", domingo: "domingo",
};

export function detectTimes(text: string): DetectedTime[] {
  const results: DetectedTime[] = [];
  const lowered = text.toLowerCase();

  TIME_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TIME_REGEX.exec(text)) !== null) {
    const hours = match[1].padStart(2, "0");
    const minutes = match[2];
    const timeStr = `${hours}:${minutes}`;
    const fullMatch = match[0];
    const chipText = fullMatch;

    const beforeText = lowered.slice(Math.max(0, match.index - 40), match.index);
    const dayMatch = DAY_NAMES.find((day) => beforeText.includes(day));
    const dayStr = dayMatch ? DAY_ALIASES[dayMatch] : undefined;

    results.push({ timeStr, chipText, dayStr, fullMatch });
  }

  return results;
}

// ── Slot Helpers ────────────────────────────────────────

export function isTimeSlotAvailable(timeStr: string, slots: { time?: string; label?: string }[]): boolean {
  const normalizedTime = timeStr.padStart(5, "0");
  return slots.some((slot) => {
    const slotTime = slot.time?.trim().toLowerCase() ?? "";
    const slotLabel = slot.label?.trim().toLowerCase() ?? "";
    return slotTime.startsWith(normalizedTime) || slotLabel.startsWith(normalizedTime);
  });
}

export function findMatchingSlot(timeStr: string, slots: { id: string; time?: string; label?: string; stylistId: string }[]): { id: string; time?: string; label?: string; stylistId: string } | undefined {
  const normalizedTime = timeStr.padStart(5, "0");
  return slots.find((slot) => {
    const slotTime = slot.time?.trim().toLowerCase() ?? "";
    const slotLabel = slot.label?.trim().toLowerCase() ?? "";
    return slotTime.startsWith(normalizedTime) || slotLabel.startsWith(normalizedTime);
  });
}

// ── Active Feed Suggestions Detection ────────────────────

function detectActiveFeedSuggestions(
  conversationText: string,
  knowledgeServices: KnowledgeService[],
  faqs: { question: string; answer: string; keywords: string[] }[]
): FeedSuggestion[] {
  const lowered = conversationText.toLowerCase().trim();

  if (!lowered || lowered === "hola,") {
    return [];
  }

  const matched: FeedSuggestion[] = [];

  for (const suggestion of feedSuggestions) {
    if (suggestion.id === "general") continue;

    const hasMatch = suggestion.intentKeywords.some((keyword) =>
      lowered.includes(keyword.toLowerCase())
    );

    const knowledgeMatch = knowledgeServices.some(
      (service) =>
        service.keywords.some((kw) => lowered.includes(kw.toLowerCase())) &&
        suggestion.intentKeywords.some((kw) => service.keywords.includes(kw))
    );

    if (hasMatch || knowledgeMatch) {
      matched.push(suggestion);
    }
  }

  const seen = new Set<string>();
  const unique = matched.filter((s) => {
    if (seen.has(s.intent)) return false;
    seen.add(s.intent);
    return true;
  });

  if (unique.length === 0) {
    unique.push(feedSuggestions[feedSuggestions.length - 1]);
  }

  return unique;
}

// ── Hook ─────────────────────────────────────────────────

export type UseFeedAnalysisOptions = {
  onKeywordChipUpdateFeed?: (
    matchedLower: string,
    suggestion: FeedSuggestion,
    matchedKeyword: string
  ) => void;
};

export function useFeedAnalysis(
  activeId: string | number | null,
  conversationContext: string,
  activeChatName: string,
  activeChatPhone: string,
  options?: UseFeedAnalysisOptions
) {
  const { onKeywordChipUpdateFeed } = options ?? {};

  // ── State ─────────────────────────────────────────────
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [feedTimeline, setFeedTimeline] = useState<FeedTimelineItem[]>([]);
  const [feedAnalysisState, setFeedAnalysisState] = useState<FeedAnalyticsState>("idle");
  const [feedAnalysisLog, setFeedAnalysisLog] = useState<string[]>([]);
  const [feedSearch, setFeedSearch] = useState("");
  const [playedItemGradients, setPlayedItemGradients] = useState<Set<string>>(new Set());
  const [selectedChips, setSelectedChips] = useState<Map<string, ChipEntry>>(new Map());
  const selectedChipsRef = useRef<Map<string, ChipEntry>>(new Map());
  const [knowledgeServices, setKnowledgeServices] = useState<KnowledgeService[]>([]);
  const [supportFeedRules, setSupportFeedRules] = useState<SupportFeedRule[]>([]);

  // ── Refs for analysis state machine ───────────────────
  const prevActiveSuggestionsRef = useRef<FeedSuggestion[]>([]);
  const lastKeywordDetectTimeRef = useRef(0);
  const analysisTimerRef = useRef<number | null>(null);
  const typewriterTimerRef = useRef<number | null>(null);

  // ── Derived ───────────────────────────────────────────
  const activeFeedSuggestions = detectActiveFeedSuggestions(
    conversationContext,
    knowledgeServices,
    []
  );

  // ── Seed feed on conversation change ──────────────────
  // Skips the typewriter animation for initial detection
  useEffect(() => {
    if (!activeId) return;
    const suggestions = activeFeedSuggestions.filter((s) => s.id !== "general");
    if (suggestions.length === 0) return;

    const now = Date.now();
    const newItems: FeedTimelineItem[] = suggestions.map((s) => {
      const lowered = conversationContext.toLowerCase();
      const matchedKeyword =
        s.intentKeywords.find((kw) => lowered.includes(kw.toLowerCase())) ?? s.intent;
      return {
        id: `feed-init-${now}-${s.id}`,
        suggestion: s,
        detectedKeyword: matchedKeyword,
        timestamp: now,
        isNew: true,
        gradientPlayed: false,
      };
    });

    setFeedTimeline((prev) => {
      const existingIds = new Set(prev.map((i) => i.suggestion.id));
      const trulyNew = newItems.filter((i) => !existingIds.has(i.suggestion.id));
      if (trulyNew.length === 0) return prev;
      return [...trulyNew, ...prev];
    });
  }, [activeId, activeFeedSuggestions, conversationContext]);

  // ── Feed analysis state machine (typewriter) ─────────
  useEffect(() => {
    const prev = prevActiveSuggestionsRef.current;
    prevActiveSuggestionsRef.current = activeFeedSuggestions;

    const prevIds = new Set(prev.map((s) => s.id));
    const newSuggestions = activeFeedSuggestions.filter((s) => !prevIds.has(s.id) && s.id !== "general");

    if (newSuggestions.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastKeywordDetectTimeRef.current < 2000) {
      return;
    }
    lastKeywordDetectTimeRef.current = now;

    const lowered = conversationContext.toLowerCase();
    const topNew = newSuggestions[0];
    const matchedKeyword =
      topNew.intentKeywords.find((kw) => lowered.includes(kw.toLowerCase())) ?? topNew.intent;

    setFeedAnalysisState("analyzing");
    setFeedAnalysisLog([]);

    const typewriterSteps = [
      { text: "Leyendo conversación…", delay: 150 },
      { text: `Detectado: ${topNew.intent}`, delay: 200 },
      { text: "Consultando Knowledge aprobado…", delay: 200 },
      { text: "Sugerencias listas", delay: 250 },
    ];

    let stepIndex = 0;
    let cumulativeDelay = 0;

    const runTypewriter = () => {
      if (stepIndex >= typewriterSteps.length) {
        setFeedAnalysisState("ready");

        setTimeout(() => {
          setFeedAnalysisState("idle");
          setFeedAnalysisLog([]);

          setFeedTimeline((prev) => {
            const exists = prev.some(
              (item) => item.detectedKeyword.toLowerCase() === matchedKeyword.toLowerCase()
            );
            if (exists) {
              return prev.map((item) =>
                item.detectedKeyword.toLowerCase() === matchedKeyword.toLowerCase()
                  ? { ...item, timestamp: now, isNew: true }
                  : item
              );
            }

            const newItem: FeedTimelineItem = {
              id: `feed-${now}-${topNew.id}`,
              suggestion: topNew,
              detectedKeyword: matchedKeyword,
              timestamp: now,
              isNew: true,
              gradientPlayed: false,
            };

            return [newItem, ...prev];
          });
        }, 400);

        return;
      }

      const step = typewriterSteps[stepIndex];
      let charIndex = 0;
      const stepLog = step.text;
      setFeedAnalysisLog((prev) => [...prev, ""]);

      const typeChar = () => {
        if (charIndex >= stepLog.length) {
          stepIndex++;
          cumulativeDelay += step.delay;
          typewriterTimerRef.current = window.setTimeout(runTypewriter, step.delay);
          return;
        }

        charIndex++;
        setFeedAnalysisLog((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = stepLog.slice(0, charIndex);
          return updated;
        });

        typewriterTimerRef.current = window.setTimeout(typeChar, 18 + Math.random() * 22);
      };

      typeChar();
    };

    runTypewriter();

    return () => {
      if (typewriterTimerRef.current) {
        window.clearTimeout(typewriterTimerRef.current);
      }
      if (analysisTimerRef.current) {
        window.clearTimeout(analysisTimerRef.current);
      }
    };
  }, [activeFeedSuggestions, conversationContext]);

  // ── Clear isNew flag after 2s ─────────────────────────
  useEffect(() => {
    if (feedTimeline.length === 0) return;
    const timer = window.setTimeout(() => {
      setFeedTimeline((prev) =>
        prev.map((item) => (item.isNew ? { ...item, isNew: false } : item))
      );
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [feedTimeline.length]);

  // ── Fetch knowledge + customer profile ────────────────
  useEffect(() => {
    let isCancelled = false;

    const loadKnowledgeContext = async () => {
      try {
        const [knowledgeResponse, customerResponse] = await Promise.all([
          fetch("/api/knowledge"),
          fetch(`/api/customers?phone=${encodeURIComponent(activeChatPhone)}`),
        ]);
        const knowledgeData = await knowledgeResponse.json();
        const customerData = await customerResponse.json();

        if (!isCancelled) {
          setKnowledgeServices(knowledgeData.knowledge?.services ?? []);
          setSupportFeedRules(knowledgeData.knowledge?.supportFeedRules ?? []);
          setCustomerProfile(customerData.customer ?? null);
        }
      } catch {
        if (!isCancelled) {
          setKnowledgeServices([]);
          setSupportFeedRules([]);
          setCustomerProfile(null);
        }
      }
    };

    void loadKnowledgeContext();

    return () => {
      isCancelled = true;
    };
  }, [activeChatPhone]);

  // ── Helpers ───────────────────────────────────────────

  const bumpFeedItem = useCallback((matchedLower: string, now?: number) => {
    const ts = now ?? Date.now();
    setFeedTimeline((prev) => {
      const exists = prev.some(
        (item) => item.detectedKeyword.toLowerCase() === matchedLower
      );
      if (exists) {
        return prev.map((item) =>
          item.detectedKeyword.toLowerCase() === matchedLower
            ? { ...item, timestamp: ts, isNew: true }
            : item
        );
      }
      return prev;
    });
  }, []);

  const addChipToSelection = useCallback((
    matchedLower: string,
    originalText: string,
    type: ChipEntry["type"]
  ): boolean => {
    if (selectedChipsRef.current.has(matchedLower)) {
      return false;
    }
    const updated = new Map(selectedChipsRef.current);
    updated.set(matchedLower, { originalText, type });
    selectedChipsRef.current = updated;
    setSelectedChips(updated);
    return true;
  }, []);

  const addFeedTimelineItem = useCallback((
    suggestion: FeedSuggestion,
    matchedKeyword: string,
    now?: number
  ) => {
    const ts = now ?? Date.now();
    setFeedTimeline((prev) => {
      const matchedLower = matchedKeyword.toLowerCase();
      const exists = prev.some(
        (item) => item.detectedKeyword.toLowerCase() === matchedLower
      );
      if (exists) {
        return prev.map((item) =>
          item.detectedKeyword.toLowerCase() === matchedLower
            ? { ...item, timestamp: ts, isNew: true }
            : item
        );
      }
      const newItem: FeedTimelineItem = {
        id: `feed-chip-${ts}`,
        suggestion,
        detectedKeyword: matchedKeyword,
        timestamp: ts,
        isNew: true,
        gradientPlayed: false,
      };
      return [newItem, ...prev];
    });
  }, []);

  const handleTimeChipSelection = useCallback((
    timeStr: string,
    dayStr: string | undefined
  ): { changed: boolean; updated: Map<string, ChipEntry> } => {
    const updated = new Map(selectedChipsRef.current);
    let changed = false;
    if (!updated.has(timeStr.toLowerCase())) {
      updated.set(timeStr.toLowerCase(), { originalText: timeStr, type: "time" });
      changed = true;
    }
    if (dayStr && !updated.has(dayStr.toLowerCase())) {
      updated.set(dayStr.toLowerCase(), { originalText: dayStr, type: "day" });
      changed = true;
    }
    if (changed) {
      selectedChipsRef.current = updated;
      setSelectedChips(updated);
    }
    return { changed, updated };
  }, []);

  return {
    // State
    customerProfile,
    feedTimeline,
    feedAnalysisState,
    feedAnalysisLog,
    feedSearch,
    setFeedSearch,
    playedItemGradients,
    setPlayedItemGradients,
    selectedChips,
    setSelectedChips,
    setFeedTimeline,
    selectedChipsRef,
    knowledgeServices,
    setKnowledgeServices,
    supportFeedRules,
    setSupportFeedRules,
    activeFeedSuggestions,
    // Feed helpers
    bumpFeedItem,
    addFeedTimelineItem,
    addChipToSelection,
    handleTimeChipSelection,
    // Smart Keyword component helpers
    keywordIndex,
    detectTimes,
    isTimeSlotAvailable,
    findMatchingSlot,
  };
}
