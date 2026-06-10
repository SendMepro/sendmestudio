// ================================================================
// api/admin/verticals/[id]/route.ts — CRUD de un Vertical Template
// GET    → obtener template
// PATCH  → actualizar template
// DELETE → eliminar template
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;

    const template = await prisma.verticalTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (err: any) {
    console.error("[admin/verticals/:id] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name", "version", "vertical", "description", "config", "isActive",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // No permitir cambiar slug
    if (body.slug) {
      return NextResponse.json(
        { error: "No se puede cambiar el slug de un template." },
        { status: 400 },
      );
    }

    const template = await prisma.verticalTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (err: any) {
    console.error("[admin/verticals/:id] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;

    await prisma.verticalTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin/verticals/:id] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
