import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type WhatsAppAnalyticsEventType } from "../whatsapp/store";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";
import { logTenantOverrideAttempt, logBolaAttempt } from "@/lib/security/audit-log";

export const dynamic = "force-dynamic";

async function resolveTenantId(request: Request): Promise<{ tenantId: string | null; isSuperAdmin?: boolean; error?: string }> {
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get("tenantId");
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

  // 1. Supabase session (PRIORITY)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tenantId: null, error: "No autenticado" };

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });
    if (!dbUser) return { tenantId: null, error: "Usuario no encontrado" };

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId: dbUser.id },
      select: { tenantId: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    if (!userTenant) return { tenantId: null, error: "Sin tenant asignado" };

    const isSuperAdmin = userTenant.role === "super_admin";

    // 2. If user is NOT super admin and provided tenantId in query/body → REJECT
    if (!isSuperAdmin && queryTenantId) {
      logTenantOverrideAttempt({
        userId: user.id,
        tenantId: userTenant.tenantId,
        providedTenantId: queryTenantId,
        path: request.url,
      });
      return { tenantId: userTenant.tenantId, isSuperAdmin: false };
    }

    // 3. Body tenantId check (non-admin)
    if (!isSuperAdmin) {
      try {
        const clone = request.clone();
        const body = await clone.json();
        if (body?.tenantId && body.tenantId !== userTenant.tenantId) {
          logTenantOverrideAttempt({
            userId: user.id,
            tenantId: userTenant.tenantId,
            providedTenantId: body.tenantId,
            path: request.url,
          });
        }
      } catch {
        // Not JSON body — ignore
      }
    }

    // 4. Super admin override
    if (isSuperAdmin && queryTenantId) {
      console.log(`[analytics] Super Admin override tenantId: ${queryTenantId}`);
      return { tenantId: queryTenantId, isSuperAdmin: true };
    }

    return { tenantId: userTenant.tenantId, isSuperAdmin };
  } catch (err) {
    console.error("[analytics] resolveTenantId error:", err);
    return { tenantId: null, error: "Error de autenticación" };
  }
}

export async function POST(request: Request) {
  const { tenantId, isSuperAdmin, error } = await resolveTenantId(request);

  if (error || !tenantId) {
    return NextResponse.json(
      { ok: false, error: error ?? "Tenant ID required" },
      { status: 401 }
    );
  }

  const body = await request.json();

  if (!body?.conversationId || !body?.type) {
    return NextResponse.json({ ok: false, error: "Missing analytics event" }, { status: 400 });
  }

  // Validate required fields
  if (typeof body.conversationId !== "string" || typeof body.type !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid analytics event" }, { status: 400 });
  }

  const event = await recordAnalyticsEvent({
    conversationId: body.conversationId,
    tenantId,
    type: body.type as WhatsAppAnalyticsEventType,
    metadata: body.metadata ?? {},
  });

  return NextResponse.json({ ok: true, event });
}
