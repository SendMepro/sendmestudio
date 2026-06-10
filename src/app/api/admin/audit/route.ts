// ================================================================
// api/admin/audit/route.ts — Auditoría de datos por tenant
// GET /api/admin/audit → conteo de todas las entidades por tenant
// GET /api/admin/audit?tenantId=xxx → solo un tenant específico
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const url = new URL(request.url);
    const tenantIdFilter = url.searchParams.get("tenantId");

    const tenants = await prisma.tenant.findMany({
      where: tenantIdFilter ? { id: tenantIdFilter } : { deletedAt: null },
      select: {
        id: true,
        slug: true,
        businessName: true,
        licenseStatus: true,
        isActive: true,
      },
    });

    const auditData = await Promise.all(
      tenants.map(async (tenant: { id: string; slug: string; businessName: string; licenseStatus: string; isActive: boolean }) => {
        const [
          customerCount,
          appointmentCount,
          campaignCount,
          whatsappCount,
          knowledgeCount,
          customerMemoryCount,
          fileCount,
          audienceCount,
          campaignHistoryCount,
        ] = await Promise.all([
          prisma.customer.count({ where: { tenantId: tenant.id } }),
          prisma.appointment.count({ where: { tenantId: tenant.id } }),
          prisma.campaign.count({ where: { tenantId: tenant.id } }),
          prisma.whatsAppMessage.count({ where: { tenantId: tenant.id } }),
          prisma.knowledgeItem.count({ where: { tenantId: tenant.id } }),
          prisma.customerMemory.count({ where: { tenantId: tenant.id } }),
          prisma.file.count({ where: { tenantId: tenant.id } }),
          prisma.audience.count({ where: { tenantId: tenant.id } }),
          prisma.campaignHistory.count({ where: { tenantId: tenant.id } }),
        ]);

        return {
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            businessName: tenant.businessName,
            licenseStatus: tenant.licenseStatus,
            isActive: tenant.isActive,
          },
          counts: {
            customers: customerCount,
            appointments: appointmentCount,
            campaigns: campaignCount,
            whatsappMessages: whatsappCount,
            knowledgeItems: knowledgeCount,
            customerMemory: customerMemoryCount,
            files: fileCount,
            audiences: audienceCount,
            campaignHistory: campaignHistoryCount,
          },
        };
      }),
    );

    const totals = auditData.reduce(
      (acc: { customers: number; appointments: number; campaigns: number; whatsappMessages: number; knowledgeItems: number; customerMemory: number; files: number; audiences: number; campaignHistory: number }, t: { counts: { customers: number; appointments: number; campaigns: number; whatsappMessages: number; knowledgeItems: number; customerMemory: number; files: number; audiences: number; campaignHistory: number } }) => {
        for (const [key, val] of Object.entries(t.counts)) {
          (acc as Record<string, number>)[key] = (acc as Record<string, number>)[key] + val;
        }
        return acc;
      },
      { customers: 0, appointments: 0, campaigns: 0, whatsappMessages: 0, knowledgeItems: 0, customerMemory: 0, files: 0, audiences: 0, campaignHistory: 0 },
    );

    return NextResponse.json({
      ok: true,
      tenants: auditData,
      totals,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[admin/audit] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
