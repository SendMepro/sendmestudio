// ---------------------------------------------------------------
// GET/PATCH /api/admin/ai-costs — Control de costos IA (admin only)
// ---------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import {
  getAICostReport,
  updateAICostLimits,
  getAICostTenants,
} from "@/data/ai-cost-store";
import { getAllPricing } from "@/config/ai-pricing";

import { getAuthUser } from "@/lib/admin-helper";

// ── Admin gate ──

async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  // 🤖 Super admin bypass: si el usuario está autenticado como super admin, permite
  try {
    const user = await getAuthUser(request);
    if (user?.isSuperAdmin) return true;
  } catch {
    // Fallback a password gate si falla resolución de sesión
  }

  const password = process.env.ADMIN_COSTS_PASSWORD;
  if (!password || password.trim() === "") {
    // Sin contraseña configurada → permitir en dev (con advertencia)
    return true;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token === password) return true;

  // También aceptar vía query param (menos seguro, útil para tests)
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
  if (!(await isAdminAuthorized(request))) return unauthorized();

  const { searchParams } = request.nextUrl;

  const tenantId = searchParams.get("tenantId") ?? undefined;
  const month = searchParams.get("month") ?? undefined;
  const demo = searchParams.get("demo") === "true";

  if (tenantId === "__tenants__") {
    // Listar tenants disponibles
    return NextResponse.json({
      ok: true,
      adminOnly: true,
      tenants: getAICostTenants(),
    });
  }

  if (tenantId === "__pricing__") {
    // Listar tabla de precios
    return NextResponse.json({
      ok: true,
      adminOnly: true,
      pricing: getAllPricing(),
    });
  }

  const report = getAICostReport({ tenantId, month });
  if (!report) {
    return NextResponse.json(
      { ok: false, error: "Tenant no encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ...report, demo });
}

// ── PATCH ──

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthorized(request))) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { tenantId, ...patchFields } = body;

  if (!tenantId || typeof tenantId !== "string") {
    return NextResponse.json({ ok: false, error: "tenantId es requerido" }, { status: 400 });
  }

  // Filtrar solo campos válidos de límites
  const validFields = [
    "monthlyBudgetClp",
    "monthlyRequestLimit",
    "isAIEnabled",
    "warningThresholdPercent",
    "hardLimitEnabled",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const field of validFields) {
    if (field in patchFields) {
      patch[field] = patchFields[field];
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No hay campos válidos para actualizar" }, { status: 400 });
  }

  const updated = updateAICostLimits(tenantId, patch as any);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    adminOnly: true,
    message: "Límites actualizados",
    limits: updated,
  });
}
