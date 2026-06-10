// ================================================================
// api/business-settings/route.ts — Configuración del negocio actual
// GET  → devuelve tenant config + business_settings del tenant autenticado
// PATCH → actualiza business_settings
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logFieldOverrideAttempt } from "@/lib/security/audit-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Zod schemas for strict validation ──

const businessSettingsSchema = z.object({
  businessHours: z.any().optional(),
  services: z.any().optional(),
  stylists: z.any().optional(),
  holidays: z.any().optional(),
  lunchBreak: z.any().optional(),
  lastAcceptedTime: z.string().optional(),
  minimumBufferMinutes: z.number().int().min(0).optional(),
  latePolicy: z.string().optional(),
  brandTone: z.string().optional(),
  shortDescription: z.string().optional(),
  mainPromise: z.string().optional(),
}).strict();

const tenantBrandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  tagline: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
}).strict();

// Fields that should NEVER be accepted from frontend
const BLOCKED_FIELDS = [
  "tenantId", "role", "isAdmin", "isSuperAdmin", "permissions",
  "ownerId", "ownerEmail", "plan", "licenseStatus", "licenseExpiresAt",
  "id", "createdAt", "updatedAt",
];

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

    // ── Block forbidden fields ──
    const blockedAttempt = BLOCKED_FIELDS.find((f) => body[f] !== undefined);
    if (blockedAttempt) {
      logFieldOverrideAttempt({
        userId: user.id,
        tenantId,
        field: blockedAttempt,
        path: request.url,
        detail: `Blocked field '${blockedAttempt}' in PATCH body`,
      });
      return NextResponse.json(
        { error: `Campo '${blockedAttempt}' no permitido en esta ruta` },
        { status: 400 },
      );
    }

    // Allowed field lists
    const allowedBsKeys = [
      "businessHours", "services", "stylists", "holidays",
      "lunchBreak", "lastAcceptedTime", "minimumBufferMinutes",
      "latePolicy", "brandTone", "shortDescription", "mainPromise",
    ];
    const allowedTenantKeys = [
      "logoUrl", "bannerUrl", "primaryColor", "secondaryColor",
      "faviconUrl", "tagline", "businessName", "businessType",
      "timezone", "language",
    ];

    // ── Separate business settings from tenant branding ──
    const bsPayload: Record<string, unknown> = {};
    const tenantPayload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedBsKeys.includes(key)) {
        bsPayload[key] = value;
      }
      if (allowedTenantKeys.includes(key)) {
        tenantPayload[key] = value;
      }
    }

    // ── Zod validation ──
    let bsResult: { success: true; data: Record<string, unknown> } | { success: false; error: any };
    if (Object.keys(bsPayload).length > 0) {
      bsResult = businessSettingsSchema.safeParse(bsPayload);
    } else {
      bsResult = { success: true, data: {} };
    }

    let tenantResult: { success: true; data: Record<string, unknown> } | { success: false; error: any };
    if (Object.keys(tenantPayload).length > 0) {
      tenantResult = tenantBrandingSchema.safeParse(tenantPayload);
    } else {
      tenantResult = { success: true, data: {} };
    }

    if (!bsResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos en business settings", details: (bsResult as any).error.flatten() },
        { status: 400 },
      );
    }

    if (!tenantResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos en branding", details: (tenantResult as any).error.flatten() },
        { status: 400 },
      );
    }

    const results: any = {};

    if (Object.keys(bsResult.data).length > 0) {
      results.businessSettings = await prisma.businessSettings.upsert({
        where: { tenantId },
        create: { tenantId, ...bsResult.data },
        update: bsResult.data,
      });
    }

    if (Object.keys(tenantResult.data).length > 0) {
      results.tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: tenantResult.data,
      });
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err: any) {
    console.error("[business-settings] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
