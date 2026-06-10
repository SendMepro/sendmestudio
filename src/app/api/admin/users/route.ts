// ================================================================
// api/admin/users/route.ts — CRUD de usuarios (Super Admin)
// GET  → listar usuarios (filtrados por tenant opcional)
// POST → crear usuario (con password temporal en Supabase Auth)
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (tenantId) {
      where.userTenants = { some: { tenantId } };
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        userTenants: {
          include: { tenant: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[admin/users] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user: adminUser, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { email, name, password, tenantId, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email y password son requeridos." },
        { status: 400 },
      );
    }

    // Crear usuario en Supabase Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, created_by: adminUser?.email ?? "unknown" },
        app_metadata: {
          tenant_id: tenantId || null,
          role: role || "staff",
          is_super_admin: false,
        },
      });

    if (authError) {
      return NextResponse.json(
        { error: `Error en Supabase Auth: ${authError.message}` },
        { status: 500 },
      );
    }

    // Crear registro local en public.users
    const localUser = await prisma.user.create({
      data: {
        supabaseId: authData.user!.id,
        email,
        name: name || email.split("@")[0],
        mustChangePassword: true, // Forzar cambio en primer login
      },
    });

    // Si se especificó tenantId, crear vínculo user_tenants
    if (tenantId) {
      await prisma.userTenant.create({
        data: {
          userId: localUser.id,
          tenantId,
          role: role || "staff",
        },
      });
    }

    return NextResponse.json({ user: localUser }, { status: 201 });
  } catch (err: any) {
    console.error("[admin/users] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
