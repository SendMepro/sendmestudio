"use client";

import { Copy } from "lucide-react";
import type { Conversation } from "../../hooks/inbox/useInboxThreads";
import styles from "../../app/inbox/inbox.module.css";

export type { Conversation };

export type ThreadItemProps = {
  conversation: Conversation;
  isActive: boolean;
  isAnimated: boolean;
  onSelect: (id: Conversation["id"]) => void;
  onCopyPhone: (phone: string) => void;
  setRef: (id: string) => (node: HTMLDivElement | null) => void;
  formatPhone: (phone: string) => string;
};

export default function ThreadItem({
  conversation,
  isActive,
  isAnimated,
  onSelect,
  onCopyPhone,
  setRef,
  formatPhone,
}: ThreadItemProps) {
  return (
    <div
      key={conversation.id}
      className={styles.threadItem}
      data-active={isActive}
      data-arrival={isAnimated ? "true" : "false"}
      data-unread={conversation.unread ? "true" : "false"}
      onClick={() => onSelect(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(conversation.id);
        }
      }}
      ref={setRef(String(conversation.id))}
      role="button"
      tabIndex={0}
    >
      <div className={styles.avatarWrap}>
        <img
          alt={conversation.name}
          className={styles.avatar}
          src={conversation.avatar}
        />
        <span
          className={styles.presenceDot}
          data-online={conversation.activeNow ? "true" : "false"}
          title={conversation.activeNow ? "Activo ahora" : "Desconectado"}
        />
      </div>

      <div className={styles.threadCopy}>
        <div className={styles.threadTopRow}>
          <span className={styles.threadName}>{conversation.name}</span>
          {conversation.mode === "automatic" || (conversation.autoReplyEnabled && !conversation.mode) ? (
            <span className={styles.modeBadge} data-mode="ia">IA</span>
          ) : conversation.mode === "scheduled" ? (
            <span className={styles.modeBadge} data-mode="horario">HORARIO</span>
          ) : conversation.mode === "manual" || (conversation.autoReplyEnabled === false && !conversation.mode) ? (
            <span className={styles.modeBadge} data-mode="manual">MANUAL</span>
          ) : null}
          <span className={styles.threadTime}>
            {conversation.unreadCount ? (
              <span className={styles.threadUnreadBadge}>
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
            {conversation.time}
          </span>
        </div>
        <div className={styles.threadPhoneRow}>
          <span className={styles.threadPhone}>{formatPhone(conversation.phone)}</span>
          <button
            aria-label="Copiar teléfono"
            className={styles.threadPhoneCopy}
            title="Copiar teléfono"
            onClick={(e) => {
              e.stopPropagation();
              onCopyPhone(formatPhone(conversation.phone));
            }}
            type="button"
          >
            <Copy size={9} strokeWidth={1.8} />
          </button>
        </div>
        <p className={styles.threadPreview}>{conversation.lastMsg}</p>
      </div>
    </div>
  );
}
