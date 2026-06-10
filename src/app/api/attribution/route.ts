import { NextResponse } from "next/server";
import {
  createAttribution,
  readAttributions,
  getAttributionsToday,
  getAttributionsByDate,
  updateAttributionStatus,
} from "../../../data/attribution-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/attribution
 *
 * Query params:
 *   - date: optional date filter (YYYY-MM-DD). Defaults to today.
 *   - all: if "true", returns all attributions without date filter.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const all = searchParams.get("all") === "true";

  let attributions;
  if (all) {
    attributions = await readAttributions();
  } else if (date) {
    attributions = await getAttributionsByDate(date);
  } else {
    attributions = await getAttributionsToday();
  }

  // Compute aggregate metrics
  const aiReservations = attributions.filter(
    (a: { attributionType: string }) => a.attributionType === "ai_full" || a.attributionType === "ai_assisted"
  );
  const humanReservations = attributions.filter((a: { attributionType: string }) => a.attributionType === "human");
  const cancelledAI = attributions.filter((a: { attributionType: string }) => a.attributionType === "ai_cancelled");

  const totalAI = aiReservations.length;
  const totalHuman = humanReservations.length;
  const totalCancelledAI = cancelledAI.length;

  const valueGeneratedAI = aiReservations.reduce((sum: number, a: { estimatedValue: number }) => sum + a.estimatedValue, 0);
  const valueGeneratedHuman = humanReservations.reduce((sum: number, a: { estimatedValue: number }) => sum + a.estimatedValue, 0);

  const totalConversions = totalAI + totalHuman + totalCancelledAI;
  const conversionRateAI =
    totalConversions > 0
      ? Math.round((totalAI / (totalAI + totalHuman + totalCancelledAI)) * 100)
      : 0;

  const cancellationRateAI =
    totalAI + totalCancelledAI > 0
      ? Math.round((totalCancelledAI / (totalAI + totalCancelledAI)) * 100)
      : 0;

  const cancellationRateHuman =
    totalHuman > 0
      ? Math.round(
          (attributions.filter(
            (a) => a.attributionType === "human" && a.bookingStatus === "cancelled"
          ).length /
            totalHuman) *
            100
        )
      : 0;

  return NextResponse.json({
    ok: true,
    attributions,
    metrics: {
      reservationsAI: totalAI,
      reservationsHuman: totalHuman,
      valueGeneratedAI,
      valueGeneratedHuman,
      conversionRateAI,
      cancellationRateAI,
      cancellationRateHuman,
    },
  });
}

/**
 * POST /api/attribution
 *
 * Create a new reservation attribution.
 * Body:
 *   - sourceId (required): unique identifier for idempotency (e.g. "appointment_{id}")
 *   - conversationId (required)
 *   - customerName (required)
 *   - phone (required)
 *   - serviceName (required)
 *   - estimatedValue (optional, default 0)
 *   - attributionType (required): "ai_full" | "ai_assisted" | "human" | "ai_cancelled"
 *   - mode (required): "automatic" | "scheduled" | "manual"
 *   - bookingStatus (optional, default "pending"): "pending" | "confirmed" | "cancelled"
 */
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.sourceId || !body.conversationId || !body.attributionType || !body.mode) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: sourceId, conversationId, attributionType, mode" },
      { status: 400 }
    );
  }

  const validTypes = ["ai_full", "ai_assisted", "human", "ai_cancelled"];
  if (!validTypes.includes(body.attributionType)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid attributionType. Must be one of: ${validTypes.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const attribution = await createAttribution({
    sourceId: body.sourceId,
    conversationId: body.conversationId,
    customerName: body.customerName ?? "Cliente WhatsApp",
    phone: body.phone ?? "",
    serviceName: body.serviceName ?? "Servicio",
    estimatedValue: body.estimatedValue,
    attributionType: body.attributionType,
    mode: body.mode,
    bookingStatus: body.bookingStatus,
  });

  return NextResponse.json({ ok: true, attribution }, { status: 201 });
}

/**
 * PATCH /api/attribution
 *
 * Update bookingStatus of an attribution.
 * Body:
 *   - id (required)
 *   - bookingStatus (required): "pending" | "confirmed" | "cancelled"
 */
export async function PATCH(request: Request) {
  const body = await request.json();

  if (!body.id || !body.bookingStatus) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: id, bookingStatus" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (!validStatuses.includes(body.bookingStatus)) {
    return NextResponse.json(
      { ok: false, error: `Invalid bookingStatus. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await updateAttributionStatus(body.id, body.bookingStatus);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Attribution not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, attribution: updated });
}
