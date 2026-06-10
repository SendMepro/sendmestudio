// ================================================================
// api/admin/verticals/backups/route.ts — Gestionar backups
// GET → listar backups de un tenant
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import { getTenantBackups } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId es requerido." },
        { status: 400 },
      );
    }

    const backups = await getTenantBackups(tenantId);
    return NextResponse.json({ backups });
  } catch (err: any) {
    console.error("[admin/verticals/backups] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
