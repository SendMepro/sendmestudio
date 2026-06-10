// ================================================================
// api/customers/[phone]/route.ts — Customer detail + memory + timeline
// GET /api/customers/[phone] → customer profile + customer memory + timeline
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const { phone } = await params;
  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  try {
    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get customer memory
    const memory = await prisma.customerMemory.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });

    // Get appointments timeline
    const appointments = await prisma.appointment.findMany({
      where: { tenantId, customerPhone: phone },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 20,
    });

    // Get WhatsApp messages
    const messages = await prisma.whatsAppMessage.findMany({
      where: { tenantId, phone },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Get campaign history for this customer
    const campaignHistory = await prisma.campaignHistory.findMany({
      where: { tenantId, phone },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Build timeline
    const timeline: TimelineEvent[] = [];

    for (const a of appointments) {
      timeline.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: `${a.service} con ${a.stylist}`,
        description: a.status === "cancelled" ? "Cancelada" : `${a.date} ${a.time}`,
        date: `${a.date}T${a.time}`,
        status: a.status,
        value: a.estimatedValue,
      });
    }

    for (const m of messages) {
      timeline.push({
        id: `msg-${m.id}`,
        type: "message",
        title: m.direction === "inbound" ? `Mensaje de ${m.senderName}` : `Mensaje a ${m.senderName}`,
        description: m.content.substring(0, 120),
        date: m.timestamp,
        direction: m.direction,
      });
    }

    for (const ch of campaignHistory) {
      timeline.push({
        id: `camp-${ch.id}`,
        type: "campaign",
        title: `Campaña: ${ch.campaignName}`,
        description: `Acción: ${ch.action}`,
        date: ch.createdAt.toISOString(),
        campaignName: ch.campaignName,
      });
    }

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Compute intelligence metrics
    const intelligence = computeCustomerIntelligence(customer, appointments, memory);

    return NextResponse.json({
      ok: true,
      customer: fromPrismaCustomerFlat(customer),
      memory: memory ? {
        id: memory.id,
        phone: memory.phone,
        profile: memory.profile,
        signals: memory.signals,
        metadata: memory.metadata,
      } : null,
      timeline,
      intelligence,
      stats: {
        totalAppointments: appointments.length,
        totalMessages: messages.length,
        totalCampaignActions: campaignHistory.length,
        lastAppointment: appointments[0] || null,
        lastMessage: messages[0] || null,
      },
    });
  } catch (err: any) {
    console.error("[customers/phone] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

type TimelineEvent = {
  id: string;
  type: "appointment" | "message" | "campaign" | "purchase" | "note";
  title: string;
  description: string;
  date: string;
  status?: string;
  value?: number | null;
  direction?: string;
  campaignName?: string;
};

function fromPrismaCustomerFlat(c: any) {
  return {
    id: c.id,
    phone: c.phone,
    displayName: c.displayName,
    firstName: c.firstName,
    tags: c.tags,
    interests: c.interests,
    requestedServices: c.requestedServices,
    lastVisit: c.lastVisit,
    lastConversationAt: c.lastConversationAt,
    preferredStylist: c.preferredStylist,
    favoriteServices: c.favoriteServices,
    campaignEligible: c.campaignEligible,
    consentWhatsapp: c.consentWhatsapp,
    notes: c.notes,
    aiSummary: c.aiSummary,
    lifecycleStage: c.lifecycleStage,
    serviceHistory: c.serviceHistory,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
  };
}

function computeCustomerIntelligence(
  customer: any,
  appointments: any[],
  memory: any | null,
) {
  const now = new Date();
  const totalAppointments = appointments.length;

  // Loyalty level based on visit frequency
  let loyaltyLevel: "new" | "bronze" | "silver" | "gold" | "platinum" = "new";
  if (totalAppointments >= 20) loyaltyLevel = "platinum";
  else if (totalAppointments >= 10) loyaltyLevel = "gold";
  else if (totalAppointments >= 5) loyaltyLevel = "silver";
  else if (totalAppointments >= 2) loyaltyLevel = "bronze";

  // Price sensitivity from memory signals
  const signals = (memory?.signals as any[]) ?? [];
  const priceSensitive = signals.some(
    (s: any) => s.type === "price_sensitivity" && s.value === true,
  );

  // Return probability (simple heuristic)
  const daysSinceLastVisit = customer.lastVisit
    ? Math.floor((now.getTime() - new Date(customer.lastVisit).getTime()) / 86400000)
    : 999;
  let returnProbability: "alta" | "media" | "baja" = "media";
  if (daysSinceLastVisit < 30) returnProbability = "alta";
  else if (daysSinceLastVisit > 90) returnProbability = "baja";

  // Emotional profile from signals
  const emotionalTraits: string[] = [];
  for (const s of signals) {
    if (s.type === "waiting_sensitivity") {
      emotionalTraits.push(s.value === "high" ? "Poco paciente" : "Paciente");
    }
    if (s.type === "stylist") {
      emotionalTraits.push(`Preferencia: ${s.value}`);
    }
    if (s.type === "transport") {
      emotionalTraits.push("Llega en auto");
    }
    if (s.type === "allergy") {
      emotionalTraits.push(`Alergia: ${s.value}`);
    }
  }

  // Total historical value (estimated from appointments)
  const historicalValue = appointments.reduce(
    (sum: number, a: any) => sum + (a.estimatedValue || 0),
    0,
  );

  // Emotional summary from AI summary + signals
  const emotionalSummary = memory?.profile
    ? (memory.profile as any)?.emotionalSummary ?? null
    : null;

  return {
    loyaltyLevel,
    priceSensitive,
    returnProbability,
    emotionalTraits: [...new Set(emotionalTraits)],
    emotionalSummary,
    historicalValue,
    daysSinceLastVisit,
    totalAppointments,
    preferredStylist: customer.preferredStylist,
    favoriteServices: customer.favoriteServices,
    lifecycleStage: customer.lifecycleStage,
    aiSummary: customer.aiSummary,
  };
}
