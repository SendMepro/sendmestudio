# Inbox Functionality Fix Report

## Summary

Fixed `/inbox` usability without redesigning the page.

## Fixes

- Conversation area now has the required scroll constraints:
  - `min-height: 0`
  - `overflow-y: auto`
  - `overflow-x: hidden`
  - hidden scrollbar styling
- Chat panel now uses:
  - `height: calc(100dvh - 28px)`
  - `grid-template-rows: 72px minmax(0, 1fr) auto`
  - `overflow: hidden`
- AI Draft is now an editable controlled textarea.
- `Edit` focuses the draft field.
- `Apply response` copies the suggested AI response into the draft field and focuses it.
- `Attach media` opens a hidden file input accepting image, video, and PDF files.
- Selected file media is staged under the draft as `Selected media`.
- Clicking the suggested media card stages `Signature Balayage finish`.
- `Send draft` appends a studio message with draft text and staged media, then clears draft and staged media.
- Messages auto-scroll to bottom after send.

## Browser Verification

- `.messages-area` computed `overflow-y`: `auto`
- `.messages-area` computed `overflow-x`: `hidden`
- `.chat-panel` rows measured as `72px 395px 225px`
- `Edit` focused `AI draft`
- `Apply response` restored the AI response and focused `AI draft`
- Suggested media staged successfully
- `Send draft` appended a right-side studio message
- Sent message included `Signature Balayage finish`
- Draft cleared after send
- Staged media cleared after send
- Distance from scroll bottom after send: `0`

## Files Changed

- `src/app/inbox/page.tsx`
- `src/app/inbox/inbox.module.css`

## Build Note

`npm run build` still reaches the Next.js production compile, then stops on the existing unrelated `GPUDevice` type error in `liquid-glass-studio-main/src/App.tsx`.
