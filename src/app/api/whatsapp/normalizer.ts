import type { WhatsAppInternalMessage } from "./store";

type WhatsAppMediaPayload = {
  id?: string;
  caption?: string;
  filename?: string;
  mime_type?: string;
  sha256?: string;
};

export type WhatsAppWebhookMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
  image?: WhatsAppMediaPayload;
  video?: WhatsAppMediaPayload;
  audio?: WhatsAppMediaPayload;
  document?: WhatsAppMediaPayload;
  reaction?: {
    message_id?: string;
    emoji?: string;
  };
};

export type WhatsAppWebhookStatus = {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
  conversation?: {
    id?: string;
  };
  pricing?: unknown;
  errors?: unknown[];
};

type WhatsAppContact = {
  wa_id?: string;
  profile?: {
    name?: string;
  };
};

const supportedMessageTypes = [
  "text",
  "image",
  "audio",
  "video",
  "document",
  "reaction",
] as const;

function isSupportedMessageType(
  type: string | undefined
): type is WhatsAppInternalMessage["type"] {
  return supportedMessageTypes.includes(
    type as (typeof supportedMessageTypes)[number]
  );
}

function mediaFor(message: WhatsAppWebhookMessage) {
  if (
    message.type === "image" ||
    message.type === "video" ||
    message.type === "audio" ||
    message.type === "document"
  ) {
    return message[message.type];
  }

  return undefined;
}

function contentFor(message: WhatsAppWebhookMessage) {
  if (message.type === "text") {
    return message.text?.body ?? "";
  }

  if (message.type === "reaction") {
    return message.reaction?.emoji ?? "";
  }

  const media = mediaFor(message);

  if (media?.caption) {
    return media.caption;
  }

  if (media?.filename) {
    return media.filename;
  }

  return message.type ? `Nuevo ${message.type} recibido` : "";
}

export function normalizeWhatsAppMessage(
  message: WhatsAppWebhookMessage,
  contacts: WhatsAppContact[]
): WhatsAppInternalMessage | null {
  if (!message.id || !message.from || !message.timestamp) {
    return null;
  }

  const contact = contacts.find((item) => item.wa_id === message.from);
  const media = mediaFor(message);
  const type = isSupportedMessageType(message.type) ? message.type : "text";
  const senderName =
    contact?.profile?.name ?? `WhatsApp ${message.from.slice(-4)}`;

  return {
    id: message.id,
    conversationId: message.from,
    phone: message.from,
    senderName,
    direction: "inbound",
    type,
    content: contentFor(message),
    mediaUrl: undefined,
    mediaId: media?.id,
    timestamp: message.timestamp,
    status: "received",
    raw: message,
  };
}

export function normalizeStatusAsMessage(
  status: WhatsAppWebhookStatus
): WhatsAppInternalMessage | null {
  if (!status.id || !status.recipient_id || !status.timestamp) {
    return null;
  }

  return {
    id: `status-${status.id}-${status.status ?? "unknown"}-${status.timestamp}`,
    conversationId: status.recipient_id,
    phone: status.recipient_id,
    senderName: `WhatsApp ${status.recipient_id.slice(-4)}`,
    direction: "outbound",
    type: "status",
    content: status.status ?? "status",
    timestamp: status.timestamp,
    status:
      status.status === "read" ||
      status.status === "delivered" ||
      status.status === "sent" ||
      status.status === "failed"
        ? status.status
        : "sent",
    raw: status,
  };
}
