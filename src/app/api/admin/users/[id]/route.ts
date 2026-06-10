// ================================================================
// api/admin/users/[id]/route.ts — CRUD de un usuario (Super Admin)
// GET    → obtener usuario
// PATCH  → actualizar rol, estado, reset password
// DELETE → desactivar usuario (soft)
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import { createClient } from "@supabase/supabase-js";
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

    const localUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userTenants: {
          include: { tenant: true },
        },
      },
    });

    if (!localUser) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ user: localUser });
  } catch (err: any) {
    console.error("[admin/users/:id] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user: adminUser, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const localUser = await prisma.user.findUnique({ where: { id } });
    if (!localUser) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const allowedFields = ["name", "email", "phone", "isActive", "mustChangePassword"];
    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Si se incluye un nuevo password, actualizar en Supabase Auth
    if (body.password && localUser.supabaseId) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        },
      );

      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          localUser.supabaseId,
          { password: body.password },
        );

      if (updateError) {
        return NextResponse.json(
          { error: `Error actualizando password: ${updateError.message}` },
          { status: 500 },
        );
      }

      // Forzar cambio de password en próximo login
      data.mustChangePassword = true;
    }

    // Si se pasa tenantId y role, actualizar/crear vínculo user_tenants
    if (body.tenantId && body.role) {
      const existingLink = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: { userId: id, tenantId: body.tenantId },
        },
      });

      if (existingLink) {
        await prisma.userTenant.update({
          where: { id: existingLink.id },
          data: { role: body.role },
        });
      } else {
        await prisma.userTenant.create({
          data: {
            userId: id,
            tenantId: body.tenantId,
            role: body.role,
          },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ user: updated });
  } catch (err: any) {
    console.error("[admin/users/:id] PATCH error:", err);
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

    // Soft delete: desactivar en lugar de borrar
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin/users/:id] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
