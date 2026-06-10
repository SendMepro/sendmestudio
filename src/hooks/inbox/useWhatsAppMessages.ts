"use client";

import { useCallback, useRef, useState } from "react";

// ── Types (subset extracted from page.tsx) ──────────────────────────

type Conversation = {
  id: number | string;
  name: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled?: boolean;
  lastInboundAt?: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  activeNow?: boolean;
  avatar: string;
};

type Message = {
  id: number | string;
  type: "client" | "studio";
  text: string;
  time: string;
  waMessageId?: string;
  from?: string;
  timestamp?: string;
  mediaId?: string;
  status?: "received" | "sending" | "read" | "sent" | "delivered" | "failed";
  media?: StagedMedia[];
  isNew?: boolean;
  replyTo?: MessageQuote;
  metadata?: {
    generatedByAI?: boolean;
    autoSent?: boolean;
    confidence?: number;
    intent?: string;
    safeguardReason?: string;
    lastError?: MetaSendError;
    assetId?: string;
    assetError?: {
      message: string;
      statusCode?: number;
      metaResponse?: unknown;
    };
  };
};

type MetaSendError = {
  statusCode?: number;
  statusText?: string;
  code?: number | string;
  message: string;
  error_subcode?: number | string;
  metaResponse?: unknown;
};

type MessageQuote = {
  type: "client" | "studio";
  text: string;
};

type WhatsAppInboxMessage = {
  id: string;
  waMessageId?: string;
  conversationId: string;
  phone: string;
  senderName: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  type: "text" | "image" | "audio" | "video" | "document" | "reaction" | "status";
  content: string;
  mediaUrl?: string;
  mediaId?: string;
  status: "received" | "sending" | "read" | "sent" | "delivered" | "failed";
  metadata?: Message["metadata"];
};

type WhatsAppInboxConversation = {
  id: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled: boolean;
  from: string;
  contactName: string;
  senderName: string;
  lastMessage: WhatsAppInboxMessage | null;
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

type StagedMedia = {
  id: string;
  name: string;
  kind: "image" | "video" | "audio" | "pdf" | "document";
  source: "file" | "suggested" | "whatsapp";
  file?: File;
  previewUrl?: string;
  resourceType?: "Visual reference" | "Before After" | "Treatment guide" | "Staged attachment";
  assetCount?: number;
};

// ── Return type ────────────────────────────────────────────────────

export type UseWhatsAppMessagesResult = {
  /** All messages keyed by conversation ID */
  messagesByConversation: Record<string, Message[]>;
  /** Setter for messagesByConversation (exposed for external manipulation) */
  setMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  /** Set of conversation IDs that have been fully loaded */
  loadedConversationIds: string[];
  /** Ref tracking the latest message ID per conversation (for polling) */
  lastWhatsAppMessageIdsRef: React.MutableRefObject<Record<string, string>>;
  /** Auto-incrementing local message ID counter */
  localMessageIdRef: React.MutableRefObject<number>;

  /** Sync thread list from WhatsApp conversation data */
  syncWhatsAppThreads: (
    whatsAppConversations: WhatsAppInboxConversation[],
    options?: { onMarkThreadArrival?: (threadId: string) => void }
  ) => void;
  /** Display status for a WhatsApp message (with existing message override) */
  displayStatusFor: (
    incomingMessage: WhatsAppInboxMessage,
    existingMessage?: Message
  ) => Message["status"];
  /** Build media preview from a WhatsApp message */
  mediaPreviewForWhatsAppMessage: (message: WhatsAppInboxMessage) => StagedMedia[] | undefined;
  /** Build display text from a WhatsApp message */
  displayTextForWhatsAppMessage: (
    message: WhatsAppInboxMessage,
    mediaPreview?: StagedMedia[]
  ) => string;
  /** Upsert WhatsApp messages into the conversation store */
  upsertWhatsAppMessages: (
    whatsAppMessages: WhatsAppInboxMessage[],
    options?: { onAutoReplyDraft?: (content: string) => void }
  ) => void;
  /** Append WhatsApp messages and optionally sync threads */
  appendWhatsAppMessages: (
    whatsAppMessages: WhatsAppInboxMessage[],
    whatsAppConversations?: WhatsAppInboxConversation[],
    options?: { onAutoReplyDraft?: (content: string) => void; onMarkThreadArrival?: (threadId: string) => void }
  ) => void;
  /** Fetch and load messages for a conversation from the API */
  loadConversationMessages: (
    conversationId: string,
    options?: {
      after?: string | null;
      markSeen?: boolean;
      replace?: boolean;
      onAutoReplyDraft?: (content: string) => void;
      onMarkThreadArrival?: (threadId: string) => void;
    }
  ) => Promise<void>;
  /** Update a message's status across all conversations */
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
  /** Format a WhatsApp Unix timestamp to display time */
  formatWhatsAppTimestamp: (timestamp: string) => string;
  /** Build an error label from message metadata */
  metaErrorLabel: (message: Message) => string | undefined;
  /** Update an optimistic message with real data */
  updateOptimisticMessage: (
    messageId: Message["id"],
    update: Pick<Message, "status"> & Partial<Pick<Message, "waMessageId" | "metadata">>
  ) => void;
  /** Update an optimistic message status, falling back to "sent" if waMessageId exists */
  updateOptimisticStatus: (
    messageId: Message["id"],
    status: Message["status"],
    metaError?: MetaSendError
  ) => void;
  /** Generate a fallback avatar URL from a contact name */
  fallbackAvatarFor: (from: string) => string;
};

// ── Helpers (originally top-level in page.tsx) ─────────────────────

const WHATSAPP_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function timestampToMs(timestamp?: string) {
  if (!timestamp) {
    return null;
  }

  if (/^\d+$/.test(timestamp)) {
    return Number(timestamp) * 1000;
  }

  const parsed = Date.parse(timestamp);

  return Number.isNaN(parsed) ? null : parsed;
}

// ── Hook ───────────────────────────────────────────────────────────

const initialMessages: Message[] = [
  {
    id: 1,
    type: "client",
    text: "Hola, me gustaria saber si tienen disponibilidad para este jueves a las 10:00 para un Balayage.",
    time: "09:10 AM",
  },
  {
    id: 2,
    type: "studio",
    text: "Hola, Valentina. Si, tenemos un espacio disponible con nuestro colorista senior.",
    time: "09:12 AM",
  },
  {
    id: 3,
    type: "client",
    text: "Perfecto, agendado para el jueves. Debo llevar algo preparado?",
    time: "10:24 AM",
  },
];

/**
 * Extracts WhatsApp message state management, CRUD operations,
 * display helpers, and polling-related refs from InboxPage.
 *
 * Manages:
 * - messagesByConversation (message store keyed by conversation ID)
 * - loadedConversationIds (tracks which conversations have been fetched)
 * - lastWhatsAppMessageIdsRef (tracks latest message ID per conversation for polling)
 * - localMessageIdRef (auto-incrementing ID for optimistic/offline messages)
 * - All message CRUD operations (sync, upsert, append, load, update status)
 * - Display helpers (status, media preview, text, timestamp, error labels)
 * - Optimistic message update helpers
 *
 * @param activeId - The currently selected conversation ID (for auto-reply triggers)
 * @param activeIdRef - Ref mirror of activeId for closure-safe access
 * @param userSelectedConversationRef - Ref tracking manual vs automatic selection
 * @param selectConversation - Function to select a conversation (from useInboxSelection)
 * @param setThreads - Thread list setter (needed for syncWhatsAppThreads)
 * @param tenantId - Optional tenantId for multi-tenant filter (used when impersonating)
 */
export function useWhatsAppMessages(
  activeId: number | string,
  activeIdRef: React.MutableRefObject<number | string>,
  userSelectedConversationRef: React.MutableRefObject<boolean>,
  selectConversation: (conversationId: Conversation["id"], options?: { manual?: boolean }) => void,
  setThreads: React.Dispatch<React.SetStateAction<Conversation[]>>,
  tenantId?: string | null
): UseWhatsAppMessagesResult {
  // ── State ──────────────────────────────────────────────────────────
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({
    "1": initialMessages,
  });
  const [loadedConversationIds, setLoadedConversationIds] = useState<string[]>([]);

  // ── Refs ───────────────────────────────────────────────────────────
  const lastWhatsAppMessageIdsRef = useRef<Record<string, string>>({});
  const localMessageIdRef = useRef(0);

  // ── Display helpers ────────────────────────────────────────────────

  const fallbackAvatarFor = useCallback(
    (from: string) =>
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(from)}`,
    []
  );

  const displayStatusFor = useCallback(
    (
      incomingMessage: WhatsAppInboxMessage,
      existingMessage?: Message
    ): Message["status"] => {
      if (
        incomingMessage.direction === "outbound" &&
        incomingMessage.waMessageId &&
        incomingMessage.status === "failed" &&
        existingMessage?.status === "sent"
      ) {
        return "sent";
      }

      if (
        incomingMessage.direction === "outbound" &&
        incomingMessage.waMessageId &&
        incomingMessage.status === "failed"
      ) {
        return "sent";
      }

      return incomingMessage.status;
    },
    []
  );

  const mediaPreviewForWhatsAppMessage = useCallback(
    (message: WhatsAppInboxMessage): StagedMedia[] | undefined => {
      const assetUrl = message.mediaUrl
        ?? (message.metadata?.assetId
          ? `/api/customer-assets?id=${encodeURIComponent(message.metadata.assetId)}`
          : undefined);

      if (message.type === "image" && assetUrl) {
        return [
          {
            id: message.id,
            name: message.content || "Image",
            kind: "image",
            source: "whatsapp",
            previewUrl: assetUrl,
          },
        ];
      }

      if (message.type === "video" && assetUrl) {
        return [
          {
            id: message.id,
            name: message.content || "Video",
            kind: "video",
            source: "whatsapp",
            previewUrl: assetUrl,
          },
        ];
      }

      if (message.type === "audio" && assetUrl) {
        return [
          {
            id: message.id,
            name: message.content || "Audio",
            kind: "audio",
            source: "whatsapp",
            previewUrl: assetUrl,
          },
        ];
      }

      if ((message.type === "document" || message.type === "image") && assetUrl) {
        const docKind = message.type === "document" ? "pdf" : "image";

        return [
          {
            id: message.id,
            name: message.content || "Document",
            kind: docKind,
            source: "whatsapp",
            previewUrl: assetUrl,
          },
        ];
      }

      return undefined;
    },
    []
  );

  const displayTextForWhatsAppMessage = useCallback(
    (message: WhatsAppInboxMessage, mediaPreview?: StagedMedia[]): string => {
      if (message.content) {
        return message.content;
      }

      if (mediaPreview && mediaPreview.length > 0) {
        const first = mediaPreview[0];

        if (first.kind === "image") return "🖼️ Image";
        if (first.kind === "video") return "🎬 Video";
        if (first.kind === "audio") return "🎤 Audio";
        if (first.kind === "pdf") return "📄 Document";
      }

      if (message.type === "image") return "🖼️ Image";
      if (message.type === "video") return "🎬 Video";
      if (message.type === "audio") return "🎤 Audio";
      if (message.type === "document") return "📄 Document";

      return "";
    },
    []
  );

  const formatWhatsAppTimestamp = useCallback(
    (timestamp: string) =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(Number(timestamp) * 1000)),
    []
  );

  const metaErrorLabel = useCallback(
    (message: Message): string | undefined => {
      const error = message.metadata?.lastError;

      if (!error) {
        return undefined;
      }

      return [
        `Meta error: ${error.message}`,
        error.code ? `code=${error.code}` : null,
        error.error_subcode ? `subcode=${error.error_subcode}` : null,
        error.statusCode ? `http=${error.statusCode}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    },
    []
  );

  // ── Thread sync ────────────────────────────────────────────────────

  const syncWhatsAppThreads = useCallback(
    (
      whatsAppConversations: WhatsAppInboxConversation[],
      syncOptions?: { onMarkThreadArrival?: (threadId: string) => void }
    ) => {
      if (whatsAppConversations.length === 0) {
        return;
      }

      setThreads((currentThreads) => {
        const previousFirstThreadId = currentThreads[0]?.id
          ? String(currentThreads[0].id)
          : null;
        const threadMap = new Map(
          currentThreads.map((thread) => [String(thread.id), thread])
        );
        const incomingAnimatedIds = new Set<string>();

        whatsAppConversations.forEach((conversation) => {
          const existingThread =
            threadMap.get(conversation.id) ??
            currentThreads.find((thread) => thread.phone === conversation.phone);

          if (!existingThread) {
            incomingAnimatedIds.add(conversation.id);
          }

          threadMap.set(conversation.id, {
            id: conversation.id,
            name: conversation.contactName,
            phone: conversation.phone,
            autoReplyEnabled: conversation.autoReplyEnabled,
            lastInboundAt: conversation.lastInboundAt,
            lastMsg: conversation.lastMessagePreview,
            time: formatWhatsAppTimestamp(conversation.timestamp),
            unread: conversation.unreadCount > 0,
            unreadCount: conversation.unreadCount,
            activeNow: conversation.activeNow,
            avatar: existingThread?.avatar ?? fallbackAvatarFor(conversation.contactName),
          });

          if (existingThread && String(existingThread.id) !== conversation.id) {
            threadMap.delete(String(existingThread.id));
          }
        });

        const sortedThreads = Array.from(threadMap.values()).sort((a, b) => {
          const aLive = whatsAppConversations.find((item) => item.id === String(a.id));
          const bLive = whatsAppConversations.find((item) => item.id === String(b.id));

          if (aLive && bLive) {
            return Number(bLive.timestamp) - Number(aLive.timestamp);
          }

          if (aLive) {
            return -1;
          }

          if (bLive) {
            return 1;
          }

          return 0;
        });

        const nextFirstThreadId = sortedThreads[0]?.id
          ? String(sortedThreads[0].id)
          : null;

        if (nextFirstThreadId && nextFirstThreadId !== previousFirstThreadId) {
          incomingAnimatedIds.add(nextFirstThreadId);
        }

        incomingAnimatedIds.forEach((threadId) => {
          window.setTimeout(() => syncOptions?.onMarkThreadArrival?.(threadId), 0);
        });

        const hasActiveConversation = sortedThreads.some(
          (thread) => String(thread.id) === String(activeIdRef.current)
        );

        if (
          !hasActiveConversation &&
          !userSelectedConversationRef.current &&
          sortedThreads[0]
        ) {
          window.setTimeout(() => {
            selectConversation(sortedThreads[0].id);
          }, 0);
        }

        return sortedThreads;
      });
    },
    [setThreads, activeIdRef, userSelectedConversationRef, selectConversation, formatWhatsAppTimestamp, fallbackAvatarFor]
  );

  // ── Message CRUD ───────────────────────────────────────────────────

  const upsertWhatsAppMessages = useCallback(
    (
      whatsAppMessages: WhatsAppInboxMessage[],
      upsertOptions?: { onAutoReplyDraft?: (content: string) => void }
    ) => {
      const visibleMessages = whatsAppMessages.filter(
        (message) =>
          message.type !== "status" &&
          (message.content || message.mediaId || message.mediaUrl)
      );

      if (visibleMessages.length === 0) {
        return;
      }

      setMessagesByConversation((currentMessagesByConversation) => {
        const nextMessagesByConversation = { ...currentMessagesByConversation };

        visibleMessages.forEach((message) => {
          const conversationId = message.conversationId;
          const existingMessages = nextMessagesByConversation[conversationId] ?? [];
          const messageType = message.direction === "outbound" ? "studio" : "client";

          const existingMessage = existingMessages.find(
            (item) =>
              String(item.id) === message.id ||
              (message.waMessageId && item.waMessageId === message.waMessageId)
          );
          const mediaPreview = mediaPreviewForWhatsAppMessage(message);

          if (existingMessage) {
            nextMessagesByConversation[conversationId] = existingMessages.map((item) =>
              item === existingMessage
                ? {
                    ...item,
                    waMessageId: message.waMessageId ?? item.waMessageId,
                    status: displayStatusFor(message, item),
                    text: displayTextForWhatsAppMessage(message, mediaPreview),
                    mediaId: message.mediaId ?? item.mediaId,
                    media: mediaPreview ?? item.media,
                    metadata: message.metadata ?? item.metadata,
                  }
                : item
            );
            return;
          }

          nextMessagesByConversation[conversationId] = [
            ...existingMessages,
            {
              id: message.id,
              waMessageId: message.waMessageId ?? message.id,
              from: message.phone,
              timestamp: message.timestamp,
              type: messageType,
              text: displayTextForWhatsAppMessage(message, mediaPreview),
              time: formatWhatsAppTimestamp(message.timestamp),
              mediaId: message.mediaId,
              media: mediaPreview,
              status: displayStatusFor(message),
              metadata: message.metadata,
              isNew: true,
            },
          ];
        });

        return nextMessagesByConversation;
      });

      const latestMessage = visibleMessages[visibleMessages.length - 1];
      lastWhatsAppMessageIdsRef.current[latestMessage.conversationId] = latestMessage.id;

      if (
        latestMessage.direction === "inbound" &&
        String(activeId) === latestMessage.conversationId
      ) {
        upsertOptions?.onAutoReplyDraft?.(
          latestMessage.content ||
            `Nuevo ${latestMessage.type} recibido para esta conversacion.`
        );
      }
    },
    [
      activeId,
      mediaPreviewForWhatsAppMessage,
      displayStatusFor,
      displayTextForWhatsAppMessage,
      formatWhatsAppTimestamp,
    ]
  );

  const appendWhatsAppMessages = useCallback(
    (
      whatsAppMessages: WhatsAppInboxMessage[],
      whatsAppConversations: WhatsAppInboxConversation[] = [],
      appendOptions?: {
        onAutoReplyDraft?: (content: string) => void;
        onMarkThreadArrival?: (threadId: string) => void;
      }
    ) => {
      syncWhatsAppThreads(whatsAppConversations, {
        onMarkThreadArrival: appendOptions?.onMarkThreadArrival,
      });
      upsertWhatsAppMessages(whatsAppMessages, {
        onAutoReplyDraft: appendOptions?.onAutoReplyDraft,
      });
    },
    [syncWhatsAppThreads, upsertWhatsAppMessages]
  );

  const loadConversationMessages = useCallback(
    async (
      conversationId: string,
      loadOptions: {
        after?: string | null;
        markSeen?: boolean;
        replace?: boolean;
        onAutoReplyDraft?: (content: string) => void;
        onMarkThreadArrival?: (threadId: string) => void;
      } = {}
    ) => {
      const params = new URLSearchParams({
        conversationId,
        markSeen: loadOptions.markSeen === false ? "false" : "true",
      });

      if (loadOptions.after) {
        params.set("after", loadOptions.after);
      }

      // Incluir tenantId si está disponible (impersonación)
      if (tenantId) {
        params.set("tenantId", tenantId);
      }

      console.log("Loaded messages for:", conversationId);

      const response = await fetch(`/api/whatsapp/messages?${params.toString()}`);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        messages?: WhatsAppInboxMessage[];
        conversations?: WhatsAppInboxConversation[];
      };
      const loadedMessages = data.messages ?? [];

      if (loadOptions.replace) {
        syncWhatsAppThreads(data.conversations ?? [], {
          onMarkThreadArrival: loadOptions.onMarkThreadArrival,
        });

        if (loadedMessages.length === 0 && /^\d+$/.test(conversationId)) {
          return;
        }

        setMessagesByConversation((currentMessagesByConversation) => ({
          ...currentMessagesByConversation,
          [conversationId]: loadedMessages.map((message) => {
            const mediaPreview = mediaPreviewForWhatsAppMessage(message);

            return {
              id: message.id,
              waMessageId: message.waMessageId ?? message.id,
              from: message.phone,
              timestamp: message.timestamp,
              type: message.direction === "outbound" ? "studio" : "client",
              text: displayTextForWhatsAppMessage(message, mediaPreview),
              time: formatWhatsAppTimestamp(message.timestamp),
              mediaId: message.mediaId,
              media: mediaPreview,
              status: displayStatusFor(message),
              metadata: message.metadata,
              isNew: true,
            };
          }),
        }));
      } else {
        appendWhatsAppMessages(
          loadedMessages,
          data.conversations ?? [],
          {
            onAutoReplyDraft: loadOptions.onAutoReplyDraft,
            onMarkThreadArrival: loadOptions.onMarkThreadArrival,
          }
        );
      }

      const latestMessage = loadedMessages.at(-1);

      if (latestMessage) {
        lastWhatsAppMessageIdsRef.current[conversationId] = latestMessage.id;
      }

      setLoadedConversationIds((currentIds) => [
        ...new Set([...currentIds, conversationId]),
      ]);
      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          String(thread.id) === conversationId
            ? { ...thread, unread: false, unreadCount: 0, activeNow: true }
            : thread
        )
      );

      console.log("Thread messages count:", loadedMessages.length);
    },
    [
      syncWhatsAppThreads,
      appendWhatsAppMessages,
      mediaPreviewForWhatsAppMessage,
      displayTextForWhatsAppMessage,
      formatWhatsAppTimestamp,
      displayStatusFor,
      setThreads,
    ]
  );

  const updateMessageStatus = useCallback(
    (messageId: string, status: Message["status"]) => {
      setMessagesByConversation((currentMessagesByConversation) => {
        const nextMessagesByConversation = { ...currentMessagesByConversation };

        Object.entries(nextMessagesByConversation).forEach(([conversationId, conversationMessages]) => {
          nextMessagesByConversation[conversationId] = conversationMessages.map((message) =>
            String(message.id) === messageId || message.waMessageId === messageId
              ? {
                  ...message,
                  status: status === "failed" && message.waMessageId ? "sent" : status,
                }
              : message
          );
        });

        return nextMessagesByConversation;
      });
    },
    []
  );

  // ── Optimistic updates ─────────────────────────────────────────────

  const updateOptimisticMessage = useCallback(
    (
      messageId: Message["id"],
      update: Pick<Message, "status"> & Partial<Pick<Message, "waMessageId" | "metadata">>
    ) => {
      setMessagesByConversation((currentMessagesByConversation) => ({
        ...currentMessagesByConversation,
        [String(activeId)]: (currentMessagesByConversation[String(activeId)] ?? []).map((message) =>
          message.id === messageId ? { ...message, ...update } : message
        ),
      }));
    },
    [activeId]
  );

  const updateOptimisticStatus = useCallback(
    (messageId: Message["id"], status: Message["status"], metaError?: MetaSendError) => {
      updateOptimisticMessage(messageId, {
        status,
        metadata: metaError ? { lastError: metaError } : undefined,
      });
    },
    [updateOptimisticMessage]
  );

  // ── Return ─────────────────────────────────────────────────────────

  return {
    messagesByConversation,
    setMessagesByConversation,
    loadedConversationIds,
    lastWhatsAppMessageIdsRef,
    localMessageIdRef,
    syncWhatsAppThreads,
    displayStatusFor,
    mediaPreviewForWhatsAppMessage,
    displayTextForWhatsAppMessage,
    upsertWhatsAppMessages,
    appendWhatsAppMessages,
    loadConversationMessages,
    updateMessageStatus,
    formatWhatsAppTimestamp,
    metaErrorLabel,
    updateOptimisticMessage,
    updateOptimisticStatus,
    fallbackAvatarFor,
  };
}
