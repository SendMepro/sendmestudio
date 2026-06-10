import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type WhatsAppAnalyticsEventType } from "../whatsapp/store";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resolveTenantId(request: Request): Promise<string | null> {
  // 1. Query param (frontend)
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get("tenantId");
  if (queryTenantId) return queryTenantId;

  // 2. Body param
  try {
    const clone = request.clone();
    const body = await clone.json();
    if (body?.tenantId) return body.tenantId;
  } catch {
    // Not JSON body
  }

  // 3. Supabase session
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });
    if (!dbUser) return null;

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId: dbUser.id },
      select: { tenantId: true },
      orderBy: { createdAt: "asc" },
    });

    return userTenant?.tenantId ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const tenantId = await resolveTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Tenant ID required — authenticate or provide tenantId" },
      { status: 401 }
    );
  }

  const body = await request.json();

  if (!body?.conversationId || !body?.type) {
    return NextResponse.json({ ok: false, error: "Missing analytics event" }, { status: 400 });
  }

  const event = await recordAnalyticsEvent({
    conversationId: body.conversationId,
    tenantId,
    type: body.type as WhatsAppAnalyticsEventType,
    metadata: body.metadata ?? {},
  });

  return NextResponse.json({ ok: true, event });
}
