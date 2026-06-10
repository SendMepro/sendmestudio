// ================================================================
// api/admin/verticals/seed/route.ts — Seed built-in templates
// POST → ejecutar seed de templates built-in
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import { seedBuiltInTemplates } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const results = await seedBuiltInTemplates();
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[admin/verticals/seed] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
