# Inbox UI Extraction Plan

> **Status: ✅ COMPLETED** — All 19 checkpoints CP-45 through CP-59 executed
> Generated: 2026-05-30
> Completed: 2026-05-30
> Final page.tsx: 1,516 lines (from 2,617 → 42.1% reduction)
> New files created: 21 (9 hooks, 12 components)
> Final audit: See [INBOX_AUDIT_REPORT.md](./INBOX_AUDIT_REPORT.md)

---

## 1. Largest JSX Sections

Measured by semantic block boundaries within the `return` of `InboxPage` (lines 3374–4376).

| Rank | Section | Lines | % of JSX | Description |
|------|---------|-------|----------|-------------|
| 1 | **Chat Panel** (header + messages + draft/composer) | ~418 | ~42% | Lines 3515–3933: Chat header, messages area, typing indicator, draft panel, resize handle, quoted reply, media preview, composer toolbar, booking drawer |
| 2 | **Assistant Rail / Feed** | ~222 | ~22% | Lines 3935–4157: Feed header with search, customer profile card, analysis log, timeline cards, empty state |
| 3 | **Conversations Panel** (sidebar) | ~129 | ~13% | Lines 3384–3513: Hero image, banner footer, panel header with logo/search, conversation list (thread items) |
| 4 | **Help Modal** | ~156 | ~16% | Lines 4169–4325: Overlay, modal with sections, divider, example log |
| 5 | **Lightbox** | ~13 | ~1% | Lines 4327–4340: Image gallery overlay |
| 6 | **Emoji Picker Portal** | ~29 | ~3% | Lines 4344–4373: Portal with curated emoji grid |
| 7 | **Toast / Mode Toast** | ~10 | ~1% | Lines 4341–4342: Two floating toast elements |

**Total JSX**: ~977 lines (range 970–1000)

---

## 2. Component Candidates

### Primary (major layout sections)

| ID | Candidate | Current Lines | New File | CSS | Type |
|----|-----------|--------------|----------|-----|------|
| C1 | `ConversationsPanel` | 129 | `src/components/inbox/ConversationsPanel.tsx` | `inbox.module.css` | **Page section** |
| C2 | `ChatPanel` | 418 | `src/components/inbox/ChatPanel.tsx` | `inbox.module.css` | **Page section** |
| C3 | `AssistantRail` | 222 | `src/components/inbox/AssistantRail.tsx` | `inbox.module.css` | **Page section** |

### Secondary (embedded UI)

| ID | Candidate | Current Lines | New File | CSS | Type |
|----|-----------|--------------|----------|-----|------|
| C4 | `SmartKeywordChipText` | 131 | `src/components/inbox/SmartKeywordChipText.tsx` | `inbox.module.css` | **Leaf component** |
| C5 | `FeedTimelineCard` | 96 | `src/components/inbox/FeedTimelineCard.tsx` | `inbox.module.css` | **Leaf component** |
| C6 | `BookingDrawer` | 79 | `src/components/inbox/BookingDrawer.tsx` | `inbox.module.css` | **Leaf component** |
| C7 | `HelpModal` | 156 | `src/components/inbox/HelpModal.tsx` | `inbox.module.css` | **Overlay modal** |
| C8 | `CuratedEmojiPicker` | 29 | `src/components/inbox/CuratedEmojiPicker.tsx` | `inbox.module.css` | **Overlay/portal** |
| C9 | `Lightbox` | 13 | `src/components/inbox/Lightbox.tsx` | `inbox.module.css` | **Overlay** |
| C10 | `ThreadItem` | ~50 | `src/components/inbox/ThreadItem.tsx` | `inbox.module.css` | **Leaf component** (inside ConversationsPanel map) |
| C11 | `MessageBubbleItem` | ~120 | `src/components/inbox/MessageBubbleItem.tsx` | `inbox.module.css` | **Leaf component** (inside ChatPanel map) |
| C12 | `InboxToast` | 10 | `src/components/inbox/InboxToast.tsx` | `inbox.module.css` | **Utility overlay** |

### Hook Candidates

| ID | Candidate | Logic Extracted | Est. Lines Removed |
|----|-----------|----------------|--------------------|
| H1 | `useWhatsAppMessages` | Polling, SSE event handling, message CRUD, optimistic updates, status tracking, thread sync | ~500 |
| H2 | `useFeedAnalysis` | feedTimeline, feedAnalysisState, typewriter effect, keyword detection, chip selection | ~350 |
| H3 | `useInboxComposer` | Draft text, staged media, quoted reply, send logic, service window, emoji picker | ~300 |
| H4 | `useBooking` | Availability fetch, slot/stylist selection, booking confirmation, drawer open/close | ~200 |
| H5 | `useRealtimeEvents` | EventSource setup, event routing to message/composer/feed/booking handlers | ~150 |
| H6 | `useEmojiPicker` | Open/close, positioning, portal management, keyboard/click handlers | ~80 |
| H7 | `useInboxThreads` | Thread list management, active selection, unread counts, arrival animations | ~250 |
| H8 | `useInboxLayout` | Composer resize, chat tapiz, scroll management, thread layout animation | ~80 |

---

## 3. Estimated Props Per Component

### Major Section Components

| Component | Props | Est. Count |
|-----------|-------|-----------|
| **`ConversationsPanel`** | `threads`, `activeId`, `onSelectConversation`, `onCopyPhone` | **4** |
| **`ChatPanel`** | `activeChat`, `messages`, `stagedMedia`, `draftText`, `bookingAvailability`, `selectedBookingSlot`, `selectedBookingStylist`, `customerProfile`, `feedTimeline`, + callbacks (~18) | **~28** (will reduce after hooks extraction) |
| **`AssistantRail`** | `customerProfile`, `feedTimeline`, `feedAnalysisState`, `feedAnalysisLog`, `feedSearch`, `activeFeedSuggestions`, + callbacks (~8) | **~14** |

### Leaf Components

| Component | Props | Est. Count |
|-----------|-------|-----------|
| **`SmartKeywordChipText`** | `text`, `onChipClick`, `onTimeChipClick`, `bookingSlots` | **4** |
| **`FeedTimelineCard`** | `item`, `onInsertReply`, `onAskPhoto`, `onSchedule`, `onSendReference`, `onDismiss` | **6** |
| **`BookingDrawer`** | `isOpen`, `isClosing`, `serviceLabels`, `slots`, `stylists`, `selectedSlotId`, `selectedStylistId`, `onSelectSlot`, `onSelectStylist`, `onConfirm`, `onClose` | **11** |
| **`HelpModal`** | `isOpen`, `onClose` | **2** |
| **`CuratedEmojiPicker`** | `isOpen`, `isClosing`, `style`, `onSelect`, `onClose`, `ref` | **6** |
| **`Lightbox`** | `images`, `onClose` | **2** |
| **`InboxToast`** | `message`, `visible` | **2** |
| **`ThreadItem`** | `conversation`, `isActive`, `onSelect`, `onCopyPhone`, `animationId`, `ref` | **6** |
| **`MessageBubbleItem`** | `message`, `messageReaction`, `messageDrag`, `bookingSlots`, + callbacks (~10) | **~15** |

---

## 4. Extraction Order

The extraction follows a **bottom-up dependency order**:

```
  Phase H-1: Hooks
  ┌──────────────────────────────────────────────────┐
  │  1. useWhatsAppMessages    (no hook deps)        │
  │  2. useRealtimeEvents      (depends on #1)        │
  │  3. useInboxThreads        (no hook deps)         │
  │  4. useFeedAnalysis        (no hook deps)         │
  │  5. useInboxComposer       (depends on #1, #3)    │
  │  6. useBooking             (no hook deps)         │
  │  7. useEmojiPicker         (no hook deps)         │
  │  8. useInboxLayout         (no hook deps)         │
  └──────────────────────────────────────────────────┘
  Phase H-2: Leaf components
  ┌──────────────────────────────────────────────────┐
  │  9. ThreadItem              (pure, 0 deps)       │
  │ 10. MessageBubbleItem       (pure, 0 deps)       │
  │ 11. SmartKeywordChipText    (pure, 0 deps)       │
  │ 12. FeedTimelineCard        (pure, 0 deps)       │
  │ 13. BookingDrawer           (pure, 0 deps)       │
  │ 14. InboxToast              (pure, 0 deps)       │
  └──────────────────────────────────────────────────┘
  Phase H-3: Section components
  ┌──────────────────────────────────────────────────┐
  │ 15. ConversationsPanel      (uses #9, #14)       │
  │ 16. ChatPanel               (uses #10, #11, #13) │
  │ 17. AssistantRail           (uses #12)           │
  └──────────────────────────────────────────────────┘
  Phase H-4: Overlay components
  ┌──────────────────────────────────────────────────┐
  │ 18. HelpModal               (pure, 0 deps)       │
  │ 19. CuratedEmojiPicker      (pure, 0 deps)       │
  │ 20. Lightbox                (pure, 0 deps)       │
  └──────────────────────────────────────────────────┘
  Phase H-5: Integration + page.tsx composition
  ┌──────────────────────────────────────────────────┐
  │ 21. Compose InboxPage from hooks + components    │
  └──────────────────────────────────────────────────┘
```

---

## 5. Dependency Graph

```
                    InboxPage (composition)
                   /     |       |       \
                  /      |       |        \
            ChatPanel  ConvPanel  AssistRail  (overlays)
             /  |  \       |          |
            /   |   \      |          |
   MsgBubbleItem  |  Booking  ThreadItem  FeedTimelineCard
                 SmartKwChip              |
                                           |
                                    FeedTimelineCard
                                           |
                                     SmartKwChipText
                                           |
                                     (no deps)

         hooks layer:
    ┌──────────────────────────────────────┐
    │ useWhatsAppMessages                  │
    │   └─ useRealtimeEvents (composes)    │
    │ useInboxThreads                      │
    │ useFeedAnalysis                      │
    │ useInboxComposer (dep: Msgs,Threads) │
    │ useBooking                           │
    │ useEmojiPicker                       │
    │ useInboxLayout                       │
    └──────────────────────────────────────┘
         │                    │
         ▼                    ▼
    useWhatsAppMessages  useFeedAnalysis
    ┌──────────────┐    ┌──────────────┐
    │ state:       │    │ state:       │
    │  threads     │    │  timeline    │
    │  messages    │    │  analysis    │
    │  activeId    │    │  chips       │
    │  unreadCount │    │  profile     │
    │  ...         │    │  ...         │
    └──────────────┘    └──────────────┘
         │                    │
         ▼                    ▼
    useRealtimeEvents     useInboxComposer
    ┌──────────────┐    ┌──────────────┐
    │ SSE handler  │    │ draft        │
    │ event router │    │ stagedMedia  │
    │ → messages   │    │ quotedReply  │
    │ → composer   │    │ send/retry   │
    │ → feed       │    │ serviceWindow│
    │ → booking    │    │ ...          │
    └──────────────┘    └──────────────┘

    Hook-to-hook data flow:
    useWhatsAppMessages.threads ──→ useInboxComposer (for activeChat)
    useWhatsAppMessages.messages ──→ useFeedAnalysis (for keyword detection)
    useWhatsAppMessages.activeId ──→ useBooking (for conversation context)
    useWhatsAppMessages.activeChat.autoReplyEnabled ──→ useInboxComposer (draft regen)
    useRealtimeEvents (dispatches to all hooks via callbacks)

    CSS dependency:
    All components → inbox.module.css (single file, ~3183 lines)
```

---

## 6. Risk Ranking

| R# | Risk | Likelihood | Impact | Phase | Mitigation |
|----|------|-----------|--------|-------|------------|
| R1 | **Broken SSE/polling during hook extraction** | Medium | **Critical** | H-1 | Extract `useRealtimeEvents` and `useWhatsAppMessages` together; test SSE connection + message rendering between each hook |
| R2 | **Optimistic message state lost on re-render** | Medium | High | H-1 | Keep `localMessageIdRef`, `lastWhatsAppMessageIdsRef`, `isSendingDraftRef` inside `useWhatsAppMessages`; expose stable refs |
| R3 | **Typewriter animation breaks on extraction** | High | Medium | H-1 | Extract `useFeedAnalysis` with `typewriterTimerRef` internal; animation relies on DOM timers, not layout |
| R4 | **Thread animation (FLIP) breaks** | High | Medium | H-2 | `useLayoutEffect` with `previousThreadRectsRef` is tightly coupled to thread DOM; extract with `ThreadItem` |
| R5 | **Swipe-to-reply gesture breaks** | Medium | High | H-2 | `useRef`-based pointer handlers in `MessageBubbleItem`; extract pointer logic into the component |
| R6 | **Overlapping state between hooks** | Low | Medium | H-1 | Define clear state ownership: messages → `useWhatsAppMessages`, feed → `useFeedAnalysis`, booking → `useBooking` |
| R7 | **Circular import between ChatPanel and AssistantRail** | Low | Medium | H-3 | Don't import section components into each other — compose from page.tsx only |
| R8 | **`sidebarUnreadStore` not yet created** | High | Low | H-1 | Create stub module before extraction: `export const handleIncomingMessage = ...; export const setUnreadMessagesCount = ...` |
| R9 | **CSS class name conflicts** | Medium | Medium | H-2 | Keep all inbox components using `inbox.module.css`; no CSS module splitting until Phase H-4 |
| R10 | **Composer resize handle breaks** | Medium | Medium | H-2 | `composerHeight` and `handleComposerResizeStart/Move/End` must stay co-located with the `<textarea>` |

### Risk Mitigation Strategy Summary

| Strategy | Applied to |
|----------|-----------|
| **Keep refs internal to hooks** | R2, R3, R4, R5 |
| **Extract hooks first, then components** | R1, R6 |
| **One CSS module for all inbox** (no splitting) | R9 |
| **Stub missing imports before extraction** | R8 |
| **Co-locate DOM-dependent logic** (resize, swipe) | R10 |
| **Test after every 2 hook extractions** | All |

---

## 7. Expected Line Reduction Per Phase

| Phase | Focus | Current Lines | Est. Remaining | Reduction | % of page.tsx |
|-------|-------|--------------|---------------|-----------|---------------|
| **H-0** | (current) | 4376 | 4376 | 0 | 0% |
| **H-1** | Hooks extraction | 4376 | ~2200 | ~2176 | 50% |
| **H-2** | Leaf components | 4376 | ~1800 | ~2576 | 59% |
| **H-3** | Section components | 4376 | ~800 | ~3576 | 82% |
| **H-4** | Overlay components | 4376 | ~650 | ~3726 | 85% |
| **H-5** | Integration + composition | 4376 | ~350 | ~4026 | 92% |

### Cumulative reduction curve

```
Lines
4500 ┤ H-0 (4376)
4000 ┤
3500 ┤
3000 ┤
     │
2500 ┤        H-1 (~2200)
2000 ┤
     │
1500 ┤            H-2 (~1800)
     │
1000 ┤                H-3 (~800)
 500 ┤                    H-4 (~650)  H-5 (~350)
   0 └─────┬──────┬──────┬──────┬──────┬──────
          H-1    H-2    H-3    H-4    H-5
```

### New code added vs removed

| Phase | Removed from page.tsx | Added (new files) | Net reduction |
|-------|---------------------|-------------------|---------------|
| H-1 | ~2176 (effects, state, closures) | ~1800 (hooks × 8) | −376 |
| H-2 | ~400 (leaf JSX + logic) | ~500 (leaf components × 6) | +100 (but page.tsx net −276 from H-1) |
| H-3 | ~1000 (section JSX) | ~600 (section components × 3) | −400 |
| H-4 | ~150 (overlay JSX) | ~200 (overlay components × 3) | +50 |
| H-5 | ~300 (remaining logic) | ~400 (integration) | +100 |

**Net reduction of page.tsx:** ~4026 lines (from 4376 to ~350)

---

## 8. Checkpoint Plan H-1 Through H-7

### Phase H-1: Hooks Extraction (7 checkpoints)

| CP | Step | Deliverable | page.tsx After | Est. Files |
|----|------|-------------|---------------|------------|
| **CP-45** | This plan | `INBOX_UI_EXTRACTION_PLAN.md` | 4376 | 0 |
| **CP-46** | Extract `useWhatsAppMessages` + `useRealtimeEvents` | Hooks + page.tsx reduced by ~500 lines | ~3876 | 3 new, 1 mod |
| **CP-47** | Extract `useInboxThreads` | Hook + page.tsx reduced by ~250 lines | ~3626 | 2 new, 1 mod |
| **CP-48** | Extract `useFeedAnalysis` | Hook + page.tsx reduced by ~350 lines | ~3276 | 2 new, 1 mod |
| **CP-49** | Extract `useInboxComposer` | Hook + page.tsx reduced by ~300 lines | ~2976 | 2 new, 1 mod |
| **CP-50** | Extract `useBooking` + `useEmojiPicker` | Hooks + page.tsx reduced by ~280 lines | ~2696 | 3 new, 1 mod |
| **CP-51** | Extract `useInboxLayout` + create `sidebarUnreadStore` stub | Hook + stub + page.tsx reduced by ~80 lines | ~2616 | 3 new, 1 mod |
| **CP-52** | Integration test: all hooks + verify SSE/polling still works | Tests pass | 2616 | 2 test files |

### Phase H-2: Leaf Components (2 checkpoints)

| CP | Step | Deliverable | page.tsx After | Est. Files |
|----|------|-------------|---------------|------------|
| **CP-53** | Extract `MessageBubbleItem`, `ThreadItem`, `SmartKeywordChipText` | Leaf components + page.tsx reduced by ~300 lines | ~2316 | 4 new, 1 mod |
| **CP-54** | Extract `FeedTimelineCard`, `BookingDrawer`, `InboxToast` | Leaf components + page.tsx reduced by ~180 lines | ~2136 | 4 new, 1 mod |

### Phase H-3: Section Components (2 checkpoints)

| CP | Step | Deliverable | page.tsx After | Est. Files |
|----|------|-------------|---------------|------------|
| **CP-55** | Extract `ConversationsPanel` + `ChatPanel` | Section components + page.tsx reduced by ~550 lines | ~1586 | 3 new, 1 mod |
| **CP-56** | Extract `AssistantRail` | Section component + page.tsx reduced by ~220 lines | ~1366 | 2 new, 1 mod |

### Phase H-4: Overlay Components (2 checkpoints)

| CP | Step | Deliverable | page.tsx After | Est. Files |
|----|------|-------------|---------------|------------|
| **CP-57** | Extract `HelpModal` + `Lightbox` | Overlays + page.tsx reduced by ~170 lines | ~1196 | 3 new, 1 mod |
| **CP-58** | Extract `CuratedEmojiPicker` + final inline cleanup | Overlay + page.tsx reduced by ~50 lines | ~1146 | 2 new, 1 mod |

### Phase H-5: Integration + Composition (1 checkpoint)

| CP | Step | Deliverable | page.tsx After | Est. Files |
|----|------|-------------|---------------|------------|
| **CP-59** | Compose `InboxPage` from hooks + components; remove dead code | Final clean page.tsx (~350 lines) | ~350 | 1 mod |

### Phase H-6: Bridge Extraction (2 checkpoints)

| CP | Step | Deliverable | Est. Files |
|----|------|-------------|------------|
| **CP-60** | Create `InboxBridge` + `WhatsAppBridge` | Bridges replacing direct `fetch()` calls | 4 new, 2 mod |
| **CP-61** | Bridge integration tests + migrate page.tsx to use bridges | Tests pass | 2 test files, 1 mod |

### Phase H-7: Repository Extraction (2 checkpoints)

| CP | Step | Deliverable | Est. Files |
|----|------|-------------|------------|
| **CP-62** | Create WhatsApp repos (conversations, messages, assets) | Repositories | 4 new, 2 mod |
| **CP-63** | Repository integration tests + final audit | Tests pass, final audit doc | 2 test files, 1 audit |

**Total: 19 checkpoints** (CP-45 through CP-63)

---

## 9. Safe Extraction Sequence

The safe sequence prioritizes **no regressions** by extracting in order of **leaf → branch → root**, extracting hooks before components, and verifying at each step.

### Sequence Rules

1. **Never** extract a parent before its children
2. **Never** extract a component that depends on a hook before the hook is extracted
3. **Never** modify CSS modules — all components share the existing `inbox.module.css`
4. **Always** verify TypeScript compiles after each extraction
5. **Always** verify the inbox renders and SSE/polling work after each commit

### Guaranteed-Safe Order

```
Step 1: sidebarUnreadStore stub          (creates missing import target)
Step 2: useWhatsAppMessages              (extracts message state + polling)
  Verify: messages render, polling works, SSE events arrive
Step 3: useRealtimeEvents                (extracts EventSource + dispatch)
  Verify: SSE events still dispatch to all handlers
Step 4: useInboxThreads                   (extracts thread list + selection)
  Verify: threads render, selection works
Step 5: useFeedAnalysis                  (extracts feed state + typewriter)
  Verify: feed suggestions appear, chips clickable
Step 6: useInboxComposer                 (extracts draft + send logic)
  Verify: draft edits, send works, optimistic updates shown
Step 7: useBooking                        (extracts booking state + confirmation)
  Verify: booking drawer opens, slots load, confirm works
Step 8: useEmojiPicker                    (extracts emoji picker state)
  Verify: emoji picker opens/closes, emoji insertable
Step 9: useInboxLayout                    (extracts resize + scroll + tapiz)
  Verify: resize handle works, auto-scroll works
── Integration test checkpoint ──
Step 10: Extract leaf components (ThreadItem, MessageBubbleItem, etc.)
  Verify: each renders identically
Step 11: Extract section components (ConversationsPanel, etc.)
  Verify: layout is identical
Step 12: Extract overlay components (HelpModal, etc.)
  Verify: overlays open/close correctly
Step 13: Compose final InboxPage
  Verify: full integration test passes
```

### Guardrails for Each Extraction

| Check | Tool | When |
|-------|------|------|
| TypeScript compiles | `npx tsc --noEmit` | After each file change |
| Tests pass | `npx jest` | After each checkpoint |
| Manual smoke test | Browser open + inbox render | After each phase |
| SSE connectivity | DevTools → Network → EventStream | After H-1 |
| Voice/video/image send | Manual | After H-1 complete |

---

## 10. Rollback Strategy

### Per-Extraction Rollback

Each hook/component extraction is **atomically revertible**:

```
git revert <commit-hash>
```

Since each extraction is:
1. One commit (or a clean commit sequence)
2. Non-overlapping with other extractions
3. Fully self-contained (no shared changes)

### Rollback Scenarios

| Scenario | Trigger | Action | Recovery Time |
|----------|---------|--------|---------------|
| **TypeScript errors** | `tsc --noEmit` fails | Don't commit; fix in place | 5–15 min |
| **Tests fail** | `jest` fails | Fix or revert last change | 10–30 min |
| **Inbox blank** | SSR/CSR crash | `git revert HEAD` | 2 min |
| **SSE broken** | No realtime updates | `git revert useRealtimeEvents commit` | 2 min |
| **Messages not rendering** | Empty chat | `git revert useWhatsAppMessages commit` | 2 min |
| **Send broken** | 400/500 errors | `git revert useInboxComposer commit` | 2 min |
| **Polling broken** | No message refresh | `git revert useWhatsAppMessages commit` | 2 min |
| **Feed analysis broken** | No suggestions | `git revert useFeedAnalysis commit` | 2 min |

### Pre-Extraction Safety

Before starting each extraction phase:
```
git checkout -b phase-h1-hooks
# (or phase-h2-leaf, phase-h3-section, etc.)
```

This keeps `main` (or working branch) clean at all times.

### After Each Checkpoint

```bash
git add -A
git commit -m "CP-XX: extract <component/hook>"
git tag checkpoint-XX
```

If regression found later:
```bash
# Option A: Soft revert
git revert <commit-hash>

# Option B: Hard reset (if no subsequent commits depend)
git reset --hard <previous-commit>
```

### Full Abort Strategy

If the entire extraction proves too risky:

```bash
git checkout main  # or the last stable branch
```

All new hook/component files remain accessible on the phase branch for later cherry-picking:

```bash
git cherry-pick <commit-hash>  # extract a single successful extraction
```

---

## Summary

| Metric | Value |
|--------|-------|
| **Current page.tsx** | ~4376 lines |
| **Target page.tsx** | ~350 lines |
| **Lines removed** | ~4026 (92% reduction) |
| **New files created** | ~32 (hooks, components, stubs) |
| **Checkpoints total** | 19 (CP-45 to CP-63) |
| **Phases** | 7 (H-1 through H-7) |
| **Safe extraction order** | Hooks → Leaf components → Sections → Overlays → Integration |
| **Highest risk** | SSE/polling continuity during hook extraction |
| **Rollback mechanism** | Per-commit `git revert` or branch reset |
| **Verification gates** | `tsc --noEmit` + `jest` after each checkpoint |
