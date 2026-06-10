// ================================================================
// lib/admin-helper.ts — Admin utility functions
// Helper para verificar licencia y roles de tenant/usuario.
// ================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type AuthUser = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  tenantId: string | null;
  role: string | null;
};

/**
 * Obtiene el usuario autenticado desde el request (middleware-safe)
 * Resuelve tenantId desde la base de datos (public.users → user_tenants)
 * en lugar de app_metadata, para asegurar aislamiento multi-tenant correcto.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No necesitamos escribir cookies aquí
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;

  const supabaseUser = data.user;
  const supabaseUserId = supabaseUser.id;
  const email = supabaseUser.email ?? "";
  // ⚠️ Inicializamos con false; resolveremos desde DB
  let isSuperAdmin = false;

  // ── Logs temporales seguros para debug multi-tenant ──
  console.log("[admin-helper] supabaseUserId:", supabaseUserId);
  console.log("[admin-helper] email:", email);

  // Para super admins, resolvemos tenantId desde la DB también
  let tenantId: string | null = null;
  let role: string | null = null;

  try {
    // Dynamic import to avoid circular dependency issues
    const prisma = (await import("@/lib/prisma")).default;

    // 1. Buscar usuario en public.users por supabaseId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
      select: { id: true, email: true, isSuperAdmin: true },
    });

    let dbUserId: string | null = null;
    if (dbUser) {
      console.log("[admin-helper] publicUserId:", dbUser.id);
      isSuperAdmin = dbUser.isSuperAdmin === true;
      dbUserId = dbUser.id;
    } else if (email) {
      // Fallback: buscar por email
      console.log("[admin-helper] ⚠️ No user found by supabaseId, trying email fallback:", email);
      const emailUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isSuperAdmin: true },
      });
      if (emailUser) {
        console.log("[admin-helper] ✅ Found user by email:", emailUser.id);
        isSuperAdmin = emailUser.isSuperAdmin === true;
        dbUserId = emailUser.id;
      }
    }

    if (dbUserId) {
      // 2. Buscar user_tenants para este usuario
      const userTenant = await prisma.userTenant.findFirst({
        where: { userId: dbUserId },
        select: { tenantId: true, role: true },
        orderBy: { createdAt: "asc" },
      });

      if (userTenant) {
        tenantId = userTenant.tenantId;
        role = userTenant.role;

        // Fetch tenant info for logs
        const tenantInfo = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { slug: true, businessName: true },
        });

        console.log("[admin-helper] resolvedTenantId:", tenantId);
        console.log("[admin-helper] tenantSlug:", tenantInfo?.slug);
        console.log("[admin-helper] tenantBusinessName:", tenantInfo?.businessName);
        console.log("[admin-helper] role:", role);
      } else {
        console.log("[admin-helper] No user_tenant found for this user");
      }
    } else {
      console.log("[admin-helper] No public user found for supabaseId:", supabaseUserId);
    }
  } catch (err) {
    console.error("[admin-helper] DB resolution error:", err);
    // Fallback: use app_metadata values
    tenantId = supabaseUser.app_metadata?.tenant_id ?? null;
    role = supabaseUser.app_metadata?.role ?? null;
    console.log("[admin-helper] Fallback to app_metadata tenantId:", tenantId);
  }

  return {
    id: supabaseUserId,
    email,
    isSuperAdmin,
    tenantId,
    role,
  };
}

/**
 * Verifica la licencia de un tenant según su estado.
 * Retorna { blocked: true, reason: "..." } si está bloqueado.
 */
export function checkLicenseBlock(
  tenant: {
    isActive: boolean;
    licenseStatus: string;
    licenseExpiresAt: Date | null;
  } | null,
): { blocked: boolean; reason: string | null } {
  if (!tenant) {
    return { blocked: true, reason: "Tenant no encontrado." };
  }

  if (!tenant.isActive) {
    return { blocked: true, reason: "Tu cuenta está desactivada. Contacta a soporte." };
  }

  if (tenant.licenseStatus === "expired") {
    return { blocked: true, reason: "Tu licencia de SendMe Studio está vencida. Contacta a soporte." };
  }

  if (tenant.licenseStatus === "suspended") {
    return { blocked: true, reason: "Tu licencia de SendMe Studio está suspendida. Contacta a soporte." };
  }

  if (tenant.licenseStatus === "cancelled") {
    return { blocked: true, reason: "Tu licencia de SendMe Studio ha sido cancelada. Contacta a soporte." };
  }

  // Si licenseExpiresAt está en el pasado, consideramos expired
  if (tenant.licenseExpiresAt && new Date(tenant.licenseExpiresAt) < new Date()) {
    return { blocked: true, reason: "Tu licencia de SendMe Studio está vencida. Contacta a soporte." };
  }

  return { blocked: false, reason: null };
}

/**
 * Verifica que el usuario autenticado sea super_admin.
 * Si no lo es, retorna una respuesta 403.
 */
export async function requireSuperAdmin(request: NextRequest): Promise<{
  user: AuthUser | null;
  error: NextResponse | null;
}> {
  const user = await getAuthUser(request);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    };
  }

  if (!user.isSuperAdmin) {
    return {
      user,
      error: NextResponse.json({ error: "Acceso denegado. Se requiere Super Admin." }, { status: 403 }),
    };
  }

  return { user, error: null };
}
