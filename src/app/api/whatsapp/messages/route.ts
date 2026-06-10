import { NextResponse } from "next/server";
import {
  getWhatsAppConversations,
  getWhatsAppMessages,
  getWhatsAppUnreadCount,
  markWhatsAppMessagesSeen,
} from "../store";
import { readCustomerAssetsIndex } from "../customer-assets";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Resuelve tenantId desde Supabase session o query param.
 * Query param tiene prioridad (para impersonación).
 */
async function resolveTenantId(
  request: Request
): Promise<string | null> {
  // 1. Query param (impersonación)
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get("tenantId");
  if (queryTenantId) {
    return queryTenantId;
  }

  // 2. Supabase session
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
  } catch (err) {
    console.error("[WHATSAPP] Failed to resolve tenantId:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const markSeen = url.searchParams.get("markSeen") === "true";
  const conversationId = url.searchParams.get("conversationId");

  // Resolver tenantId
  const tenantId = await resolveTenantId(request);

  if (markSeen) {
    await markWhatsAppMessagesSeen(conversationId, tenantId);
  }

  // Cuando hay tenantId, leer desde Prisma con filtro
  if (tenantId) {
    const [messages, conversations] = await Promise.all([
      getWhatsAppMessages({ after, conversationId, tenantId }),
      getWhatsAppConversations(tenantId),
    ]);

    const assets = await readCustomerAssetsIndex();
    const assetsByMediaId = new Map(
      assets
        .filter((asset) => asset.originalMediaId)
        .map((asset) => [asset.originalMediaId, asset])
    );
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const hydratedMessages = messages.map((message) => {
      if (
        message.type !== "image" &&
        message.type !== "audio" &&
        message.type !== "video" &&
        message.type !== "document"
      ) {
        return message;
      }

      const asset =
        (message.metadata?.assetId ? assetsById.get(message.metadata.assetId) : undefined) ??
        (message.mediaId ? assetsByMediaId.get(message.mediaId) : undefined);

      if (!asset) {
        return message;
      }

      return {
        ...message,
        mediaUrl: message.mediaUrl ?? asset.publicUrl ?? undefined,
        metadata: {
          ...message.metadata,
          assetId: message.metadata?.assetId ?? asset.id,
          assetError: message.metadata?.assetError ?? asset.error,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      messages: hydratedMessages,
      conversations,
      unreadCount: conversations.reduce(
        (sum, c) => sum + c.unreadCount,
        0
      ),
    });
  }

  // Fallback legacy: JSON store (sin tenantId)
  const [messages, assets] = await Promise.all([
    getWhatsAppMessages({ after, conversationId }),
    readCustomerAssetsIndex(),
  ]);
  const assetsByMediaId = new Map(
    assets
      .filter((asset) => asset.originalMediaId)
      .map((asset) => [asset.originalMediaId, asset])
  );
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const hydratedMessages = messages.map((message) => {
    if (
      message.type !== "image" &&
      message.type !== "audio" &&
      message.type !== "video" &&
      message.type !== "document"
    ) {
      return message;
    }

    const asset =
      (message.metadata?.assetId ? assetsById.get(message.metadata.assetId) : undefined) ??
      (message.mediaId ? assetsByMediaId.get(message.mediaId) : undefined);

    if (!asset) {
      return message;
    }

    return {
      ...message,
      mediaUrl: message.mediaUrl ?? asset.publicUrl ?? undefined,
      metadata: {
        ...message.metadata,
        assetId: message.metadata?.assetId ?? asset.id,
        assetError: message.metadata?.assetError ?? asset.error,
      },
    };
  });

  return NextResponse.json({
    ok: true,
    messages: hydratedMessages,
    conversations: await getWhatsAppConversations(),
    unreadCount: await getWhatsAppUnreadCount(),
  });
}
