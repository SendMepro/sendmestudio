"use client";

import { createPortal } from "react-dom";
import { curatedComposerEmojis } from "../../hooks/inbox/useEmojiPicker";
import styles from "../../app/inbox/inbox.module.css";

export type CuratedEmojiPickerProps = {
  isOpen: boolean;
  isClosing: boolean;
  style: React.CSSProperties;
  pickerRef: React.RefObject<HTMLDivElement | null>;
  onEmojiSelect: (emoji: string) => void;
};

export default function CuratedEmojiPicker({
  isOpen,
  isClosing,
  style,
  pickerRef,
  onEmojiSelect,
}: CuratedEmojiPickerProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-label="Emojis curados del salón"
      className={styles.curatedEmojiPicker}
      data-closing={isClosing ? "true" : "false"}
      ref={pickerRef}
      role="menu"
      style={style}
    >
      <div className={styles.curatedEmojiHeader}>
        <span>Accentos concierge</span>
      </div>
      <div className={styles.curatedEmojiGrid}>
        {curatedComposerEmojis.map((emoji) => (
          <button
            aria-label={`Insertar ${emoji}`}
            className={styles.curatedEmojiButton}
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
