"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

// ── Types (subset extracted from page.tsx) ──────────────────────────

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

// ── Local types matching page.tsx (not exported from useWhatsAppMessages) ─

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

type ChatInfo = {
  id: number | string;
  name: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled?: boolean;
  lastInboundAt?: string;
  lastMsg: string;
};

type ServiceWindowInfo = {
  isOpen: boolean;
  label: string;
};

type WhatsAppSendErrorResponse = {
  statusCode?: number;
  statusText?: string;
  errorMessage?: string;
  error?: string;
  metaError?: MetaSendError;
  metaResponse?: unknown;
};

// ── Service Window Helper ─────────────────────────────────────────

function serviceWindowFor(lastInboundAt?: string): ServiceWindowInfo {
  if (!lastInboundAt) {
    return { isOpen: false, label: "Sin conversación activa" };
  }

  const last = new Date(lastInboundAt).getTime();
  const now = Date.now();
  const hoursSinceLastInbound = (now - last) / (1000 * 60 * 60);

  if (hoursSinceLastInbound > 24) {
    return { isOpen: false, label: "Ventana de 24h cerrada" };
  }

  return { isOpen: true, label: "Ventana abierta" };
}

// ── Hook ──────────────────────────────────────────────────────────

export type UseInboxComposerOptions = {
  activeId: string | number;
  activeChat: ChatInfo | undefined;
  conversationContext: string;
  appendMessage: (msg: Partial<Message> & { type: Message["type"]; text: string }) => void;
  updateOptimisticMessage: (id: string, updates: Partial<Message>) => void;
  updateOptimisticStatus: (id: string, status: Message["status"], metaError?: MetaSendError) => void;
  localMessageIdRef: React.MutableRefObject<number>;
  sendWhatsAppMessage: (
    conversationId: string | number,
    text: string,
    clientMessageId: string,
    imageAttachment?: StagedMedia
  ) => Promise<{ message?: { waMessageId?: string }; messageId?: string }>;
  /** Called when an emoji picker needs to be closed before send */
  closeCuratedEmojiPicker?: (options?: { restoreFocus?: boolean }) => void;
  /** Called just before a draft is sent (e.g. to set shouldStickToBottomRef) */
  onBeforeSendDraft?: () => void;
  /**
   * Called when "stage suggested media" is triggered.
   * If provided, the hook delegates the full action to this callback.
   * If omitted, the hook uses its own simple fallback.
   */
  onStageSuggestedMedia?: () => void;
};

export function useInboxComposer({
  activeId,
  activeChat,
  conversationContext,
  appendMessage,
  updateOptimisticMessage,
  updateOptimisticStatus,
  localMessageIdRef,
  sendWhatsAppMessage,
  closeCuratedEmojiPicker: closeEmojiPicker,
  onBeforeSendDraft,
  onStageSuggestedMedia,
}: UseInboxComposerOptions) {
  // ── State ────────────────────────────────────────────────────
  const [draftText, setDraftText] = useState("");
  const [stagedMedia, setStagedMedia] = useState<StagedMedia[]>([]);
  const [quotedReply, setQuotedReply] = useState<Message | null>(null);
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [composerHeight, setComposerHeight] = useState(180);
  const [justSentIds, setJustSentIds] = useState<Set<string>>(new Set());
  const [copyToast, setCopyToast] = useState("");
  const [modeToast, setModeToast] = useState("");
  const [messageDrag, setMessageDrag] = useState<{ id: Message["id"]; x: number } | null>(null);

  // ── Refs ─────────────────────────────────────────────────────
  const draftFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSendingDraftRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);
  const copyToastTimerRef = useRef<number | null>(null);
  const modeToastTimerRef = useRef<number | null>(null);
  const composerResizeRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const swipeStartRef = useRef<{ id: Message["id"]; x: number; y: number } | null>(null);

  // ── Derived ──────────────────────────────────────────────────
  const activeServiceWindow = serviceWindowFor(activeChat?.lastInboundAt);

  // ── Send Logic ───────────────────────────────────────────────

  const handleSendDraft = useCallback(() => {
    if (isSendingDraftRef.current) {
      return;
    }

    closeEmojiPicker?.({ restoreFocus: true });

    const text = draftText.trim();
    const imageAttachment = stagedMedia.find((media) => media.kind === "image" && media.file);

    if (!text && !imageAttachment) {
      draftFieldRef.current?.focus();
      return;
    }

    if (!activeServiceWindow.isOpen) {
      setCopyToast("Para escribir fuera de la ventana de 24h debes usar una plantilla aprobada.");
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      copyToastTimerRef.current = window.setTimeout(() => {
        setCopyToast("");
      }, 2600);
      draftFieldRef.current?.focus();
      return;
    }

    isSendingDraftRef.current = true;
    setIsSendingDraft(true);
    onBeforeSendDraft?.();

    const optimisticId = `optimistic-${localMessageIdRef.current++}`;

    appendMessage({
      id: optimisticId,
      type: "studio",
      text: text || "Media enviada.",
      status: "sending",
      media: stagedMedia,
      replyTo: quotedReply
        ? {
            type: quotedReply.type,
            text: quotedReply.text,
          }
        : undefined,
    });

    // Trigger shine animation on the just-sent bubble
    setJustSentIds((prev) => new Set(prev).add(optimisticId));
    const justSentTimerId = window.setTimeout(() => {
      setJustSentIds((prev) => {
        const next = new Set(prev);
        next.delete(optimisticId);
        return next;
      });
    }, 1200);

    if (text || imageAttachment) {
      void sendWhatsAppMessage(activeId, text, optimisticId, imageAttachment)
        .then((data) => {
          updateOptimisticMessage(optimisticId, {
            status: "sent",
            waMessageId: data.message?.waMessageId ?? data.messageId,
          });
        })
        .catch((error: unknown) => {
          const metaError =
            error &&
            typeof error === "object" &&
            "metaError" in error
              ? (error.metaError as MetaSendError)
              : undefined;

          updateOptimisticStatus(optimisticId, "failed", metaError);
        })
        .finally(() => {
          isSendingDraftRef.current = false;
          setIsSendingDraft(false);
        });
    } else {
      isSendingDraftRef.current = false;
      setIsSendingDraft(false);
    }

    setDraftText("");
    setStagedMedia([]);
    setQuotedReply(null);
    window.requestAnimationFrame(() => {
      draftFieldRef.current?.focus();
    });
  }, [
    activeId,
    activeChat?.lastInboundAt,
    conversationContext,
    draftText,
    stagedMedia,
    quotedReply,
    closeEmojiPicker,
    appendMessage,
    updateOptimisticMessage,
    updateOptimisticStatus,
    localMessageIdRef,
    sendWhatsAppMessage,
    activeServiceWindow.isOpen,
    onBeforeSendDraft,
  ]);

  const handleDraftKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      handleSendDraft();
    },
    [handleSendDraft]
  );

  // ── Media ────────────────────────────────────────────────────

  const attachMedia = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeStagedMedia = useCallback((mediaId: StagedMedia["id"]) => {
    setStagedMedia((currentMedia) => currentMedia.filter((media) => media.id !== mediaId));
  }, []);

  const stageSuggestedMedia = useCallback(() => {
    if (onStageSuggestedMedia) {
      onStageSuggestedMedia();
      return;
    }

    // Shared media library mock — stage a reference image
    const newMedia: StagedMedia = {
      id: `suggested-media-${Date.now()}`,
      kind: "image",
      source: "suggested",
      name: "Referencia de servicio",
      previewUrl: "/placeholder-reference.jpg",
      resourceType: "Visual reference",
      assetCount: 1,
    };
    setStagedMedia((currentMedia) => [...currentMedia, newMedia]);
    setComposerHeight(390);
    window.requestAnimationFrame(() => {
      draftFieldRef.current?.focus();
    });
  }, [onStageSuggestedMedia]);

  // ── Reply Mode ───────────────────────────────────────────────

  const focusDraft = useCallback(() => {
    draftFieldRef.current?.focus();
  }, []);

  const activateReplyMode = useCallback(
    (message: Message) => {
      setQuotedReply(message);
      window.requestAnimationFrame(focusDraft);
    },
    [focusDraft]
  );

  // ── Copy / Toast ─────────────────────────────────────────────

  const showCopyToast = useCallback(
    (message = "Mensaje copiado") => {
      setCopyToast(message);

      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }

      copyToastTimerRef.current = window.setTimeout(() => {
        setCopyToast("");
      }, 1600);
    },
    []
  );

  const copyMessageText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      showCopyToast();
    },
    [showCopyToast]
  );

  // ── Swipe-to-Reply ────────────────────────────────────────────

  const resetMessageDrag = useCallback(() => {
    swipeStartRef.current = null;
    setMessageDrag(null);
  }, []);

  const handleMessagePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, message: Message) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      swipeStartRef.current = {
        id: message.id,
        x: event.clientX,
        y: event.clientY,
      };
      setMessageDrag({ id: message.id, x: 0 });
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    []
  );

  const handleMessagePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>, message: Message) => {
      const swipeStart = swipeStartRef.current;

      if (!swipeStart || swipeStart.id !== message.id) {
        return;
      }

      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;

      if (deltaX <= 0) {
        setMessageDrag({ id: message.id, x: 0 });
        return;
      }

      if (deltaX > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
        setMessageDrag({ id: message.id, x: Math.min(deltaX, 72) });
      }
    },
    []
  );

  const handleMessagePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>, message: Message) => {
      const swipeStart = swipeStartRef.current;

      if (!swipeStart || swipeStart.id !== message.id) {
        resetMessageDrag();
        return;
      }

      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;

      resetMessageDrag();

      // Page uses a stricter threshold: wider sweep and less vertical drift allowed
      if (deltaX > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        activateReplyMode(message);
      }
    },
    [resetMessageDrag, activateReplyMode]
  );

  // ── Composer Resize ───────────────────────────────────────────

  const handleComposerResizeStart = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      event.preventDefault();
      composerResizeRef.current = {
        startY: event.clientY,
        startHeight: composerHeight,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [composerHeight]
  );

  const handleComposerResizeMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const resizeStart = composerResizeRef.current;

      if (!resizeStart) {
        return;
      }

      event.preventDefault();
      const newHeight = resizeStart.startHeight + resizeStart.startY - event.clientY;
      setComposerHeight(Math.min(340, Math.max(110, newHeight)));
    },
    []
  );

  const handleComposerResizeEnd = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      composerResizeRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    []
  );

  // ── Return ────────────────────────────────────────────────────

  return {
    // State
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
    setMessageDrag,

    // Refs
    draftFieldRef,
    fileInputRef,
    isSendingDraftRef,
    objectUrlsRef,
    copyToastTimerRef,
    modeToastTimerRef,
    composerResizeRef,
    swipeStartRef,

    // Derived
    activeServiceWindow,

    // Handlers
    handleSendDraft,
    handleDraftKeyDown,
    attachMedia,
    removeStagedMedia,
    stageSuggestedMedia,
    activateReplyMode,
    copyMessageText,
    showCopyToast,
    focusDraft,

    // Swipe
    resetMessageDrag,
    handleMessagePointerDown,
    handleMessagePointerMove,
    handleMessagePointerUp,

    // Resize
    handleComposerResizeStart,
    handleComposerResizeMove,
    handleComposerResizeEnd,
  };
}
