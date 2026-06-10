"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// ── Hook ─────────────────────────────────────────────────────────

export type InboxLayoutOptions = Record<string, never>;

export function useInboxLayout() {
  const [chatTapiz, setChatTapiz] = useState("");

  const messagesAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  // ── Chat tapiz (daily rotating background) ──────────────
  useEffect(() => {
    const tapices = [
      "/img/tapiz-1.png",
      "/img/tapiz-2.png",
      "/img/tapiz-3.png",
    ];

    const today = new Date();
    const todayIndex = today.getDate() % tapices.length;
    setChatTapiz(tapices[todayIndex]);
  }, []);

  // ── Scroll helpers ─────────────────────────────────────
  const isMessagesAreaNearBottom = useCallback(() => {
    const messagesArea = messagesAreaRef.current;

    if (!messagesArea) {
      return true;
    }

    return (
      messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight <
      96
    );
  }, []);

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const messagesArea = messagesAreaRef.current;

      if (!messagesArea) {
        return;
      }

      messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior,
      });
    },
    []
  );

  const handleMessagesScroll = useCallback(() => {
    shouldStickToBottomRef.current = isMessagesAreaNearBottom();
  }, [isMessagesAreaNearBottom]);

  // ── Derived style ──────────────────────────────────────
  const messagesAreaStyle: CSSProperties | undefined = chatTapiz
    ? ({
        "--chat-tapiz": `url("${chatTapiz}")`,
      } as CSSProperties & { "--chat-tapiz": string })
    : undefined;

  return {
    /** State: current chat tapiz image path */
    chatTapiz,
    /** Ref: attach to the messages scroll area */
    messagesAreaRef,
    /** Ref: attach to an element at the bottom of the message list */
    messagesEndRef,
    /** Ref: tracks whether the user is scrolled to the bottom */
    shouldStickToBottomRef,
    /** Style for the messages area (includes tapiz background) */
    messagesAreaStyle,
    /** Scroll to bottom of the messages area */
    scrollMessagesToBottom,
    /** Check if the messages area is near the bottom */
    isMessagesAreaNearBottom,
    /** Call on scroll of the messages area to track stick-to-bottom */
    handleMessagesScroll,
  };
}
