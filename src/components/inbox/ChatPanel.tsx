"use client";

import type { CSSProperties, ChangeEvent, PointerEvent } from "react";
import { CalendarDays, FileText, Paperclip, Reply, Send, Smile, Sticker, X } from "lucide-react";
import type { Message, StagedMedia } from "../../app/inbox/page";
import type { Conversation } from "../../hooks/inbox/useInboxThreads";
import type { FeedSuggestion } from "../../hooks/inbox/useFeedAnalysis";
import type { BookingSlot, BookingService, BookingStylist } from "../../hooks/inbox/useBooking";

import MessageBubbleItem from "./MessageBubbleItem";
import BookingDrawer from "./BookingDrawer";
import styles from "../../app/inbox/inbox.module.css";

export type ChatPanelProps = {
  // Chat header data
  activeChat: Conversation;
  activeServiceWindow: { isOpen: boolean; label: string };
  toggleAutoReplyMode: () => void;

  // Messages area
  messagesAreaRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesAreaStyle: React.CSSProperties | undefined;
  chatTapiz: string | null;
  handleMessagesScroll: () => void;
  visibleMessages: Message[];
  messageReactions: Record<string, string>;
  justSentIds: Set<string>;
  messageDrag: { id: string | number; x: number } | null;
  bookingSlots: BookingSlot[];
  isTyping: boolean;
  getQuoteAuthor: (type: Message["type"]) => string;
  metaErrorLabel: (message: Message) => string | undefined;
  onKeywordChipClick: (suggestion: FeedSuggestion, matchedKeyword: string) => void;
  onTimeChipClick: (timeStr: string, dayStr: string | undefined, isAvailable: boolean) => void;
  activateReplyMode: (message: Message) => void;
  copyMessageText: (text: string) => void;
  toggleMessageHeartReaction: (message: Message) => void;
  resetMessageDrag: () => void;
  handleMessagePointerDown: (event: PointerEvent<HTMLElement>, message: Message) => void;
  handleMessagePointerMove: (event: PointerEvent<HTMLElement>, message: Message) => void;
  handleMessagePointerUp: (event: PointerEvent<HTMLElement>, message: Message) => void;
  renderMediaPreview: (mediaItems: StagedMedia[], surface: "message" | "draft") => React.ReactNode;

  // Draft / composer
  composerHeight: number;
  handleComposerResizeStart: (event: PointerEvent<HTMLElement>) => void;
  handleComposerResizeMove: (event: PointerEvent<HTMLElement>) => void;
  handleComposerResizeEnd: (event: PointerEvent<HTMLElement>) => void;
  quotedReply: Message | null;
  setQuotedReply: React.Dispatch<React.SetStateAction<Message | null>>;
  isBookingDrawerOpen: boolean;
  isBookingDrawerClosing: boolean;
  isConfirmingBooking: boolean;
  detectedBookingService: BookingService | undefined;
  activeChatName: string;
  bookingStylists: BookingStylist[];
  selectedBookingSlot: BookingSlot | undefined;
  selectedBookingStylist: BookingStylist | undefined;
  onSelectBookingSlot: (slotId: string, stylistId: string) => void;
  onSelectBookingStylist: (stylistId: string) => void;
  onConfirmBooking: () => void;
  onCloseBookingDrawer: () => void;
  draftText: string;
  setDraftText: React.Dispatch<React.SetStateAction<string>>;
  handleDraftKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  draftFieldRef: React.RefObject<HTMLTextAreaElement | null>;
  stagedMedia: StagedMedia[];
  getSelectedResourceMeta: (media: StagedMedia) => string;
  removeStagedMedia: (mediaId: string) => void;
  attachMedia: () => void;
  openBookingDrawer: () => void;
  isEmojiPickerOpen: boolean;
  toggleCuratedEmojiPicker: () => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  isSendingDraft: boolean;
  handleSendDraft: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;

  // Mode system (new)
  currentMode: "manual" | "automatic" | "scheduled";
  onSetMode: (mode: "manual" | "automatic" | "scheduled") => void;
  scheduleStart: string;
  scheduleEnd: string;
  onSetSchedule: (start: string, end: string) => void;
};

export default function ChatPanel({
  // Chat header
  activeChat,
  activeServiceWindow,
  toggleAutoReplyMode,

  // Messages area
  messagesAreaRef,
  messagesEndRef,
  messagesAreaStyle,
  chatTapiz,
  handleMessagesScroll,
  visibleMessages,
  messageReactions,
  justSentIds,
  messageDrag,
  bookingSlots,
  isTyping,
  getQuoteAuthor,
  metaErrorLabel,
  onKeywordChipClick,
  onTimeChipClick,
  activateReplyMode,
  copyMessageText,
  toggleMessageHeartReaction,
  resetMessageDrag,
  handleMessagePointerDown,
  handleMessagePointerMove,
  handleMessagePointerUp,
  renderMediaPreview,

  // Composer
  composerHeight,
  handleComposerResizeStart,
  handleComposerResizeMove,
  handleComposerResizeEnd,
  quotedReply,
  setQuotedReply,
  isBookingDrawerOpen,
  isBookingDrawerClosing,
  isConfirmingBooking,
  detectedBookingService,
  activeChatName,
  bookingStylists,
  selectedBookingSlot,
  selectedBookingStylist,
  onSelectBookingSlot,
  onSelectBookingStylist,
  onConfirmBooking,
  onCloseBookingDrawer,
  draftText,
  setDraftText,
  handleDraftKeyDown,
  draftFieldRef,
  stagedMedia,
  getSelectedResourceMeta,
  removeStagedMedia,
  attachMedia,
  openBookingDrawer,
  isEmojiPickerOpen,
  toggleCuratedEmojiPicker,
  emojiButtonRef,
  isSendingDraft,
  handleSendDraft,
  fileInputRef,
  handleFileSelected,

  // Mode system (new)
  currentMode,
  onSetMode,
  scheduleStart,
  scheduleEnd,
  onSetSchedule,
}: ChatPanelProps) {
  const chatPanelStyle = {
    "--composer-height": `${composerHeight}px`,
  } as CSSProperties & { "--composer-height": string };

  const statusLabel =
    currentMode === "automatic" ? "IA activa ahora" :
    currentMode === "scheduled" ? "Horario 20:00 → 10:00" :
    "Recepción toma control";

  const statusMode =
    currentMode === "automatic" ? "ia" :
    currentMode === "scheduled" ? "horario" :
    "manual";

  return (
    <section className={`${styles.chatPanel} chat-panel`} style={chatPanelStyle}>
      <header className={styles.chatHeader}>
        <div className={styles.chatIdentity}>
          <img alt={activeChat.name} className={styles.chatAvatar} src={activeChat.avatar} />

          <div className={styles.chatIdentityRow}>
            <h2 className={styles.chatTitle}>{activeChat.name}</h2>
            <span
              className={styles.serviceWindowStatus}
              data-open={activeServiceWindow.isOpen ? "true" : "false"}
            >
              {activeServiceWindow.label}
            </span>
          </div>
        </div>

        <div className={styles.chatActions} style={{ flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <div className={styles.modePills}>
            <button
              className={styles.modePill}
              data-active={currentMode === "manual" ? "true" : "false"}
              data-mode="manual"
              onClick={() => onSetMode("manual")}
              type="button"
              title="Modo manual"
            >
              <span className={styles.modePillDot} style={{ background: "#999" }} />
              Manual
            </button>
            <button
              className={styles.modePill}
              data-active={currentMode === "automatic" ? "true" : "false"}
              data-mode="automatic"
              onClick={() => onSetMode("automatic")}
              type="button"
              title="IA 24/7"
            >
              <span className={styles.modePillDot} style={{ background: "#7c5cff" }} />
              IA 24/7
            </button>
            <button
              className={styles.modePill}
              data-active={currentMode === "scheduled" ? "true" : "false"}
              data-mode="horario"
              onClick={() => onSetMode("scheduled")}
              type="button"
              title="IA Horario"
            >
              <span className={styles.modePillDot} style={{ background: "#ffa500" }} />
              IA Horario
            </button>
          </div>
          <span className={styles.modeStatus}>
            <span className={styles.modeStatusDot} data-mode={statusMode} />
            {statusLabel}
          </span>
          {currentMode === "scheduled" && (
            <div className={styles.scheduleRow}>
              Desde
              <input
                className={styles.scheduleInput}
                type="time"
                value={scheduleStart}
                onChange={(e) => onSetSchedule(e.target.value, scheduleEnd)}
              />
              Hasta
              <input
                className={styles.scheduleInput}
                type="time"
                value={scheduleEnd}
                onChange={(e) => onSetSchedule(scheduleStart, e.target.value)}
              />
            </div>
          )}
        </div>
      </header>

      <div
        ref={messagesAreaRef}
        className={`${styles.messagesArea} messages-area`}
        data-has-tapiz={chatTapiz ? "true" : "false"}
        onScroll={handleMessagesScroll}
        style={messagesAreaStyle}
      >
        <div className={styles.messagesStack}>
          {visibleMessages.map((message) => {
            const messageReaction = messageReactions[String(message.id)];

            return (
              <MessageBubbleItem
                key={message.id}
                message={message}
                messageReaction={messageReaction}
                isJustSent={justSentIds.has(String(message.id))}
                messageDrag={messageDrag}
                bookingSlots={bookingSlots}
                getQuoteAuthor={getQuoteAuthor}
                metaErrorLabel={metaErrorLabel}
                onKeywordChipClick={onKeywordChipClick}
                onTimeChipClick={onTimeChipClick}
                onReply={activateReplyMode}
                onCopyText={copyMessageText}
                onToggleHeart={toggleMessageHeartReaction}
                onPointerCancel={resetMessageDrag}
                onPointerDown={handleMessagePointerDown}
                onPointerMove={handleMessagePointerMove}
                onPointerUp={handleMessagePointerUp}
                renderMediaPreview={renderMediaPreview}
              />
            );
          })}
          {isTyping ? (
            <div className={styles.typingBubble} aria-live="polite">
              <span>Valentina esta escribiendo...</span>
              <span className={styles.typingDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <section className={`${styles.draftPanel} ai-composer`}>
        <div
          aria-label="Redimensionar composer IA"
          aria-orientation="horizontal"
          aria-valuemax={340}
          aria-valuemin={110}
          aria-valuenow={composerHeight}
          className={`${styles.composerResizeHandle} composer-resize-handle`}
          onPointerCancel={handleComposerResizeEnd}
          onPointerDown={handleComposerResizeStart}
          onPointerMove={handleComposerResizeMove}
          onPointerUp={handleComposerResizeEnd}
          role="separator"
          tabIndex={0}
        />
        {quotedReply ? (
          <div className={styles.quotedReplyPreview}>
            <Reply size={12} strokeWidth={1.9} />
            <div>
              <span>Respondiendo a {getQuoteAuthor(quotedReply.type)}</span>
              <p>{quotedReply.text}</p>
            </div>
            <button
              aria-label="Cancelar respuesta citada"
              className={styles.quotedReplyClose}
              onClick={() => setQuotedReply(null)}
              type="button"
            >
              <X size={11} strokeWidth={1.8} />
            </button>
          </div>
        ) : null}

        <div className={[styles.draftBox, stagedMedia.length > 0 ? styles.draftBoxHasResources : ""].join(" ")}>
          {!activeServiceWindow.isOpen ? (
            <div className={styles.serviceWindowNotice}>
              Para escribir fuera de la ventana de 24h debes usar una plantilla aprobada.
            </div>
          ) : null}
          {isBookingDrawerOpen ? (
            <BookingDrawer
              isOpen={isBookingDrawerOpen}
              isClosing={isBookingDrawerClosing}
              isConfirming={isConfirmingBooking}
              detectedService={detectedBookingService}
              activeChatName={activeChatName}
              bookingSlots={bookingSlots}
              bookingStylists={bookingStylists}
              selectedSlot={selectedBookingSlot}
              selectedStylist={selectedBookingStylist}
              onSelectSlot={onSelectBookingSlot}
              onSelectStylist={onSelectBookingStylist}
              onConfirm={onConfirmBooking}
              onClose={onCloseBookingDrawer}
            />
          ) : null}

          <textarea
            ref={draftFieldRef}
            aria-label="Borrador IA"
            className={`${styles.draftCard} ai-draft-textarea`}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={handleDraftKeyDown}
            value={draftText}
          />

          {stagedMedia.length > 0 ? (
            <div className={`${styles.selectedResources} selected-resources`} aria-label="Recursos seleccionados">
              {stagedMedia.map((media) => (
                <article
                  className={`${styles.selectedResourceCard} selected-resource-card`}
                  key={media.id}
                >
                  {media.previewUrl ? (
                    <img
                      alt=""
                      className={`${styles.selectedResourceThumb} selected-resource-thumb`}
                      src={media.previewUrl}
                    />
                  ) : (
                    <div className={`${styles.selectedResourceThumb} ${styles.selectedResourceFileThumb}`}>
                      <FileText size={17} strokeWidth={1.8} />
                    </div>
                  )}
                  <div className={styles.selectedResourceCopy}>
                    <span>Recurso seleccionado</span>
                    <strong>{media.name}</strong>
                    <small>{getSelectedResourceMeta(media)}</small>
                  </div>
                  <button
                    aria-label={`Remove ${media.name}`}
                    className={styles.selectedResourceRemove}
                    onClick={() => removeStagedMedia(media.id)}
                    type="button"
                  >
                    <X size={11} strokeWidth={1.9} />
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          <div className={styles.composerActionBar}>
            <div className={styles.composerToolbar}>
              <button
                aria-label="Adjuntar media"
                className={styles.composerIconButton}
                onClick={attachMedia}
                type="button"
              >
                <Paperclip size={14} strokeWidth={1.8} />
              </button>
              <button
                aria-label="Agendar cita"
                className={styles.composerIconButton}
                onClick={() => openBookingDrawer()}
                type="button"
              >
                <CalendarDays size={14} strokeWidth={1.8} />
              </button>
              <button
                aria-expanded={isEmojiPickerOpen}
                aria-label="Abrir accents de emojis curados"
                className={styles.composerIconButton}
                onClick={toggleCuratedEmojiPicker}
                ref={emojiButtonRef}
                type="button"
              >
                <Smile size={14} strokeWidth={1.8} />
              </button>
              <button
                aria-label="Stickers próximamente"
                className={[styles.composerIconButton, styles.composerSoonButton].join(" ")}
                tabIndex={-1}
                type="button"
              >
                <Sticker size={14} strokeWidth={1.8} />
                <span className={styles.composerTooltip}>Stickers! Próximamente</span>
              </button>
            </div>

            <button
              className={styles.composerSend}
              disabled={isSendingDraft || !activeServiceWindow.isOpen}
              onClick={handleSendDraft}
              type="button"
            >
              <Send size={13} strokeWidth={1.9} />
              <span>Enviar borrador</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          accept="image/*,video/*,application/pdf"
          className={styles.hiddenFileInput}
          multiple
          onChange={handleFileSelected}
          type="file"
        />
      </section>
    </section>
  );
}
