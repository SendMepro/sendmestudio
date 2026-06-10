import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { validateBusinessHours, autoAssignStylist } from "@/lib/booking-validator";
import { BusinessEventBus } from "../../../../agents/system/BusinessEventBus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateBody = {
  customerName: string;
  phone: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  estimatedValue: number;
  status?: "pending" | "confirmed" | "cancelled";
  source?: "manual" | "ai" | "campaign";
  conversationId?: string;
};

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

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;

  try {
    const appointments = await prisma.appointment.findMany({
      where: { tenantId: ctx!.tenantId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(
      appointments.map((a: typeof appointments[number]) => ({
        id: a.id,
        customerName: a.customerName,
        phone: a.customerPhone,
        serviceName: a.service,
        stylistId: a.stylistId ?? "",
        stylistName: a.stylist,
        date: a.date,
        startTime: a.time,
        endTime: a.endTime ?? computeEndTime(a.time, a.durationMinutes || 60),
        durationMinutes: a.durationMinutes || 60,
        estimatedValue: a.estimatedValue ?? 0,
        status: a.status as string,
        source: a.source,
        conversationId: a.conversationId ?? undefined,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    console.warn("[calendar/appointments] Prisma error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const body = (await request.json()) as CreateBody;

  if (!body.customerName || !body.date || !body.startTime) {
    return NextResponse.json(
      { error: "customerName, date, and startTime are required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const endTime = computeEndTime(body.startTime, body.durationMinutes || 60);

  // ── Validate business hours ──
  const hoursValidation = await validateBusinessHours(tenantId, body.date, body.startTime);
  if (!hoursValidation.valid) {
    return NextResponse.json(
      { error: hoursValidation.error },
      { status: 400 },
    );
  }

  // ── Auto-assign stylist if not specified ──
  if (!body.stylistId) {
    const assigned = await autoAssignStylist(
      tenantId,
      body.serviceName || "Servicio",
      body.date,
      body.startTime,
      body.durationMinutes || 60,
    );
    if (assigned) {
      body.stylistId = assigned.id;
      body.stylistName = assigned.name;
    }
  }

  // ── Conflict detection ──
  if (body.stylistId) {
    try {
      const existingAppts = await prisma.appointment.findMany({
        where: {
          tenantId,
          stylistId: body.stylistId,
          date: body.date,
          status: { not: "cancelled" },
        },
        select: { id: true, time: true, endTime: true, customerName: true, service: true },
      });

      const conflicts = existingAppts.filter((a: typeof existingAppts[number]) => {
        const aEnd = a.endTime ?? computeEndTime(a.time, 60);
        return rangesOverlap(body.startTime, endTime, a.time, aEnd);
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Conflicto de horario",
            conflict: true,
            conflicts: conflicts.map((c: typeof conflicts[number]) => ({
              id: c.id,
              customerName: c.customerName,
              serviceName: c.service,
              startTime: c.time,
              endTime: c.endTime,
            })),
            message: `${body.stylistName} ya tiene una cita de ${conflicts[0].time} a ${conflicts[0].endTime} con ${conflicts[0].customerName}`,
          },
          { status: 409 },
        );
      }
    } catch (err) {
      console.warn("[calendar/appointments] Conflict check failed:", err);
    }
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        customerName: body.customerName,
        customerPhone: body.phone || "",
        service: body.serviceName || "Servicio",
        stylist: body.stylistName || "",
        stylistId: body.stylistId || null,
        date: body.date,
        time: body.startTime,
        endTime,
        durationMinutes: body.durationMinutes || 60,
        estimatedValue: body.estimatedValue || 0,
        status: body.status || "confirmed",
        source: body.source || "manual",
        conversationId: body.conversationId || null,
      },
    });

    // ── BusinessEvent: appointment created ──
    BusinessEventBus.emit({
      type: 'appointment_created',
      timestamp: new Date().toISOString(),
      conversationId: body.conversationId,
      metadata: {
        appointmentId: appointment.id,
        customerName: body.customerName,
        service: body.serviceName || "Servicio",
        date: body.date,
        time: body.startTime,
        stylist: body.stylistName || "",
        tenantId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        appointment: {
          ...appointment,
          phone: body.phone || "",
          serviceName: body.serviceName || "Servicio",
          startTime: body.startTime,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[calendar/appointments] Create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
