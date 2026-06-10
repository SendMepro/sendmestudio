import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { emitWhatsAppEvent } from "../whatsapp/realtime";
import { recordAnalyticsEvent } from "../whatsapp/store";
import { createAttribution } from "../../../data/attribution-store";
import { readSalonConfig } from "../../data/salon-config-store";
import { validateBusinessHours } from "@/lib/booking-validator";
import { BusinessEventBus } from "../../../agents/system/BusinessEventBus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Shared helpers (mirrors /api/calendar/appointments) ─────────────────────

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/** Check if two time ranges overlap */
function rangesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

type Appointment = {
  id: string;
  status: "confirmed" | "pending" | "cancelled";
  conversationId?: string;
  customerName: string;
  customerPhone: string;
  service: string;
  serviceId?: string;
  durationMinutes?: number;
  stylist: string;
  stylistId?: string;
  date: string;
  time: string;
  slotId?: string;
  source: "inbox_booking" | "manual";
  createdAt: string;
};

type AppointmentRequest = Partial<Appointment> & {
  clientName?: string;
  specialist?: string;
  attributionType?: "ai_full" | "ai_assisted" | "human" | "ai_cancelled";
  estimatedValue?: number;
};

function fromPrismaAppointment(a: any): Appointment {
  return {
    id: a.id,
    status: a.status as Appointment["status"],
    conversationId: a.conversationId ?? undefined,
    customerName: a.customerName,
    customerPhone: a.customerPhone,
    service: a.service,
    serviceId: a.serviceId ?? undefined,
    durationMinutes: a.durationMinutes ?? undefined,
    stylist: a.stylist,
    stylistId: a.stylistId ?? undefined,
    date: a.date,
    time: a.time,
    slotId: a.slotId ?? undefined,
    source: a.source as Appointment["source"],
    createdAt: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const records = await prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records.map(fromPrismaAppointment));
  } catch (err) {
    console.warn("[appointments] Prisma error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const body = (await request.json()) as AppointmentRequest;
  const customerName = body.customerName ?? body.clientName ?? "Cliente WhatsApp";
  const customerPhone = body.customerPhone ?? "";
  const service = body.service ?? "Servicio";
  const stylist = body.stylist ?? body.specialist ?? "Equipo SendMe Studio";
  const stylistId = body.stylistId ?? null;
  const date = body.date ?? "";
  const time = body.time ?? "";
  const durationMinutes = body.durationMinutes ?? 60;
  const endTime = computeEndTime(time, durationMinutes);

  // ── Validate business hours ──
  const hoursValidation = await validateBusinessHours(tenantId, date, time);
  if (!hoursValidation.valid) {
    return NextResponse.json(
      { error: hoursValidation.error },
      { status: 400 },
    );
  }

  // ── Conflict detection (unified) ──
  if (stylistId) {
    try {
      const existingAppts = await prisma.appointment.findMany({
        where: {
          tenantId,
          stylistId,
          date,
          status: { not: "cancelled" },
        },
        select: { id: true, time: true, endTime: true, customerName: true, service: true },
      });

      const conflicts = existingAppts.filter((a) => {
        const aEnd = a.endTime ?? computeEndTime(a.time, 60);
        return rangesOverlap(time, endTime, a.time, aEnd);
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Conflicto de horario",
            conflict: true,
            conflicts: conflicts.map((c) => ({
              id: c.id,
              customerName: c.customerName,
              serviceName: c.service,
              startTime: c.time,
              endTime: c.endTime,
            })),
            message: `${stylist} ya tiene una cita de ${conflicts[0].time} a ${conflicts[0].endTime} con ${conflicts[0].customerName}`,
          },
          { status: 409 },
        );
      }
    } catch (err) {
      console.warn("[appointments] Conflict check failed:", err);
    }
  }

  // ── Create appointment in Prisma (primary store, no JSON fallback) ──
  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: {
        tenantId,
        customerName,
        customerPhone,
        service,
        serviceId: body.serviceId,
        durationMinutes,
        stylist,
        stylistId,
        date,
        time,
        endTime,
        slotId: body.slotId,
        status: "confirmed",
        source: "inbox_booking",
        conversationId: body.conversationId,
      },
    });
  } catch (err: any) {
    console.error("[appointments] Prisma create failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // ── Analytics & attribution ──
  if (body.conversationId) {
    await recordAnalyticsEvent({
      conversationId: body.conversationId,
      type: "appointment_scheduled",
      metadata: {
        appointmentId: appointment.id,
        service,
        stylist,
        date,
        time,
        source: "inbox_booking",
      },
    });

    let attributionType = body.attributionType;
    if (!attributionType) {
      attributionType = "ai_full";
    }

    let mode: "automatic" | "scheduled" | "manual" = "automatic";
    try {
      const config = await readSalonConfig();
      const rawMode = config.defaultMode;
      if (rawMode === "automatic" || rawMode === "scheduled" || rawMode === "manual") {
        mode = rawMode;
      }
    } catch { /* fallback */ }

    await createAttribution({
      sourceId: `appointment_${appointment.id}`,
      conversationId: body.conversationId,
      customerName,
      phone: customerPhone,
      serviceName: service,
      estimatedValue: body.estimatedValue,
      attributionType,
      mode,
      bookingStatus: "confirmed",
    });
  }

  emitWhatsAppEvent({
    type: "appointment_scheduled",
    appointment: fromPrismaAppointment(appointment),
    conversationId: body.conversationId,
  });

  // ── BusinessEvent: appointment created ──
  BusinessEventBus.emit({
    type: 'appointment_created',
    timestamp: new Date().toISOString(),
    conversationId: body.conversationId,
    metadata: {
      appointmentId: appointment.id,
      customerName,
      service,
      date,
      time,
      stylist,
      tenantId,
    },
  });

  return NextResponse.json({ success: true, appointment: fromPrismaAppointment(appointment) }, { status: 201 });
}
