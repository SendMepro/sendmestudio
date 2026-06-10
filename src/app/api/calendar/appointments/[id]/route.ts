import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { BusinessEventBus } from "@/agents/system/BusinessEventBus";
import { validateBusinessHours } from "@/lib/booking-validator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Check if two time ranges overlap */
function rangesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const allowed = [
      "customerName", "customerPhone", "service", "stylist", "stylistId",
      "date", "time", "durationMinutes", "estimatedValue", "status",
      "source", "conversationId",
    ];

    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        const dbKey = key === "customerPhone" ? "customerPhone" : key;
        updateData[dbKey] = body[key];
      }
    }

    // Re-compute endTime if time or durationMinutes changed
    const newTime = (body.time as string) ?? existing.time;
    const newDuration = (body.durationMinutes as number) ?? existing.durationMinutes ?? 60;
    updateData.endTime = computeEndTime(newTime, newDuration);

    // ── Validate business hours if date/time changed ──
    const newDate = (body.date as string) ?? existing.date;
    if (body.date || body.time) {
      const hoursValidation = await validateBusinessHours(tenantId, newDate, newTime);
      if (!hoursValidation.valid) {
        return NextResponse.json(
          { error: hoursValidation.error },
          { status: 400 },
        );
      }
    }

    // ── Conflict detection on update ──
    const newStylistId = (body.stylistId as string) ?? existing.stylistId;

    if (newStylistId) {
      const conflicts = await prisma.appointment.findMany({
        where: {
          tenantId,
          stylistId: newStylistId,
          date: newDate,
          status: { not: "cancelled" },
          id: { not: id },
        },
        select: { id: true, time: true, endTime: true, customerName: true },
      });

      const matchingConflicts = conflicts.filter((a: typeof conflicts[number]) => {
        const aEnd = a.endTime ?? computeEndTime(a.time, 60);
        return rangesOverlap(newTime, updateData.endTime as string, a.time, aEnd);
      });

      if (matchingConflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Conflicto de horario",
            conflict: true,
            conflicts: matchingConflicts.map((c: typeof matchingConflicts[number]) => ({
              id: c.id,
              customerName: c.customerName,
              startTime: c.time,
              endTime: c.endTime,
            })),
            message: `El/La estilista ya tiene una cita de ${matchingConflicts[0].time} a ${matchingConflicts[0].endTime} con ${matchingConflicts[0].customerName}`,
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData as any,
    });

    // ── BusinessEvent: appointment rescheduled/cancelled ──
    if (body.status === "cancelled") {
      BusinessEventBus.emit({
        type: 'appointment_cancelled',
        timestamp: new Date().toISOString(),
        conversationId: existing.conversationId ?? undefined,
        metadata: {
          appointmentId: id,
          customerName: existing.customerName,
          service: existing.service,
          date: existing.date,
          time: existing.time,
          tenantId,
        },
      });
    } else if (body.date || body.time || body.stylistId) {
      // Detect reschedule: date/time/stylist changed
      const dateChanged = body.date && body.date !== existing.date;
      const timeChanged = body.time && body.time !== existing.time;
      if (dateChanged || timeChanged) {
        BusinessEventBus.emit({
          type: 'appointment_rescheduled',
          timestamp: new Date().toISOString(),
          conversationId: existing.conversationId ?? undefined,
          metadata: {
            appointmentId: id,
            customerName: existing.customerName,
            previousDate: existing.date,
            previousTime: existing.time,
            newDate: updated.date,
            newTime: updated.time,
            tenantId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    console.error("[calendar/appointments/patch] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const { id } = await params;

  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" } as any,
    });

    // ── BusinessEvent: appointment cancelled ──
    BusinessEventBus.emit({
      type: 'appointment_cancelled',
      timestamp: new Date().toISOString(),
      conversationId: existing.conversationId ?? undefined,
      metadata: {
        appointmentId: id,
        customerName: existing.customerName,
        service: existing.service,
        date: existing.date,
        time: existing.time,
        tenantId,
      },
    });

    return NextResponse.json({ success: true, status: "cancelled" });
  } catch (err: any) {
    console.error("[calendar/appointments/delete] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
