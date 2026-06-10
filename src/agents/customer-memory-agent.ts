// ================================================================
// Customer Memory Agent — extract and store memory signals from
// customer conversations.
// Phase: FASE 2 — Customer Memory Agent MVP
// Status: created
//
// Rule-based extraction (no LLM dependency for MVP).
// Future: enrich with runAI("customer_memory", ...) via AI Router.
// ================================================================

import { randomUUID } from "node:crypto";
import { fuzzyIncludes, normalizeSearchText } from "../app/lib/serviceMatcher";

// ── Types ────────────────────────────────────────────────────────────

export type CustomerSignalType =
  | "transport"
  | "schedule"
  | "stylist"
  | "allergy"
  | "price_sensitivity"
  | "service_interest"
  | "waiting_sensitivity"
  | "preference"
  | "general";

export interface CustomerSignal {
  id: string;
  type: CustomerSignalType;
  value: string | boolean;
  confidence: number;
  source: string;
  messageText: string;
  createdAt: string;
}

// ── Prisma result shape (without depending on @prisma/client types) ──
interface CustomerMemoryRecord {
  id: string;
  tenantId: string;
  phone: string;
  profile: unknown;
  signals: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMemoryProfile {
  id: string;
  customerPhone: string;
  customerName: string;
  signals: CustomerSignal[];
  preferences: Record<string, string | boolean | number>;
  preferredStylist: string | null;
  preferredSchedule: string | null;
  transport: string | null;
  parkingInterest: boolean;
  allergies: string[];
  favoriteServices: string[];
  waitingSensitivity: "low" | "medium" | "high" | null;
  priceSensitive: boolean;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

// ── Stylist names we know about ────────────────────────────────────

const KNOWN_STYLISTS = [
  "renata",
  "martina",
];

function normalizeStylistName(name: string): string {
  const map: Record<string, string> = {
    renata: "Renata",
    martina: "Martina",
  };
  return map[name.toLowerCase().trim()] ?? name;
}

// ── Signal detection rules ──────────────────────────────────────────

interface DetectedSignal {
  type: CustomerSignalType;
  value: string | boolean;
  confidence: number;
}

/**
 * Extract signals from a message text using MVP rule-based detection.
 */
function extractSignalsFromText(
  text: string,
): DetectedSignal[] {
  const signals: DetectedSignal[] = [];
  const normalized = normalizeSearchText(text);
  const lower = text.toLowerCase();

  // ── Transport / Parking ──
  const parkingPatterns = [
    "estacionamiento",
    "estacionar",
    "aparcar",
    "parqueo",
    "auto",
    "automovil",
    "automóvil",
    "carro",
    "voy en auto",
    "voy en carro",
    "llegar en auto",
    "llegar en carro",
    "hay estacionamiento",
    "tienen estacionamiento",
  ];
  if (parkingPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "transport",
      value: "automovil",
      confidence: 0.85,
    });
  }

  // ── Schedule preference (tarde) ──
  const afternoonPatterns = [
    "tarde",
    "despues del trabajo",
    "después del trabajo",
    "despues de las",
    "después de las",
    "a la tarde",
    "por la tarde",
    "salgo del trabajo",
  ];
  if (afternoonPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "schedule",
      value: "tarde",
      confidence: 0.8,
    });
  }

  // ── Morning schedule ──
  const morningPatterns = [
    "a la manana",
    "a la mañana",
    "por la manana",
    "por la mañana",
    "temprano",
  ];
  if (morningPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "schedule",
      value: "manana",
      confidence: 0.7,
    });
  }

  // ── Stylist preference ──
  for (const stylist of KNOWN_STYLISTS) {
    if (fuzzyIncludes(normalized, stylist)) {
      signals.push({
        type: "stylist",
        value: normalizeStylistName(stylist),
        confidence: 0.9,
      });
    }
  }

  // ── Allergy ──
  const allergyPatterns = [
    "alergia",
    "alérgico",
    "alergico",
    "alérgica",
    "alergica",
    "me da alergia",
    "soy alergico",
    "soy alérgico",
    "soy alergica",
    "soy alérgica",
    "reaccion",
    "reacción",
    "irritacion",
    "irritación",
    "piel sensible",
    "cuero cabelludo sensible",
  ];
  if (allergyPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    // Try to extract the specific allergen
    const allergenMatch = lower.match(
      /alergia\s+(?:a\s+)?([a-záéíóúñ\s]+?)(?:\.|,|$|y\s)/i,
    );
    const allergen = allergenMatch?.[1]?.trim() || "general";
    signals.push({
      type: "allergy",
      value: allergen,
      confidence: 0.75,
    });
  }

  // ── Price sensitivity ──
  const pricePatterns = [
    "promocion",
    "promoción",
    "descuento",
    "oferta",
    "rebaja",
    "cuanto sale",
    "cuánto sale",
    "mas barato",
    "más barato",
    "precio especial",
    "precios",
    "presupuesto",
    "conviene",
  ];
  if (pricePatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "price_sensitivity",
      value: true,
      confidence: 0.65,
    });
  }

  // ── Waiting sensitivity ──
  const urgentPatterns = [
    "urgente",
    "rapido",
    "rápido",
    "lo antes posible",
    "cuanto antes",
    "necesito ya",
    "para hoy",
    "no puedo esperar",
  ];
  if (urgentPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "waiting_sensitivity",
      value: "high",
      confidence: 0.7,
    });
  }

  const patientPatterns = [
    "sin apuro",
    "sin prisa",
    "cuando puedas",
    "cuando tenga",
    "con calma",
    "no hay apuro",
    "no hay prisa",
  ];
  if (patientPatterns.some((p) => fuzzyIncludes(normalized, p))) {
    signals.push({
      type: "waiting_sensitivity",
      value: "low",
      confidence: 0.65,
    });
  }

  // ── Service interest (favorite services) ──
  const servicePatterns: Array<{ keyword: string; value: string }> = [
    { keyword: "balayage", value: "balayage" },
    { keyword: "corte", value: "corte" },
    { keyword: "color", value: "color" },
    { keyword: "hidratacion", value: "hidratacion" },
    { keyword: "hidratación", value: "hidratacion" },
    { keyword: "alisado", value: "alisado" },
    { keyword: "gloss", value: "gloss" },
    { keyword: "brushing", value: "brushing" },
    { keyword: "lavado", value: "lavado" },
    { keyword: "manicure", value: "manicure" },
    { keyword: "pedicure", value: "pedicure" },
    { keyword: "cepillo", value: "brushing" },
    { keyword: "peinado", value: "peinado" },
  ];

  for (const svc of servicePatterns) {
    if (fuzzyIncludes(normalized, svc.keyword)) {
      // Avoid detecting "no quiero" as interest
      const negated =
        fuzzyIncludes(normalized, `no ${svc.keyword}`) ||
        fuzzyIncludes(normalized, `no quiero ${svc.keyword}`);
      if (!negated) {
        signals.push({
          type: "service_interest",
          value: svc.value,
          confidence: 0.6,
        });
      }
    }
  }

  return signals;
}

// ── Agent logic ──────────────────────────────────────────────────────

export interface ProcessMessageInput {
  customerPhone: string;
  customerName: string;
  messageText: string;
  source: string;
  tenantId?: string;
}

export interface ProcessMessageResult {
  profile: CustomerMemoryProfile;
  signalsAdded: number;
  isNew: boolean;
}

/**
 * Process a customer message and extract memory signals.
 * Returns the updated (or newly created) profile.
 * Requires tenantId for multi-tenant isolation.
 * If tenantId is not provided, logs a warning and returns a safe result without persisting.
 */
export async function processCustomerMessage(
  input: ProcessMessageInput,
): Promise<ProcessMessageResult> {
  if (!input.tenantId) {
    console.warn(
      "[customer-memory] processCustomerMessage called without tenantId — skipping persistence to avoid data leakage",
      { customerPhone: input.customerPhone },
    );
    // Return safe result without reading or writing any store
    const signals = extractSignalsFromText(input.messageText);
    const now = new Date().toISOString();
    const newSignals: CustomerSignal[] = signals.map((s) => ({
      id: randomUUID(),
      type: s.type,
      value: s.value,
      confidence: s.confidence,
      source: input.source,
      messageText: input.messageText,
      createdAt: now,
    }));
    return {
      profile: {
        id: randomUUID(),
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        signals: newSignals,
        preferences: {},
        preferredStylist: null,
        preferredSchedule: null,
        transport: null,
        parkingInterest: false,
        allergies: [],
        favoriteServices: [],
        waitingSensitivity: null,
        priceSensitive: false,
        confidenceScore: 0,
        createdAt: now,
        updatedAt: now,
      },
      signalsAdded: newSignals.length,
      isNew: true,
    };
  }

  const { prisma } = await import("../lib/prisma");

  // Try to find existing profile in Prisma scoped to tenantId
  let existing: CustomerMemoryProfile | null = null;

  try {
    const record = await prisma.customerMemory.findFirst({
      where: {
        tenantId: input.tenantId,
        phone: input.customerPhone,
      },
    });
    if (record) {
      existing = {
        id: record.id,
        customerPhone: record.phone,
        customerName: (record.profile as any)?.customerName ?? input.customerName,
        signals: (record.signals as unknown) as CustomerSignal[],
        preferences: (record.profile as any)?.preferences ?? {},
        preferredStylist: (record.profile as any)?.preferredStylist ?? null,
        preferredSchedule: (record.profile as any)?.preferredSchedule ?? null,
        transport: (record.profile as any)?.transport ?? null,
        parkingInterest: (record.profile as any)?.parkingInterest ?? false,
        allergies: (record.profile as any)?.allergies ?? [],
        favoriteServices: (record.profile as any)?.favoriteServices ?? [],
        waitingSensitivity: (record.profile as any)?.waitingSensitivity ?? null,
        priceSensitive: (record.profile as any)?.priceSensitive ?? false,
        confidenceScore: (record.profile as any)?.confidenceScore ?? 0,
        createdAt: record.createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      };
    }
  } catch {
    // Fallback to JSON store
    try {
      const { getProfileByPhone } = await import("../data/customer-memory-store");
      existing = await getProfileByPhone(input.customerPhone);
    } catch { /* ignore */ }
  }

  const isNew = !existing;
  const rawSignals = extractSignalsFromText(input.messageText);

  // Build new signal objects
  const now = new Date().toISOString();
  const newSignals: CustomerSignal[] = rawSignals.map((s) => ({
    id: randomUUID(),
    type: s.type,
    value: s.value,
    confidence: s.confidence,
    source: input.source,
    messageText: input.messageText,
    createdAt: now,
  }));

  // Compute derived profile fields from existing profile + raw signals
  const allSignals = [
    ...(existing?.signals ?? []),
    ...newSignals,
  ];

  const derivedFields = deriveProfileFields(allSignals);

  const profile: CustomerMemoryProfile = {
    id: existing?.id ?? randomUUID(),
    customerPhone: input.customerPhone,
    customerName: existing?.customerName ?? input.customerName,
    signals: existing?.signals ?? [],
    preferences: {
      ...derivedFields.preferences,
    },
    preferredStylist: derivedFields.preferredStylist,
    preferredSchedule: derivedFields.preferredSchedule,
    transport: derivedFields.transport,
    parkingInterest: derivedFields.parkingInterest,
    allergies: derivedFields.allergies,
    favoriteServices: derivedFields.favoriteServices,
    waitingSensitivity: derivedFields.waitingSensitivity,
    priceSensitive: derivedFields.priceSensitive,
    confidenceScore: 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  // Save to JSON store (legacy fallback)
  try {
    const { upsertProfile } = await import("../data/customer-memory-store");
    await upsertProfile({
      ...profile,
      signals: newSignals,
    });
  } catch { /* ignore */ }

  return {
    profile: {
      ...profile,
      signals: allSignals,
      confidenceScore: calculateConfidenceScore(allSignals),
    },
    signalsAdded: newSignals.length,
    isNew,
  };
}

/**
 * Calculate average confidence score from signals.
 */
function calculateConfidenceScore(signals: CustomerSignal[]): number {
  if (signals.length === 0) return 0;
  const sum = signals.reduce((acc, s) => acc + s.confidence, 0);
  return Math.round((sum / signals.length) * 100) / 100;
}

/**
 * Derive profile fields from all accumulated signals.
 */
function deriveProfileFields(
  signals: CustomerSignal[],
): {
  preferences: Record<string, string | boolean | number>;
  preferredStylist: string | null;
  preferredSchedule: string | null;
  transport: string | null;
  parkingInterest: boolean;
  allergies: string[];
  favoriteServices: string[];
  waitingSensitivity: "low" | "medium" | "high" | null;
  priceSensitive: boolean;
} {
  // Get the latest (most recent) signal of each type
  const latestByType = new Map<CustomerSignalType, CustomerSignal>();
  for (const signal of signals) {
    const existing = latestByType.get(signal.type);
    if (!existing || signal.createdAt > existing.createdAt) {
      latestByType.set(signal.type, signal);
    }
  }

  const stylistSignal = latestByType.get("stylist");
  const scheduleSignal = latestByType.get("schedule");
  const transportSignal = latestByType.get("transport");
  const priceSignal = latestByType.get("price_sensitivity");
  const waitingSignal = latestByType.get("waiting_sensitivity");
  const serviceSignals = signals.filter(
    (s) => s.type === "service_interest",
  );
  const allergySignals = signals.filter((s) => s.type === "allergy");

  return {
    preferences: {
      // Will grow as more signals are added
      transport: transportSignal?.value ?? false,
      schedule: scheduleSignal?.value ?? false,
      priceSensitive: priceSignal?.value ?? false,
    },
    preferredStylist: stylistSignal
      ? String(stylistSignal.value)
      : null,
    preferredSchedule: scheduleSignal
      ? String(scheduleSignal.value)
      : null,
    transport: transportSignal ? String(transportSignal.value) : null,
    parkingInterest:
      transportSignal?.value === "automovil",
    allergies: [
      ...new Set(allergySignals.map((s) => String(s.value))),
    ],
    favoriteServices: [
      ...new Set(serviceSignals.map((s) => String(s.value))),
    ],
    waitingSensitivity: waitingSignal
      ? (String(waitingSignal.value) as "low" | "medium" | "high")
      : null,
    priceSensitive: priceSignal?.value === true,
  };
}

/**
 * Get all known memory profiles scoped to a tenant.
 * When tenantId is omitted, logs warning and returns empty array (no data leakage).
 */
export async function getAllProfiles(tenantId?: string) {
  if (!tenantId) {
    console.warn(
      "[customer-memory] getAllProfiles called without tenantId — returning empty to avoid data leakage",
    );
    return [];
  }

  // Prefer Prisma
  try {
    const { prisma } = await import("../lib/prisma");
    const records = (await prisma.customerMemory.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    })) as CustomerMemoryRecord[];
    return records.map((r: CustomerMemoryRecord) => ({
      id: r.id,
      customerPhone: r.phone,
      customerName: (r.profile as any)?.customerName ?? "",
      signals: (r.signals as unknown) as CustomerSignal[],
      preferences: (r.profile as any)?.preferences ?? {},
      preferredStylist: (r.profile as any)?.preferredStylist ?? null,
      preferredSchedule: (r.profile as any)?.preferredSchedule ?? null,
      transport: (r.profile as any)?.transport ?? null,
      parkingInterest: (r.profile as any)?.parkingInterest ?? false,
      allergies: (r.profile as any)?.allergies ?? [],
      favoriteServices: (r.profile as any)?.favoriteServices ?? [],
      waitingSensitivity: (r.profile as any)?.waitingSensitivity ?? null,
      priceSensitive: (r.profile as any)?.priceSensitive ?? false,
      confidenceScore: (r.profile as any)?.confidenceScore ?? 0,
      createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: r.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  } catch {
    // Fallback to JSON store
    const { getProfiles } = await import("../data/customer-memory-store");
    return getProfiles();
  }
}

/**
 * Get a memory profile by phone number scoped to a tenant.
 * When tenantId is omitted, logs warning and returns null (no data leakage).
 */
export async function getProfile(phone: string, tenantId?: string) {
  if (!tenantId) {
    console.warn(
      "[customer-memory] getProfile called without tenantId — returning null to avoid data leakage",
      { phone },
    );
    return null;
  }

  // Prefer Prisma
  try {
    const { prisma } = await import("../lib/prisma");
    const record = await prisma.customerMemory.findFirst({
      where: {
        tenantId,
        phone,
      },
    });
    if (!record) return null;
    return {
      id: record.id,
      customerPhone: record.phone,
      customerName: (record.profile as any)?.customerName ?? "",
      signals: (record.signals as unknown) as CustomerSignal[],
      preferences: (record.profile as any)?.preferences ?? {},
      preferredStylist: (record.profile as any)?.preferredStylist ?? null,
      preferredSchedule: (record.profile as any)?.preferredSchedule ?? null,
      transport: (record.profile as any)?.transport ?? null,
      parkingInterest: (record.profile as any)?.parkingInterest ?? false,
      allergies: (record.profile as any)?.allergies ?? [],
      favoriteServices: (record.profile as any)?.favoriteServices ?? [],
      waitingSensitivity: (record.profile as any)?.waitingSensitivity ?? null,
      priceSensitive: (record.profile as any)?.priceSensitive ?? false,
      confidenceScore: (record.profile as any)?.confidenceScore ?? 0,
      createdAt: record.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    } as CustomerMemoryProfile;
  } catch {
    const { getProfileByPhone } = await import(
      "../data/customer-memory-store"
    );
    return getProfileByPhone(phone);
  }
}
