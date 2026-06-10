// ================================================================
// lib/tenant-helper.ts — Obtiene tenantId del usuario autenticado
// Todas las rutas API deben usar esto para filtrar por tenant.
// ================================================================

import { NextResponse, NextRequest } from "next/server";
import { getAuthUser, type AuthUser } from "./admin-helper";
import prisma from "./prisma";

export type TenantContext = {
  user: AuthUser;
  tenantId: string;
};

/**
 * Obtiene el tenantId del usuario autenticado.
 * Falla con 401/403 si no hay sesión o no hay tenant.
 * Ideal para rutas de negocio (no super admin).
 */
export async function requireTenant(
  request: NextRequest,
): Promise<{ ctx: TenantContext | null; error: NextResponse | null }> {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      ctx: null,
      error: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    };
  }

  if (!user.tenantId) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: "No tienes un tenant asignado." },
        { status: 403 },
      ),
    };
  }

  return {
    ctx: { user, tenantId: user.tenantId },
    error: null,
  };
}

/**
 * Para rutas que reciben request nativo (no NextRequest)
 */
export async function requireTenantFromNativeRequest(
  request: Request,
): Promise<{ ctx: TenantContext | null; error: NextResponse | null }> {
  // Convert Request to a mock NextRequest that preserves cookies
  const nextRequest = new NextRequest(request.url, {
    headers: request.headers,
    method: request.method,
    body: request.body,
  });

  return requireTenant(nextRequest);
}

/**
 * Helper para obtener las business_settings con stylists
 */
export async function getBusinessStylists(tenantId: string) {
  const bs = await prisma.businessSettings.findUnique({
    where: { tenantId },
    select: { stylists: true },
  });
  return (bs?.stylists as any[]) ?? [];
}
