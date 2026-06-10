// ================================================================
// api/business-settings/memory/export/route.ts
// Exporta un backup JSON completo del conocimiento/configuración del tenant.
//
// GET /api/business-settings/memory/export
// → sendme-memory-backup-{slug}-{YYYY-MM-DD}.json
//
// Seguridad: solo owner/admin del tenant (vía tenant-helper).
// No exporta datos de clientes (CustomerMemory se omite por privacidad).
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireTenant } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireTenant(request);
  if (error) return error;

  const tenantId = ctx!.tenantId;

  try {
    // ── 1. Tenant info ──
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
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
        templateId: true,
        templateVersion: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // ── 2. Business Settings ──
    const businessSettings = await prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    // ── 3. AI Settings ──
    const aiSettings = await prisma.aiSettings.findUnique({
      where: { tenantId },
    });

    // ── 4. Knowledge Items (seccionados) ──
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });

    // Build knowledge bundle
    const knowledge: Record<string, any> = {};
    const faqs: any[] = [];
    for (const item of knowledgeItems) {
      if (item.section === "faqs" && Array.isArray(item.data)) {
        faqs.push(...item.data);
      } else {
        knowledge[item.section] = item.data;
      }
    }

    // ── 5. Vertical template aplicado (si existe) ──
    let verticalTemplate = null;
    if (tenant.templateId) {
      const template = await prisma.verticalTemplate.findUnique({
        where: { id: tenant.templateId },
        select: {
          slug: true,
          name: true,
          version: true,
          vertical: true,
          description: true,
        },
      });
      if (template) {
        verticalTemplate = {
          slug: template.slug,
          name: template.name,
          version: template.version,
          vertical: template.vertical,
          description: template.description,
        };
      }
    }

    // ── 6. Customer memory schema summary (NO datos de clientes) ──
    const customerMemoryStats = await prisma.customerMemory.aggregate({
      where: { tenantId },
      _count: true,
    });

    // ── 7. Build export payload ──
    const now = new Date();
    const slug = tenant.slug || "unknown";
    const dateStr = now.toISOString().split("T")[0];

    const exportPayload = {
      exportMeta: {
        tenantId,
        businessName: tenant.businessName,
        slug: tenant.slug,
        exportedAt: now.toISOString(),
        version: "1.0.0",
        format: "sendme-memory-backup",
        description: "Backup del conocimiento y configuración del negocio para IA y operación.",
      },
      branding: {
        businessName: tenant.businessName,
        businessType: tenant.businessType,
        tagline: tenant.tagline,
        logoUrl: tenant.logoUrl,
        bannerUrl: tenant.bannerUrl,
        faviconUrl: tenant.faviconUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        timezone: tenant.timezone,
        language: tenant.language,
      },
      businessSettings: businessSettings
        ? {
            services: businessSettings.services,
            stylists: businessSettings.stylists,
            businessHours: businessSettings.businessHours,
            holidays: businessSettings.holidays,
            lunchBreak: businessSettings.lunchBreak,
            lastAcceptedTime: businessSettings.lastAcceptedTime,
            minimumBufferMinutes: businessSettings.minimumBufferMinutes,
            latePolicy: businessSettings.latePolicy,
            brandTone: businessSettings.brandTone,
            shortDescription: businessSettings.shortDescription,
            mainPromise: businessSettings.mainPromise,
          }
        : null,
      aiSettings: aiSettings
        ? {
            autoReplyEnabled: aiSettings.autoReplyEnabled,
            aiMode: aiSettings.aiMode,
            aiRules: aiSettings.aiRules,
            supportFeedRules: aiSettings.supportFeedRules,
            bookingRules: aiSettings.bookingRules,
            availabilityRules: aiSettings.availabilityRules,
            monthlyAiBudget: aiSettings.monthlyAiBudget,
          }
        : null,
      knowledge: Object.keys(knowledge).length > 0 ? knowledge : null,
      faqs: faqs.length > 0 ? faqs : null,
      verticalTemplate,
      customerMemory: {
        totalProfiles: customerMemoryStats._count,
        note: "Datos de clientes excluidos por privacidad. Solo se incluye el conteo.",
      },
      licenseStatus: tenant.licenseStatus,
      ownerInfo: {
        name: tenant.ownerName,
        email: tenant.ownerEmail,
      },
    };

    // ── 8. Return as downloadable JSON ──
    const filename = `sendme-memory-backup-${slug}-${dateStr}.json`;
    const jsonStr = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(Buffer.byteLength(jsonStr, "utf-8")),
      },
    });
  } catch (err: any) {
    console.error("[memory/export] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// TODO: Import endpoint (futuro)
//
// POST /api/business-settings/memory/import
//
// Recibe un JSON en el mismo formato que export.
// Valida estructura, tenantId, version.
// Reemplaza/mergea configuraciones existentes.
//
// Seguridad:
// - Solo owner/admin del tenant destino.
// - Validar que el tenantId del backup coincida con el tenant autenticado
//   (o permitir super admin para migraciones).
// - Backup automático antes de aplicar cambios.
//
// Ejemplo de uso:
//   curl -X POST /api/business-settings/memory/import \
//     -H "Content-Type: application/json" \
//     -d @sendme-memory-backup-misalon-2026-06-09.json
//
// ═══════════════════════════════════════════════════════════════
