"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Conversation type used by the InboxPage.
 * This is a partial extraction — the full type is defined in page.tsx.
 */
type Conversation = {
  id: number | string;
  name: string;
  phone: string;
  recipient?: string;
  autoReplyEnabled?: boolean;
  mode?: string;
  lastInboundAt?: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  activeNow?: boolean;
  avatar: string;
};

export type SelectConversationOptions = {
  manual?: boolean;
};

export type UseInboxSelectionResult = {
  /** The currently selected conversation ID */
  activeId: number | string;
  /** Ref keeping the activeId in sync for use inside closures */
  activeIdRef: React.MutableRefObject<number | string>;
  /** Ref tracking whether the user manually selected a conversation */
  userSelectedConversationRef: React.MutableRefObject<boolean>;
  /** The currently active conversation object (derived from threads + activeId) */
  activeChat: Conversation;
  /** Select a conversation by ID, optionally marking it as a manual selection */
  selectConversation: (
    conversationId: Conversation["id"],
    options?: SelectConversationOptions
  ) => void;
};

/**
 * Extracts inbox conversation selection state and handlers.
 *
 * Manages:
 * - activeId (which conversation is currently selected)
 * - activeIdRef (ref mirror for closure safety)
 * - userSelectedConversationRef (tracks manual vs automatic selection)
 * - activeChat (derived from threads + activeId)
 * - selectConversation handler
 *
 * @param threads - The current list of conversations from the parent.
 * @param setThreads - State setter for threads (needed to clear unread on selection).
 */
export function useInboxSelection(
  threads: Conversation[],
  setThreads: React.Dispatch<React.SetStateAction<Conversation[]>>
): UseInboxSelectionResult {
  const [activeId, setActiveId] = useState<number | string>(1);
  const activeIdRef = useRef<number | string>(1);
  const userSelectedConversationRef = useRef(false);

  const activeChat = useMemo(
    () =>
      threads.find((conversation) => conversation.id === activeId) ??
      threads[0] ?? {
        id: 0,
        name: "",
        phone: "",
        lastMsg: "",
        time: "",
        unread: false,
        unreadCount: 0,
        activeNow: false,
        avatar: "",
      },
    [threads, activeId]
  );

  const selectConversation = useCallback(
    (
      conversationId: Conversation["id"],
      options: SelectConversationOptions = {}
    ) => {
      if (options.manual) {
        userSelectedConversationRef.current = true;
      }

      activeIdRef.current = conversationId;
      setActiveId(conversationId);
      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          String(thread.id) === String(conversationId)
            ? { ...thread, unread: false, unreadCount: 0, activeNow: true }
            : thread
        )
      );
    },
    [setThreads]
  );

  return {
    activeId,
    activeIdRef,
    userSelectedConversationRef,
    activeChat,
    selectConversation,
  };
}
