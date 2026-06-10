# Checkpoint 47: Extract `useWhatsAppMessages` + `useRealtimeEvents`

> **Phase H-1 | Extraction report**
> Completed: 2026-05-30

---

## Summary

Extracted two hooks from `src/app/inbox/page.tsx`:

| Hook | File | Lines | Exported API |
|------|------|-------|-------------|
| `useWhatsAppMessages` | `src/hooks/inbox/useWhatsAppMessages.ts` | 806 | State + 11 CRUD/display functions + refs |
| `useRealtimeEvents` | `src/hooks/inbox/useRealtimeEvents.ts` | 261 | 1 composable hook (no return value) |

**Net reduction**: `page.tsx` reduced by ~540 lines.

## What was moved to `useWhatsAppMessages`

### State
- `messagesByConversation` / `setMessagesByConversation`
- `loadedConversationIds` / `setLoadedConversationIds`

### Refs
- `lastWhatsAppMessageIdsRef`
- `localMessageIdRef`

### Functions
| Function | Description |
|----------|-------------|
| `syncWhatsAppThreads` | Syncs thread list from WhatsApp conversation data, handles sorting, arrival animation triggering, auto-selection |
| `displayStatusFor` | Determines display status with "failed→sent" overrides for outbound messages with waMessageId |
| `mediaPreviewForWhatsAppMessage` | Builds `StagedMedia[]` from WhatsApp media message |
| `displayTextForWhatsAppMessage` | Extracts display text with media fallback handling |
| `upsertWhatsAppMessages` | Core upsert into `messagesByConversation` store, fires `onAutoReplyDraft` callback |
| `appendWhatsAppMessages` | Combines `syncWhatsAppThreads` + `upsertWhatsAppMessages` |
| `loadConversationMessages` | Async fetch from `/api/whatsapp/messages`, handles replace/append, updates `loadedConversationIds` |
| `updateMessageStatus` | Updates message status across all conversations |
| `formatWhatsAppTimestamp` | Formats Unix timestamp to localized time string |
| `metaErrorLabel` | Builds error label string from message metadata |
| `updateOptimisticMessage` | Partial update of a message by ID for active conversation |
| `updateOptimisticStatus` | Convenience wrapper around `updateOptimisticMessage` |
| `fallbackAvatarFor` | Generates DiceBear initials avatar URL |

### Design decisions

- **Callbacks for cross-cutting side effects**: `syncWhatsAppThreads` accepts `onMarkThreadArrival` (animation callback), `upsertWhatsAppMessages` accepts `onAutoReplyDraft` (composer callback). This keeps the hook pure of animation/composer state while enabling `handleRealtimeEvent` to wire through these effects.
- **Accepts `activeId`, `activeIdRef`, `userSelectedConversationRef`, `selectConversation`, `setThreads` as parameters**: These come from the parent and other hooks (like `useInboxSelection`).
- **Version diff from original**: The `mediaPreviewForWhatsAppMessage` in the hook uses a slightly different implementation from the original — the hook version is the **newer** version that includes `assetError` handling and better media type naming (Spanish labels like "Imagen enviada por WhatsApp"). The original version in page.tsx had the older simpler implementation. The hook captures the latest version.

## What was moved to `useRealtimeEvents`

### Effects
- **Polling effect** (line 2861–2884 original): Polls `loadConversationMessages` every 2000ms for active conversation
- **SSE/EventSource effect** (line 2886–2919 original): Connects to `/api/whatsapp/events`, listens for 9 event types, dispatches to `handleRealtimeEvent`

### Parameters
| Param | Source |
|-------|--------|
| `activeId` | From `useInboxSelection` |
| `lastWhatsAppMessageIdsRef` | From `useWhatsAppMessages` |
| `loadConversationMessages` | From `useWhatsAppMessages` |
| `handleRealtimeEvent` | From page.tsx (wraps message + composer + feed dispatch) |

### Design decisions
- **`handleRealtimeEvent` stays in page.tsx**: It dispatches to `setDraftText`, `setCopyToast`, `setIsTyping`, `regenerateAiDraft`, `handleIncomingMessage` — all composer/UI state not yet extracted. It will be extracted in a later checkpoint when `useInboxComposer` is ready (checkpoint 49).
- **Configurable polling interval and SSE endpoint**: Exposed as optional params with sensible defaults.
- **Pure infrastructure hook**: Returns nothing; all effects are self-contained.

## What was removed from page.tsx

- `const initialMessages` (1 line)
- `const fallbackAvatarFor` (~2 lines)
- `const syncWhatsAppThreads` (~90 lines)
- `const displayStatusFor` (~22 lines)
- `const mediaPreviewForWhatsAppMessage` (~45 lines)
- `const displayTextForWhatsAppMessage` (~24 lines)
- `const upsertWhatsAppMessages` (~80 lines)
- `const appendWhatsAppMessages` (~8 lines)
- `const loadConversationMessages` (~80 lines)
- `const updateMessageStatus` (~20 lines)
- `const formatWhatsAppTimestamp` (~6 lines)
- `const metaErrorLabel` (~18 lines)
- `const updateOptimisticMessage` (~12 lines)
- `const updateOptimisticStatus` (~16 lines)
- Polling `useEffect` (~24 lines)
- SSE `useEffect` (~34 lines)
- State declarations for `messagesByConversation`, `loadedConversationIds`, `lastWhatsAppMessageIdsRef`, `localMessageIdRef` (~6 lines)

## What stayed in page.tsx

- `handleRealtimeEvent` (still calls `appendWhatsAppMessages`, `syncWhatsAppThreads`, `updateMessageStatus` etc. which now come from the hook via closure)
- `markThreadArrival` (animation state management)
- `setThreadItemRef` (DOM ref management)
- `formatThreadTimestamp` (thread-level timestamp formatting)
- `regenerateAiDraft` (composer logic, not yet extracted)
- `sendWhatsAppMessage` (message sending logic)
- All composer, feed, booking, emoji state and handlers

## TypeScript Verification

**Before**: 2 errors
**After**: 2 errors (same 2)

| Error | Location | Status |
|-------|----------|--------|
| `TS2322: (node: HTMLButtonElement) => void` not assignable to `Ref<HTMLDivElement>` | `page.tsx:2959` | **Pre-existing** — mismatched ref type on div with role="button" |
| `TS2345: FlowAppointment` missing properties | `page.tsx(1253,39)` | **Pre-existing** — unrelated to inbox |

## Risk Mitigation

| Risk | Status |
|------|--------|
| **R1**: Broken SSE/polling during hook extraction | **Mitigated** — extracted together into `useRealtimeEvents`, same effect structure preserved |
| **R2**: Optimistic message state lost | **Mitigated** — `localMessageIdRef` and `lastWhatsAppMessageIdsRef` are stable refs inside `useWhatsAppMessages` |
| **R6**: Overlapping state between hooks | **Clean** — `messagesByConversation` and `loadedConversationIds` owned solely by `useWhatsAppMessages` |
