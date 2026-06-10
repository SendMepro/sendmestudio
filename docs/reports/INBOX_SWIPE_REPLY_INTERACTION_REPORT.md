# Inbox Swipe Reply Interaction Report

## Scope

Applied only to `/inbox` chat message bubbles.

## Changes

- Added interactive cursor treatment for `.message-bubble`:
  - `cursor: pointer`
  - `touch-action: pan-y`
  - `user-select: none`
- Added horizontal drag/swipe reply support for mouse and touch via pointer events.
- Bubble now moves slightly to the right while dragging.
- Visual drag movement is capped at `72px`.
- Swipe threshold is `48px`.
- Bubble snaps back to its original position after release.
- Added a small reply arrow indicator while dragging.
- Preserved vertical scroll by only preventing default behavior once horizontal movement is dominant.
- Desktop reply fallback remains available through the inline reply icon.
- Reply preview now uses the client first name:
  - `Replying to Valentina`
  - repeated quoted message text
  - close button

## Verification

Browser verified on `/inbox`:

- Found 3 chat bubbles and 3 reply buttons.
- Confirmed first bubble computed styles:
  - `cursor: pointer`
  - `touch-action: pan-y`
  - `user-select: none`
- Dragged a message horizontally to the right.
- Confirmed reply preview appears above AI Draft.
- Confirmed preview text:
  - `Replying to Valentina`
  - `"Perfecto, agendado para el jueves. Debo llevar algo preparado?"`
- Confirmed focus moves to `AI draft`.
- Confirmed no bubble remains displaced after release:
  - no `data-dragging="true"` bubbles
  - computed transform returns to `none`

## Build Status

`npm.cmd run build` compiled the Next.js bundle successfully, then failed on an unrelated existing TypeScript issue:

`liquid-glass-studio-main/src/App.tsx:260` cannot find name `GPUDevice`.
