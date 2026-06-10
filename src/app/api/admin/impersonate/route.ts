// ================================================================
// api/admin/impersonate/route.ts — Super Admin "Entrar como cliente"
// Abre el dashboard del tenant en una nueva pestaña.
// El super_admin mantiene su propia sesión; usamos app_metadata
// para indicar qué tenant está visualizando.
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId es requerido." },
      { status: 400 },
    );
  }

  // Devolver la URL relativa para que el frontend navegue directamente.
  // No usar request.url, headers.host, ni 0.0.0.0.
  return NextResponse.json({
    redirectUrl: "/?tenantId=" + tenantId + "&impersonating=true",
  });
}
