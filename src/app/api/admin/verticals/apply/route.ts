// ================================================================
// api/admin/verticals/apply/route.ts — Aplicar template a un tenant
// GET  → preview/diff de cambios
// POST → aplicar template con merge/replace por categorías
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";
import { generatePreviewDiff, applyTemplate } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET: Preview / Diff ──
export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const templateId = searchParams.get("templateId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId es requerido." },
        { status: 400 },
      );
    }

    // If templateId is "preview", just return current tenant info
    if (templateId === "preview") {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          templateId: true,
          templateVersion: true,
          businessName: true,
          businessType: true,
          slug: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });

      // Get template name if a template is applied
      let templateName: string | undefined;
      if (tenant?.templateId) {
        const tpl = await prisma.verticalTemplate.findUnique({
          where: { id: tenant.templateId },
          select: { name: true },
        });
        templateName = tpl?.name;
      }

      return NextResponse.json({
        current: tenant
          ? {
              templateId: tenant.templateId,
              templateVersion: tenant.templateVersion,
              businessName: tenant.businessName,
              templateName,
            }
          : null,
      });
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId es requerido." },
        { status: 400 },
      );
    }

    const diffs = await generatePreviewDiff(tenantId, templateId);

    // Get template info
    const template = await prisma.verticalTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, name: true, slug: true, version: true, vertical: true, description: true },
    });

    // Get current tenant template info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        templateId: true,
        templateVersion: true,
        businessName: true,
        businessType: true,
        slug: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    // If templateId was provided as valid UUID or "preview"
    return NextResponse.json({
      diff: diffs,
      template,
      current: tenant
        ? {
            templateId: tenant.templateId,
            templateVersion: tenant.templateVersion,
            businessName: tenant.businessName,
          }
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
    });
  } catch (err: any) {
    console.error("[admin/verticals/apply] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Apply template ──
export async function POST(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { tenantId, templateId, mode, categories } = body;

    if (!tenantId || !templateId) {
      return NextResponse.json(
        { error: "tenantId y templateId son requeridos." },
        { status: 400 },
      );
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
    console.error("[admin/verticals/apply] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
