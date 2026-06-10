// ================================================================
// api/business-settings/route.ts — Configuración del negocio actual
// GET  → devuelve tenant config + business_settings del tenant autenticado
// PATCH → actualiza business_settings
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tienes un tenant asignado." }, { status: 403 });
  }

  try {
    const [tenant, businessSettings, aiSettings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          slug: true,
          businessName: true,
          businessType: true,
          ownerName: true,
          ownerEmail: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          secondaryColor: true,
          faviconUrl: true,
          tagline: true,
          timezone: true,
          language: true,
          licenseStatus: true,
          licenseExpiresAt: true,
        },
      }),
      prisma.businessSettings.findUnique({
        where: { tenantId },
      }),
      prisma.aiSettings.findUnique({
        where: { tenantId },
      }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      tenant,
      businessSettings,
      aiSettings,
      branding: {
        logoUrl: tenant.logoUrl,
        bannerUrl: tenant.bannerUrl,
        faviconUrl: tenant.faviconUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        businessName: tenant.businessName,
        businessType: tenant.businessType,
        tagline: tenant.tagline,
      },
    });
  } catch (err: any) {
    console.error("[business-settings] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tienes un tenant asignado." }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Allowed fields for business_settings
    const allowedBsKeys = [
      "businessHours", "services", "stylists", "holidays",
      "lunchBreak", "lastAcceptedTime", "minimumBufferMinutes",
      "latePolicy", "brandTone", "shortDescription", "mainPromise",
    ];

    // Allowed fields for tenant (branding)
    const allowedTenantKeys = [
      "logoUrl", "bannerUrl", "primaryColor", "secondaryColor",
      "faviconUrl", "tagline", "businessName", "businessType",
      "timezone", "language",
    ];

    // Update business_settings
    const bsData: any = {};
    for (const key of allowedBsKeys) {
      if (body[key] !== undefined) {
        bsData[key] = body[key];
      }
    }

    // Update tenant branding
    const tenantData: any = {};
    for (const key of allowedTenantKeys) {
      if (body[key] !== undefined) {
        tenantData[key] = body[key];
      }
    }

    const results: any = {};

    if (Object.keys(bsData).length > 0) {
      results.businessSettings = await prisma.businessSettings.upsert({
        where: { tenantId },
        create: { tenantId, ...bsData },
        update: bsData,
      });
    }

    if (Object.keys(tenantData).length > 0) {
      results.tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: tenantData,
      });
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err: any) {
    console.error("[business-settings] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
