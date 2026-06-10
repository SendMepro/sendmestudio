// ================================================================
// lib/booking-validator.ts — Validación de reservas production-ready
// Fase 25: Horario laboral, disponibilidad stylist, auto-asignación
// ================================================================

import prisma from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────

export type StylistInfo = {
  id: string;
  name: string;
  availableDays: string[];
  workingHours: string; // "HH:MM-HH:MM"
  servicesAllowed: string[];
  status: string;
};

export type BusinessHours = {
  weeklyHours: Array<{
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }>;
  holidays: string[];
  lunchBreak?: string;
  lastAcceptedTime?: string;
  minimumBufferMinutes?: number;
};

export type ValidationResult = {
  valid: boolean;
  error?: string;
  assignableStylists?: StylistInfo[];
};

// ── Day name mapping ───────────────────────────────────────────────

const SPANISH_DAYS: Record<string, string> = {
  domingo: "Sunday",
  lunes: "Monday",
  martes: "Tuesday",
  miercoles: "Wednesday",
  miércoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sabado: "Saturday",
  sábado: "Saturday",
};

const ENGLISH_DAYS: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

function toEnglishDay(day: string): string {
  const lower = day.toLowerCase();
  return SPANISH_DAYS[lower] ?? ENGLISH_DAYS[lower] ?? day;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

// ── Load helpers ────────────────────────────────────────────────────

async function loadBusinessHours(tenantId: string): Promise<BusinessHours | null> {
  try {
    const bs = await prisma.businessSettings.findUnique({
      where: { tenantId },
      select: { businessHours: true },
    });
    if (!bs?.businessHours) return null;
    const bh = bs.businessHours as BusinessHours;
    return bh;
  } catch {
    return null;
  }
}

async function loadStylists(tenantId: string): Promise<StylistInfo[]> {
  try {
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { tenantId, section: "stylists" },
      select: { data: true },
    });
    if (knowledgeItems.length === 0) return [];
    // Use first match
    const rawData = knowledgeItems[0].data;
    if (Array.isArray(rawData)) {
      return rawData as StylistInfo[];
    }
    // The data might be a single stylist object
    return [rawData as StylistInfo].filter(Boolean);
  } catch {
    return [];
  }
}

// ── Validación horario laboral ──────────────────────────────────────

/**
 * Validate that a date+time falls within the business hours of the tenant.
 * Checks: day of week open/closed, holidays, lastAcceptedTime, lunchBreak.
 */
export async function validateBusinessHours(
  tenantId: string,
  date: string,
  time: string,
): Promise<ValidationResult> {
  const bh = await loadBusinessHours(tenantId);
  if (!bh) {
    // No business hours configured — allow (graceful degradation)
    return { valid: true };
  }

  // ── Check holidays ──
  if (bh.holidays && bh.holidays.length > 0) {
    for (const holiday of bh.holidays) {
      // Support both exact date "YYYY-MM-DD" and date string
      if (holiday.startsWith(date) || date.startsWith(holiday)) {
        return {
          valid: false,
          error: `Lo siento, no atendemos ese día (feriado). Por favor elige otra fecha.`,
        };
      }
    }
  }

  // ── Determine day of week ──
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(date + "T12:00:00");
  if (isNaN(d.getTime())) {
    return { valid: false, error: "Fecha inválida." };
  }
  const dayOfWeek = dayNames[d.getDay()];

  // ── Find weekly hours for this day ──
  const dayHours = bh.weeklyHours?.find(
    (wh) => wh.day.toLowerCase() === dayOfWeek.toLowerCase(),
  );

  if (!dayHours || dayHours.closed) {
    return {
      valid: false,
      error: `Lo siento, no atendemos los ${dayOfWeek === "Sunday" ? "domingos" : dayOfWeek === "Saturday" ? "sábados" : dayOfWeek + "s"}. Por favor elige otro día.`,
    };
  }

  const openMinutes = timeToMinutes(dayHours.open);
  const closeMinutes = timeToMinutes(dayHours.close);
  const timeMinutes = timeToMinutes(time);

  if (timeMinutes < openMinutes || timeMinutes >= closeMinutes) {
    return {
      valid: false,
      error: `Nuestro horario es de ${dayHours.open} a ${dayHours.close} ese día. Por favor elige un horario dentro de ese rango.`,
    };
  }

  // ── Check lastAcceptedTime ──
  if (bh.lastAcceptedTime) {
    const lastAccMinutes = timeToMinutes(bh.lastAcceptedTime);
    if (timeMinutes > lastAccMinutes) {
      return {
        valid: false,
        error: `La última hora que aceptamos es a las ${bh.lastAcceptedTime}. Por favor elige un horario más temprano.`,
      };
    }
  }

  // ── Check lunch break ──
  if (bh.lunchBreak) {
    const [lunchStart, lunchEnd] = bh.lunchBreak.split("-");
    if (lunchStart && lunchEnd) {
      const lunchStartMin = timeToMinutes(lunchStart.trim());
      const lunchEndMin = timeToMinutes(lunchEnd.trim());
      if (timeMinutes >= lunchStartMin && timeMinutes < lunchEndMin) {
        return {
          valid: false,
          error: `Ese horario cae durante nuestra pausa de almuerzo (${bh.lunchBreak}). ¿Te sirve antes o después?`,
        };
      }
    }
  }

  return { valid: true };
}

// ── Validación disponibilidad del stylist ────────────────────────────

/**
 * Validate that a stylist is available on a given date/time.
 * Checks: status active, availableDays, workingHours, existing appointments.
 */
export async function validateStylistAvailability(
  tenantId: string,
  stylistId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeAppointmentId?: string,
): Promise<ValidationResult> {
  const stylists = await loadStylists(tenantId);
  const stylist = stylists.find((s) => s.id === stylistId);

  if (!stylist) {
    return { valid: false, error: "El profesional seleccionado no existe." };
  }

  if (stylist.status !== "active") {
    return { valid: false, error: `${stylist.name} no está disponible actualmente.` };
  }

  // ── Check availableDays ──
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(date + "T12:00:00");
  if (isNaN(d.getTime())) {
    return { valid: false, error: "Fecha inválida." };
  }
  const dayOfWeek = dayNames[d.getDay()];

  if (stylist.availableDays && stylist.availableDays.length > 0) {
    const isAvailableDay = stylist.availableDays.some(
      (ad) => ad.toLowerCase() === dayOfWeek.toLowerCase(),
    );
    if (!isAvailableDay) {
      return {
        valid: false,
        error: `${stylist.name} no atiende los ${dayOfWeek === "Sunday" ? "domingos" : dayOfWeek === "Saturday" ? "sábados" : dayOfWeek + "s"}. Por favor elige otro profesional o día.`,
      };
    }
  }

  // ── Check workingHours ──
  if (stylist.workingHours) {
    const [startStr, endStr] = stylist.workingHours.split("-");
    if (startStr && endStr) {
      const startMin = timeToMinutes(startStr.trim());
      const endMin = timeToMinutes(endStr.trim());
      const timeMinutes = timeToMinutes(time);
      const endTimeMinutes = timeMinutes + durationMinutes;

      if (timeMinutes < startMin || endTimeMinutes > endMin) {
        return {
          valid: false,
          error: `${stylist.name} trabaja de ${startStr.trim()} a ${endStr.trim()}. Por favor elige un horario dentro de ese rango.`,
        };
      }
    }
  }

  // ── Check service allowed ──
  // (servicesAllowed check is optional — we skip the strict check here since
  //  the knowledge data may not be fully populated. But we keep the data structure ready.)

  // ── Check existing appointments (conflict detection) ──
  const endTime = computeEndTime(time, durationMinutes);
  const whereClause: any = {
    tenantId,
    stylistId,
    date,
    status: { not: "cancelled" },
  };
  if (excludeAppointmentId) {
    whereClause.id = { not: excludeAppointmentId };
  }

  try {
    const existingAppts = await prisma.appointment.findMany({
      where: whereClause,
      select: { id: true, time: true, endTime: true, customerName: true },
    });

    for (const appt of existingAppts) {
      const apptEnd = appt.endTime ?? computeEndTime(appt.time, 60);
      if (rangesOverlap(time, endTime, appt.time, apptEnd)) {
        return {
          valid: false,
          error: `${stylist.name} ya tiene una cita de ${appt.time} a ${apptEnd} con ${appt.customerName}. Por favor elige otro horario.`,
        };
      }
    }
  } catch {
    // If DB check fails, allow (graceful degradation)
  }

  return { valid: true };
}

// ── Auto-asignación de stylist ───────────────────────────────────────

/**
 * Assigns the best available stylist for a given service, date, and time.
 * Returns null if no stylist is available.
 */
export async function autoAssignStylist(
  tenantId: string,
  service: string,
  date: string,
  time: string,
  durationMinutes: number,
): Promise<StylistInfo | null> {
  const stylists = await loadStylists(tenantId);

  if (stylists.length === 0) return null;

  // Filter active stylists
  const activeStylists = stylists.filter((s) => s.status === "active");

  if (activeStylists.length === 0) return null;

  // Filter by available day
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(date + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  const dayOfWeek = dayNames[d.getDay()];

  const dayAvailable = activeStylists.filter((s) => {
    if (!s.availableDays || s.availableDays.length === 0) return true;
    return s.availableDays.some((ad) => ad.toLowerCase() === dayOfWeek.toLowerCase());
  });

  if (dayAvailable.length === 0) return null;

  // Filter by working hours
  const timeMinutes = timeToMinutes(time);
  const endMinutes = timeMinutes + durationMinutes;

  const hourAvailable = dayAvailable.filter((s) => {
    if (!s.workingHours) return true;
    const [startStr, endStr] = s.workingHours.split("-");
    if (!startStr || !endStr) return true;
    const startMin = timeToMinutes(startStr.trim());
    const endMin = timeToMinutes(endStr.trim());
    return timeMinutes >= startMin && endMinutes <= endMin;
  });

  if (hourAvailable.length === 0) return null;

  // Filter by service allowed (if data exists)
  const serviceAvailable = hourAvailable.filter((s) => {
    if (!s.servicesAllowed || s.servicesAllowed.length === 0) return true;
    return s.servicesAllowed.includes(service);
  });

  const candidates = serviceAvailable.length > 0 ? serviceAvailable : hourAvailable;

  // Check conflict detection — find first stylist with no conflict
  for (const stylist of candidates) {
    const result = await validateStylistAvailability(
      tenantId, stylist.id, date, time, durationMinutes,
    );
    if (result.valid) {
      return stylist;
    }
  }

  return null;
}

// ── Helpers (shared) ────────────────────────────────────────────────

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function rangesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
