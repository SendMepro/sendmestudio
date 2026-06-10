// ================================================================
// api/admin/session/route.ts — Devuelve información de sesión admin
// GET /api/admin/session → { email, role, tenantId, tenantName,
//   isSuperAdmin, isImpersonating }
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado" });
  }

  let tenantName: string | null = null;
  if (user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { businessName: true },
    });
    tenantName = tenant?.businessName ?? null;
  }

  return NextResponse.json({
    ok: true,
    session: {
      email: user.email,
      role: user.role ?? null,
      tenantId: user.tenantId ?? null,
      tenantName,
      isSuperAdmin: user.isSuperAdmin,
      isImpersonating: !!((user as any).impersonating),
    },
  });
}
