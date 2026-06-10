// ---------------------------------------------------------------
// GET /api/admin/licenses — License Center (admin only)
// ---------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getLicenseReport } from "@/data/license-store";
import { getAuthUser } from "@/lib/admin-helper";

// ── Admin gate (reuse same password as ai-costs) ──

async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  // 🤖 Super admin bypass
  try {
    const user = await getAuthUser(request);
    if (user?.isSuperAdmin) return true;
  } catch {
    // Fallback a password gate
  }

  const password = process.env.ADMIN_COSTS_PASSWORD;
  if (!password || password.trim() === "") {
    return true;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token === password) return true;

  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken === password) return true;

  return false;
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "No autorizado. Proporciona ADMIN_COSTS_PASSWORD en header Authorization: Bearer <clave> o query ?token=<clave>." },
    { status: 401 },
  );
}

// ── GET ──

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized(request))) {
    return unauthorized();
  }

  const report = getLicenseReport();
  return NextResponse.json(report);
}
