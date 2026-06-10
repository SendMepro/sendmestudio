import { NextResponse } from "next/server";
import { sendWhatsAppReaction } from "../sender";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ReactionBody = {
  emoji?: string;
  messageId?: string;
  to?: string;
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
  const body = (await request.json()) as ReactionBody;
  const recipient = body.to?.trim();
  const messageId = body.messageId?.trim();
  const emoji = body.emoji ?? "";

  if (!recipient || !messageId) {
    return NextResponse.json(
      { ok: false, error: "Missing `to` or `messageId`." },
      { status: 400 }
    );
  }

  const tenantId = await resolveTenantId(request, body.tenantId);

  try {
    const result = await sendWhatsAppReaction(recipient, messageId, emoji, tenantId);

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      response: result.data,
    });
  } catch (error) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const metaResponse =
      error && typeof error === "object" && "metaResponse" in error
        ? error.metaResponse
        : null;
    const errorMessage =
      error instanceof Error ? error.message : "WhatsApp reaction failed.";

    return NextResponse.json(
      {
        ok: false,
        error: "WhatsApp reaction failed.",
        statusCode,
        errorMessage,
        metaResponse,
      },
      { status: statusCode }
    );
  }
}
