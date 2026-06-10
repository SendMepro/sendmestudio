import type { WhatsAppConversation, WhatsAppInternalMessage } from "./store";

export type WhatsAppRealtimeEvent =
  | {
      type: "new_message";
      message: WhatsAppInternalMessage;
      conversation?: WhatsAppConversation;
      tenantId?: string;
    }
  | {
      type: "conversation_updated";
      conversation: WhatsAppConversation;
      tenantId?: string;
    }
  | {
      type: "message_status_updated";
      messageId: string;
      conversationId?: string;
      status: WhatsAppInternalMessage["status"];
      timestamp?: string;
      tenantId?: string;
    }
  | {
      type: "ai_draft_ready";
      conversationId: string;
      draft: string;
      confidence: number;
      intent: string;
      safeguardReason?: string;
      tenantId?: string;
    }
  | {
      type: "ai_auto_replied";
      conversationId: string;
      messageId: string;
      confidence: number;
      intent: string;
      tenantId?: string;
    }
  | {
      type: "ai_auto_reply_blocked";
      conversationId: string;
      reason: string;
      intent?: string;
      confidence?: number;
      tenantId?: string;
    }
  | {
      type: "typing_started" | "typing_stopped";
      conversationId: string;
      phone?: string;
      tenantId?: string;
    }
  | {
      type: "appointment_scheduled";
      conversationId?: string;
      appointment: unknown;
      tenantId?: string;
    };

type Subscriber = {
  id: string;
  send: (event: WhatsAppRealtimeEvent) => void;
  tenantId?: string;
};

const globalRealtime = globalThis as typeof globalThis & {
  __sendmeWhatsAppSubscribers?: Set<Subscriber>;
};

const subscribers =
  globalRealtime.__sendmeWhatsAppSubscribers ?? new Set<Subscriber>();

globalRealtime.__sendmeWhatsAppSubscribers = subscribers;

export function subscribeToWhatsAppEvents(
  subscriber: Subscriber
) {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function emitWhatsAppEvent(event: WhatsAppRealtimeEvent) {
  for (const subscriber of subscribers) {
    // Si el subscriber tiene tenantId y el evento también, filtrar
    if (subscriber.tenantId && event.tenantId && subscriber.tenantId !== event.tenantId) {
      continue;
    }
    subscriber.send(event);
  }
}
