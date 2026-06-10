"use client";

import { Sparkles } from "lucide-react";
import type { FeedTimelineItem, FeedAction } from "../../hooks/inbox/useFeedAnalysis";
import { feedActionLabels } from "../../hooks/inbox/useFeedAnalysis";
import styles from "../../app/inbox/inbox.module.css";

export type { FeedTimelineItem };

export type FeedTimelineCardProps = {
  item: FeedTimelineItem;
  isFirstUnplayed: boolean;
  isCollapsed: boolean;
  onPlayGradient: (itemId: string) => void;
  onInsertReply: (text: string) => void;
  onAskPhoto: () => void;
  onSchedule: () => void;
  onSendReference: () => void;
};

export default function FeedTimelineCard({
  item,
  isFirstUnplayed,
  isCollapsed,
  onPlayGradient,
  onInsertReply,
  onAskPhoto,
  onSchedule,
  onSendReference,
}: FeedTimelineCardProps) {
  const suggestion = item.suggestion;

  const handleActionClick = (action: FeedAction) => {
    if (action === "insert_reply") {
      onInsertReply(suggestion.suggestedReply);
    } else if (action === "ask_photo") {
      onAskPhoto();
    } else if (action === "schedule") {
      onSchedule();
    } else if (action === "send_reference") {
      onSendReference();
    }
  };

  return (
    <section
      key={item.id}
      className={[
        styles.feedCard,
        styles.feedTimelineCard,
        item.isNew ? styles.feedCardNew : "",
        isCollapsed ? styles.feedCardCollapsed : "",
      ].join(" ")}
      data-fresh={item.isNew ? "true" : "false"}
      onClick={() => {
        if (!item.gradientPlayed) {
          onPlayGradient(item.id);
        }
      }}
    >
      <div className={styles.feedCardHeader}>
        <div
          className={[
            styles.feedIcon,
            styles.feedIconActive,
            item.isNew ? styles.feedIconPulse : "",
          ].join(" ")}
        >
          <Sparkles size={14} />
        </div>
        <div className={styles.feedCardCopy}>
          <span className={styles.feedCardLabel}>Sugerencia</span>
          <strong
            className={[
              styles.feedCardTitle,
              isFirstUnplayed ? styles.feedCardTitleGradient : "",
            ].join(" ")}
          >
            {suggestion.label}
          </strong>
        </div>
        <span className={styles.feedTimestamp}>
          {new Date(item.timestamp).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className={styles.feedDetectLabel}>
        Detectado: {suggestion.intent}
      </div>

      <p className={styles.feedCardText}>
        {suggestion.suggestedReply}
      </p>

      <div className={styles.feedActionRow}>
        {suggestion.actions.map((action) => (
          <button
            key={action}
            className={styles.feedActionChip}
            onClick={() => handleActionClick(action)}
            type="button"
          >
            {feedActionLabels[action].label}
          </button>
        ))}
      </div>
    </section>
  );
}
