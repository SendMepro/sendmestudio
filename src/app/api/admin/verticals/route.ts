// ================================================================
// api/admin/verticals/route.ts — CRUD de Vertical Templates (Super Admin)
// GET  → listar templates
// POST → crear template
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";
import { seedBuiltInTemplates } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get("vertical");

    const where: any = {};
    if (vertical) where.vertical = vertical;

    const templates = await prisma.verticalTemplate.findMany({
      where,
      orderBy: [{ vertical: "asc" }, { version: "desc" }],
    });

    return NextResponse.json({ templates });
  } catch (err: any) {
    console.error("[admin/verticals] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { slug, name, version, vertical, description, config } = body;

    if (!slug || !name || !vertical) {
      return NextResponse.json(
        { error: "slug, name y vertical son requeridos." },
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const existing = await prisma.verticalTemplate.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: `El slug "${slug}" ya existe. Usa una versión distinta.` },
        { status: 409 },
      );
    }

    const template = await prisma.verticalTemplate.create({
      data: {
        slug,
        name,
        version: version || "v1",
        vertical,
        description: description || "",
        isActive: true,
        config: config || {},
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err: any) {
    console.error("[admin/verticals] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
