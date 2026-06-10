// ================================================================
// api/admin/tenants/[id]/route.ts — CRUD de un tenant (Super Admin)
// GET    → obtener tenant
// PATCH  → actualizar tenant (licencia, estado, etc.)
// DELETE → archivar/eliminar tenant
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

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
        userTenants: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { userTenants: true },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (err: any) {
    console.error("[admin/tenants/:id] GET error:", err);
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

    // Campos permitidos para actualizar desde Super Admin
    const allowedFields = [
      "businessName", "businessType", "ownerName", "ownerEmail", "ownerPhone",
      "logoUrl", "isActive", "licenseStatus", "licenseExpiresAt",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convertir strings a Date para campos de fecha
        if (field === "licenseExpiresAt" && typeof body[field] === "string") {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    // No permitir cambiar slug
    if (body.slug) {
      return NextResponse.json(
        { error: "No se puede cambiar el slug de un tenant." },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    });

    return NextResponse.json({ tenant });
  } catch (err: any) {
    console.error("[admin/tenants/:id] PATCH error:", err);
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

    // Soft delete: marcar deletedAt en lugar de borrar realmente
    await prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin/tenants/:id] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
