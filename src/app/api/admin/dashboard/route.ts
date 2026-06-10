// ================================================================
// api/admin/dashboard/route.ts — Dashboard metrics for Super Admin
// GET /api/admin/dashboard → stats about tenants, users, licenses
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
    const now = new Date();
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      expiredTenants,
      trialTenants,
      cancelledTenants,
      tenantsExpiringSoon,
      totalUsers,
      totalOwners,
      totalCustomers,
      totalAppointments,
      totalMessages,
      totalAudiences,
      totalCampaignHistory,
      totalKnowledgeItems,
      totalFiles,
    ] = await Promise.all([
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.tenant.count({ where: { deletedAt: null, licenseStatus: "active", isActive: true } }),
      prisma.tenant.count({ where: { deletedAt: null, licenseStatus: "suspended" } }),
      prisma.tenant.count({ where: { deletedAt: null, licenseStatus: "expired" } }),
      prisma.tenant.count({ where: { deletedAt: null, licenseStatus: "trial" } }),
      prisma.tenant.count({ where: { deletedAt: null, licenseStatus: "cancelled" } }),
      prisma.tenant.count({
        where: {
          deletedAt: null,
          licenseStatus: { in: ["active", "trial"] },
          licenseExpiresAt: { not: null, lte: in15Days, gte: now },
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.userTenant.count({ where: { role: "owner" } }),
      prisma.customer.count(),
      prisma.appointment.count(),
      prisma.whatsAppMessage.count(),
      prisma.audience.count(),
      prisma.campaignHistory.count(),
      prisma.knowledgeItem.count(),
      prisma.file.count(),
    ]);

    return NextResponse.json({
      metrics: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        expiredTenants,
        trialTenants,
        cancelledTenants,
        tenantsExpiringSoon,
        totalUsers,
        totalOwners,
        totalCustomers,
        totalAppointments,
        totalMessages,
        totalAudiences,
        totalCampaignHistory,
        totalKnowledgeItems,
        totalFiles,
      },
    });
  } catch (err: any) {
    console.error("[admin/dashboard] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
