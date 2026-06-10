// ================================================================
// api/ai/context/route.ts — AI Context Builder
// Devuelve contexto completo para agentes IA:
// - Tenant info
// - Business settings
// - Knowledge items
// - Customer memory (opcional, por phone)
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/admin-helper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const customerPhone = url.searchParams.get("phone");

  try {
    // 1. Tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessType: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        tagline: true,
        timezone: true,
        language: true,
        licenseStatus: true,
      },
    });

    // 2. Business settings
    const businessSettings = await prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    // 3. Knowledge items
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });

    // Build knowledge bundle
    const knowledge: Record<string, any> = {};
    for (const item of knowledgeItems) {
      knowledge[item.section] = item.data;
    }

    // 4. Customer memory (optional)
    let customerMemory = null;
    if (customerPhone) {
      const memoryRecord = await prisma.customerMemory.findUnique({
        where: { tenantId_phone: { tenantId, phone: customerPhone } },
      });

      if (memoryRecord) {
        // Also get recent messages for this customer
        const recentMessages = await prisma.whatsAppMessage.findMany({
          where: { tenantId, phone: customerPhone },
          orderBy: { timestamp: "desc" },
          take: 10,
        });

        // Get appointments for this customer
        const appointments = await prisma.appointment.findMany({
          where: { tenantId, customerPhone: customerPhone },
          orderBy: [{ date: "desc" }, { time: "desc" }],
          take: 10,
        });

        // Get customer profile
        const customer = await prisma.customer.findUnique({
          where: { tenantId_phone: { tenantId, phone: customerPhone } },
        });

        customerMemory = {
          profile: memoryRecord.profile,
          signals: memoryRecord.signals,
          customer: customer ? {
            displayName: customer.displayName,
            firstName: customer.firstName,
            tags: customer.tags,
            lifecycleStage: customer.lifecycleStage,
            notes: customer.notes,
            aiSummary: customer.aiSummary,
            serviceHistory: customer.serviceHistory,
          } : null,
          recentMessages: recentMessages.map((m) => ({
            direction: m.direction,
            content: m.content.substring(0, 300),
            timestamp: m.timestamp,
            type: m.type,
          })),
          appointments: appointments.map((a) => ({
            service: a.service,
            stylist: a.stylist,
            date: a.date,
            time: a.time,
            status: a.status,
          })),
        };
      }
    }

    // 5. Available services (from business settings or knowledge)
    const services = businessSettings?.services ?? knowledge.services ?? [];

    return NextResponse.json({
      ok: true,
      context: {
        tenant: {
          businessName: tenant?.businessName,
          businessType: tenant?.businessType,
          tagline: tenant?.tagline,
          timezone: tenant?.timezone,
          language: tenant?.language,
        },
        businessSettings: businessSettings ? {
          businessHours: businessSettings.businessHours,
          services,
          stylists: businessSettings.stylists,
          holidays: businessSettings.holidays,
          lunchBreak: businessSettings.lunchBreak,
          lastAcceptedTime: businessSettings.lastAcceptedTime,
          minimumBufferMinutes: businessSettings.minimumBufferMinutes,
          latePolicy: businessSettings.latePolicy,
          brandTone: businessSettings.brandTone,
          shortDescription: businessSettings.shortDescription,
          mainPromise: businessSettings.mainPromise,
        } : null,
        knowledge: Object.keys(knowledge).length > 0 ? knowledge : null,
        customerMemory,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[ai/context] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
