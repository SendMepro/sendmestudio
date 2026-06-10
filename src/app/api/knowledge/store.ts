import { promises as fs } from "fs";
import path from "path";

export type KnowledgeSection =
  | "salonProfile"
  | "businessHours"
  | "services"
  | "stylists"
  | "availabilityRules"
  | "bookingRules"
  | "faqs"
  | "aiRules"
  | "supportFeedRules"
  | "mediaLibrary";

const knowledgeDir = path.join(process.cwd(), "data", "knowledge");

const knowledgeFiles: Record<KnowledgeSection, string> = {
  salonProfile: "salon-profile.json",
  businessHours: "business-hours.json",
  services: "services.json",
  stylists: "stylists.json",
  availabilityRules: "availability-rules.json",
  bookingRules: "booking-rules.json",
  faqs: "faqs.json",
  aiRules: "ai-rules.json",
  supportFeedRules: "support-feed-rules.json",
  mediaLibrary: "media-library.json",
};

export const defaultKnowledge = {
  salonProfile: {
    salonName: "SendMe Studio",
    address: "",
    city: "",
    phone: "",
    connectedWhatsApp: "",
    instagram: "",
    website: "",
    brandTone: "Luxury concierge, cálido, editorial y seguro.",
    salonType: "Beauty salon",
    shortDescription: "Atelier de belleza con atención personalizada.",
    mainPromise: "Crear experiencias de belleza cuidadas, luminosas y memorables.",
  },
  businessHours: {
    weeklyHours: [
      { day: "Monday", open: "10:00", close: "19:00", closed: false },
      { day: "Tuesday", open: "10:00", close: "19:00", closed: false },
      { day: "Wednesday", open: "10:00", close: "19:00", closed: false },
      { day: "Thursday", open: "10:00", close: "19:00", closed: false },
      { day: "Friday", open: "10:00", close: "19:00", closed: false },
      { day: "Saturday", open: "10:00", close: "16:00", closed: false },
      { day: "Sunday", open: "", close: "", closed: true },
    ],
    holidays: [],
    lunchBreak: "14:00-15:00",
    lastAcceptedTime: "17:30",
    minimumBufferMinutes: 15,
    latePolicy: "Se conserva la reserva con 10 minutos de tolerancia.",
  },
  services: [
    {
      id: "balayage",
      name: "Balayage",
      category: "Color",
      description: "Iluminación personalizada con efecto natural y acabado editorial.",
      shortPitch: "Dimensión suave, brillo luminoso y movimiento natural.",
      priceFrom: 85000,
      priceTo: 160000,
      durationMinutes: 180,
      requiredDeposit: true,
      keywords: [
        "balayage",
        "balayagee",
        "balayash",
        "balayageh",
        "balallage",
        "ballage",
        "balaje",
        "balalle",
        "balayach",
        "balayachis",
        "ballayage",
        "ballayash",
        "bayalage",
        "bayalash",
        "balay",
        "baleage",
        "baleaje",
        "balayaje",
        "baliage",
        "baliaje",
        "balayague",
        "mechas",
        "iluminación",
        "iluminacion",
        "rubios",
        "rubio",
        "rayitos",
        "reflejos",
        "claritos",
        "iluminar",
      ],
      tags: ["color", "premium", "diagnóstico"],
      upsells: ["Gloss", "Olaplex", "Hidratación"],
      contraindications: ["Cabello muy sensibilizado sin evaluación previa"],
      preparationNotes: "Enviar foto del cabello con luz natural antes de confirmar.",
      aftercareNotes: "Usar shampoo sin sulfatos y agendar gloss de mantenimiento.",
      suggestedReply: "Sí, trabajamos balayage con diagnóstico previo para cuidar el resultado.",
      supportCardText: "Balayage · desde $85.000 · 180 min · sugerir foto previa.",
      campaignText: "Balayage luminoso con acabado natural y cuidado premium.",
    },
    {
      id: "corte-mujer",
      name: "Corte mujer",
      category: "Haircut",
      description: "Corte personalizado según rostro, textura y estilo de vida.",
      shortPitch: "Forma, movimiento y acabado pulido.",
      priceFrom: 28000,
      priceTo: 45000,
      durationMinutes: 60,
      requiredDeposit: false,
      keywords: ["corte", "cortar", "cortarme", "cabello", "pelo", "melena", "capas", "flequillo", "chascas", "puntas", "rebajar", "despuntar", "bob", "long bob", "pixie", "movimiento", "forma", "corte mujer"],
      tags: ["corte", "styling"],
      upsells: ["Brushing", "Tratamiento"],
      contraindications: [],
      preparationNotes: "Traer referencias visuales si busca un cambio marcado.",
      aftercareNotes: "Revisar mantenimiento cada 8 a 10 semanas.",
      suggestedReply: "Podemos ayudarte con un corte personalizado según tu textura y objetivo.",
      supportCardText: "Corte mujer · desde $28.000 · 60 min.",
      campaignText: "Cortes con movimiento natural y terminación editorial.",
    },
    {
      id: "hidratacion",
      name: "Hidratación",
      category: "Treatment",
      description: "Ritual de nutrición para suavidad, brillo y control del frizz.",
      shortPitch: "Suavidad inmediata y brillo saludable.",
      priceFrom: 35000,
      priceTo: 65000,
      durationMinutes: 75,
      requiredDeposit: false,
      keywords: ["hidratación", "seco", "frizz", "tratamiento"],
      tags: ["wellness", "cuidado"],
      upsells: ["Brushing", "Gloss"],
      contraindications: [],
      preparationNotes: "Ideal si el cabello se siente opaco o áspero.",
      aftercareNotes: "Mantener con mascarilla semanal y protector térmico.",
      suggestedReply: "Sí, tenemos hidratación para devolver suavidad, brillo y movimiento.",
      supportCardText: "Hidratación · desde $35.000 · 75 min.",
      campaignText: "Ritual de hidratación para un cabello suave, luminoso y cuidado.",
    },
  ],
  stylists: [
    {
      id: "renata",
      name: "Renata",
      age: 31,
      role: "Color specialist",
      specialties: ["Balayage", "Color", "Gloss"],
      experienceYears: 8,
      availableDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: "10:00-18:30",
      servicesAllowed: ["balayage", "hidratacion"],
      bioShort: "Especialista en color luminoso y acabados naturales.",
      tone: "Calma, precisa y editorial.",
      photoUrl: "",
      status: "active",
    },
    {
      id: "martina",
      name: "Martina",
      age: 28,
      role: "Stylist",
      specialties: ["Corte", "Brushing", "Tratamientos"],
      experienceYears: 6,
      availableDays: ["Monday", "Tuesday", "Friday", "Saturday"],
      workingHours: "10:00-17:00",
      servicesAllowed: ["corte-mujer", "hidratacion"],
      bioShort: "Stylist enfocada en cortes suaves y cuidado del cabello.",
      tone: "Cercana, práctica y elegante.",
      photoUrl: "",
      status: "active",
    },
  ],
  availabilityRules: {
    durationByService: { balayage: 180, "corte-mujer": 60, hidratacion: 75 },
    stylistAvailability: {},
    blockedDates: [],
    dailyCapacity: 12,
    vipPriority: true,
    bufferBetweenServicesMinutes: 15,
    recommendedTimes: ["10:00", "13:30", "16:00"],
    notRecommendedTimes: ["18:30"],
  },
  bookingRules: {
    requiresPriorEvaluation: ["balayage", "color", "alisado"],
    requiresHairPhoto: ["balayage", "color"],
    requiresDeposit: ["balayage"],
    cancellationPolicy: "Cancelar o reagendar con 24 horas de anticipación.",
    latePolicy: "Tolerancia de 10 minutos según disponibilidad del día.",
    autoConfirmation: true,
    autoReminder: true,
    minimumBookingWindowHours: 4,
    confirmationMessageByService: {
      balayage: "Tu reserva de balayage queda confirmada. Por favor envíanos una foto de tu cabello con luz natural.",
    },
  },
  faqs: [
    {
      question: "¿Dónde están ubicados?",
      answer: "Estamos en el salón indicado en nuestra ficha. Podemos enviarte ubicación por WhatsApp.",
      keywords: ["ubicación", "dirección", "donde"],
      autoReplyAllowed: true,
      requiresHuman: false,
    },
    {
      question: "¿Qué medios de pago aceptan?",
      answer: "Aceptamos transferencia, tarjetas y efectivo.",
      keywords: ["pago", "tarjeta", "transferencia"],
      autoReplyAllowed: true,
      requiresHuman: false,
    },
    {
      question: "¿Cuánto dura un balayage?",
      answer: "Un balayage suele durar entre 3 y 4 horas según diagnóstico, largo y estado del cabello.",
      keywords: ["duración", "balayage", "cuánto demora"],
      autoReplyAllowed: true,
      requiresHuman: false,
    },
  ],
  aiRules: {
    responseTone: "Concierge premium, cálido, claro y sin presión.",
    allowedWords: ["ritual", "diagnóstico", "luminoso", "cuidado", "experiencia"],
    forbiddenWords: ["barato", "urgente", "últimos cupos", "compra ya"],
    allowedEmojis: ["✨", "🤍", "💆‍♀️", "🌿", "☁️"],
    whenToSell: "Cuando el cliente muestra intención clara de servicio o agenda.",
    whenNotToSell: "Ante reclamos, pagos, frustración o dudas sensibles.",
    whenToAskForPhoto: "Color, balayage, alisado o cambios grandes.",
    whenToAskHuman: "Reclamos, pagos, conflictos, salud, ambigüedad alta.",
    whenToSuggestTime: "Cuando pregunta disponibilidad o agenda.",
    whenToSuggestUpsell: "Después de confirmar servicio base y si mejora el resultado.",
    autoReplyLimits: "No prometer precios finales sin diagnóstico ni confirmar horarios inexistentes.",
  },
  supportFeedRules: [
    {
      id: "balayage-support",
      keywords: ["balayage", "balayagee", "balayash", "balayageh", "balallage", "ballage", "balaje", "balalle", "balayach", "balayachis", "ballayage", "ballayash", "bayalage", "bayalash", "balay", "baleage", "baleaje", "balayaje", "baliage", "baliaje", "balayague", "mechas", "iluminación", "iluminacion", "rubios", "rubio", "rayitos", "reflejos", "claritos", "iluminar"],
      cardTitle: "Servicio: Balayage",
      serviceId: "balayage",
      replyInsertable: "Sí, trabajamos balayage con diagnóstico previo. Podemos orientarte si nos envías una foto con luz natural.",
      upsellSuggestion: "Gloss u Olaplex",
      referenceImage: "",
    },
  ],
  mediaLibrary: {
    referenceImages: [],
    beforeAfter: [],
    promos: [],
    pdfs: [],
    diagnosisVisuals: [],
    customerAssetsEnabled: true,
    campaignCandidates: [],
  },
};

export type KnowledgeBundle = typeof defaultKnowledge;

function filePathFor(section: KnowledgeSection) {
  return path.join(knowledgeDir, knowledgeFiles[section]);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function ensureKnowledgeFiles() {
  await fs.mkdir(knowledgeDir, { recursive: true });
  await Promise.all(
    (Object.keys(knowledgeFiles) as KnowledgeSection[]).map((section) =>
      readJsonFile(filePathFor(section), defaultKnowledge[section])
    )
  );
}

export async function readKnowledgeBundle(): Promise<KnowledgeBundle> {
  await ensureKnowledgeFiles();

  const entries = await Promise.all(
    (Object.keys(knowledgeFiles) as KnowledgeSection[]).map(async (section) => [
      section,
      await readJsonFile(filePathFor(section), defaultKnowledge[section]),
    ])
  );

  return Object.fromEntries(entries) as KnowledgeBundle;
}

export async function readKnowledgeSection<T extends KnowledgeSection>(
  section: T
): Promise<KnowledgeBundle[T]> {
  await ensureKnowledgeFiles();
  return readJsonFile(filePathFor(section), defaultKnowledge[section]);
}

export async function writeKnowledgeSection<T extends KnowledgeSection>(
  section: T,
  data: KnowledgeBundle[T]
) {
  await writeJsonFile(filePathFor(section), data);
  return data;
}

export async function writeKnowledgeBundle(bundle: Partial<KnowledgeBundle>) {
  await ensureKnowledgeFiles();
  await Promise.all(
    (Object.keys(bundle) as KnowledgeSection[]).map((section) =>
      writeJsonFile(filePathFor(section), bundle[section])
    )
  );

  return readKnowledgeBundle();
}
