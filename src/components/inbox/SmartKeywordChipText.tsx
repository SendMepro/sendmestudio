"use client";

import type { FeedSuggestion, DetectedTime } from "../../hooks/inbox/useFeedAnalysis";
import { keywordIndex, detectTimes, isTimeSlotAvailable } from "../../hooks/inbox/useFeedAnalysis";
import type { BookingSlot } from "../../hooks/inbox/useBooking";
import styles from "../../app/inbox/inbox.module.css";

export default function SmartKeywordChipText({
  text,
  onChipClick,
  onTimeChipClick,
  bookingSlots,
}: {
  text: string;
  onChipClick: (suggestion: FeedSuggestion, matchedKeyword: string) => void;
  onTimeChipClick: (timeStr: string, dayStr: string | undefined, isAvailable: boolean) => void;
  bookingSlots: BookingSlot[];
}) {
  // Detect time patterns
  const detectedTimes = detectTimes(text);

  // Build regex that matches any service keyword (longest match first)
  const sortedKeywords = [...keywordIndex.keys()].sort((a, b) => b.length - a.length);
  const hasKeywords = sortedKeywords.length > 0;

  // Build a combined regex for both service keywords and time patterns
  // Escape keywords, and add time patterns as alternations
  let patterns: { re: RegExp; type: "keyword" | "time" }[] = [];

  if (hasKeywords) {
    const escaped = sortedKeywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    patterns.push({
      re: new RegExp(`(${escaped.join("|")})`, "gi"),
      type: "keyword",
    });
  }

  // Add time patterns (capture each detected time)
  if (detectedTimes.length > 0) {
    const timePatterns = detectedTimes.map((dt) => dt.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    patterns.push({
      re: new RegExp(`(${timePatterns.join("|")})`, "gi"),
      type: "time",
    });
  }

  if (patterns.length === 0) {
    return <p className={styles.messageText}>{text}</p>;
  }

  // Combine patterns: we need a single regex that matches all patterns
  const allPatterns = patterns.flatMap((p) => {
    // Extract the inner pattern from the capturing group
    const src = p.re.source;
    const inner = src.replace(/^\((.*)\)$/i, "$1");
    return inner;
  });

  const combinedRe = new RegExp(`(${allPatterns.join("|")})`, "gi");

  // Build a lookup for detected times by their exact text
  const timeLookup = new Map<string, DetectedTime>();
  for (const dt of detectedTimes) {
    timeLookup.set(dt.fullMatch.toLowerCase(), dt);
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRe.exec(text)) !== null) {
    const matchedText = match[0];
    const matchStart = match.index;

    // Add text before this match
    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    const matchedLower = matchedText.toLowerCase();

    // Check if it's a time match first (time patterns take priority)
    const timeInfo = timeLookup.get(matchedLower);
    if (timeInfo) {
      const isAvailable = isTimeSlotAvailable(timeInfo.timeStr, bookingSlots);
      parts.push(
        <button
          key={`chip-${matchStart}`}
          className={`${styles.smartKeywordChip} ${isAvailable ? styles.smartTimeChipAvailable : styles.smartTimeChipUnavailable}`}
          onClick={(e) => {
            e.stopPropagation();
            onTimeChipClick(timeInfo.timeStr, timeInfo.dayStr, isAvailable);
          }}
          type="button"
        >
          {matchedText}
        </button>
      );
    } else {
      // Check if it's a service keyword
      const suggestion = keywordIndex.get(matchedLower);
      if (suggestion) {
        parts.push(
          <button
            key={`chip-${matchStart}`}
            className={styles.smartKeywordChip}
            onClick={(e) => {
              e.stopPropagation();
              onChipClick(suggestion, matchedText);
            }}
            type="button"
          >
            {matchedText}
          </button>
        );
      } else {
        parts.push(matchedText);
      }
    }

    lastIndex = matchStart + matchedText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no chips were inserted, return plain <p>
  const hasChips = parts.some(
    (part) => typeof part !== "string"
  );

  if (!hasChips) {
    return <p className={styles.messageText}>{text}</p>;
  }

  return <p className={`${styles.messageText} ${styles.messageTextWithChips}`}>{parts}</p>;
}
