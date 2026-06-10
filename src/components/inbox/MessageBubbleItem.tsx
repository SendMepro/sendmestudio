"use client";

import type { PointerEvent, CSSProperties } from "react";
import { CheckCheck, Copy, Heart, Reply, Sparkles } from "lucide-react";
import SmartKeywordChipText from "./SmartKeywordChipText";
import type { Message, MetaSendError, StagedMedia } from "../../app/inbox/page";
import type { FeedSuggestion } from "../../hooks/inbox/useFeedAnalysis";
import type { BookingSlot } from "../../hooks/inbox/useBooking";
import styles from "../../app/inbox/inbox.module.css";



export type MessageBubbleItemProps = {
  message: Message;
  messageReaction: string | undefined;
  isJustSent: boolean;
  messageDrag: { id: string | number; x: number } | null;
  bookingSlots: BookingSlot[];
  getQuoteAuthor: (type: Message["type"]) => string;
  metaErrorLabel: (message: Message) => string | undefined;
  onKeywordChipClick: (suggestion: FeedSuggestion, matchedKeyword: string) => void;
  onTimeChipClick: (timeStr: string, dayStr: string | undefined, isAvailable: boolean) => void;
  onReply: (message: Message) => void;
  onCopyText: (text: string) => void;
  onToggleHeart: (message: Message) => void;
  onPointerCancel: () => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, message: Message) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>, message: Message) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>, message: Message) => void;
  renderMediaPreview: (mediaItems: StagedMedia[], surface: "message" | "draft") => React.ReactNode;
};

export default function MessageBubbleItem({
  message,
  messageReaction,
  isJustSent,
  messageDrag,
  bookingSlots,
  getQuoteAuthor,
  metaErrorLabel,
  onKeywordChipClick,
  onTimeChipClick,
  onReply,
  onCopyText,
  onToggleHeart,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  renderMediaPreview,
}: MessageBubbleItemProps) {
  const dragStyle: CSSProperties | undefined =
    messageDrag?.id === message.id && messageDrag.x > 0
      ? { transform: `translateX(${messageDrag.x}px)` }
      : undefined;

  return (
    <article
      key={message.id}
      className={[
        styles.messageBubble,
        "message-bubble",
        message.isNew ? `${styles.newMessage} new-message` : "",
        isJustSent ? `${styles.messageBubbleJustSent} just-sent` : "",
      ].join(" ")}
      data-dragging={messageDrag !== null && messageDrag.id === message.id && messageDrag.x > 0 ? "true" : "false"}
      data-status={message.status}
      data-type={message.type}
      onPointerCancel={onPointerCancel}
      onPointerDown={(event) => onPointerDown(event, message)}
      onPointerMove={(event) => onPointerMove(event, message)}
      onPointerUp={(event) => onPointerUp(event, message)}
      style={dragStyle}
    >
      <span className={styles.swipeReplyIndicator} aria-hidden="true">
        <Reply size={13} strokeWidth={1.9} />
      </span>
      {message.replyTo ? (
        <div className={styles.sentReplyQuote}>
          <span>Respondiendo a {getQuoteAuthor(message.replyTo.type)}</span>
          <p>{message.replyTo.text}</p>
        </div>
      ) : null}
      {message.text ? (
        message.type === "client" ? (
          <SmartKeywordChipText
            text={message.text}
            onChipClick={onKeywordChipClick}
            onTimeChipClick={onTimeChipClick}
            bookingSlots={bookingSlots}
          />
        ) : (
          <p className={styles.messageText}>{message.text}</p>
        )
      ) : null}
      {message.metadata?.generatedByAI && message.metadata.autoSent ? (
        <div className={styles.aiAutoBadge}>
          <Sparkles size={10} strokeWidth={1.8} />
          <span>La IA respondió automáticamente</span>
        </div>
      ) : null}

      <div className={styles.messageMeta}>
        <div className={`${styles.messageActions} message-actions`}>
          <button
            aria-label="Responder mensaje"
            className={`${styles.messageActionBtn} message-action-btn`}
            onClick={() => onReply(message)}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Reply size={11} strokeWidth={1.8} />
          </button>
          <button
            aria-label="Copiar mensaje"
            className={`${styles.messageActionBtn} message-action-btn`}
            onClick={() => onCopyText(message.text)}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Copy size={11} strokeWidth={1.8} />
          </button>
          <button
            aria-label={messageReaction ? "Quitar reacción de corazón" : "Reaccionar con corazón"}
            className={[
              styles.messageActionBtn,
              "message-action-btn",
              messageReaction ? `${styles.activeMessageAction} active` : "",
            ].join(" ")}
            onClick={() => onToggleHeart(message)}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Heart
              fill={messageReaction ? "currentColor" : "none"}
              size={11}
              strokeWidth={1.8}
            />
          </button>
        </div>
        <span>{message.time}</span>
        {message.type === "studio" ? (
          <>
            {message.status === "sent" || message.status === "delivered" || message.status === "read" ? <CheckCheck size={11} /> : null}
            {message.status ? (
              <span
                className={styles.messageStatus}
                data-status={message.status === "failed" && message.waMessageId ? "sent" : message.status}
                title={message.status === "failed" ? metaErrorLabel(message) : undefined}
              >
                {message.status === "read"
                  ? "✓✓ Mensaje visto"
                  : message.status === "delivered"
                    ? "✓✓ Entregado"
                    : message.status === "failed" && !message.waMessageId
                      ? "Fallido"
                      : "✓ Enviado"}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      {message.media && message.media.length > 0 ? (
        renderMediaPreview(message.media, "message")
      ) : null}
      {messageReaction ? (
        <span className={styles.messageReactionBadge} aria-label={`Reaction ${messageReaction}`}>
          {messageReaction}
        </span>
      ) : null}
    </article>
  );
}
