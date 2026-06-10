"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// ── Emoji data (extracted from page.tsx) ──────────────────────────

export const curatedComposerEmojis = [
  "✨", "💇‍♀️", "💆‍♀️", "🌸", "🤍", "🪞", "💖", "🕯️",
  "🥂", "🌿", "☁️", "💅🏻", "🎀", "🧴", "💫", "📅",
  "💜", "🙏🏼", "😊",
];

// ── Hook ─────────────────────────────────────────────────────────

export type EmojiPickerOptions = {
  /** Called when the picker should close — e.g. to restore focus to draft */
  onClose?: (options?: { restoreFocus?: boolean }) => void;
  /** Called when an emoji is selected — receives the emoji string + current draft text */
  onEmojiSelect?: (emoji: string) => void;
};

export function useEmojiPicker(options: EmojiPickerOptions = {}) {
  const { onClose, onEmojiSelect } = options;

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isEmojiPickerClosing, setIsEmojiPickerClosing] = useState(false);
  const [emojiPickerStyle, setEmojiPickerStyle] = useState<CSSProperties | null>(null);

  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiCloseTimerRef = useRef<number | null>(null);

  // ── Position picker below/above emoji button ──────────
  const updateEmojiPickerPosition = useCallback(() => {
    const emojiButton = emojiButtonRef.current;

    if (!emojiButton) {
      return;
    }

    const buttonRect = emojiButton.getBoundingClientRect();
    const pickerWidth = Math.min(244, Math.max(208, window.innerWidth - 24));
    const pickerHeight = emojiPickerRef.current?.offsetHeight ?? 158;
    const viewportPadding = 12;
    const left = Math.min(
      Math.max(buttonRect.left - 16, viewportPadding),
      window.innerWidth - pickerWidth - viewportPadding
    );
    const topAbove = buttonRect.top - pickerHeight - 10;
    const topBelow = buttonRect.bottom + 10;
    const hasRoomAbove = topAbove >= viewportPadding;
    const top = hasRoomAbove
      ? topAbove
      : Math.min(topBelow, window.innerHeight - pickerHeight - viewportPadding);

    setEmojiPickerStyle({
      left,
      top: Math.max(viewportPadding, top),
      width: pickerWidth,
    });
  }, []);

  // ── Close with animation ──────────────────────────────
  const closeCuratedEmojiPicker = useCallback(
    (closeOptions: { restoreFocus?: boolean } = {}) => {
      if (!isEmojiPickerOpen) {
        if (closeOptions.restoreFocus) {
          onClose?.({ restoreFocus: true });
        }
        return;
      }

      if (emojiCloseTimerRef.current) {
        window.clearTimeout(emojiCloseTimerRef.current);
      }

      setIsEmojiPickerClosing(true);
      emojiCloseTimerRef.current = window.setTimeout(() => {
        setIsEmojiPickerOpen(false);
        setIsEmojiPickerClosing(false);
        emojiCloseTimerRef.current = null;

        if (closeOptions.restoreFocus) {
          onClose?.({ restoreFocus: true });
        }
      }, 160);
    },
    [isEmojiPickerOpen, onClose]
  );

  // ── Toggle open/close ────────────────────────────────
  const toggleCuratedEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen((isOpen) => {
      const shouldOpen = !isOpen;

      if (shouldOpen) {
        if (emojiCloseTimerRef.current) {
          window.clearTimeout(emojiCloseTimerRef.current);
          emojiCloseTimerRef.current = null;
        }
        setIsEmojiPickerClosing(false);
        window.requestAnimationFrame(updateEmojiPickerPosition);
      } else {
        window.requestAnimationFrame(() => {
          closeCuratedEmojiPicker();
        });
        return true;
      }

      return shouldOpen;
    });
  }, [closeCuratedEmojiPicker, updateEmojiPickerPosition]);

  // ── Insert emoji into draft ──────────────────────────
  const insertCuratedEmoji = useCallback(
    (emoji: string) => {
      onEmojiSelect?.(emoji);
      closeCuratedEmojiPicker({ restoreFocus: true });
    },
    [onEmojiSelect, closeCuratedEmojiPicker]
  );

  // ── Click-outside + Escape handler ───────────────────
  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return;
    }

    const updatePosition = () => {
      window.requestAnimationFrame(updateEmojiPickerPosition);
    };
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        (emojiPickerRef.current?.contains(target) ||
          emojiButtonRef.current?.contains(target))
      ) {
        return;
      }

      closeCuratedEmojiPicker();
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCuratedEmojiPicker({ restoreFocus: true });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCuratedEmojiPicker, isEmojiPickerOpen, updateEmojiPickerPosition]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (emojiCloseTimerRef.current) {
        window.clearTimeout(emojiCloseTimerRef.current);
      }
    };
  }, []);

  return {
    /** State: whether the emoji picker is visible */
    isEmojiPickerOpen,
    /** State: whether the picker is in closing animation */
    isEmojiPickerClosing,
    /** State: positioned style for the picker element */
    emojiPickerStyle,
    /** Ref: attach to the emoji trigger button */
    emojiButtonRef,
    /** Ref: attach to the picker DOM element */
    emojiPickerRef,
    /** Toggle picker open/closed */
    toggleCuratedEmojiPicker,
    /** Close picker with optional restoreFocus */
    closeCuratedEmojiPicker,
    /** Insert an emoji and close */
    insertCuratedEmoji,
  };
}
