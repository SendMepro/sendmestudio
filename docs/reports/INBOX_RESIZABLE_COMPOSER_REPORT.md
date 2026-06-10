# Inbox Resizable Composer Report

## Scope

Updated only the `/inbox` chat layout and AI draft composer.

## Changes

- Added `composerHeight` state with a default height of `150px`.
- Added pointer-driven resize behavior from the top edge of the composer.
- Clamped composer height with `Math.min(340, Math.max(110, newHeight))`.
- Connected the chat panel layout to `--composer-height`, so the messages area grows and shrinks automatically.
- Added a visible top resize handle with a subtle horizontal pill and `ns-resize` cursor.
- Kept textarea native resizing disabled and made the draft textarea scroll internally.
- Reduced the chat header row from `72px` to `64px`.
- Tightened message area padding, day chip padding, message gap, and message bubble padding while keeping readable spacing.
- Kept the send button inside the composer.
- Kept message bubble design and right support panel unchanged.

## Files Updated

- `src/app/inbox/page.tsx`
- `src/app/inbox/inbox.module.css`
- `src/app/globals.css`

## Acceptance Notes

- Dragging upward expands the AI composer.
- Dragging downward collapses the AI composer.
- Chat messages resize dynamically with the composer.
- The composer has no native textarea resize affordance.
- The page remains height-bound with only the chat messages area scrolling.
