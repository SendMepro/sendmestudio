import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";

// ── Prisma multi-tenant store (Fase 3: reemplazo gradual del JSON) ──
import prisma from "@/lib/prisma";

export type WhatsAppMessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "reaction"
  | "status";

export type WhatsAppMessageStatus =
  | "received"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppInternalMessage = {
  id: string;
  tenantId?: string;
  conversationId: string;
  phone: string;
  senderName: string;
  direction: "inbound" | "outbound";
  type: WhatsAppMessageType;
  content: string;
  mediaUrl?: string;
  mediaId?: string;
  timestamp: string;
  status: WhatsAppMessageStatus;
  seen?: boolean;
  raw: unknown;
  waMessageId?: string;
  metadata?: {
    generatedByAI?: boolean;
    autoSent?: boolean;
    confidence?: number;
    intent?: string;
    safeguardReason?: string;
    bookingStage?: string;
    lastError?: {
      statusCode?: number;
      statusText?: string;
      code?: number | string;
      message: string;
      error_subcode?: number | string;
      metaResponse?: unknown;
      publicImageUrl?: string;
      publicPath?: string;
    };
    assetId?: string;
    assetError?: {
      message: string;
      statusCode?: number;
      metaResponse?: unknown;
    };
  };
};

export type WhatsAppConversation = {
  id: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled: boolean;
  /** New mode system: manual | automatic | scheduled | inherit. Optional for backward compat. */
  mode?: "manual" | "automatic" | "scheduled" | "inherit";
  from: string;
  contactName: string;
  senderName: string;
  lastMessage: WhatsAppInternalMessage | null;
  lastMessagePreview: string;
  lastInboundAt?: string;
  timestamp: string;
  unreadCount: number;
  updatedAt: string;
  activeNow: boolean;
  customerProfile: {
    phone: string;
    name: string;
    tags: string[];
    firstSeenAt: string;
    lastSeenAt: string;
  };
};

type StoreSnapshot = {
  messages: WhatsAppInternalMessage[];
  conversations: WhatsAppConversation[];
  unreadCount: number;
};

// ── Helpers de conversión Prisma ↔ tipos internos (Fase 3) ─────
function fromPrismaMessage(row: {
  id: string;
  conversationId: string;
  phone: string;
  senderName: string;
  direction: string;
  type: string;
  content: string;
  mediaUrl: string | null;
  mediaId: string | null;
  timestamp: string;
  status: string;
  seen: boolean;
  waMessageId: string | null;
  metadata: unknown;
}): WhatsAppInternalMessage {
  const rawMeta = (typeof row.metadata === "object" && row.metadata !== null
    ? row.metadata
    : {}) as Record<string, unknown>;

  return {
    id: row.id,
    waMessageId: row.waMessageId ?? undefined,
    conversationId: row.conversationId,
    phone: row.phone,
    senderName: row.senderName,
    direction: row.direction as "inbound" | "outbound",
    type: row.type as WhatsAppMessageType,
    content: row.content,
    mediaUrl: row.mediaUrl ?? undefined,
    mediaId: row.mediaId ?? undefined,
    timestamp: row.timestamp,
    status: row.status as WhatsAppMessageStatus,
    seen: row.seen,
    raw: rawMeta,
    metadata: rawMeta as WhatsAppInternalMessage["metadata"],
  };
}

function fromPrismaConversation(row: {
  id: string;
  phone: string;
  displayName: string | null;
  autoReplyEnabled: boolean;
  aiMode: string;
  unreadCount: number;
  lastActivityAt: Date;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  messages?: Array<{
    id: string;
    conversationId: string;
    phone: string;
    senderName: string;
    direction: string;
    type: string;
    content: string;
    mediaUrl: string | null;
    mediaId: string | null;
    timestamp: string;
    status: string;
    seen: boolean;
    waMessageId: string | null;
    metadata: unknown;
  }>;
}): WhatsAppConversation {
  const rawMeta = (typeof row.metadata === "object" && row.metadata !== null
    ? row.metadata
    : {}) as Record<string, unknown>;

  const lastMsg =
    row.messages && row.messages.length > 0
      ? row.messages.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        )[0]
      : null;

  const lastInternalMsg = lastMsg ? fromPrismaMessage(lastMsg) : null;

  return {
    id: row.id,
    phone: row.phone,
    autoReplyEnabled: row.autoReplyEnabled,
    mode: (rawMeta.mode as WhatsAppConversation["mode"]) ?? undefined,
    from: row.phone,
    contactName: row.displayName ?? `WhatsApp ${maskPhone(row.phone)}`,
    senderName: row.displayName ?? `WhatsApp ${maskPhone(row.phone)}`,
    lastMessage: lastInternalMsg,
    lastMessagePreview: lastInternalMsg
      ? previewFor(lastInternalMsg)
      : "",
    timestamp: Math.floor(row.lastActivityAt.getTime() / 1000).toString(),
    unreadCount: row.unreadCount,
    updatedAt: row.updatedAt.toISOString(),
    activeNow: false,
    customerProfile: {
      phone: row.phone,
      name: row.displayName ?? `WhatsApp ${maskPhone(row.phone)}`,
      tags: ["whatsapp"],
      firstSeenAt: row.createdAt.toISOString(),
      lastSeenAt: row.updatedAt.toISOString(),
    },
  };
}

async function toPrismaMessage(
  message: WhatsAppInternalMessage
): Promise<void> {
  const tenantId = message.tenantId;
  if (!tenantId) return;

  await prisma.whatsAppMessage.upsert({
    where: { id: message.id },
    create: {
      id: message.id,
      tenantId,
      conversationId: message.conversationId,
      phone: message.phone,
      senderName: message.senderName,
      direction: message.direction,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl ?? null,
      mediaId: message.mediaId ?? null,
      timestamp: message.timestamp,
      status: message.status,
      seen: message.seen ?? message.direction !== "inbound",
      waMessageId: message.waMessageId ?? null,
      metadata: (message.metadata ?? {}) as object,
    },
    update: {
      status: message.status,
      seen: message.seen ?? false,
      content: message.content,
      timestamp: message.timestamp,
      metadata: (message.metadata ?? {}) as object,
    },
  });
}

async function toPrismaConversation(
  conversation: WhatsAppConversation,
  tenantId: string
): Promise<void> {
  const metadata: Record<string, unknown> = {};
  if (conversation.mode) metadata.mode = conversation.mode;

  await prisma.whatsAppConversation.upsert({
    where: {
      tenantId_id: { tenantId, id: conversation.id },
    },
    create: {
      id: conversation.id,
      tenantId,
      phone: conversation.phone,
      displayName: conversation.contactName,
      autoReplyEnabled: conversation.autoReplyEnabled,
      aiMode: conversation.mode ?? "automatic",
      unreadCount: conversation.unreadCount,
      lastActivityAt: new Date(
        Number(conversation.timestamp) * 1000
      ),
      metadata: metadata as object,
    },
    update: {
      phone: conversation.phone,
      displayName: conversation.contactName,
      autoReplyEnabled: conversation.autoReplyEnabled,
      aiMode: conversation.mode ?? "automatic",
      unreadCount: conversation.unreadCount,
      lastActivityAt: new Date(
        Number(conversation.timestamp) * 1000
      ),
      metadata: metadata as object,
    },
  });
}

export type WhatsAppAnalyticsEventType =
  | "message_received"
  | "media_received"
  | "image_received"
  | "audio_received"
  | "video_received"
  | "document_received"
  | "asset_saved"
  | "message_sent"
  | "ai_draft_generated"
  | "ai_auto_reply_sent"
  | "ai_auto_reply_blocked"
  | "appointment_suggested"
  | "appointment_scheduled"
  | "failed_send"
  | "manual_override"
  | "conversation_opened"
  | "response_time_measured"
  | "intent_detected"
  | "support_card_shown"
  | "support_card_inserted"
  | "campaign_generated"
  | "campaign_personalized"
  | "campaign_sent"
  | "campaign_reply_received"
  | "booking_from_campaign";

type WhatsAppAnalyticsEvent = {
  id: string;
  tenantId: string;
  conversationId: string;
  type: WhatsAppAnalyticsEventType;
  timestamp: string;
  metadata: Record<string, unknown>;
};

const dataFile = path.join(process.cwd(), "data", "whatsapp-store.json");
const conversationsDir = path.join(process.cwd(), "data", "conversations");
const conversationsFile = path.join(conversationsDir, "conversations.json");
const messagesFile = path.join(conversationsDir, "messages.json");
const analyticsEventsFile = path.join(conversationsDir, "analytics-events.json");
const appointmentsFile = path.join(conversationsDir, "appointments.json");

const emptyStore = (): StoreSnapshot => ({
  messages: [],
  conversations: [],
  unreadCount: 0,
});

export function maskPhone(value: string) {
  if (value.length <= 4) {
    return "****";
  }

  return `${"*".repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000).toString();
}

function normalizeTimestamp(timestamp?: string) {
  if (!timestamp) {
    return nowSeconds();
  }

  if (/^\d+$/.test(timestamp)) {
    return timestamp;
  }

  const parsed = Date.parse(timestamp);

  return Number.isNaN(parsed) ? nowSeconds() : Math.floor(parsed / 1000).toString();
}

function migrateMessage(message: Partial<WhatsAppInternalMessage> & {
  from?: string;
  text?: string;
  contactName?: string;
  media?: {
    id?: string;
    type?: WhatsAppMessageType;
  };
}): WhatsAppInternalMessage | null {
  const phone = message.phone ?? message.from ?? message.conversationId;

  if (!message.id || !phone) {
    return null;
  }

  const direction = message.direction ?? "inbound";
  const type =
    message.type === "image" ||
    message.type === "audio" ||
    message.type === "video" ||
    message.type === "document" ||
    message.type === "reaction" ||
    message.type === "status" ||
    message.type === "text"
      ? message.type
      : "text";

  return {
    id: message.id,
    waMessageId: message.waMessageId ?? message.id,
    conversationId: message.conversationId ?? phone,
    phone,
    senderName:
      message.senderName ??
      message.contactName ??
      `WhatsApp ${maskPhone(phone)}`,
    direction,
    type,
    content:
      message.content ??
      message.text ??
      (message.media?.type ? `Nuevo ${message.media.type} recibido` : ""),
    mediaUrl: message.mediaUrl,
    mediaId: message.mediaId ?? message.media?.id,
    timestamp: normalizeTimestamp(message.timestamp),
    status: message.status ?? (direction === "inbound" ? "received" : "sent"),
    seen:
      typeof message.seen === "boolean"
        ? message.seen
        : direction !== "inbound" || type === "status",
    raw: message.raw ?? message,
    metadata: message.metadata,
  };
}

function isUnreadInboundMessage(message: WhatsAppInternalMessage) {
  return (
    message.direction === "inbound" &&
    message.type !== "status" &&
    message.seen !== true
  );
}

function recomputeConversationUnread(store: StoreSnapshot, conversationId: string) {
  const conversation = store.conversations.find(
    (item) => item.id === conversationId || item.phone === conversationId
  );

  if (!conversation) {
    return;
  }

  conversation.unreadCount = store.messages.filter(
    (message) =>
      (message.conversationId === conversation.id ||
        message.phone === conversation.phone) &&
      isUnreadInboundMessage(message)
  ).length;
}

function recomputeUnreadCounts(store: StoreSnapshot) {
  store.conversations.forEach((conversation) => {
    conversation.unreadCount = store.messages.filter(
      (message) =>
        (message.conversationId === conversation.id ||
          message.phone === conversation.phone) &&
        isUnreadInboundMessage(message)
    ).length;
  });

  store.unreadCount = store.messages.filter(isUnreadInboundMessage).length;
}

function recomputeConversationServiceWindows(store: StoreSnapshot) {
  store.conversations.forEach((conversation) => {
    const lastInbound = store.messages
      .filter(
        (message) =>
          (message.conversationId === conversation.id ||
            message.phone === conversation.phone) &&
          message.direction === "inbound" &&
          message.type !== "status"
      )
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))[0];

    conversation.lastInboundAt = lastInbound?.timestamp;
  });
}

function previewFor(message: WhatsAppInternalMessage) {
  if (message.type === "reaction") {
    return message.content ? `Reacciono ${message.content}` : "Nueva reaccion";
  }

  if (message.type === "status") {
    return `Estado: ${message.content}`;
  }

  if (message.content) {
    return message.content;
  }

  return `Nuevo ${message.type} recibido`;
}

function createConversation(message: WhatsAppInternalMessage): WhatsAppConversation {
  const updatedAt = new Date(Number(message.timestamp) * 1000).toISOString();
  const name = message.senderName || `WhatsApp ${maskPhone(message.phone)}`;

  return {
    id: message.conversationId,
    phone: message.phone,
    autoReplyEnabled: false,
    from: message.phone,
    contactName: name,
    senderName: name,
    lastMessage: message,
    lastMessagePreview: previewFor(message),
    lastInboundAt:
      message.direction === "inbound" && message.type !== "status"
        ? message.timestamp
        : undefined,
    timestamp: message.timestamp,
    unreadCount: isUnreadInboundMessage(message) ? 1 : 0,
    updatedAt,
    activeNow: true,
    customerProfile: {
      phone: message.phone,
      name,
      tags: ["whatsapp"],
      firstSeenAt: updatedAt,
      lastSeenAt: updatedAt,
    },
  };
}

function upsertConversation(
  store: StoreSnapshot,
  message: WhatsAppInternalMessage,
  options: { countUnread?: boolean } = {}
) {
  const existingConversation = store.conversations.find(
    (conversation) => conversation.id === message.conversationId
  );
  const updatedAt = new Date(Number(message.timestamp) * 1000).toISOString();

  if (existingConversation) {
    existingConversation.phone = message.phone;
    existingConversation.from = message.phone;
    existingConversation.autoReplyEnabled =
      existingConversation.autoReplyEnabled ?? false;
    existingConversation.senderName =
      message.senderName || existingConversation.senderName;
    existingConversation.contactName =
      message.senderName || existingConversation.contactName;
    existingConversation.lastMessage = message;
    existingConversation.lastMessagePreview = previewFor(message);
    if (message.direction === "inbound" && message.type !== "status") {
      existingConversation.lastInboundAt = message.timestamp;
    }
    existingConversation.timestamp = message.timestamp;
    existingConversation.updatedAt = updatedAt;
    existingConversation.activeNow = true;
    existingConversation.customerProfile = {
      ...existingConversation.customerProfile,
      phone: message.phone,
      name: message.senderName || existingConversation.customerProfile.name,
      lastSeenAt: updatedAt,
    };

    if (options.countUnread && isUnreadInboundMessage(message)) {
      existingConversation.unreadCount += 1;
    }
  } else {
    store.conversations.push(createConversation(message));
  }

  store.conversations.sort(
    (a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)
  );
}

function timestampToIso(timestamp?: string) {
  const normalizedTimestamp = normalizeTimestamp(timestamp);

  return new Date(Number(normalizedTimestamp) * 1000).toISOString();
}

function sourceFor(message: WhatsAppInternalMessage) {
  if (message.direction === "inbound") {
    return "whatsapp_webhook";
  }

  if (message.metadata?.generatedByAI && message.metadata.autoSent) {
    return "ai_auto_reply";
  }

  if (message.metadata?.generatedByAI) {
    return "ai_draft";
  }

  return "manual_crm";
}

function structuredMessageFor(message: WhatsAppInternalMessage) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    direction: message.direction,
    type: message.type,
    text: message.content,
    phone: message.phone,
    timestamp: timestampToIso(message.timestamp),
    status: message.status,
    seen: Boolean(message.seen),
    waMessageId: message.waMessageId ?? null,
    generatedByAI: Boolean(message.metadata?.generatedByAI),
    autoSent: Boolean(message.metadata?.autoSent),
    intent: message.metadata?.intent ?? null,
    confidence: message.metadata?.confidence ?? null,
    source: sourceFor(message),
    mediaId: message.mediaId ?? null,
    mediaUrl: message.mediaUrl ?? null,
    assetId: message.metadata?.assetId ?? null,
    assetError: message.metadata?.assetError ?? null,
    lastError: message.metadata?.lastError ?? null,
    rawMetaPayload: message.raw ?? null,
  };
}

function structuredConversationFor(conversation: WhatsAppConversation) {
  return {
    id: conversation.id,
    phone: conversation.phone,
    displayName: conversation.contactName,
    lastMessage: conversation.lastMessagePreview,
    lastInboundAt: conversation.lastInboundAt ?? null,
    unreadCount: conversation.unreadCount,
    autoReplyEnabled: conversation.autoReplyEnabled,
    mode: conversation.mode ?? null,
    createdAt: conversation.customerProfile.firstSeenAt,
    updatedAt: conversation.updatedAt,
    tags: conversation.customerProfile.tags,
    currentIntent: conversation.lastMessage?.metadata?.intent ?? null,
    satisfactionSignals: [],
    appointmentId: null,
  };
}

async function ensureStructuredFiles() {
  await fs.mkdir(conversationsDir, { recursive: true });

  await Promise.all(
    [analyticsEventsFile, appointmentsFile].map(async (filePath) => {
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
      }
    })
  );
}

async function readAnalyticsEvents(): Promise<WhatsAppAnalyticsEvent[]> {
  try {
    const content = await fs.readFile(analyticsEventsFile, "utf-8");
    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStructuredStore(store: StoreSnapshot) {
  await ensureStructuredFiles();
  await Promise.all([
    fs.writeFile(
      conversationsFile,
      JSON.stringify(store.conversations.map(structuredConversationFor), null, 2)
    ),
    fs.writeFile(
      messagesFile,
      JSON.stringify(store.messages.map(structuredMessageFor), null, 2)
    ),
  ]);
}

async function writeStore(store: StoreSnapshot) {
  recomputeConversationServiceWindows(store);
  recomputeUnreadCounts(store);
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
  await writeStructuredStore(store);
}

/**
 * writeStoreJsonOnly — Escribe un mensaje individual al JSON store como fallback.
 * Se usa desde saveWhatsAppMessage cuando la ruta Prisma está activa,
 * para mantener sincronizado el JSON legacy.
 */
async function writeStoreJsonOnly(message: WhatsAppInternalMessage) {
  try {
    const store = await readStore();
    const existingIndex = store.messages.findIndex(
      (m) => m.id === message.id
    );
    if (existingIndex === -1) {
      store.messages.push(message);
    } else {
      store.messages[existingIndex] = message;
    }
    upsertConversation(store, message, {
      countUnread: isUnreadInboundMessage(message),
    });
    recomputeUnreadCounts(store);
    await writeStore(store);
  } catch {
    // Silencioso — es solo fallback
  }
}

async function readStore(): Promise<StoreSnapshot> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    const parsed = JSON.parse(content) as Partial<StoreSnapshot>;
    const previousConversations = new Map(
      (parsed.conversations ?? []).map((conversation) => [
        conversation.id,
        conversation,
      ])
    );
    const previousConversationsByPhone = new Map(
      (parsed.conversations ?? []).map((conversation) => [
        conversation.phone,
        conversation,
      ])
    );
    const messagesMissingSeen = new Set(
      (parsed.messages ?? [])
        .filter((message) => typeof message.seen !== "boolean" && message.id)
        .map((message) => String(message.id))
    );
    const store: StoreSnapshot = {
      messages: (parsed.messages ?? [])
        .map((message) => migrateMessage(message))
        .filter((message): message is WhatsAppInternalMessage => Boolean(message)),
      conversations: [],
      unreadCount: 0,
    };

    if (messagesMissingSeen.size > 0) {
      const unreadBudgetByConversation = new Map<string, number>();
      for (const conversation of parsed.conversations ?? []) {
        unreadBudgetByConversation.set(
          conversation.id,
          Math.max(0, conversation.unreadCount ?? 0)
        );
        unreadBudgetByConversation.set(
          conversation.phone,
          Math.max(0, conversation.unreadCount ?? 0)
        );
      }

      const inboundMissingSeen = store.messages
        .filter(
          (message) =>
            messagesMissingSeen.has(message.id) &&
            message.direction === "inbound" &&
            message.type !== "status"
        )
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      inboundMissingSeen.forEach((message) => {
        const budget =
          unreadBudgetByConversation.get(message.conversationId) ??
          unreadBudgetByConversation.get(message.phone) ??
          0;

        if (budget > 0) {
          message.seen = false;
          unreadBudgetByConversation.set(message.conversationId, budget - 1);
          unreadBudgetByConversation.set(message.phone, budget - 1);
          return;
        }

        message.seen = true;
      });
    }

    for (const message of store.messages) {
      if (message.type !== "status") {
        upsertConversation(store, message, {
          countUnread: isUnreadInboundMessage(message),
        });
      }
    }

    store.conversations = store.conversations.map((conversation) => {
      const previousConversation = previousConversations.get(conversation.id);
      const previousConversationByPhone = previousConversationsByPhone.get(
        conversation.phone
      );

      return {
        ...conversation,
        recipient:
          previousConversation?.recipient ??
          previousConversationByPhone?.recipient ??
          conversation.recipient,
        lastInboundAt:
          previousConversation?.lastInboundAt ??
          previousConversationByPhone?.lastInboundAt ??
          conversation.lastInboundAt,
        autoReplyEnabled:
          previousConversation?.autoReplyEnabled ??
          previousConversationByPhone?.autoReplyEnabled ??
          false,
      };
    });

    recomputeConversationServiceWindows(store);
    recomputeUnreadCounts(store);
    if (messagesMissingSeen.size > 0) {
      await writeStore(store);
    }

    return store;
  } catch {
    const initialStore = emptyStore();
    await writeStore(initialStore);
    return initialStore;
  }
}

export async function recordAnalyticsEvent(event: {
  conversationId: string;
  type: WhatsAppAnalyticsEventType;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}) {
  // ── Ruta Prisma: cuando tenantId está presente ──
  if (event.tenantId) {
    try {
      const created = await prisma.whatsAppAnalyticsEvent.create({
        data: {
          tenantId: event.tenantId,
          conversationId: event.conversationId,
          type: event.type,
          metadata: (event.metadata ?? {}) as object,
        },
      });
      return {
        id: created.id,
        tenantId: created.tenantId,
        conversationId: created.conversationId,
        type: created.type as WhatsAppAnalyticsEventType,
        timestamp: created.timestamp.toISOString(),
        metadata: created.metadata as Record<string, unknown>,
      };
    } catch (err) {
      console.error("[ANALYTICS] Failed to record event in Prisma:", err);
      // Fallback a JSON
    }
  }

  // ── Ruta JSON (legacy) ──
  await ensureStructuredFiles();

  const events = await readAnalyticsEvents();
  const nextEvent: WhatsAppAnalyticsEvent = {
    id: randomUUID(),
    tenantId: event.tenantId ?? "unknown",
    conversationId: event.conversationId,
    type: event.type,
    timestamp: new Date().toISOString(),
    metadata: event.metadata ?? {},
  };

  events.push(nextEvent);
  await fs.writeFile(analyticsEventsFile, JSON.stringify(events, null, 2));

  return nextEvent;
}

export async function saveWhatsAppMessage(message: WhatsAppInternalMessage) {
  // ── Ruta Prisma: cuando message.tenantId está presente ──
  const hasTenantId = !!message.tenantId;
  if (hasTenantId) {
    try {
      // Verificar si ya existe en Prisma
      const existing = await prisma.whatsAppMessage.findUnique({
        where: { id: message.id },
        select: { id: true },
      });
      const isNew = !existing;

      // Guardar mensaje en Prisma
      await toPrismaMessage(message);

      // Upsert conversación en Prisma
      const conversation = createConversation(message);
      await toPrismaConversation(conversation, message.tenantId!);

      // Recomputar unreadCount en Prisma
      const unread = await prisma.whatsAppMessage.count({
        where: {
          tenantId: message.tenantId,
          conversationId: message.conversationId,
          direction: "inbound",
          type: { not: "status" },
          seen: false,
        },
      });
      await prisma.whatsAppConversation.updateMany({
        where: {
          tenantId: message.tenantId,
          id: message.conversationId,
        },
        data: { unreadCount: unread },
      });

      // Registrar analytics event si es nuevo
      if (isNew) {
        const eventType: WhatsAppAnalyticsEventType =
          message.direction === "inbound"
            ? "message_received"
            : message.status === "failed"
              ? "failed_send"
              : message.metadata?.autoSent
                ? "ai_auto_reply_sent"
                : "message_sent";

        await recordAnalyticsEvent({
          conversationId: message.conversationId,
          tenantId: message.tenantId,
          type: eventType,
          metadata: {
            messageId: message.id,
            waMessageId: message.waMessageId ?? null,
            direction: message.direction,
            status: message.status,
            intent: message.metadata?.intent ?? null,
            confidence: message.metadata?.confidence ?? null,
            generatedByAI: Boolean(message.metadata?.generatedByAI),
            autoSent: Boolean(message.metadata?.autoSent),
            source: sourceFor(message),
            tenantId: message.tenantId,
          },
        });
      }

      // Obtener la conversación actualizada desde Prisma
      const prismaConversation = await getWhatsAppConversation(
        message.conversationId,
        message.tenantId
      );

      // Siempre escribe también en JSON como fallback
      try {
        await writeStoreJsonOnly(message);
      } catch {
        // Silencioso — JSON es solo fallback
      }

      return {
        message,
        conversation: prismaConversation,
        isNew,
      };
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma saveWhatsAppMessage failed, falling back to JSON",
        err
      );
      // Fall through to JSON legacy
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();
  const existingIndex = store.messages.findIndex(
    (storedMessage) => storedMessage.id === message.id
  );
  const isNew = existingIndex === -1;

  if (isNew) {
    store.messages.push({
      ...message,
      seen:
        typeof message.seen === "boolean"
          ? message.seen
          : message.direction !== "inbound" || message.type === "status",
    });
  } else {
    store.messages[existingIndex] = {
      ...store.messages[existingIndex],
      ...message,
      seen:
        typeof message.seen === "boolean"
          ? message.seen
          : store.messages[existingIndex].seen,
    };
  }

  const storedMessage = store.messages.find((stored) => stored.id === message.id) ?? message;
  upsertConversation(store, message, {
    countUnread: isNew && isUnreadInboundMessage(storedMessage),
  });
  recomputeUnreadCounts(store);
  await writeStore(store);

  if (isNew) {
    const eventType: WhatsAppAnalyticsEventType =
      message.direction === "inbound"
        ? "message_received"
        : message.status === "failed"
          ? "failed_send"
        : message.metadata?.autoSent
          ? "ai_auto_reply_sent"
          : "message_sent";

    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      type: eventType,
      metadata: {
        messageId: message.id,
        waMessageId: message.waMessageId ?? null,
        direction: message.direction,
        status: message.status,
        intent: message.metadata?.intent ?? null,
        confidence: message.metadata?.confidence ?? null,
        generatedByAI: Boolean(message.metadata?.generatedByAI),
        autoSent: Boolean(message.metadata?.autoSent),
        source: sourceFor(message),
      },
    });
  }

  return {
    message,
    conversation:
      store.conversations.find((item) => item.id === message.conversationId) ??
      null,
    isNew,
  };
}

export async function updateWhatsAppMessageStatus(
  waMessageId: string,
  status: WhatsAppMessageStatus,
  timestamp?: string,
  tenantId?: string | null
) {
  const normalizedTimestamp = normalizeTimestamp(timestamp);

  // ── Ruta Prisma ──
  if (tenantId) {
    try {
      // Buscar el mensaje en Prisma por waMessageId o id
      const row = await prisma.whatsAppMessage.findFirst({
        where: {
          tenantId,
          OR: [
            { waMessageId },
            { id: waMessageId },
          ],
        },
      });

      if (!row) {
        // Fallback a JSON si no encontramos en Prisma
        const fallback = await fallbackUpdateStatus(
          waMessageId,
          status,
          normalizedTimestamp
        );
        return fallback;
      }

      if (status === "failed" && row.direction === "outbound") {
        await recordAnalyticsEvent({
          conversationId: row.conversationId,
          tenantId,
          type: "failed_send",
          metadata: {
            messageId: row.id,
            waMessageId,
            previousStatus: row.status,
            source: "whatsapp_status_webhook",
            tenantId,
          },
        });
        return fromPrismaMessage(row);
      }

      // Actualizar status y timestamp en Prisma
      await prisma.whatsAppMessage.update({
        where: { id: row.id },
        data: {
          status,
          timestamp: normalizedTimestamp || row.timestamp,
        },
      });

      // Actualizar unreadCount en conversación
      if (status === "read") {
        const unread = await prisma.whatsAppMessage.count({
          where: {
            tenantId,
            conversationId: row.conversationId,
            direction: "inbound",
            type: { not: "status" },
            seen: false,
          },
        });
        await prisma.whatsAppConversation.updateMany({
          where: { tenantId, id: row.conversationId },
          data: { unreadCount: unread },
        });
      }

      return fromPrismaMessage({
        ...row,
        status,
        timestamp: normalizedTimestamp || row.timestamp,
      });
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma updateWhatsAppMessageStatus failed, falling back to JSON",
        err
      );
      // Fall through to JSON
    }
  }

  // ── Fallback JSON (legacy) ──
  return fallbackUpdateStatus(waMessageId, status, normalizedTimestamp);
}

async function fallbackUpdateStatus(
  waMessageId: string,
  status: WhatsAppMessageStatus,
  normalizedTimestamp: string
) {
  const store = await readStore();
  const message = store.messages.find(
    (storedMessage) =>
      storedMessage.waMessageId === waMessageId || storedMessage.id === waMessageId
  );

  if (!message) {
    return null;
  }

  if (status === "failed" && message.direction === "outbound") {
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      type: "failed_send",
      metadata: {
        messageId: message.id,
        waMessageId,
        previousStatus: message.status,
        source: "whatsapp_status_webhook",
      },
    });
    return message;
  }

  message.status = status;
  message.timestamp = normalizedTimestamp || message.timestamp;
  upsertConversation(store, message, { countUnread: false });
  await writeStore(store);

  return message;
}

export async function updateWhatsAppConversationMode(
  conversationId: string,
  autoReplyEnabled: boolean,
  options: {
    contactName?: string;
    phone?: string;
    tenantId?: string | null;
  } = {}
) {
  // ── Ruta Prisma ──
  if (options.tenantId) {
    try {
      const metadata: Record<string, unknown> = {
        mode: autoReplyEnabled ? "automatic" : "manual",
      };

      const row = await prisma.whatsAppConversation.upsert({
        where: {
          tenantId_id: {
            tenantId: options.tenantId,
            id: conversationId,
          },
        },
        create: {
          id: conversationId,
          tenantId: options.tenantId,
          phone: options.phone ?? conversationId,
          displayName: options.contactName ?? null,
          autoReplyEnabled,
          aiMode: autoReplyEnabled ? "automatic" : "manual",
          unreadCount: 0,
          lastActivityAt: new Date(),
          metadata: metadata as object,
        },
        update: {
          autoReplyEnabled,
          aiMode: autoReplyEnabled ? "automatic" : "manual",
          phone: options.phone ?? undefined,
          displayName: options.contactName ?? undefined,
          metadata: metadata as object,
        },
        include: {
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      await recordAnalyticsEvent({
        conversationId,
        tenantId: options.tenantId,
        type: "manual_override",
        metadata: {
          autoReplyEnabled,
          mode: autoReplyEnabled ? "automatic" : "manual",
          tenantId: options.tenantId,
        },
      });

      return fromPrismaConversation(row);
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma updateWhatsAppConversationMode failed, falling back to JSON",
        err
      );
      // Fall through to JSON
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();
  let conversation = store.conversations.find(
    (item) => item.id === conversationId || item.phone === conversationId
  );

  if (!conversation) {
    const phone = options.phone ?? conversationId;
    const timestamp = nowSeconds();
    const updatedAt = new Date(Number(timestamp) * 1000).toISOString();
    const name = options.contactName || `WhatsApp ${maskPhone(phone)}`;

    conversation = {
      id: conversationId,
      phone,
      recipient: phone,
      autoReplyEnabled,
      from: phone,
      contactName: name,
      senderName: name,
      lastMessage: null,
      lastMessagePreview: "AI mode configured",
      lastInboundAt: undefined,
      timestamp,
      unreadCount: 0,
      updatedAt,
      activeNow: true,
      customerProfile: {
        phone,
        name,
        tags: ["whatsapp"],
        firstSeenAt: updatedAt,
        lastSeenAt: updatedAt,
      },
    };
    store.conversations.push(conversation);
  }

  conversation.autoReplyEnabled = autoReplyEnabled;
  if (options.phone) {
    conversation.phone = options.phone;
    conversation.recipient = options.phone;
    conversation.from = options.phone;
  }
  if (options.contactName) {
    conversation.contactName = options.contactName;
    conversation.senderName = options.contactName;
    conversation.customerProfile.name = options.contactName;
  }
  await writeStore(store);
  await recordAnalyticsEvent({
    conversationId,
    tenantId: options.tenantId ?? undefined,
    type: "manual_override",
    metadata: {
      autoReplyEnabled,
      mode: autoReplyEnabled ? "automatic" : "manual",
    },
  });

  return conversation;
}

export async function getWhatsAppMessages(options: {
  after?: string | null;
  conversationId?: string | null;
  tenantId?: string | null;
} = {}) {
  // ── Ruta Prisma: cuando tenantId está presente ──
  if (options.tenantId) {
    try {
      const where: Record<string, unknown> = {
        tenantId: options.tenantId,
      };
      if (options.conversationId) {
        where.conversationId = options.conversationId;
      }

      const rows = await prisma.whatsAppMessage.findMany({
        where: where as any,
        orderBy: { timestamp: "asc" },
      });

      let messages = rows.map(fromPrismaMessage);

      if (options.after) {
        const afterIndex = messages.findIndex(
          (message) => message.id === options.after
        );
        if (afterIndex !== -1) {
          messages = messages.slice(afterIndex + 1);
        }
      }

      return messages.filter((message) => message.type !== "status");
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma getWhatsAppMessages failed, falling back to JSON",
        err
      );
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();
  let messages = options.conversationId
    ? store.messages.filter(
        (message) =>
          message.conversationId === options.conversationId ||
          message.phone === options.conversationId
      )
    : store.messages;

  if (options.after) {
    const afterIndex = messages.findIndex((message) => message.id === options.after);

    if (afterIndex !== -1) {
      messages = messages.slice(afterIndex + 1);
    }
  }

  return messages
    .filter((message) => message.type !== "status")
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

export async function getWhatsAppUnreadCount() {
  const store = await readStore();
  recomputeUnreadCounts(store);

  return store.unreadCount;
}

export async function getWhatsAppConversations(tenantId?: string | null) {
  // ── Ruta Prisma ──
  if (tenantId) {
    try {
      const rows = await prisma.whatsAppConversation.findMany({
        where: { tenantId },
        include: {
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
        orderBy: { lastActivityAt: "desc" },
      });

      return rows.map(fromPrismaConversation);
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma getWhatsAppConversations failed, falling back to JSON",
        err
      );
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();
  recomputeUnreadCounts(store);

  return store.conversations;
}

export async function getWhatsAppConversation(
  conversationId: string,
  tenantId?: string | null
) {
  // ── Ruta Prisma ──
  if (tenantId) {
    try {
      const row = await prisma.whatsAppConversation.findFirst({
        where: {
          tenantId,
          OR: [
            { id: conversationId },
            { phone: conversationId },
          ],
        },
        include: {
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      if (row) return fromPrismaConversation(row);
      return null;
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma getWhatsAppConversation failed, falling back to JSON",
        err
      );
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();

  return (
    store.conversations.find(
      (conversation) =>
        conversation.id === conversationId || conversation.phone === conversationId
    ) ??
    null
  );
}

export async function markWhatsAppMessagesSeen(
  conversationId?: string | null,
  tenantId?: string | null
) {
  // ── Ruta Prisma ──
  if (tenantId && conversationId) {
    try {
      const result = await prisma.whatsAppMessage.updateMany({
        where: {
          tenantId,
          conversationId,
          direction: "inbound",
          type: { not: "status" },
          seen: false,
        },
        data: { seen: true },
      });

      // Actualizar unreadCount en la conversación
      if (result.count > 0) {
        const unread = await prisma.whatsAppMessage.count({
          where: {
            tenantId,
            conversationId,
            direction: "inbound",
            type: { not: "status" },
            seen: false,
          },
        });

        await prisma.whatsAppConversation.updateMany({
          where: { tenantId, id: conversationId },
          data: { unreadCount: unread },
        });

        // También registrar analytics event
        await recordAnalyticsEvent({
          conversationId,
          tenantId,
          type: "conversation_opened",
          metadata: { unreadCleared: true, source: "prisma" },
        });
      }

      // Retornar conversación actualizada
      const conversation = await getWhatsAppConversation(
        conversationId,
        tenantId
      );
      return conversation;
    } catch (err) {
      console.warn(
        "[WHATSAPP] Prisma markWhatsAppMessagesSeen failed, falling back to JSON",
        err
      );
    }
  }

  // ── Fallback JSON (legacy) ──
  const store = await readStore();

  if (conversationId) {
    const conversation = store.conversations.find(
      (item) => item.id === conversationId || item.phone === conversationId
    );

    if (conversation) {
      store.messages = store.messages.map((message) =>
        (message.conversationId === conversation.id ||
          message.phone === conversation.phone ||
          message.conversationId === conversationId) &&
        isUnreadInboundMessage(message)
          ? { ...message, seen: true }
          : message
      );
      recomputeConversationUnread(store, conversation.id);
      recomputeUnreadCounts(store);
      conversation.activeNow = true;
      await writeStore(store);
      await recordAnalyticsEvent({
        conversationId,
        tenantId: tenantId ?? undefined,
        type: "conversation_opened",
        metadata: {
          unreadCleared: true,
        },
      });
    }

    return conversation ?? null;
  }

  store.messages = store.messages.map((message) =>
    isUnreadInboundMessage(message) ? { ...message, seen: true } : message
  );
  recomputeUnreadCounts(store);
  await writeStore(store);

  return null;
}
