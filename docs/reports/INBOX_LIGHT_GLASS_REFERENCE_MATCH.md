# INBOX Light Glass Reference Match

## Files Changed

- `src/app/inbox/page.tsx`
- `src/app/inbox/inbox.module.css`

## What Was Adjusted

- Refined `/inbox` only to better match the approved Light Glass Theme reference.
- Kept the fixed 4-column viewport layout for sidebar, conversation list, chat, and right rail.
- Enforced the local font stack as `Outfit, Inter, system-ui, sans-serif`.
- Replaced the dark studio message bubble with the approved soft lavender gradient bubble.
- Reduced vertical dead space in the chat body and centered the message stack more naturally.
- Softened the conversation list panel and active thread treatment with pearl/lavender glass states.
- Reduced header action button weight and converted them to smaller soft glass circles.
- Rebuilt the right rail into three lighter cards:
  - Assistance AI
  - Multimedia suggested
  - Quick actions
- Kept invisible scrolling only inside:
  - conversation list
  - messages area
  - right rail

## What Was Preserved

- Global app layout outside `/inbox`
- `/editorial`
- `/analytics`
- `/campaigns`
- `/clients`
- global styles
- global sidebar structure
- existing route structure for `/inbox`

## Screenshot Checklist

- Left sidebar remains unchanged
- Conversation list uses soft glass and compact spacing
- Active thread is lavender, not dark
- Chat header uses smaller circular glass buttons
- Studio reply bubble is soft lavender, not black
- Messages feel centered without large empty gaps
- AI draft remains fixed at the bottom of chat
- Right rail shows three separate cards instead of one text-heavy panel
- No serif fonts visible in `/inbox`
- Body/page does not scroll
- Only conversation list, messages area, and right rail scroll invisibly
