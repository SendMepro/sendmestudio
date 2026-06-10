# Checkpoint 48 (H4): Extract `useInboxThreads`

> **Phase H-1 | Extraction report**
> Completed: 2026-05-30

---

## Summary

Extracted thread data management from `src/app/inbox/page.tsx` into a dedicated hook.

| Hook | File | Lines | Exported API |
|------|------|-------|-------------|
| `useInboxThreads` | `src/hooks/inbox/useInboxThreads.ts` | 109 | 4 return values |

**Net reduction**: `page.tsx` reduced by ~55 lines.

---

## What was moved

| Item | Type | Lines Removed |
|------|------|--------------|
| `Conversation` type | Type definition | ~14 |
| `initialConversations` | Module-level constant (~3 seed threads) | ~32 |
| `threads` / `setThreads` | `useState` declaration | ~1 (replaced by hook call) |
| `browserUnreadCount` | `useMemo` derivation (`threads.reduce(...)`) | ~1 (replaced by hook) |
| `formatThreadTimestamp` | Arrow function (timestamp formatting) | ~6 |

### Hook return values

```typescript
export type UseInboxThreadsResult = {
  threads: Conversation[];                   // The thread list
  setThreads: React.Dispatch<...>;           // Thread list setter
  browserUnreadCount: number;                // Total unread count
  formatThreadTimestamp: (ts: string) => string;  // Timestamp formatter
};
```

---

## What stayed in page.tsx

These items are **UI animation state** and are NOT thread management — they belong to animation/layout concerns that will be extracted to `useInboxLayout` later:

| Item | Purpose |
|------|---------|
| `animatedThreadIds` / `setAnimatedThreadIds` | Animation state for thread arrival |
| `threadItemRefs` | DOM refs for FLIP animation |
| `threadAnimationTimersRef` | Animation timer cleanup refs |
| `previousThreadRectsRef` | FLIP animation rect tracking |
| `markThreadArrival` | Animates thread arrival |
| `setThreadItemRef` | DOM ref callback for thread items |
| `useEffect` for `setUnreadMessagesCount` | Side effect using browser badge |
| `useLayoutEffect` for FLIP animation | Thread list animation |

---

## Data flow

```
useInboxThreads()
  └─ { threads, setThreads, browserUnreadCount, formatThreadTimestamp }
       │
       ├── useInboxSelection(threads, setThreads)
       │     └─ { activeId, activeChat, selectConversation, ... }
       │
       ├── useWhatsAppMessages(activeId, ..., selectConversation, setThreads)
       │     └─ (syncWhatsAppThreads internally calls setThreads)
       │
       ├── JSX: {threads.length} activos
       ├── JSX: threads.map(...)    (conversation list render)
       └── useEffect: setUnreadMessagesCount(browserUnreadCount)
```

---

## TypeScript Verification

**Before**: 2 errors
**After**: 2 errors (same 2, pre-existing)

| Error | Location | Status |
|-------|----------|--------|
| `TS2322: setThreadItemRef` div/button mismatch | `page.tsx:2909` | **Pre-existing** |
| `TS2345: FlowAppointment` missing properties | `page.tsx(1253,39)` | **Pre-existing** |

---

## Risk Assessment

| Risk | Status |
|------|--------|
| Broken thread list rendering | Low — pure data extraction, same state shape |
| Broken unread badge | Low — `browserUnreadCount` is same derivation, just relocated |
| Broken thread timestamp formatting | Low — `formatThreadTimestamp` is pure function |
| Thread animation broken | **Not affected** — all animation state/refs stayed in page.tsx |
| Selection broken | Low — `useInboxSelection` receives same `threads`/`setThreads` |
| Thread sync broken | Low — `setThreads` is the same function reference, passed to `useWhatsAppMessages` |
