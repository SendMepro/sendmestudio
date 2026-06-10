"use client";

import { useMemo, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────

export type Conversation = {
  id: number | string;
  name: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled?: boolean;
  /** "manual" | "automatic" | "scheduled" | undefined */
  mode?: string;
  lastInboundAt?: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  activeNow?: boolean;
  avatar: string;
};

// ── Initial data ───────────────────────────────────────────────────

const initialConversations: Conversation[] = [];

// ── Return type ────────────────────────────────────────────────────

export type UseInboxThreadsResult = {
  /** The current thread (conversation) list */
  threads: Conversation[];
  /** Setter for the thread list */
  setThreads: React.Dispatch<React.SetStateAction<Conversation[]>>;
  /** Total unread count across all conversations (for browser badge) */
  browserUnreadCount: number;
  /** Format a Unix timestamp to a display time string for thread items */
  formatThreadTimestamp: (timestamp: string) => string;
};

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Manages inbox thread (conversation list) data and derived values.
 *
 * Owns:
 * - threads state (the conversation list)
 * - initialConversations data (seed data for new inbox)
 * - browserUnreadCount (total unread count across threads)
 * - formatThreadTimestamp (timestamp formatting for thread items)
 *
 * Does NOT own:
 * - UI animation state (animatedThreadIds, threadAnimationTimersRef, etc.)
 * - Selection state (activeId, activeChat — managed by useInboxSelection)
 * - DOM refs for animation (threadItemRefs, previousThreadRectsRef)
 *
 * This is a pure data-hook: no side effects, no animation logic.
 */
export function useInboxThreads(): UseInboxThreadsResult {
  const [threads, setThreads] = useState<Conversation[]>(initialConversations);

  const browserUnreadCount = useMemo(
    () => threads.reduce((total, thread) => total + (thread.unreadCount ?? 0), 0),
    [threads]
  );

  const formatThreadTimestamp = (timestamp: string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(Number(timestamp) * 1000));

  return {
    threads,
    setThreads,
    browserUnreadCount,
    formatThreadTimestamp,
  };
}
