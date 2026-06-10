# Inbox Selected Resource Composer Fix

## Scope

Fixed contextual resource insertion only in `/inbox`.

## Changes

- Conversation Support Feed media now inserts as a structured selected resource card instead of opening a raw upload flow.
- Uploaded files from the composer attach control still stage as attachments.
- Both support resources and uploaded files render in the same clean selected resources row.
- Selected resource cards include a thumbnail, title, resource type/count metadata, and a remove button.
- Moved selected resources into the draft input container in normal layout flow, below the textarea and above the composer toolbar.
- Moved quoted reply preview above the draft textarea.
- Converted composer toolbar and send button from absolute positioning into a normal footer row to prevent overlap.
- Made the draft box scroll internally when selected resources need more room.

## Files Updated

- `src/app/inbox/page.tsx`
- `src/app/inbox/inbox.module.css`

## Acceptance Notes

- Selected resources are visibly structured and readable.
- Draft text remains readable and is not covered by thumbnails or controls.
- Support assets are clear as reply resources, not raw floating uploads.
- Send Draft still sends the text and selected staged resources together.
