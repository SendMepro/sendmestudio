// ================================================================
// api/business-settings/whatsapp/route.ts — WhatsApp Tenant Mapping
// GET  → devuelve la configuración de WhatsApp del tenant autenticado
// PATCH → actualiza la configuración de WhatsApp
// POST → crea configuración inicial
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/business-settings/whatsapp
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tienes un tenant asignado." }, { status: 403 });
  }

  try {
    const mapping = await prisma.whatsAppTenantMapping.findUnique({
      where: { tenantId },
    });

    return NextResponse.json({
      ok: true,
      whatsapp: mapping,
    });
  } catch (err: any) {
    console.error("[whatsapp-settings] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/business-settings/whatsapp
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tienes un tenant asignado." }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "phoneNumberId", "businessPhone", "waBusinessId",
      "accessToken", "webhookSecret", "isActive",
    ];

    const data: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para actualizar." }, { status: 400 });
    }

    const mapping = await prisma.whatsAppTenantMapping.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true, whatsapp: mapping });
  } catch (err: any) {
    console.error("[whatsapp-settings] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
