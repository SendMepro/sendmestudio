import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "../sender";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SendBody = {
  to?: string;
  text?: string;
  conversationId?: string;
  clientMessageId?: string;
  tenantId?: string;
};

async function resolveTenantId(
  request: Request,
  bodyTenantId?: string
): Promise<string | null> {
  // 1. Body
  if (bodyTenantId) return bodyTenantId;

  // 2. Query param
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get("tenantId");
  if (queryTenantId) return queryTenantId;

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
  const body = (await request.json()) as SendBody;
  const recipient = body.to?.trim();
  const message = body.text?.trim();

  if (!recipient || !message) {
    return NextResponse.json(
      { ok: false, error: "Missing `to` or `text`." },
      { status: 400 }
    );
  }

  const tenantId = await resolveTenantId(request, body.tenantId);

  try {
    const result = await sendWhatsAppMessage(recipient, message, tenantId);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      to: recipient,
      message,
    });
  } catch (err) {
    const error = err as Error & { statusCode?: number; metaError?: unknown };
    console.error("[whatsapp/send] Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statusCode: error.statusCode || 500,
        metaError: error.metaError || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}
