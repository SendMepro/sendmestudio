"use client";

import { Search, Sparkles, Users, X } from "lucide-react";
import type { CustomerProfile, FeedTimelineItem, FeedAnalyticsState } from "../../hooks/inbox/useFeedAnalysis";
import FeedTimelineCard from "./FeedTimelineCard";
import styles from "../../app/inbox/inbox.module.css";

export type AssistantRailProps = {
  activeId: number | string;
  activeChatName: string;
  feedSearch: string;
  onFeedSearchChange: (value: string) => void;
  onFeedSearchClear: () => void;
  customerProfile: CustomerProfile | null;
  feedAnalysisState: FeedAnalyticsState;
  feedAnalysisLog: string[];
  feedTimeline: FeedTimelineItem[];
  activeFeedSuggestions: { id: string; label: string }[];
  onOpenHelp: () => void;
  onPlayGradient: (itemId: string) => void;
  onInsertReply: (text: string) => void;
  onAskPhoto: () => void;
  onSchedule: () => void;
  onSendReference: () => void;
};

export default function AssistantRail({
  activeId,
  activeChatName,
  feedSearch,
  onFeedSearchChange,
  onFeedSearchClear,
  customerProfile,
  feedAnalysisState,
  feedAnalysisLog,
  feedTimeline,
  activeFeedSuggestions,
  onOpenHelp,
  onPlayGradient,
  onInsertReply,
  onAskPhoto,
  onSchedule,
  onSendReference,
}: AssistantRailProps) {
  return (
    <aside className={styles.assistantRail}>
      <div className={styles.assistantRailScroll}>
        <div className={styles.feedHeader}>
          <div className={styles.feedTitleRow}>
            <span className={styles.feedTitle}>Asistente Feed</span>
            <button
              className={styles.feedHelpBtn}
              onClick={onOpenHelp}
              title="Guía de Asistencia Inteligente"
              type="button"
            >
              <Sparkles size={13} strokeWidth={1.6} />
            </button>
            {feedTimeline.length > 0 ? (
              <span className={styles.feedHint} data-active="true">
                {feedTimeline.length} sugerencia{feedTimeline.length !== 1 ? "s" : ""}
              </span>
            ) : activeFeedSuggestions.length > 0 ? (
              <span className={styles.feedHint}>
                {activeFeedSuggestions.length} sugerencia{activeFeedSuggestions.length !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
          <label className={styles.feedSearch}>
            <Search size={11} strokeWidth={1.8} />
            <input
              aria-label="Buscar en el Asistente Feed"
              className={styles.feedSearchInput}
              onChange={(e) => onFeedSearchChange(e.target.value)}
              placeholder="Buscar asistencia, artículos, productos..."
              value={feedSearch}
            />
            {feedSearch ? (
              <button
                aria-label="Limpiar búsqueda"
                className={styles.feedSearchClear}
                onClick={onFeedSearchClear}
                type="button"
              >
                <X size={10} strokeWidth={1.8} />
              </button>
            ) : null}
          </label>
        </div>

        {customerProfile ? (
          <section className={styles.feedCard}>
            <div className={styles.feedCardHeader}>
              <div className={styles.feedIcon}>
                <Users size={14} />
              </div>
              <div className={styles.feedCardCopy}>
                <span className={styles.feedCardLabel}>Cliente</span>
                <strong className={styles.feedCardTitle}>{customerProfile.displayName ?? activeChatName}</strong>
              </div>
              <span className={styles.feedPill}>{customerProfile.lifecycleStage}</span>
            </div>
            <p className={styles.feedCardText}>
              {customerProfile.requestedServices.length > 0
                ? `Interés: ${customerProfile.requestedServices.join(", ")}`
                : "Sin intención registrada todavía."}
            </p>
          </section>
        ) : null}

        {feedAnalysisState === "analyzing" ? (
          <div className={styles.feedAnalysisLog}>
            {feedAnalysisLog.map((line, i) => (
              <span key={i} className={styles.feedAnalysisLine}>
                {line}
                {i === feedAnalysisLog.length - 1 && line.length > 0 && line.length < 30 ? (
                  <span className={styles.feedAnalysisCursor}>▌</span>
                ) : null}
              </span>
            ))}
          </div>
        ) : feedAnalysisState === "ready" ? (
          <div className={styles.feedAnalysisLog} data-ready="true">
            {feedAnalysisLog.map((line, i) => (
              <span key={i} className={styles.feedAnalysisLine}>
                {line}
              </span>
            ))}
          </div>
        ) : null}

        {(() => {
          const search = feedSearch.toLowerCase().trim();
          const filteredItems = search
            ? feedTimeline.filter((item) => {
                const suggestion = item.suggestion;
                const haystack = [
                  suggestion.label,
                  suggestion.intent,
                  suggestion.suggestedReply,
                  ...suggestion.intentKeywords,
                  ...suggestion.actions,
                ].join(" ").toLowerCase();
                return haystack.includes(search);
              })
            : feedTimeline;

          if (search && filteredItems.length === 0) {
            return (
              <div className={styles.feedNoResults}>
                No se encontraron coincidencias
              </div>
            );
          }

          return filteredItems.map((item, index) => {
            const isFirstUnplayed = index === 0 && !item.gradientPlayed;
            const isCollapsed = filteredItems.length > 5 && index >= 5;

            return (
              <FeedTimelineCard
                key={item.id}
                item={item}
                isFirstUnplayed={isFirstUnplayed}
                isCollapsed={isCollapsed}
                onPlayGradient={onPlayGradient}
                onInsertReply={onInsertReply}
                onAskPhoto={onAskPhoto}
                onSchedule={onSchedule}
                onSendReference={onSendReference}
              />
            );
          });
        })()}

        {!feedSearch && feedTimeline.length === 0 && feedAnalysisState === "idle" && !customerProfile ? (
          <div className={styles.feedEmpty}>
            <div className={styles.feedEmptyIcon}>
              <Sparkles size={18} />
            </div>
            <p className={styles.feedEmptyText}>
              {activeId
                ? "No hay sugerencias todavía."
                : "Selecciona una conversación para ver sugerencias del Asistente Feed."}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
