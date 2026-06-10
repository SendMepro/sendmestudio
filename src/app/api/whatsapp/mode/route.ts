import { NextRequest, NextResponse } from "next/server";
import { emitWhatsAppEvent } from "../realtime";
import {
  getWhatsAppConversation,
  updateWhatsAppConversationMode,
} from "../store";
import {
  readSalonConfig,
  writeSalonConfig,
  getEffectiveMode,
  type ConversationMode,
} from "../../../data/salon-config-store";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ModeBody = {
  autoReplyEnabled?: boolean;
  conversationId?: string;
  contactName?: string;
  phone?: string;
  /** New mode system (extends autoReplyEnabled) */
  mode?: ConversationMode;
  /** Multi-tenant: opcional para impersonación */
  tenantId?: string;
};

/**
 * Resuelve tenantId desde body, query param o Supabase session.
 */
async function resolveTenantId(
  request: Request,
  bodyTenantId?: string
): Promise<string | null> {
  // 1. Body (propuesto explícitamente por el frontend)
  if (bodyTenantId) return bodyTenantId;

  // 2. Query param (impersonación desde URL)
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

/**
 * POST /api/whatsapp/mode
 *
 * Sets the auto-reply mode for a conversation.
 * Can use either legacy autoReplyEnabled (boolean) or new mode (string).
 * When tenantId is present, writes to Prisma (multi-tenant).
 * Without tenantId, falls back to salon-config-store JSON (legacy).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as ModeBody;
  const conversationId = body.conversationId?.trim();

  if (!conversationId) {
    return NextResponse.json(
      { ok: false, error: "Missing `conversationId`." },
      { status: 400 }
    );
  }

  const tenantId = await resolveTenantId(request, body.tenantId);

  // New mode system takes precedence
  if (body.mode) {
    const validModes: ConversationMode[] = ["manual", "automatic", "scheduled", "inherit"];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { ok: false, error: `Invalid mode: ${body.mode}. Valid: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }

    // Compute effective boolean for legacy compatibility
    const config = await readSalonConfig();
    const effectiveAutoReply = getEffectiveMode(config, body.mode);

    // Update conversation in Prisma (si tenantId) o JSON (si no)
    const conversation = await updateWhatsAppConversationMode(
      conversationId,
      effectiveAutoReply,
      {
        contactName: body.contactName,
        phone: body.phone,
        tenantId,
      }
    );

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    conversation.mode = body.mode;

    // Save as conversation override in salon-config (global, always)
    config.conversationOverrides[conversationId] = { mode: body.mode };
    await writeSalonConfig(config);

    emitWhatsAppEvent({
      type: "conversation_updated",
      conversation,
      tenantId: tenantId ?? undefined,
    });

    return NextResponse.json({ ok: true, conversation, mode: body.mode });
  }

  // Legacy mode (boolean autoReplyEnabled)
  if (typeof body.autoReplyEnabled !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "Provide `autoReplyEnabled` (boolean) or `mode` (string)." },
      { status: 400 }
    );
  }

  // Save as a manual override in the new system
  const config = await readSalonConfig();
  config.conversationOverrides[conversationId] = {
    mode: body.autoReplyEnabled ? "automatic" : "manual",
  };
  await writeSalonConfig(config);

  const conversation = await updateWhatsAppConversationMode(
    conversationId,
    body.autoReplyEnabled,
    {
      contactName: body.contactName,
      phone: body.phone,
      tenantId,
    }
  );

  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found." },
      { status: 404 }
    );
  }

  emitWhatsAppEvent({
    type: "conversation_updated",
    conversation,
    tenantId: tenantId ?? undefined,
  });

  return NextResponse.json({ ok: true, conversation });
}

/**
 * GET /api/whatsapp/mode?conversationId=xxx&tenantId=xxx
 *
 * Returns the mode for a conversation, including effective autoReplyEnabled.
 * Multi-tenant: cuando tenantId está presente, lee desde Prisma.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const tenantId = await resolveTenantId(request);

  if (!conversationId) {
    return NextResponse.json(
      { ok: false, error: "Missing `conversationId`." },
      { status: 400 }
    );
  }

  const conversation = await getWhatsAppConversation(conversationId, tenantId);
  const config = await readSalonConfig();
  const override = config.conversationOverrides[conversationId];
  const effectiveMode = override?.mode || config.defaultMode;

  return NextResponse.json({
    ok: true,
    autoReplyEnabled: conversation?.autoReplyEnabled ?? false,
    mode: effectiveMode,
    conversation,
  });
}
