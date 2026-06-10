"use client";

import { useEffect } from "react";

// ── Types (subset from page.tsx) ───────────────────────────────────

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
  metadata?: Record<string, unknown>;
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
  metadata?: Record<string, unknown>;
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

// ── Options type ───────────────────────────────────────────────────

export type UseRealtimeEventsOptions = {
  /** The currently selected conversation ID */
  activeId: number | string;
  /** Ref tracking the latest message ID per conversation (for polling) */
  lastWhatsAppMessageIdsRef: React.MutableRefObject<Record<string, string>>;
  /**
   * Function to fetch and load messages for a conversation.
   * Signature matches useWhatsAppMessages.loadConversationMessages.
   */
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
  /**
   * Handler for realtime events received via SSE.
   * This is a callback that the component provides, dispatching to
   * message/composer/feed/etc. handlers as needed.
   */
  handleRealtimeEvent: (event: WhatsAppRealtimeEvent) => void;
  /**
   * Polling interval in milliseconds. Default: 2000.
   */
  pollingIntervalMs?: number;
  /**
   * SSE endpoint URL. Default: "/api/whatsapp/events".
   */
  sseEndpoint?: string;
  /**
   * Optional tenantId for multi-tenant SSE filtering (used when impersonating).
   */
  tenantId?: string;
};

// ── WhatsApp Realtime Event type ───────────────────────────────────

type WhatsAppRealtimeEvent =
  | {
      type: "new_message";
      message: WhatsAppInboxMessage;
      conversation?: WhatsAppInboxConversation;
    }
  | {
      type: "conversation_updated";
      conversation: WhatsAppInboxConversation;
    }
  | {
      type: "message_status_updated";
      messageId: string;
      conversationId?: string;
      status: Message["status"];
      timestamp?: string;
    }
  | {
      type: "ai_draft_ready";
      conversationId: string;
      draft: string;
      confidence: number;
      intent: string;
      safeguardReason?: string;
    }
  | {
      type: "ai_auto_replied";
      conversationId: string;
      messageId: string;
      confidence: number;
      intent: string;
    }
  | {
      type: "ai_auto_reply_blocked";
      conversationId: string;
      reason: string;
      intent?: string;
      confidence?: number;
    }
  | {
      type: "typing_started" | "typing_stopped";
      conversationId: string;
      phone?: string;
    }
  | {
      type: "appointment_scheduled";
      conversationId?: string;
      appointment: {
        id: string;
        service: string;
        stylist: string;
        date: string;
        time: string;
      };
    };

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Sets up polling and Server-Sent Events (SSE) for real-time
 * WhatsApp message updates.
 *
 * Polling:
 * - Runs every `pollingIntervalMs` (default 2000ms) for the active
 *   conversation, fetching messages after the last known message ID.
 * - Cleans up on unmount or activeId change.
 *
 * SSE:
 * - Opens an EventSource to `sseEndpoint` (default "/api/whatsapp/events").
 * - Listens for all known event types and dispatches to `handleRealtimeEvent`.
 * - Cleans up on unmount or activeId change.
 *
 * @param options - Configuration object with callbacks and refs.
 */
export function useRealtimeEvents({
  activeId,
  lastWhatsAppMessageIdsRef,
  loadConversationMessages,
  handleRealtimeEvent,
  pollingIntervalMs = 2000,
  sseEndpoint = "/api/whatsapp/events",
  tenantId,
}: UseRealtimeEventsOptions): void {
  // ── SSE URL con tenantId ──────────────────────────────────────
  const sseUrl = tenantId
    ? `${sseEndpoint}?tenantId=${encodeURIComponent(tenantId)}`
    : sseEndpoint;
  // ── Polling effect ──────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    const pollWhatsAppMessages = async () => {
      try {
        if (!isCancelled) {
          await loadConversationMessages(String(activeId), {
            after: lastWhatsAppMessageIdsRef.current[String(activeId)],
            markSeen: true,
          });
        }
      } catch {
        // The inbox remains usable when the local API is not available.
      }
    };

    void pollWhatsAppMessages();
    const intervalId = window.setInterval(pollWhatsAppMessages, pollingIntervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeId, loadConversationMessages, lastWhatsAppMessageIdsRef, pollingIntervalMs]);

  // ── SSE effect ───────────────────────────────────────────────────────
  useEffect(() => {
    const source = new EventSource(sseUrl);
    const events: WhatsAppRealtimeEvent["type"][] = [
      "new_message",
      "conversation_updated",
      "message_status_updated",
      "ai_draft_ready",
      "ai_auto_replied",
      "ai_auto_reply_blocked",
      "appointment_scheduled",
      "typing_started",
      "typing_stopped",
    ];
    const listeners = events.map((eventName) => {
      const listener = (event: MessageEvent) => {
        try {
          handleRealtimeEvent(JSON.parse(event.data) as WhatsAppRealtimeEvent);
        } catch {
          // Ignore malformed realtime frames and keep the polling fallback active.
        }
      };

      source.addEventListener(eventName, listener);

      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        source.removeEventListener(eventName, listener);
      });
      source.close();
    };
  }, [activeId, handleRealtimeEvent, sseEndpoint]);
}
