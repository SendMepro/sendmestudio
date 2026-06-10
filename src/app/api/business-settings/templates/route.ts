// ================================================================
// api/business-settings/templates/route.ts — Templates para negocio
// GET  → listar templates + info template actual + preview diff
// POST → aplicar template al tenant actual
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";
import { generatePreviewDiff, applyTemplate } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET: Templates disponibles + info actual + preview ──
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
    const { searchParams } = new URL(request.url);
    const previewTemplateId = searchParams.get("preview");

    // 1. Cargar tenant actual + templates disponibles
    const [tenant, templates] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          businessName: true,
          businessType: true,
          templateId: true,
          templateVersion: true,
          primaryColor: true,
          secondaryColor: true,
        },
      }),
      prisma.verticalTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ vertical: "asc" }, { version: "desc" }],
      }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }

    // 2. Nombre del template actual si existe
    let currentTemplateName: string | undefined;
    if (tenant.templateId) {
      const tpl = await prisma.verticalTemplate.findUnique({
        where: { id: tenant.templateId },
        select: { name: true },
      });
      currentTemplateName = tpl?.name;
    }

    // 3. Preview diff si se solicita
    let diff: any = null;
    if (previewTemplateId) {
      const diffs = await generatePreviewDiff(tenantId, previewTemplateId);
      const tpl = templates.find((t) => t.id === previewTemplateId);

      diff = {
        items: diffs,
        template: tpl
          ? { id: tpl.id, name: tpl.name, version: tpl.version, vertical: tpl.vertical, description: tpl.description }
          : null,
        summary: {
          total: diffs.length,
          byCategory: diffs.reduce(
            (acc: Record<string, number>, d) => {
              acc[d.category] = (acc[d.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      };
    }

    return NextResponse.json({
      current: {
        templateId: tenant.templateId,
        templateVersion: tenant.templateVersion,
        templateName: currentTemplateName || null,
        businessName: tenant.businessName,
        businessType: tenant.businessType,
      },
      templates,
      diff,
    });
  } catch (err: any) {
    console.error("[business-settings/templates] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Aplicar template ──
export async function POST(request: NextRequest) {
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
    const { templateId, mode, categories } = body;

    if (!templateId) {
      return NextResponse.json({ error: "templateId es requerido." }, { status: 400 });
    }

    const applyMode: "merge" | "replace" = mode === "replace" ? "replace" : "merge";

    const result = await applyTemplate(tenantId, templateId, applyMode, categories);

    return NextResponse.json({
      ok: true,
      backup: { id: result.backup.id, appliedAt: result.backup.appliedAt },
      template: { id: result.template.id, name: result.template.name, version: result.template.version },
      mode: applyMode,
      categories: categories || "all",
    });
  } catch (err: any) {
    console.error("[business-settings/templates] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
