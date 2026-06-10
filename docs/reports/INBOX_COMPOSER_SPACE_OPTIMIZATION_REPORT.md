# Inbox Composer Space Optimization Report

## Scope

Optimized only the `/inbox` chat composer layout to reduce vertical waste and give the conversation area more usable height.

## Changes

- Changed the chat panel rows to `72px minmax(0, 1fr) auto` so the message list takes the available height and the composer only uses the space it needs.
- Rebuilt the AI draft area as a compact draft box with the textarea, footer toolbar, reply context, and send action inside the same input container.
- Moved `Send draft` into the input area on the lower right.
- Replaced the separate `Edit` action row with compact icon controls for attach and edit in the input footer.
- Reduced composer padding, textarea height, and bottom spacing while preserving the luxury glass styling.
- Kept the right support rail and message bubble styling unchanged.

## Files Updated

- `src/app/inbox/page.tsx`
- `src/app/inbox/inbox.module.css`
- `src/app/globals.css`

## Acceptance Notes

- The composer no longer reserves a tall fixed bottom block.
- The conversation viewport gains vertical space because the composer now sizes to compact content.
- The send action lives inside the input container.
- Attach, edit, and reply context live in the input footer toolbar.
