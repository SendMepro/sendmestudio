"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInboxSelection } from "../../hooks/inbox/useInboxSelection";
import { useInboxThreads } from "../../hooks/inbox/useInboxThreads";
import { useWhatsAppMessages } from "../../hooks/inbox/useWhatsAppMessages";
import { useRealtimeEvents } from "../../hooks/inbox/useRealtimeEvents";
import ConversationsPanel from "../../components/inbox/ConversationsPanel";
import ChatPanel from "../../components/inbox/ChatPanel";
import AssistantRail from "../../components/inbox/AssistantRail";
import CuratedEmojiPicker from "../../components/inbox/CuratedEmojiPicker";
import HelpModal from "../../components/inbox/HelpModal";
import Lightbox from "../../components/inbox/Lightbox";
import InboxToast from "../../components/inbox/InboxToast";
import { useInboxComposer } from "../../hooks/inbox/useInboxComposer";
import { useEmojiPicker } from "../../hooks/inbox/useEmojiPicker";
import { useBooking } from "../../hooks/inbox/useBooking";
import { useInboxLayout } from "../../hooks/inbox/useInboxLayout";
import { Inter, Outfit } from "next/font/google";
import { FileText, ImageIcon, Mic, Sparkles } from "lucide-react";
import AppShell from "../components/AppShell";
import { handleIncomingMessage, setUnreadMessagesCount } from "../components/sidebarUnreadStore";
import { useRouter } from "next/navigation";
import { matchesServiceText } from "../lib/serviceMatcher";
import styles from "./inbox.module.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--inbox-font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--inbox-font-ui",
});

export type Message = {
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

export type MetaSendError = {
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
      appointment: AppointmentResponse["appointment"];
    };

type WhatsAppSendResponse = {
  ok: boolean;
  clientMessageId?: string;
  messageId?: string;
  message?: WhatsAppInboxMessage;
  conversation?: WhatsAppInboxConversation;
};

type WhatsAppSendErrorResponse = {
  ok?: false;
  error?: string;
  statusCode?: number;
  statusText?: string;
  errorMessage?: string;
  metaError?: {
    code?: number | string;
    message?: string;
    error_subcode?: number | string;
  };
  metaResponse?: unknown;
  message?: WhatsAppInboxMessage;
  conversation?: WhatsAppInboxConversation;
};

import type { AppointmentResponse } from "../../hooks/inbox/useBooking";

export type StagedMedia = {
  id: string;
  name: string;
  kind: "image" | "video" | "audio" | "pdf" | "document";
  source: "file" | "suggested" | "whatsapp";
  file?: File;
  previewUrl?: string;
  resourceType?: "Visual reference" | "Before After" | "Treatment guide" | "Staged attachment";
  assetCount?: number;
};

declare global {
  interface Window {
    simulateIncomingClientMessage?: () => void;
  }
}

const suggestedMedia: StagedMedia = {
  id: "suggested-balayage-reference",
  name: "Finalizado Signature Balayage",
  kind: "image",
  source: "suggested",
  resourceType: "Visual reference",
  assetCount: 3,
  previewUrl:
    "https://images.unsplash.com/photo-1560869713-da86a9ec0730?auto=format&fit=crop&q=80&w=360&h=360",
};

import { useFeedAnalysis, findMatchingSlot, buildSmartDraft } from "../../hooks/inbox/useFeedAnalysis";
import type { FeedSuggestion, FeedTimelineItem, ChipEntry } from "../../hooks/inbox/useFeedAnalysis";

import { useAuth } from "../../hooks/useAuth";

export default function InboxPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [impersonating, setImpersonating] = useState(false);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setImpersonating(
      params.get("impersonating") === "true" && !!params.get("tenantId")
    );
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isSuperAdmin && !impersonating && !redirected) {
      setRedirected(true);
      router.replace("/admin");
    }
  }, [isLoading, isSuperAdmin, impersonating, redirected, router]);

  // Neutro mientras auth carga — sin branding, sin sidebar, sin tenant data
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          background: "#0b0b0f",
          color: "#888",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Cargando...
      </div>
    );
  }

  // Super admin sin impersonación — no renderizar nada del inbox
  if (isSuperAdmin && !impersonating) {
    return null;
  }

  // ── Usuario normal o impersonando — renderizar inbox completo ──
  return <InboxContent />;
}

/**
 * InboxContent — Componente interno que contiene toda la lógica del inbox.
 * Solo se monta si el usuario no es super admin o está impersonando.
 */
function InboxContent() {
  // ── Leer tenantId de searchParams (para impersonación multi-tenant) ──
  const [searchParams] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );
  const tenantId = searchParams.get("tenantId") ?? undefined;

  const {
    threads,
    setThreads,
    browserUnreadCount,
  } = useInboxThreads();
  const {
    activeId,
    activeIdRef,
    userSelectedConversationRef,
    activeChat,
    selectConversation,
  } = useInboxSelection(threads, setThreads);
  const {
    messagesByConversation,
    setMessagesByConversation,
    loadedConversationIds,
    lastWhatsAppMessageIdsRef,
    localMessageIdRef,
    syncWhatsAppThreads,
    appendWhatsAppMessages,
    loadConversationMessages,
    updateMessageStatus,
    metaErrorLabel,
    updateOptimisticMessage,
    updateOptimisticStatus,
  } = useWhatsAppMessages(
    activeId,
    activeIdRef,
    userSelectedConversationRef,
    selectConversation,
    setThreads,
    tenantId
  );
  const messages = messagesByConversation[String(activeId)] ?? [];
  const isActiveConversationLoaded = loadedConversationIds.includes(String(activeId));
  const visibleMessages =
    isActiveConversationLoaded || messages.length > 0 || String(activeId) === "1"
      ? messages
      : [];
  const conversationContext = [
    activeChat.lastMsg,
    ...visibleMessages.map((message) => message.text),
  ].join(" ").toLowerCase();
  const feedAnalysis = useFeedAnalysis(
    activeId,
    conversationContext,
    activeChat?.name ?? "",
    activeChat?.phone ?? ""
  );
  const {
    customerProfile,
    feedTimeline,
    feedAnalysisState,
    feedAnalysisLog,
    feedSearch,
    setFeedSearch,
    setPlayedItemGradients,
    setSelectedChips,
    setFeedTimeline,
    selectedChipsRef,
    activeFeedSuggestions,
  } = feedAnalysis;
  const [isTyping, setIsTyping] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<StagedMedia[] | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const modeToastTimerRef = useRef<number | null>(null);
  const [animatedThreadIds, setAnimatedThreadIds] = useState<string[]>([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [iaResponsesToday, setIaResponsesToday] = useState(0);
  const [currentMode, setCurrentMode] = useState<"manual" | "automatic" | "scheduled">(
    activeChat?.mode === "automatic" ? "automatic" :
    activeChat?.mode === "scheduled" ? "scheduled" : "manual"
  );
  const [scheduleStart, setScheduleStart] = useState("22:00");
  const [scheduleEnd, setScheduleEnd] = useState("10:00");

  const onSetMode = useCallback((mode: "manual" | "automatic" | "scheduled") => {
    setCurrentMode(mode);
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        String(thread.id) === String(activeId)
          ? { ...thread, autoReplyEnabled: mode === "automatic" || mode === "scheduled", mode }
          : thread
      )
    );
    void fetch("/api/whatsapp/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: String(activeId),
        contactName: activeChat.name,
        phone: activeChat.phone,
        mode,
        tenantId,
      }),
    });
  }, [activeId, activeChat.name, activeChat.phone]);

  const onSetSchedule = useCallback((start: string, end: string) => {
    setScheduleStart(start);
    setScheduleEnd(end);
    void fetch("/api/analytics/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleStart: start, scheduleEnd: end }),
    });
  }, []);

  const threadItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousThreadRectsRef = useRef<Record<string, DOMRect>>({});
  const incomingTimerRef = useRef<number | null>(null);
  const lastRenderedMessageKeyRef = useRef<string | null>(null);
  const threadAnimationTimersRef = useRef<Record<string, number>>({});

  const {
    chatTapiz,
    messagesAreaRef,
    messagesEndRef,
    shouldStickToBottomRef,
    messagesAreaStyle,
    scrollMessagesToBottom,
    isMessagesAreaNearBottom,
    handleMessagesScroll,
  } = useInboxLayout();

  // Ref-based bridges for functions defined below (to avoid TDZ issues)
  const closeCuratedEmojiPickerRef = useRef<((options?: { restoreFocus?: boolean }) => void) | null>(null);
  const appendMessageRef = useRef<((...args: any[]) => void) | null>(null);
  const sendWhatsAppMessageRef = useRef<((...args: any[]) => Promise<any>) | null>(null);

  const {
    draftText,
    setDraftText,
    stagedMedia,
    setStagedMedia,
    quotedReply,
    setQuotedReply,
    isSendingDraft,
    composerHeight,
    setComposerHeight,
    justSentIds,
    setJustSentIds,
    copyToast,
    setCopyToast,
    modeToast,
    setModeToast,
    messageDrag,
    draftFieldRef,
    fileInputRef,
    objectUrlsRef,
    copyToastTimerRef,
    modeToastTimerRef: _modeToastTimerRef,
    activeServiceWindow,
    handleSendDraft,
    handleDraftKeyDown,
    attachMedia,
    removeStagedMedia,
    stageSuggestedMedia,
    activateReplyMode,
    copyMessageText,
    focusDraft,
    resetMessageDrag,
    handleMessagePointerDown,
    handleMessagePointerMove,
    handleMessagePointerUp,
    handleComposerResizeStart,
    handleComposerResizeMove,
    handleComposerResizeEnd,
  } = useInboxComposer({
    activeId,
    activeChat,
    conversationContext,
    appendMessage: (...args) => { appendMessageRef.current?.(...args); },
    updateOptimisticMessage,
    updateOptimisticStatus,
    localMessageIdRef,
    sendWhatsAppMessage: (...args) => sendWhatsAppMessageRef.current?.(...args) as Promise<any>,
    closeCuratedEmojiPicker: (options) => {
      closeCuratedEmojiPickerRef.current?.(options);
    },
    onBeforeSendDraft: () => {
      shouldStickToBottomRef.current = true;
    },
    onStageSuggestedMedia: () => {
      stageMedia(suggestedMedia);
    },
  });

  // ── Booking Hook (after useInboxComposer so refs are wired) ─
  const {
    isBookingDrawerOpen,
    isBookingDrawerClosing,
    bookingAvailability,
    selectedBookingSlotId,
    selectedBookingStylistId,
    isConfirmingBooking,
    setSelectedBookingSlotId,
    setSelectedBookingStylistId,
    openBookingDrawer: _openBookingDrawer,
    closeBookingDrawer,
    confirmBooking,
  } = useBooking({
    conversationId: activeId,
    customerName: activeChat.name,
    customerPhone: activeChat.phone,
    appendMessage: (...args) => { appendMessageRef.current?.(...args as any); },
    sendWhatsAppMessage: (...args) => sendWhatsAppMessageRef.current?.(...args) as Promise<any>,
    updateOptimisticMessage: updateOptimisticMessage as (id: string | number, updates: { status?: string; waMessageId?: string }) => void,
    updateOptimisticStatus: updateOptimisticStatus as (id: string | number, status: string, metaError?: any) => void,
    localMessageIdRef,
    setCopyToast,
    copyToastTimerRef,
    setJustSentIds,
  });

  // Wrap openBookingDrawer to also resize the composer
  const openBookingDrawer = useCallback(() => {
    _openBookingDrawer((height) => setComposerHeight(height));
  }, [_openBookingDrawer, setComposerHeight]);

  // Wrap closeBookingDrawer to also resize the composer back
  const handleCloseBookingDrawer = useCallback(
    (options: { clearDraft?: boolean; restoreFocus?: boolean } = {}) => {
      closeBookingDrawer({
        ...options,
        setDraftText,
        draftFieldRef,
        onComposerResize: (height) => setComposerHeight(height),
      });
    },
    [closeBookingDrawer, setDraftText, draftFieldRef, setComposerHeight]
  );

  // ── Emoji Picker Hook ──────────────────────────────────
  const {
    isEmojiPickerOpen,
    isEmojiPickerClosing,
    emojiPickerStyle,
    emojiButtonRef,
    emojiPickerRef,
    toggleCuratedEmojiPicker,
    closeCuratedEmojiPicker,
    insertCuratedEmoji,
  } = useEmojiPicker({
    onClose: (options) => {
      // Only restore focus — never call back into closeCuratedEmojiPicker
      if (options?.restoreFocus) {
        draftFieldRef.current?.focus();
      }
    },
    onEmojiSelect: (emoji) => {
      const draftField = draftFieldRef.current;

      if (!draftField) {
        setDraftText((currentDraft) => `${currentDraft}${emoji}`);
        return;
      }

      const selectionStart = draftField.selectionStart;
      const selectionEnd = draftField.selectionEnd;

      if (selectionStart == null || selectionEnd == null) {
        setDraftText((currentDraft) => `${currentDraft}${emoji}`);
        return;
      }

      const nextDraft = `${draftText.slice(0, selectionStart)}${emoji}${draftText.slice(selectionEnd)}`;
      const nextCursorPosition = selectionStart + emoji.length;

      setDraftText(nextDraft);
      window.requestAnimationFrame(() => {
        draftField.focus();
        draftField.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    },
  });
  // Wire emoji bridge
  closeCuratedEmojiPickerRef.current = closeCuratedEmojiPicker;

  const draftGreeting = "Hola,";
  const detectedBookingService =
    bookingAvailability?.services.find((service) =>
      matchesServiceText(conversationContext, service.id, service.keywords)
    ) ?? bookingAvailability?.services[0];
  const bookingSlots = detectedBookingService
    ? bookingAvailability?.slots.filter((slot) =>
        slot.serviceIds.includes(detectedBookingService.id)
      ) ?? []
    : [];
  const bookingStylists = detectedBookingService
    ? bookingAvailability?.stylists.filter((stylist) =>
        stylist.services.includes(detectedBookingService.id)
      ) ?? []
    : [];
  const selectedBookingSlot =
    bookingSlots.find((slot) => slot.id === selectedBookingSlotId) ?? bookingSlots[0];
  const selectedBookingStylist =
    bookingStylists.find((stylist) => stylist.id === selectedBookingStylistId) ??
    bookingStylists.find((stylist) => stylist.id === selectedBookingSlot?.stylistId) ??
    bookingStylists[0];

  // Wrap confirmBooking to pass helpers (after derived booking variables)
  const handleConfirmBooking = useCallback(() => {
    confirmBooking(detectedBookingService, selectedBookingSlot, selectedBookingStylist, {
      activeId,
      activeChat,
      setDraftText,
      draftFieldRef,
      onComposerResize: (height) => setComposerHeight(height),
      closePicker: () => closeCuratedEmojiPicker(),
    });
  }, [
    confirmBooking,
    detectedBookingService,
    selectedBookingSlot,
    selectedBookingStylist,
    activeId,
    activeChat,
    setDraftText,
    draftFieldRef,
    setComposerHeight,
    closeCuratedEmojiPicker,
  ]);

  // ── Smart Keyword Chip → Composition + Feed ────────
  const onKeywordChipClick = useCallback(
    (suggestion: FeedSuggestion, matchedKeyword: string) => {
      const now = Date.now();
      const matchedLower = matchedKeyword.toLowerCase();

      // 1. Determine chip type
      const dayNames = ["lunes", "martes", "miércoles", "viernes", "sábado", "domingo"];
      let chipType: ChipEntry["type"] = "other";
      if (suggestion.id === "foto") chipType = "photo";
      else if (suggestion.id === "precio") chipType = "price";
      else if (suggestion.id === "reserva") chipType = "booking";
      else if (dayNames.includes(matchedLower)) chipType = "day";
      else chipType = "service";

      // 2. Add chip to ref (always up-to-date) and state (for re-render)
      if (!selectedChipsRef.current.has(matchedLower)) {
        const updated = new Map(selectedChipsRef.current);
        updated.set(matchedLower, { originalText: matchedKeyword, type: chipType });
        selectedChipsRef.current = updated;
        setSelectedChips(updated);

        // 3. Generate smart draft into textarea
        const draft = buildSmartDraft(updated, conversationContext, activeChat.name);
        if (draft) {
          setDraftText((prev) => (prev.includes(draft) ? prev : draft));
        }
      } else {
        // Chip already exists — still regenerate draft in case context changed
        const draft = buildSmartDraft(selectedChipsRef.current, conversationContext, activeChat.name);
        if (draft) {
          setDraftText((prev) => (prev.includes(draft) ? prev : draft));
        }
      }

      // Show brief toast
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      setCopyToast("Borrador actualizado");
      copyToastTimerRef.current = window.setTimeout(() => setCopyToast(""), 1400);

      // 4. Update feed timeline
      setFeedTimeline((prev) => {
        const exists = prev.some(
          (item) => item.detectedKeyword.toLowerCase() === matchedLower
        );
        if (exists) {
          return prev.map((item) =>
            item.detectedKeyword.toLowerCase() === matchedLower
              ? { ...item, timestamp: now, isNew: true }
              : item
          );
        }
        const newItem: FeedTimelineItem = {
          id: `feed-chip-${now}`,
          suggestion,
          detectedKeyword: matchedKeyword,
          timestamp: now,
          isNew: true,
          gradientPlayed: false,
        };
        return [newItem, ...prev];
      });

      // 5. Subtle scroll to feed panel
      window.requestAnimationFrame(() => {
        const feedPanel = document.querySelector(`.${styles.assistantRail}`);
        if (feedPanel) {
          feedPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    [conversationContext, activeChat.name]
  );

  // ── Time Chip Click → Open Booking Drawer ──────────
  const onTimeChipClick = useCallback(
    (timeStr: string, dayStr: string | undefined, isAvailable: boolean) => {
      const now = Date.now();

      // 1. Add time (and day if present) to chips ref and state
      const updated = new Map(selectedChipsRef.current);
      let changed = false;
      if (!updated.has(timeStr.toLowerCase())) {
        updated.set(timeStr.toLowerCase(), { originalText: timeStr, type: "time" });
        changed = true;
      }
      if (dayStr && !updated.has(dayStr.toLowerCase())) {
        updated.set(dayStr.toLowerCase(), { originalText: dayStr, type: "day" });
        changed = true;
      }
      if (changed) {
        selectedChipsRef.current = updated;
        setSelectedChips(updated);
      }

      // 2. Generate smart draft into textarea
      const chips = changed ? updated : selectedChipsRef.current;
      const draft = buildSmartDraft(chips, conversationContext, activeChat.name);
      if (draft) {
        setDraftText((prev) => (prev.includes(draft) ? prev : draft));
      }

      // 3. Pre-select slot if available
      if (isAvailable) {
        const slots = bookingSlots;
        const slot = findMatchingSlot(timeStr, slots);
        if (slot) {
          setSelectedBookingSlotId(slot.id);
          setSelectedBookingStylistId(slot.stylistId);
        }
      }

      // 4. Open booking drawer
      openBookingDrawer();

      // Show brief toast
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      setCopyToast("Borrador actualizado");
      copyToastTimerRef.current = window.setTimeout(() => setCopyToast(""), 1400);

      // 5. Scroll to drawer
      window.requestAnimationFrame(() => {
        const bookingArea = document.querySelector(`.${styles.bookingDrawer}`);
        if (bookingArea) {
          bookingArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    [bookingSlots, conversationContext, activeChat.name]
  );

  const getQuoteAuthor = (type: Message["type"]) =>
    type === "client" ? "Client" : "Studio";

  const formatWhatsAppLine = (phone: string) => {
    if (/^56\d{9}$/.test(phone)) {
      return `+56 ${phone.slice(2, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
    }

    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  const formatMessageTime = () =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

  const regenerateAiDraft = (clientText: string) => {
    const loweredText = clientText.toLowerCase();

    if (matchesServiceText(loweredText, "balayage")) {
      setDraftText(
        `${draftGreeting} perfecto. Para tu balayage podemos sumar una referencia visual y, si quieres elevar el resultado, agregar el Ritual Signature para brillo y cuidado posterior.`
      );
      return;
    }

    if (matchesServiceText(loweredText, "color")) {
      setDraftText(
        `${draftGreeting} despues del color te recomendamos cuidado suave las primeras 48 horas y una rutina de hidratacion para mantener brillo y tono.`
      );
      return;
    }

    if (loweredText.includes("jueves") || loweredText.includes("agenda")) {
      setDraftText(
        `${draftGreeting} confirmo disponibilidad para jueves. Te propongo dejarlo reservado y enviarte la confirmacion con horario y especialista asignado.`
      );
      return;
    }

    if (loweredText.includes("preparado")) {
      setDraftText(
        `${draftGreeting} ven con el cabello seco y sin productos pesados. Llegar 10 minutos antes nos ayuda a preparar el diagnostico con calma.`
      );
      return;
    }

    setDraftText(
      `${draftGreeting} gracias por escribirnos. Dejamos tu solicitud registrada y te respondemos con una confirmacion breve, clara y en tono concierge.`
    );
  };

  const appendMessage = (
    message: Omit<Message, "id" | "time" | "isNew"> &
      Partial<Pick<Message, "id" | "time" | "isNew">>
  ) => {
    const conversationId = String(activeId);
    const nextMessage = {
      ...message,
      id: message.id ?? `local-${localMessageIdRef.current++}`,
      time: message.time ?? formatMessageTime(),
      isNew: message.isNew ?? true,
    };

    setMessagesByConversation((currentMessagesByConversation) => ({
      ...currentMessagesByConversation,
      [conversationId]: [
        ...(currentMessagesByConversation[conversationId] ?? []),
        nextMessage,
      ],
    }));
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        String(thread.id) === conversationId
          ? {
              ...thread,
              lastMsg: nextMessage.text,
              time: nextMessage.time,
              activeNow: true,
            }
          : thread
      )
    );
  };
  // Wire ref bridge so the (previously called) hook can invoke appendMessage
  appendMessageRef.current = appendMessage;

  const setThreadItemRef = (threadId: string) => (node: HTMLDivElement | null) => {
    threadItemRefs.current[threadId] = node;
  };

  const handleRealtimeEvent = (event: WhatsAppRealtimeEvent) => {
    if (event.type === "new_message") {
      appendWhatsAppMessages(
        [event.message],
        event.conversation ? [event.conversation] : []
      );

      if (event.message.direction === "inbound" && String(activeId) !== event.message.conversationId) {
        handleIncomingMessage({ text: event.message.content });
      }

      if (event.message.direction === "outbound") {
        return;
      }

      return;
    }

    if (event.type === "conversation_updated") {
      syncWhatsAppThreads([event.conversation]);
      return;
    }

    if (event.type === "message_status_updated") {
      updateMessageStatus(event.messageId, event.status);
      return;
    }

    if (event.type === "ai_draft_ready") {
      if (event.conversationId === String(activeId) && activeChat.autoReplyEnabled) {
        setDraftText(event.draft);
      }

      return;
    }

    if (event.type === "ai_auto_replied") {
      if (event.conversationId === String(activeId)) {
        setCopyToast("La IA respondió automáticamente");

        if (copyToastTimerRef.current) {
          window.clearTimeout(copyToastTimerRef.current);
        }

        copyToastTimerRef.current = window.setTimeout(() => {
          setCopyToast("");
        }, 1800);
      }

      return;
    }

    if (event.type === "ai_auto_reply_blocked") {
      if (event.conversationId === String(activeId)) {
        setCopyToast("IA en pausa · requiere revisión humana");

        if (copyToastTimerRef.current) {
          window.clearTimeout(copyToastTimerRef.current);
        }

        copyToastTimerRef.current = window.setTimeout(() => {
          setCopyToast("");
        }, 2400);
      }

      console.warn("AI auto reply blocked", {
        reason: event.reason,
        intent: event.intent,
        confidence: event.confidence,
      });

      return;
    }

    if (event.type === "appointment_scheduled") {
      if (!event.conversationId || event.conversationId === String(activeId)) {
        setCopyToast(`Booking confirmado · ${event.appointment.time}`);

        if (copyToastTimerRef.current) {
          window.clearTimeout(copyToastTimerRef.current);
        }

        copyToastTimerRef.current = window.setTimeout(() => {
          setCopyToast("");
        }, 1800);
      }

      return;
    }

    if (event.type === "typing_started" && event.conversationId === String(activeId)) {
      setIsTyping(true);
      return;
    }

    if (event.type === "typing_stopped" && event.conversationId === String(activeId)) {
      setIsTyping(false);
    }
  };

  const sendWhatsAppMessage = async (
    conversationId: string | number,
    text: string,
    clientMessageId: string,
    imageAttachment?: StagedMedia
  ) => {
    const recipient = activeChat.recipient ?? activeChat.phone;
    const requestBody: Record<string, string> = {
        clientMessageId,
        conversationId: String(conversationId),
        to: recipient,
        text,
      };
    // Incluir tenantId si está disponible (impersonación multi-tenant)
    if (tenantId) {
      requestBody.tenantId = tenantId;
    }
    const requestInit: RequestInit = imageAttachment?.file
      ? (() => {
          console.log("SEND IMAGE CLICKED");
          console.log("attachment file/path/url", {
            fileName: imageAttachment.file?.name,
            mimeType: imageAttachment.file?.type,
            size: imageAttachment.file?.size,
            previewUrl: imageAttachment.previewUrl,
          });

          const formData = new FormData();
          formData.set("clientMessageId", requestBody.clientMessageId);
          formData.set("conversationId", requestBody.conversationId);
          formData.set("to", requestBody.to);
          formData.set("text", requestBody.text);
          formData.set("image", imageAttachment.file as File);

          return {
            method: "POST",
            body: formData,
          };
        })()
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        };
    const response = await fetch("/api/whatsapp/send", requestInit);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorData = data as WhatsAppSendErrorResponse | null;
      const metaError: MetaSendError = {
        statusCode: errorData?.statusCode ?? response.status,
        statusText: errorData?.statusText ?? response.statusText,
        code: errorData?.metaError?.code,
        message:
          errorData?.metaError?.message ??
          errorData?.errorMessage ??
          errorData?.error ??
          "Unknown send error",
        error_subcode: errorData?.metaError?.error_subcode,
        metaResponse: errorData?.metaResponse ?? errorData,
      };

      console.warn("WhatsApp send endpoint returned non-ok status", {
        statusCode: metaError.statusCode,
        statusText: metaError.statusText,
        errorCode: metaError.code,
        errorMessage: metaError.message,
        errorSubcode: metaError.error_subcode,
        metaResponse: metaError.metaResponse,
      });

      if (process.env.NODE_ENV !== "production") {
        console.info(
          `Meta error: code=${metaError.code ?? "n/a"} subcode=${metaError.error_subcode ?? "n/a"} message=${metaError.message}`,
          metaError.metaResponse
        );
      }

      throw Object.assign(new Error(metaError.message), {
        metaError,
        failedMessage: errorData?.message,
      });
    }

    return data as WhatsAppSendResponse;
  };
  // Wire ref bridge so the (previously called) hook can invoke sendWhatsAppMessage
  sendWhatsAppMessageRef.current = sendWhatsAppMessage;

  const toggleAutoReplyMode = () => {
    const conversationId = String(activeId);
    const nextAutoReplyEnabled = !activeChat.autoReplyEnabled;

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        String(thread.id) === conversationId
          ? { ...thread, autoReplyEnabled: nextAutoReplyEnabled }
          : thread
      )
    );

    void fetch("/api/whatsapp/mode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        contactName: activeChat.name,
        phone: activeChat.phone,
        autoReplyEnabled: nextAutoReplyEnabled,
        tenantId,
      }),
    }).then((response) => {
      if (!response.ok) {
        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            String(thread.id) === conversationId
              ? { ...thread, autoReplyEnabled: !nextAutoReplyEnabled }
              : thread
          )
        );
      }
    });

    if (!nextAutoReplyEnabled) {
      setDraftText("");
    }

    // Mode toast
    setModeToast(nextAutoReplyEnabled ? "Modo IA activado" : "Modo manual activado");
    if (modeToastTimerRef.current) {
      window.clearTimeout(modeToastTimerRef.current);
    }
    modeToastTimerRef.current = window.setTimeout(() => {
      setModeToast("");
      modeToastTimerRef.current = null;
    }, 1800);
  };

  const simulateIncomingClientMessage = () => {
    if (incomingTimerRef.current) {
      window.clearTimeout(incomingTimerRef.current);
    }

    setIsTyping(true);
    incomingTimerRef.current = window.setTimeout(() => {
      const text = "Hola, podria agregar hidratacion premium al balayage del jueves?";

      setIsTyping(false);
      appendMessage({ type: "client", text });
      if (activeChat.autoReplyEnabled) {
        regenerateAiDraft(text);
      }
      handleIncomingMessage({ text });
    }, 900);
  };

  const sendWhatsAppReaction = async (message: Message, emoji: string) => {
    if (!message.waMessageId) {
      return;
    }

    const response = await fetch("/api/whatsapp/reaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: activeChat.recipient ?? activeChat.phone,
        messageId: message.waMessageId,
        emoji,
      }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn("WhatsApp reaction endpoint returned non-ok status", {
        statusCode: response.status,
        errorMessage: data?.errorMessage ?? data?.error ?? "Unknown reaction error",
        metaResponse: data?.metaResponse ?? data,
      });

      throw new Error(data?.errorMessage ?? "WhatsApp reaction failed.");
    }
  };

  const toggleMessageHeartReaction = (message: Message) => {
    const messageKey = String(message.id);
    const previousReaction = messageReactions[messageKey];
    const nextReaction = previousReaction ? "" : "❤️";

    setMessageReactions((currentReactions) => {
      const nextReactions = { ...currentReactions };

      if (nextReaction) {
        nextReactions[messageKey] = nextReaction;
      } else {
        delete nextReactions[messageKey];
      }

      return nextReactions;
    });

    void sendWhatsAppReaction(message, nextReaction).catch(() => {
      setMessageReactions((currentReactions) => {
        const nextReactions = { ...currentReactions };

        if (previousReaction) {
          nextReactions[messageKey] = previousReaction;
        } else {
          delete nextReactions[messageKey];
        }

        return nextReactions;
      });
    });
  };

  const stageMedia = (media: StagedMedia) => {
    setStagedMedia((currentMedia) => {
      if (currentMedia.some((item) => item.id === media.id)) {
        return currentMedia;
      }

      return [...currentMedia, media];
    });
    setComposerHeight((currentHeight) => Math.min(340, Math.max(300, currentHeight)));
  };

  const getSelectedResourceMeta = (media: StagedMedia) => {
    const resourceType =
      media.resourceType ?? (media.source === "suggested" ? "Visual reference" : "Staged attachment");
    const resourceTypeLabel =
      resourceType === "Visual reference"
        ? "Referencia visual"
        : resourceType === "Before After"
          ? "Antes / después"
          : resourceType === "Treatment guide"
            ? "Guía de tratamiento"
            : "Adjunto preparado";
    const assetCount = media.assetCount ?? 1;
    const assetLabel = assetCount === 1 ? "recurso" : media.kind === "image" ? "imágenes" : "recursos";

    return `${resourceTypeLabel} · ${assetCount} ${assetLabel}`;
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    files.forEach((file) => {
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.type === "application/pdf"
              ? "pdf"
              : "document";
      const previewUrl =
        kind === "image" || kind === "video" || kind === "audio"
          ? URL.createObjectURL(file)
          : undefined;

      if (previewUrl) {
        objectUrlsRef.current.push(previewUrl);
      }

      stageMedia({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        kind,
        source: "file",
        file,
        resourceType: "Staged attachment",
        assetCount: 1,
        previewUrl,
      });
    });
    event.target.value = "";
    window.requestAnimationFrame(focusDraft);
  };

  const renderMediaPreview = (mediaItems: StagedMedia[], surface: "message" | "draft") => {
    const imageItems = mediaItems.filter((media) => media.kind === "image");
    const availableImageItems = imageItems.filter((media) => media.previewUrl);
    const unavailableImageItems = imageItems.filter((media) => !media.previewUrl);
    const documentItems = mediaItems.filter((media) => media.kind === "pdf" || media.kind === "document");
    const audioItems = mediaItems.filter((media) => media.kind === "audio");
    const videoItems = mediaItems.filter((media) => media.kind === "video");
    const visibleImages = availableImageItems.slice(0, 3);
    const extraImages = Math.max(availableImageItems.length - 3, 0);

    return (
      <div className={surface === "draft" ? styles.draftMediaPreview : styles.messageMediaPreview}>
        {availableImageItems.length > 0 ? (
          <button
            aria-label="Open media gallery"
            className={`${styles.mediaAlbum} media-album`}
            data-count={visibleImages.length}
            onClick={() => setLightboxImages(availableImageItems)}
            type="button"
          >
            {visibleImages.map((media) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={media.id}
                alt={media.name}
                className={`${styles.mediaThumb} media-thumb`}
                src={media.previewUrl}
              />
            ))}
            {extraImages > 0 ? (
              <span className={`${styles.mediaCountBadge} media-count-badge`}>
                +{extraImages}
              </span>
            ) : null}
          </button>
        ) : null}

        {unavailableImageItems.map((media) => (
          <div key={media.id} className={styles.mediaUnavailableCard}>
            <ImageIcon size={14} strokeWidth={1.7} />
            <span>Imagen no disponible</span>
          </div>
        ))}

        {availableImageItems.length > 0 ? (
          <div className={styles.mediaFilename}>
            {availableImageItems.length === 1 ? availableImageItems[0].name : `${availableImageItems.length} imagenes seleccionadas`}
          </div>
        ) : null}

        {videoItems.map((media) => (
          <div key={media.id} className={styles.mediaDocumentCard}>
            <ImageIcon size={13} />
            <span>{media.name}</span>
            <small>{media.source === "whatsapp" ? "Video recibido" : "Video staged"}</small>
            {media.previewUrl ? (
              <video className={styles.mediaVideo} controls src={media.previewUrl} />
            ) : null}
          </div>
        ))}

        {audioItems.map((media) => (
          <div key={media.id} className={styles.mediaAudioCard}>
            <Mic size={14} />
            <span>{media.name}</span>
            <small>{media.source === "whatsapp" ? "Audio recibido" : "Audio staged"}</small>
            {media.previewUrl ? (
              <audio className={styles.mediaAudio} controls src={media.previewUrl} />
            ) : null}
          </div>
        ))}

        {documentItems.map((media) => (
          <a
            key={media.id}
            className={styles.mediaDocumentCard}
            href={media.previewUrl}
            rel="noreferrer"
            target="_blank"
          >
            <FileText size={13} />
            <span>{media.name}</span>
            <small>{media.source === "whatsapp" ? "Documento recibido" : "PDF staged"}</small>
          </a>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const latestMessage = visibleMessages.at(-1);
    const latestMessageKey = latestMessage
      ? `${String(activeId)}:${latestMessage.id}`
      : `${String(activeId)}:empty`;
    const isNewMessage = latestMessageKey !== lastRenderedMessageKeyRef.current;

    if (!isNewMessage) {
      return;
    }

    lastRenderedMessageKeyRef.current = latestMessageKey;

    if (shouldStickToBottomRef.current) {
      window.requestAnimationFrame(() => {
        scrollMessagesToBottom("smooth");
      });
    }
  }, [activeId, visibleMessages]);

  useEffect(() => {
    setUnreadMessagesCount(browserUnreadCount);
  }, [browserUnreadCount]);

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects: Record<string, DOMRect> = {};

    threads.forEach((thread) => {
      const threadId = String(thread.id);
      const node = threadItemRefs.current[threadId];

      if (!node) {
        return;
      }

      const nextRect = node.getBoundingClientRect();
      const previousRect = previousThreadRectsRef.current[threadId];

      nextRects[threadId] = nextRect;

      if (
        reduceMotion ||
        animatedThreadIds.includes(threadId) ||
        !previousRect ||
        previousRect.top === nextRect.top
      ) {
        return;
      }

      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaY) < 2) {
        return;
      }

      node.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );
    });

    previousThreadRectsRef.current = nextRects;
  }, [animatedThreadIds, threads]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    lastRenderedMessageKeyRef.current = null;
    console.log("Selected conversation:", String(activeId));
    console.log("Thread messages count:", visibleMessages.length);

    window.setTimeout(() => {
      void loadConversationMessages(String(activeId), {
        replace: true,
        markSeen: true,
      });
    }, 0);

    window.requestAnimationFrame(() => {
      scrollMessagesToBottom("auto");
    });
  }, [activeId]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      scrollMessagesToBottom("auto");
    });
  }, [composerHeight]);

  useRealtimeEvents({
    activeId,
    lastWhatsAppMessageIdsRef,
    loadConversationMessages,
    handleRealtimeEvent,
    tenantId,
  });

  useEffect(() => {
    const threadAnimationTimers = threadAnimationTimersRef.current;
    const objectUrls = objectUrlsRef.current;

    window.simulateIncomingClientMessage = simulateIncomingClientMessage;

    return () => {
      if (incomingTimerRef.current) {
        window.clearTimeout(incomingTimerRef.current);
      }
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      if (modeToastTimerRef.current) {
        window.clearTimeout(modeToastTimerRef.current);
      }
      Object.values(threadAnimationTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <AppShell>
    <div
      className={[
        "inbox-page",
        outfit.variable,
        inter.variable,
        styles.inboxPage,
      ].join(" ")}
    >
      <ConversationsPanel
        threads={threads}
        activeId={activeId}
        animatedThreadIds={animatedThreadIds}
        onSelectConversation={(id, conversation) => {
          if (!conversation.autoReplyEnabled) {
            setDraftText("");
          }

          selectConversation(id, { manual: true });
          setThreads((currentThreads) =>
            currentThreads.map((thread) =>
              thread.id === conversation.id
                ? { ...thread, unread: false, unreadCount: 0, activeNow: true }
                : thread
            )
          );
        }}
        onCopyPhone={(formattedPhone) => {
          copyMessageText(formattedPhone);
          setCopyToast("Teléfono copiado");
          if (copyToastTimerRef.current) {
            window.clearTimeout(copyToastTimerRef.current);
          }
          copyToastTimerRef.current = window.setTimeout(() => setCopyToast(""), 1600);
        }}
        setThreadItemRef={setThreadItemRef}
        formatPhone={formatWhatsAppLine}
        iaResponsesToday={iaResponsesToday}
      />

      <ChatPanel
        activeChat={activeChat}
        activeServiceWindow={activeServiceWindow}
        toggleAutoReplyMode={toggleAutoReplyMode}
        messagesAreaRef={messagesAreaRef}
        messagesEndRef={messagesEndRef}
        messagesAreaStyle={messagesAreaStyle}
        chatTapiz={chatTapiz}
        handleMessagesScroll={handleMessagesScroll}
        visibleMessages={visibleMessages}
        messageReactions={messageReactions}
        justSentIds={justSentIds}
        messageDrag={messageDrag}
        bookingSlots={bookingSlots}
        isTyping={isTyping}
        getQuoteAuthor={getQuoteAuthor}
        metaErrorLabel={metaErrorLabel}
        onKeywordChipClick={onKeywordChipClick}
        onTimeChipClick={onTimeChipClick}
        activateReplyMode={activateReplyMode}
        copyMessageText={copyMessageText}
        toggleMessageHeartReaction={toggleMessageHeartReaction}
        resetMessageDrag={resetMessageDrag}
        handleMessagePointerDown={handleMessagePointerDown}
        handleMessagePointerMove={handleMessagePointerMove}
        handleMessagePointerUp={handleMessagePointerUp}
        renderMediaPreview={renderMediaPreview}
        composerHeight={composerHeight}
        handleComposerResizeStart={handleComposerResizeStart}
        handleComposerResizeMove={handleComposerResizeMove}
        handleComposerResizeEnd={handleComposerResizeEnd}
        quotedReply={quotedReply}
        setQuotedReply={setQuotedReply}
        isBookingDrawerOpen={isBookingDrawerOpen}
        isBookingDrawerClosing={isBookingDrawerClosing}
        isConfirmingBooking={isConfirmingBooking}
        detectedBookingService={detectedBookingService}
        activeChatName={activeChat.name}
        bookingStylists={bookingStylists}
        selectedBookingSlot={selectedBookingSlot}
        selectedBookingStylist={selectedBookingStylist}
        onSelectBookingSlot={(slotId, stylistId) => {
          setSelectedBookingSlotId(slotId);
          setSelectedBookingStylistId(stylistId);
        }}
        onSelectBookingStylist={setSelectedBookingStylistId}
        onConfirmBooking={handleConfirmBooking}
        onCloseBookingDrawer={() => handleCloseBookingDrawer({ restoreFocus: true })}
        draftText={draftText}
        setDraftText={setDraftText}
        handleDraftKeyDown={handleDraftKeyDown}
        draftFieldRef={draftFieldRef}
        stagedMedia={stagedMedia}
        getSelectedResourceMeta={getSelectedResourceMeta}
        removeStagedMedia={removeStagedMedia}
        attachMedia={attachMedia}
        openBookingDrawer={openBookingDrawer}
        isEmojiPickerOpen={isEmojiPickerOpen}
        toggleCuratedEmojiPicker={toggleCuratedEmojiPicker}
        emojiButtonRef={emojiButtonRef}
        isSendingDraft={isSendingDraft}
        handleSendDraft={handleSendDraft}
        fileInputRef={fileInputRef}
        handleFileSelected={handleFileSelected}
        currentMode={currentMode}
        onSetMode={onSetMode}
        scheduleStart={scheduleStart}
        scheduleEnd={scheduleEnd}
        onSetSchedule={onSetSchedule}
      />

      <AssistantRail
        activeId={activeId}
        activeChatName={activeChat.name}
        feedSearch={feedSearch}
        onFeedSearchChange={setFeedSearch}
        onFeedSearchClear={() => setFeedSearch("")}
        customerProfile={customerProfile}
        feedAnalysisState={feedAnalysisState}
        feedAnalysisLog={feedAnalysisLog}
        feedTimeline={feedTimeline}
        activeFeedSuggestions={activeFeedSuggestions}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onPlayGradient={(itemId) => {
          setPlayedItemGradients((prev) => new Set(prev).add(itemId));
          setFeedTimeline((prev) =>
            prev.map((t) =>
              t.id === itemId ? { ...t, gradientPlayed: true } : t
            )
          );
        }}
        onInsertReply={(text) => {
          setDraftText(text);
          window.requestAnimationFrame(() => {
            draftFieldRef.current?.focus();
          });
        }}
        onAskPhoto={() => {
          setDraftText(
            (prev) =>
              `${prev ? prev + "\n\n" : ""}¿Podrías enviarnos una foto con luz natural para orientarte mejor?`
          );
          window.requestAnimationFrame(() => {
            draftFieldRef.current?.focus();
          });
        }}
        onSchedule={() => {
          openBookingDrawer();
        }}
        onSendReference={() => {
          stageSuggestedMedia();
        }}
      />

      {/* ── Floating help button ─────────────────────────────── */}
      <button
        className={styles.floatingHelpBtn}
        onClick={() => setIsHelpModalOpen(true)}
        title="Guía de Asistencia Inteligente"
        type="button"
      >
        <Sparkles size={16} strokeWidth={1.6} />
      </button>

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      <Lightbox images={lightboxImages ?? []} onClose={() => setLightboxImages(null)} />
      <InboxToast copyToast={copyToast} modeToast={modeToast} />
    </div>
    <CuratedEmojiPicker
      isOpen={isEmojiPickerOpen}
      isClosing={isEmojiPickerClosing}
      style={emojiPickerStyle ?? { left: 12, opacity: 0, top: 12 }}
      pickerRef={emojiPickerRef}
      onEmojiSelect={insertCuratedEmoji}
    />
    </AppShell>
  );
}
