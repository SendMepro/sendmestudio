import type { WhatsAppInternalMessage } from "./store";
import { matchTextToServices, normalizeSearchText, fuzzyIncludes } from "../../lib/serviceMatcher";
import prisma from "@/lib/prisma";
import type { WhatsAppBookingContext } from "@prisma/client";

/**
 * Booking conversation state persisted in Prisma per conversation.
 *
 * States: idle → intent_detected → awaiting_time → awaiting_confirm → booking
 *
 * v2: Uses WhatsAppBookingContext Prisma model instead of in-memory Map.
 *     The in-memory Map is kept as a fast L1 cache; Prisma is the source of truth.
 */
export type BookingStage =
  | "idle"
  | "intent_detected"
  | "awaiting_date"
  | "awaiting_time"
  | "awaiting_confirm"
  | "booking_complete";

/** Acción de booking detectada: new (crear), reschedule (reagendar), cancel (cancelar) */
export type BookingAction = "new" | "reschedule" | "cancel";

export type BookingContextState = {
  conversationId: string;
  tenantId?: string;
  stage: BookingStage;
  action: BookingAction;
  service: string | null;
  stylist: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  existingAppointmentId: string | null; // ID de cita existente para reschedule/cancel
  updatedAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

// ── L1 in-memory cache (fast path) ─────────────────────────────────────────

const globalCtx = globalThis as typeof globalThis & {
  __sendmeBookingContexts?: Map<string, BookingContextState>;
};

const l1Cache =
  globalCtx.__sendmeBookingContexts ?? new Map<string, BookingContextState>();

globalCtx.__sendmeBookingContexts = l1Cache;

function keyFor(conversationId: string, tenantId?: string): string {
  return tenantId ? `${tenantId}:${conversationId}` : conversationId;
}

function gc() {
  const now = Date.now();
  for (const [key, state] of l1Cache) {
    if (now - state.updatedAt > CACHE_TTL_MS) {
      l1Cache.delete(key);
    }
  }
}

// ── Prisma persistence helpers ─────────────────────────────────────────────

function fromPrismaRow(row: WhatsAppBookingContext): BookingContextState {
  return {
    conversationId: row.conversationId,
    tenantId: row.tenantId,
    stage: (row.stage as BookingStage) ?? "idle",
    action: ((row.metadata as any)?.action as BookingAction) ?? "new",
    service: row.service ?? null,
    stylist: row.stylist ?? null,
    proposedDate: row.date ?? null,
    proposedTime: row.time ?? null,
    existingAppointmentId: ((row.metadata as any)?.existingAppointmentId as string) ?? null,
    updatedAt: row.updatedAt.getTime(),
  };
}

function toPrismaUpdate(
  state: Partial<BookingContextState>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (state.stage !== undefined) data.stage = state.stage;
  if (state.service !== undefined) data.service = state.service;
  if (state.stylist !== undefined) data.stylist = state.stylist;
  if (state.proposedDate !== undefined) data.date = state.proposedDate;
  if (state.proposedTime !== undefined) data.time = state.proposedTime;
  return data;
}

async function readFromPrisma(
  conversationId: string,
  tenantId: string,
): Promise<BookingContextState | null> {
  try {
    const row = await prisma.whatsAppBookingContext.findUnique({
      where: {
        conversationId,
      },
    });
    if (!row) return null;
    // Tenant isolation check
    if (row.tenantId !== tenantId) return null;
    return fromPrismaRow(row);
  } catch (err) {
    console.warn("[booking-context] Prisma read failed:", err);
    return null;
  }
}

async function writeToPrisma(
  conversationId: string,
  tenantId: string,
  state: Partial<BookingContextState>,
): Promise<void> {
  try {
    const data = toPrismaUpdate(state);
    await prisma.whatsAppBookingContext.upsert({
      where: { conversationId },
      create: {
        conversationId,
        tenantId,
        phone: state.service ?? "",
        stage: (state.stage as string) ?? "idle",
        service: state.service ?? null,
        stylist: state.stylist ?? null,
        date: state.proposedDate ?? null,
        time: state.proposedTime ?? null,
        metadata: {},
      },
      update: {
        ...data,
        tenantId, // re-assure tenant isolation
      },
    });
  } catch (err) {
    console.warn("[booking-context] Prisma write failed:", err);
  }
}

async function deleteFromPrisma(
  conversationId: string,
  tenantId: string,
): Promise<void> {
  try {
    const existing = await prisma.whatsAppBookingContext.findUnique({
      where: { conversationId },
      select: { tenantId: true },
    });
    if (existing && existing.tenantId === tenantId) {
      await prisma.whatsAppBookingContext.delete({
        where: { conversationId },
      });
    }
  } catch (err) {
    console.warn("[booking-context] Prisma delete failed:", err);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getBookingContext(
  conversationId: string,
  tenantId?: string,
): Promise<BookingContextState | null> {
  gc();
  if (!tenantId) {
    console.warn(
      "[booking-context] getBookingContext called without tenantId — returning null to avoid cross-tenant leakage",
      { conversationId },
    );
    return null;
  }

  // L1 cache hit
  const cached = l1Cache.get(keyFor(conversationId, tenantId));
  if (cached) return cached;

  // L2 Prisma read
  const fromDb = await readFromPrisma(conversationId, tenantId);
  if (fromDb) {
    l1Cache.set(keyFor(conversationId, tenantId), fromDb);
    return fromDb;
  }

  return null;
}

async function upsertContext(
  conversationId: string,
  partial: Partial<BookingContextState>,
  tenantId?: string,
): Promise<BookingContextState> {
  gc();
  if (!tenantId) {
    console.warn(
      "[booking-context] upsertContext called without tenantId — not persisting to avoid cross-tenant leakage",
      { conversationId },
    );
    return {
      conversationId,
      tenantId: undefined,
      stage: partial.stage ?? "idle",
      action: partial.action ?? "new",
      service: partial.service ?? null,
      stylist: partial.stylist ?? null,
      proposedDate: null,
      proposedTime: null,
      existingAppointmentId: null,
      updatedAt: Date.now(),
    };
  }

  const k = keyFor(conversationId, tenantId);

  // Read existing from L1 cache or DB
  const existing = l1Cache.get(k) ?? (await readFromPrisma(conversationId, tenantId));

  const next: BookingContextState = {
    conversationId,
    tenantId,
    stage: "idle",
    action: "new",
    service: null,
    stylist: null,
    proposedDate: null,
    proposedTime: null,
    existingAppointmentId: null,
    updatedAt: Date.now(),
    ...(existing ?? {}),
    ...partial,
  };
  // Ensure action and existingAppointmentId are set (spread may carry undefined)
  next.action = next.action ?? "new";
  next.existingAppointmentId = next.existingAppointmentId ?? null;
  next.updatedAt = Date.now();

  // Write to L1 cache
  l1Cache.set(k, next);

  // Write to Prisma (fire-and-forget safe)
  await writeToPrisma(conversationId, tenantId, partial);

  return next;
}

export async function resetBookingContext(
  conversationId: string,
  tenantId?: string,
) {
  if (!tenantId) {
    console.warn(
      "[booking-context] resetBookingContext called without tenantId — skipping to avoid cross-tenant leakage",
      { conversationId },
    );
    return;
  }

  // Remove from L1 cache
  l1Cache.delete(keyFor(conversationId, tenantId));

  // Delete from Prisma
  await deleteFromPrisma(conversationId, tenantId);
}

// ── Slot & availability helpers ─────────────────────────────────────────

let cachedAvailability: {
  stylists: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; durationMinutes: number }>;
  slots: string[];
} | null = null;

async function readAvailability() {
  /* v8 ignore next 3 */
  if (cachedAvailability) return cachedAvailability;

  try {
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "availability.json");
    const raw = await fs.readFile(filePath, "utf-8");
    cachedAvailability = JSON.parse(raw);
  } catch {
    cachedAvailability = { stylists: [], services: [], slots: [] };
  }
  return cachedAvailability;
}

let availabilityTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAvailabilityRefresh(minutes = 5) {
  /* v8 ignore next 3 */
  if (availabilityTimer) clearTimeout(availabilityTimer);
  availabilityTimer = setTimeout(() => {
    cachedAvailability = null;
    availabilityTimer = null;
  }, minutes * 60 * 1000);
}

// ── Booking decision logic ──────────────────────────────────────────────

/**
 * Tries to detect a scheduling-related intent + service from a message.
 * Returns `null` if no booking signal found.
 */
export type BookingSignal = {
  /** Which stage the conversation should transition into. */
  nextStage: BookingStage;
  /** Booking action: new booking, reschedule, or cancel */
  action: BookingAction;
  /** Detected service ID (balayage, corte, color, etc.) or null. */
  service: string | null;
  /** Detected date ISO string, or null. */
  date: string | null;
  /** Detected time string (HH:MM), or null. */
  time: string | null;
  /** Confirmation intent detected (yes/si/ok/dale). */
  isConfirm: boolean;
  /** ID of existing appointment (for reschedule/cancel) */
  existingAppointmentId: string | null;
};

const bookingKeywords = [
  "agenda",
  "agendar",
  "reservar",
  "cita",
  "hora",
  "turno",
  "disponible",
  "disponibilidad",
  "pueden",
  "tienen hora",
] as const;

const confirmationKeywords = [
  "si",
  "sí",
  "yes",
  "ok",
  "okay",
  "dale",
  "de una",
  "confirmo",
  "confirma",
  "quiero",
  "porfa",
  "por favor",
  "adelante",
  "agenda",
  "agendalo",
  "agéndalo",
  "reserva",
  "reservalo",
  "resérvalo",
  "listo",
  "bueno",
  "vamos",
] as const;

const negationKeywords = [
  "no",
  "no quiero",
  "despues",
  "después",
  "luego",
  "mas tarde",
  "más tarde",
  "otro dia",
  "otro día",
] as const;

const cancelKeywords = [
  "cancelar",
  "cancela",
  "cancelación",
  "cancelacion",
  "anular",
  "anula",
  "eliminar",
  "elimina",
  "borrar",
  "cancela mi cita",
  "cancelar cita",
  "no voy a ir",
  "no puedo ir",
] as const;

const rescheduleKeywords = [
  "cambiar",
  "cambio",
  "reagendar",
  "reprogramar",
  "modificar",
  "mover",
  "correr",
  "adelantar",
  "atrasar",
  "cambiar hora",
  "cambiar día",
  "cambiar fecha",
  "otra hora",
  "otro horario",
  "otro día",
  "mejor",
] as const;

function detectDate(text: string): string | null {
  // Today / tomorrow
  const normalized = normalizeSearchText(text);
  if (fuzzyIncludes(normalized, "hoy")) {
    return todayDateString();
  }
  if (fuzzyIncludes(normalized, "manana") || fuzzyIncludes(normalized, "mañana")) {
    return tomorrowDateString();
  }

  // Day of week: matches "lunes", "martes", etc.
  const dayNames: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };
  for (const [dayName, dayIndex] of Object.entries(dayNames)) {
    if (fuzzyIncludes(normalized, dayName)) {
      return nextDayOfWeek(dayIndex);
    }
  }

  // Date patterns: "15/05", "15-05", "15 de mayo" etc.
  const datePatterns = [
    /(\d{1,2})\s*[/-]\s*(\d{1,2})(?:[/-]\d{2,4})?/,
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // For day-month pattern
      if (pattern === datePatterns[0]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
          const d = new Date(new Date().getFullYear(), month, day);
          if (d >= dateOnlyToday()) {
            return d.toISOString().split("T")[0];
          }
        }
      } else if (pattern === datePatterns[1]) {
        const months: Record<string, number> = {
          enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
          julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
        };
        const day = parseInt(match[1], 10);
        const month = months[match[2].toLowerCase()];
        if (day >= 1 && day <= 31 && month !== undefined) {
          const d = new Date(new Date().getFullYear(), month, day);
          if (d >= dateOnlyToday()) {
            return d.toISOString().split("T")[0];
          }
        }
      }
    }
  }

  return null;
}

function detectTime(text: string): string | null {
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2})\s+hrs?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      let minutes = match[2] && pattern !== patterns[1] ? parseInt(match[2], 10) : 0;
      const meridian = (match[match.length - 1] ?? "").toLowerCase();

      if (meridian === "pm" && hours < 12) hours += 12;
      if (meridian === "am" && hours === 12) hours = 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    }
  }

  return null;
}

function dateOnlyToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayDateString(): string {
  return dateOnlyToday().toISOString().split("T")[0];
}

function tomorrowDateString(): string {
  const d = dateOnlyToday();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function nextDayOfWeek(dayIndex: number): string {
  const today = dateOnlyToday().getDay();
  let daysUntil = dayIndex - today;
  if (daysUntil <= 0) daysUntil += 7;
  const d = dateOnlyToday();
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString().split("T")[0];
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Busca la cita activa (no cancelled) más reciente de un cliente por teléfono.
 */
async function findActiveAppointment(
  phone: string,
  tenantId: string,
): Promise<{ id: string; date: string; time: string; service: string } | null> {
  try {
    const appt = await prisma.appointment.findFirst({
      where: {
        tenantId,
        customerPhone: phone,
        status: { not: "cancelled" },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, date: true, time: true, service: true },
    });
    return appt;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export function detectBookingSignal(
  message: WhatsAppInternalMessage,
  context: BookingContextState | null
): BookingSignal {
  const tenantId = message.tenantId;
  const text = normalizeSearchText(message.content);
  const rawText = message.content.toLowerCase();

  const hasBookingKeyword = bookingKeywords.some((kw) => fuzzyIncludes(text, kw));
  const hasConfirmation = confirmationKeywords.some((kw) => fuzzyIncludes(text, kw));
  const hasNegation = negationKeywords.some((kw) => fuzzyIncludes(text, kw));
  const hasCancelIntent = cancelKeywords.some((kw) => fuzzyIncludes(text, kw));
  const hasRescheduleIntent = rescheduleKeywords.some((kw) => fuzzyIncludes(text, kw));

  const detectedDate = detectDate(rawText);
  const detectedTime = detectTime(rawText);

  // Detect service from text using the service matcher
  const serviceIntents = [
    { id: "balayage", keywords: [] },
    { id: "color", keywords: [] },
    { id: "corte", keywords: [] },
    { id: "lavado", keywords: [] },
    { id: "hidratacion", keywords: [] },
    { id: "gloss", keywords: [] },
    { id: "alisado", keywords: [] },
  ];
  const matchedServices = matchTextToServices(text, serviceIntents);
  const detectedService = matchedServices[0]?.id ?? context?.service ?? null;

  // ── Cancel intent detected ──
  if (hasCancelIntent && !hasNegation) {
    // Check if we know an active appointment from context or from DB lookup
    if (context?.existingAppointmentId) {
      return {
        nextStage: "booking_complete",
        action: "cancel",
        service: detectedService,
        date: null,
        time: null,
        isConfirm: true, // auto-confirm if we have the ID
        existingAppointmentId: context.existingAppointmentId,
      };
    }
    // If we have context with booking_complete, signal cancel
    if (context?.stage === "booking_complete" || hasBookingKeyword) {
      return {
        nextStage: "booking_complete",
        action: "cancel",
        service: detectedService,
        date: null,
        time: null,
        isConfirm: hasConfirmation || hasCancelIntent,
        existingAppointmentId: context?.existingAppointmentId ?? null,
      };
    }
    // Trigger cancel flow — will look up appointment on webhook side
    return {
      nextStage: "booking_complete",
      action: "cancel",
      service: detectedService,
      date: null,
      time: null,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // ── Reschedule intent detected ──
  // Reschedule: user wants to change date/time of existing appointment
  if (hasRescheduleIntent && !hasNegation) {
    if (context?.existingAppointmentId) {
      // We know which appointment; capture new date/time
      return {
        nextStage: detectedDate && detectedTime ? "awaiting_confirm" : detectedDate ? "awaiting_time" : "awaiting_date",
        action: "reschedule",
        service: detectedService,
        date: detectedDate,
        time: detectedTime,
        isConfirm: false,
        existingAppointmentId: context.existingAppointmentId,
      };
    }
    // No existing appointment ID yet — signal reschedule, will look up
    return {
      nextStage: "booking_complete",
      action: "reschedule",
      service: detectedService,
      date: detectedDate,
      time: detectedTime,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // Handle negation (cancels context)
  if (hasNegation && context && context.stage !== "idle") {
    resetBookingContext(message.conversationId, tenantId);
    return {
      nextStage: "idle",
      action: "new",
      service: null,
      date: null,
      time: null,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // ── if we have a context, evolve it ──

  // Awaiting time: if we had a date and now user gives time
  if (context?.stage === "awaiting_date" && detectedTime) {
    return {
      nextStage: "awaiting_time",
      action: context.action ?? "new",
      service: detectedService,
      date: detectedDate ?? context.proposedDate,
      time: detectedTime,
      isConfirm: false,
      existingAppointmentId: context.existingAppointmentId ?? null,
    };
  }

  if (context?.stage === "awaiting_date" && detectedDate) {
    return {
      nextStage: "awaiting_time",
      action: context.action ?? "new",
      service: detectedService,
      date: detectedDate,
      time: null,
      isConfirm: false,
      existingAppointmentId: context.existingAppointmentId ?? null,
    };
  }

  if (context?.stage === "awaiting_time" && detectedTime) {
    return {
      nextStage: "awaiting_confirm",
      action: context.action ?? "new",
      service: detectedService,
      date: context.proposedDate,
      time: detectedTime,
      isConfirm: false,
      existingAppointmentId: context.existingAppointmentId ?? null,
    };
  }

  // Confirmation after proposed time
  if (
    (context?.stage === "awaiting_time" || context?.stage === "awaiting_confirm") &&
    hasConfirmation &&
    !hasNegation
  ) {
    return {
      nextStage: "awaiting_confirm",
      action: context.action ?? "new",
      isConfirm: true,
      service: detectedService,
      date: detectedDate ?? context.proposedDate,
      time: detectedTime ?? context.proposedTime,
      existingAppointmentId: context.existingAppointmentId ?? null,
    };
  }

  // ── No context yet: detect booking intent ──

  // If the message has both date and time, and a booking keyword, move straight to confirm
  if (hasBookingKeyword && detectedDate && detectedTime) {
    return {
      nextStage: "awaiting_confirm",
      action: "new",
      service: detectedService,
      date: detectedDate,
      time: detectedTime,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // Booking keyword with date (but no time)
  if (hasBookingKeyword && detectedDate) {
    return {
      nextStage: "awaiting_time",
      action: "new",
      service: detectedService,
      date: detectedDate,
      time: null,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // Booking keyword with time (but no date)
  if (hasBookingKeyword && detectedTime) {
    return {
      nextStage: "awaiting_date",
      action: "new",
      service: detectedService,
      date: null,
      time: detectedTime,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // Booking keyword alone
  if (hasBookingKeyword) {
    return {
      nextStage: "awaiting_date",
      action: "new",
      service: detectedService,
      date: null,
      time: null,
      isConfirm: false,
      existingAppointmentId: null,
    };
  }

  // No booking signal
  return {
    nextStage: context?.stage ?? "idle",
    action: context?.action ?? "new",
    service: detectedService,
    date: null,
    time: null,
    isConfirm: false,
    existingAppointmentId: context?.existingAppointmentId ?? null,
  };
}

export async function formatSlotSuggestions(): Promise<string> {
  const availability = await readAvailability();
  scheduleAvailabilityRefresh();

  if (!availability || !availability.slots || availability.slots.length === 0) {
    return "";
  }

  // Group slots by date
  const grouped: Record<string, string[]> = {};
  for (const slot of availability.slots) {
    // Slots could be "26/05 10:00" or ISO-like
    const date = slot.split(" ")[0] ?? slot.substring(0, 10);
    const time = slot.includes(" ") ? slot.split(" ").slice(1).join(" ") : slot.substring(11, 16);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(time);
  }

  const lines: string[] = ["Horarios disponibles:"];
  for (const [date, times] of Object.entries(grouped)) {
    lines.push(`${date}: ${times.slice(0, 5).join(", ")}`);
  }

  const stylistNames = availability.stylists.map((s) => s.name).join(", ");
  if (stylistNames) {
    lines.push(`Especialistas: ${stylistNames}`);
  }

  return lines.join("\n");
}

export { findActiveAppointment };

export async function updateBookingContext(
  conversationId: string,
  signal: BookingSignal,
  tenantId?: string,
): Promise<BookingContextState> {
  if (signal.nextStage === "idle" && signal.isConfirm === false) {
    await resetBookingContext(conversationId, tenantId);
    return {
      conversationId,
      tenantId,
      stage: "idle",
      action: "new",
      service: null,
      stylist: null,
      proposedDate: null,
      proposedTime: null,
      existingAppointmentId: null,
      updatedAt: Date.now(),
    };
  }

  return upsertContext(conversationId, {
    stage: signal.nextStage,
    service: signal.service,
    proposedDate: signal.date ?? undefined,
    proposedTime: signal.time ?? undefined,
  }, tenantId);
}

/**
 * Actualiza booking context con metadatos adicionales (action, existingAppointmentId).
 */
export async function updateBookingContextWithMeta(
  conversationId: string,
  signal: BookingSignal,
  tenantId?: string,
): Promise<BookingContextState> {
  if (signal.nextStage === "idle" && signal.isConfirm === false) {
    await resetBookingContext(conversationId, tenantId);
    return {
      conversationId,
      tenantId,
      stage: "idle",
      action: "new",
      service: null,
      stylist: null,
      proposedDate: null,
      proposedTime: null,
      existingAppointmentId: null,
      updatedAt: Date.now(),
    };
  }

  // Persist action + existingAppointmentId in Prisma metadata
  const metaPayload: Record<string, unknown> = {};
  if (signal.action) metaPayload.action = signal.action;
  if (signal.existingAppointmentId) metaPayload.existingAppointmentId = signal.existingAppointmentId;

  return upsertContextWithMeta(conversationId, {
    stage: signal.nextStage,
    service: signal.service,
    proposedDate: signal.date ?? undefined,
    proposedTime: signal.time ?? undefined,
  }, metaPayload, tenantId);
}

async function upsertContextWithMeta(
  conversationId: string,
  partial: Partial<BookingContextState>,
  metaPayload: Record<string, unknown>,
  tenantId?: string,
): Promise<BookingContextState> {
  gc();
  if (!tenantId) {
    return {
      conversationId,
      tenantId,
      stage: partial.stage ?? "idle",
      action: "new",
      service: null,
      stylist: null,
      proposedDate: null,
      proposedTime: null,
      existingAppointmentId: null,
      updatedAt: Date.now(),
    };
  }

  const k = keyFor(conversationId, tenantId);
  const existing = l1Cache.get(k) ?? (await readFromPrisma(conversationId, tenantId));

  const next: BookingContextState = {
    conversationId,
    tenantId,
    stage: "idle",
    action: "new",
    service: null,
    stylist: null,
    proposedDate: null,
    proposedTime: null,
    existingAppointmentId: null,
    updatedAt: Date.now(),
    ...existing,
    ...partial,
  };
  next.updatedAt = Date.now();

  // Update L1 cache
  l1Cache.set(k, next);

  // Write to Prisma with metadata
  try {
    const data = toPrismaUpdate(partial);
    const metadata = {
      ...(existing ? ((await readFromPrisma(conversationId, tenantId)) as any)?.metadata ?? {} : {}),
      ...metaPayload,
    };
    // We need to update metadata via a separate approach since toPrismaUpdate doesn't include it
    await prisma.whatsAppBookingContext.upsert({
      where: { conversationId },
      create: {
        conversationId,
        tenantId,
        phone: partial.service ?? "",
        stage: (partial.stage as string) ?? "idle",
        service: partial.service ?? null,
        stylist: partial.stylist ?? null,
        date: partial.proposedDate ?? null,
        time: partial.proposedTime ?? null,
        metadata: metaPayload as any,
      },
      update: {
        ...data,
        metadata: metaPayload as any,
        tenantId,
      },
    });
  } catch (err) {
    console.warn("[booking-context] Prisma write failed:", err);
  }

  return next;
}

/**
 * Format a date ISO string (YYYY-MM-DD) into a human-friendly Spanish format
 * including weekday, day number, and month name.
 *
 * Example: "2026-06-01" → "lunes 01 de junio"
 *
 * Note: Must not use Node.js `Intl` for locale-based formatting to stay
 * portable. Uses a manual weekday/month map instead.
 */
export function formatBookingDate(isoDate: string): string {
  const weekdays = [
    'domingo', 'lunes', 'martes', 'miércoles',
    'jueves', 'viernes', 'sábado',
  ];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  const d = new Date(isoDate + 'T12:00:00');
  if (isNaN(d.getTime())) return isoDate;

  const weekday = weekdays[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];

  return `${weekday} ${day} de ${month}`;
}
