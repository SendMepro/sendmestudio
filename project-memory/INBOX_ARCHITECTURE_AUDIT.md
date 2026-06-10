# Inbox Architecture Audit

> **Checkpoint 44 | Phase H-0 | Read-only analysis**
> Generated: 2026-05-30
> Status: **Read-only audit — no code changes applied**

---

## 1. Inbox Component Map

### UI / Rendering

| # | Name | Location | Lines | Role |
|---|------|----------|-------|------|
| 1 | `InboxPage` (default export) | `src/app/inbox/page.tsx` | ~4376 | Main inbox SPA: conversations panel, chat panel, assistant rail, booking, emoji picker, lightbox, help modal |
| 2 | `SmartKeywordChipText` | Same file, lines 822–953 | ~131 | Tokenizes message text, renders clickable golden chips for intents and time chips for booking slots |
| 3 | `Composer` | `src/components/atelier/Composer.tsx` | ~78 | Draft input with AI toggle, send button (simple inline component) |
| 4 | `MessageBubble` | `src/components/atelier/MessageBubble.tsx` | ~52 | Styled chat bubble (client vs studio) |
| 5 | `AIDrawer` (LiquidGlassAIDrawer) | `src/components/atelier/AIDrawer.tsx` | ~201 | AI suggestion drawer with reply buttons, media placeholders, quick actions |
| 6 | `AIBadge` | `src/app/components/AIBadge` (imported) | — | AI badge component for inbox header |
| 7 | `AppShell` | `src/app/components/AppShell` (imported) | — | Layout wrapper used by inbox |

### Utilities & Helpers

| # | Name | Location | Role |
|---|------|----------|------|
| 8 | `handleIncomingMessage` | Not yet created (page.tsx imports from `sidebarUnreadStore`) | Sidebar unread badge updates |
| 9 | `setUnreadMessagesCount` | Not yet created | Same module |
| 10 | `fuzzyIncludes`, `matchesServiceText` | `src/lib/serviceMatcher.ts` | Keyword/service matching |
| 11 | `detectTimes()` | page.tsx lines 516–540 | Regex-based Spanish time detection |
| 12 | `buildSmartDraft()` | page.tsx lines 589–718 | Composes AI draft from selected keyword chips |
| 13 | `detectActiveFeedSuggestions()` | page.tsx lines 955–1001 | Matches conversation text to feed suggestion intents |
| 14 | `serviceWindowFor()` | page.tsx lines 131–153 | WhatsApp 24h service window calculator |
| 15 | `timestampToMs()` | page.tsx lines 117–129 | Timestamp normalization |
| 16 | `isTimeSlotAvailable()`, `findMatchingSlot()` | page.tsx lines 543–561 | Booking slot matching |

### State & Effect Groups (InboxPage)

| # | Group | `useState` Keys | Role |
|---|-------|-----------------|------|
| 17 | Conversation state | `activeId`, `threads`, `messagesByConversation` | Active chat, thread list, message store |
| 18 | Composer state | `draftText`, `stagedMedia`, `quotedReply`, `composerHeight`, `isSendingDraft` | Draft composition |
| 19 | Feed & analysis | `feedTimeline`, `feedAnalysisState`, `feedAnalysisLog`, `playedItemGradients`, `feedSearch`, `selectedChips` | AI suggestion feed |
| 20 | Booking state | `isBookingDrawerOpen`, `bookingAvailability`, `selectedBookingSlotId`, `selectedBookingStylistId`, `isConfirmingBooking` | Inline booking |
| 21 | UI transient state | `copyToast`, `modeToast`, `isEmojiPickerOpen`, `lightboxImages`, `isHelpModalOpen`, `messageReactions`, `messageDrag` | Toasts, overlays, reactions |
| 22 | Refs (27 total) | `useRef` | Animation timers, DOM references, optimisic state guards |

---

## 2. Current page.tsx Structure

```
src/app/inbox/page.tsx  (~4376 lines)
│
├─ Imports & Constants (lines 1–115)
│   ├─ React + next/font
│   ├─ Lucide icons (20 icons)
│   ├─ AIBadge, AppShell, sidebarUnreadStore
│   ├─ serviceMatcher
│   └─ styles
│
├─ Type Definitions (lines 46–399)
│   ├─ Conversation, Message, WhatsAppInboxMessage, WhatsAppInboxConversation
│   ├─ WhatsAppRealtimeEvent, WhatsAppSendResponse/Error
│   ├─ Booking types (BookingService, BookingStylist, BookingSlot, AppointmentResponse)
│   ├─ StagedMedia, FeedSuggestion, FeedTimelineItem, FeedAction
│   └─ KnowledgeService, SupportFeedRule, CustomerProfile
│
├─ Data Constants (lines 61–113, 401–501)
│   ├─ initialConversations (3 hardcoded threads)
│   ├─ initialMessages (3 hardcoded messages)
│   ├─ feedSuggestions (9 entries: balayage, hidratacion, corte, olaplex, color, reserva, precio, foto, general)
│   └─ curatedComposerEmojis (19 emojis)
│
├─ Helper Functions (lines 115–1001)
│   ├─ serviceWindowFor, timestampToMs
│   ├─ detectTimes, isTimeSlotAvailable, findMatchingSlot
│   ├─ buildSmartDraft (6 cases, ~130 lines)
│   ├─ SmartKeywordChipText component (~131 lines)
│   └─ detectActiveFeedSuggestions
│
└─ InboxPage Component (lines 1003–4376)
    ├─ State declarations (~70 entries, lines 1004–1069)
    ├─ Derived values (lines 1069–1086)
    ├─ Effect hooks (lines 1088–3372, ~16 effects)
    │   ├─ Seed feed on conversation change
    │   ├─ Feed analysis state machine (typewriter)
    │   ├─ Clear isNew flag
    │   ├─ Smart keyword chip click handling
    │   ├─ Time chip click handling
    │   ├─ Auto-scroll to bottom
    │   ├─ Update unread count
    │   ├─ Thread animation layout effect
    │   ├─ Chat tapiz selection
    │   ├─ Load knowledge/customer context
    │   ├─ Load booking availability
    │   ├─ Load conversation messages
    │   ├─ Scroll on composer resize
    │   ├─ Emoji picker positioning
    │   ├─ Polling (2s interval)
    │   ├─ SSE realtime events
    │   └─ Cleanup (timers, object URLs)
    ├─ Helper closures (lines 1411–3069)
    │   ├─ sendWhatsAppMessage, loadConversationMessages
    │   ├─ handleSendDraft, confirmBooking, toggleAutoReplyMode
    │   ├─ toggleMessageHeartReaction, copyMessageText
    │   ├─ stageMedia, removeStagedMedia, renderMediaPreview
    │   └─ Emoji picker open/close/insert
    └─ JSX Return (lines 3374–4376)
        ├─ <AppShell>
        ├─ Conversations Panel (sidebar, ~129 lines JSX)
        ├─ Chat Panel (header + messages + draft, ~218 lines JSX)
        ├─ Assistant Rail / Feed (~145 lines JSX)
        ├─ Help Modal (~105 lines JSX)
        ├─ Lightbox
        ├─ Toast
        └─ Emoji Picker Portal
```

**Key metrics:**

- Total lines: ~4376 (largest file in the project)
- State variables: ~70
- `useEffect` hooks: ~16
- `useRef` variables: ~27
- Helper functions (inline): ~40+
- JSX return: ~1000+ lines

---

## 3. WhatsApp API Integration Flow

```
                    ┌──────────────────────┐
                    │  Meta WhatsApp Cloud  │
                    │     Graph API v25.0   │
                    └──────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     Webhook  │                  Send   │
     inbound  │                  outbound│
              │                         │
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ webhook/route.ts │    │ send/route.ts    │
    │ POST /api/       │    │ POST /api/       │
    │ whatsapp/webhook │    │ whatsapp/send    │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ normalizer.ts    │    │ sender.ts        │
    │ normalizeWhatsApp│    │ sendWhatsAppMsg  │
    │ Message()        │    │ sendImageMsg()   │
    │ normalizeStatus  │    │ sendReaction()   │
    │ AsMessage()      │    │ metaErrorDetail()│
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ ai-concierge.ts  │    │ store.ts         │
    │ generateConcierge│    │ saveWhatsAppMsg  │
    │ Decision()       │    │ updateStatus()   │
    │ generateDeepSeek │    │ recordAnalytics  │
    │ ConciergeReply() │    │ Event()          │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ customer-assets  │    │ customers/store  │
    │ .ts              │    │ upsertCustomer   │
    │ saveInbound      │    │ FromMessage()    │
    │ CustomerAsset()  │    │ addCustomerAsset │
    └──────────────────┘    └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ realtime.ts      │
    │ emitWhatsAppEvent│
    │ SSE to inbox     │
    └──────────────────┘

Inbox-side (page.tsx):

    ┌─────────────────────────────────────┐
    │ InboxPage                           │
    │                                     │
    │ 1. Poll: GET /api/whatsapp/messages │
    │    (every 2s via setInterval)       │
    │                                     │
    │ 2. SSE: /api/whatsapp/events        │
    │    (EventSource, realtime)          │
    │    └─ new_message                   │
    │    └─ conversation_updated          │
    │    └─ message_status_updated        │
    │    └─ ai_draft_ready                │
    │    └─ ai_auto_replied/blocked       │
    │    └─ appointment_scheduled         │
    │    └─ typing_started/stopped        │
    │                                     │
    │ 3. Send: POST /api/whatsapp/send    │
    │    (JSON or FormData with image)    │
    │                                     │
    │ 4. Mode: POST /api/whatsapp/mode    │
    │    (toggle autoReply)               │
    │                                     │
    │ 5. Reaction: POST /api/whatsapp/   │
    │    reaction                         │
    │    (send/receive emoji reactions)   │
    └─────────────────────────────────────┘
```

### Data Flow Summary

| Direction | Path | Mechanism | Frequency |
|-----------|------|-----------|-----------|
| Inbound message | Webhook → Normalizer → Store → SSE → Inbox | Webhook POST + SSE push | Real-time |
| Outbound send | Inbox → `/api/whatsapp/send` → Sender → Graph API | HTTP POST | On user action |
| Message polling | Inbox → `/api/whatsapp/messages?after=X` | GET with `after` cursor | Every 2s |
| AI auto-reply | Webhook → Concierge → DeepSeek → Sender → Store → SSE | Chained async | Per inbound msg |
| Reactions | Inbox → `/api/whatsapp/reaction` → Sender → Graph API | POST | On heart toggle |
| Mode toggle | Inbox → `/api/whatsapp/mode` → Store | POST | On toggle switch |
| Booking confirm | Inbox → `/api/appointments` → Store | POST | On confirm button |

---

## 4. Agent Dependencies

| Agent | Location | Relevance to Inbox | Dependency |
|-------|----------|--------------------|------------|
| `HomeAIInsightAgent` | `src/agents/home/HomeAIInsightAgent.ts` | Low — dashboard insights only | Knowledge store |
| `HomeDataSourceAgent` | `src/agents/home/HomeDataSourceAgent.ts` | Low — dashboard data sourcing | Repositories |
| `HomeOrchestratorAgent` | `src/agents/home/HomeOrchestratorAgent.ts` | Low — dashboard orchestration | EventBus, agents |
| `HomeHealthCheckAgent` | `src/agents/home/HomeHealthCheckAgent.ts` | Low — dashboard health | PlatformHealthRepo |
| `HomeInspectorAgent` | `src/agents/home/HomeInspectorAgent.ts` | Low — dashboard inspection | AgentRegistry |
| `HomeLearningAgent` | `src/agents/home/HomeLearningAgent.ts` | Low — dashboard learning | LearningEventRepo |
| `HomeMetricsAgent` | `src/agents/home/HomeMetricsAgent.ts` | Low — dashboard metrics | KpiMetricsRepo |
| `RecommendationEngine` | `src/agents/home/recommendations/` | Low — dashboard recs | ClientRepo, KPI |
| `IntelligenceLayer` | `src/agents/home/intelligence/` | Low — dashboard intelligence | Recs + data |

**Current observation:** None of the agent system (home agents, recommendation engine, intelligence layer) is connected to the Inbox. The inbox has its own independent AI logic:
- `ai-concierge.ts` — standalone intent detection + reply generation
- `SmartKeywordChipText` — client-side keyword matching
- `detectActiveFeedSuggestions` — client-side feed detection
- `buildSmartDraft` — client-side draft composition

**Gap:** The home agents and inbox operate on separate AI stacks with no shared context.

---

## 5. Repository Opportunities

| # | Repository | Domain | Current Data Source | Benefit |
|---|-----------|--------|-------------------|---------|
| **R1** | `WhatsAppConversationRepository` | Conversations | `data/whatsapp-store.json` | Centralize conversation CRUD, enable migration away from file-based store |
| **R2** | `WhatsAppMessageRepository` | Messages | `data/conversations/messages.json` | Same for messages |
| **R3** | `CustomerAssetRepository` | Customer uploaded media | `data/customer-assets/assets-index.json` | Asset management abstraction |
| **R4** | `KnowledgeRepository` | Services, FAQs, rules | `data/knowledge/*.json` | Already partially exists via `/api/knowledge`, but no dedicated repository class |
| **R5** | `InboxConfigRepository` | Service window settings, auto-reply defaults | Env vars + store | Config abstraction |
| **R6** | `BookingAvailabilityRepository` | Slots, stylists, services | `/api/booking/availability` | Currently fetched ad-hoc via API route |
| **R7** | `AnalyticsEventRepository` | WhatsApp analytics events | `data/conversations/analytics-events.json` | Currently inlined in store |

**Pattern:** All WhatsApp data is file-based JSON in `data/` directory. No database adapter, no repository classes. Current pattern is procedural functions in `store.ts` and `customers/store.ts`.

---

## 6. Bridge Opportunities

| # | Bridge | Methods | Purpose |
|---|--------|---------|---------|
| **B1** | `WhatsAppBridge` | `sendMessage()`, `sendImage()`, `sendReaction()`, `fetchMediaMetadata()`, `verifyWebhook()` | API abstraction for Meta Graph API |
| **B2** | `ConciergeBridge` | `generateDecision()`, `generateReply()`, `detectIntent()`, `checkSafeguards()` | Wraps `ai-concierge.ts` logic |
| **B3** | `InboxBridge` | `getThreads()`, `getMessages()`, `sendMessage()`, `toggleAutoReply()`, `getServiceWindow()`, `getAvailability()` | UI-facing bridge (analogous to `HomeBridge.ts`) |
| **B4** | `CustomerBridge` | `upsertCustomer()`, `getProfile()`, `getSegments()` | Customer data access from inbox |

**Note:** `HomeBridge.ts` already exists in `src/bridges/`. The inbox currently accesses APIs directly via `fetch()` calls scattered throughout the component.

---

## 7. Candidate Component Extractions

| # | Component | Current Location | Lines | Complexity | Priority |
|---|-----------|-----------------|-------|------------|----------|
| **C1** | `ConversationPanel` (sidebar) | page.tsx lines 3384–3513 | ~129 | Medium | **High** |
| **C2** | `ChatPanel` (header + messages + draft) | page.tsx lines 3515–3933 | ~418 | High | **High** |
| **C3** | `AssistantRail` (feed) | page.tsx lines 3935–4157 | ~222 | Medium | **High** |
| **C4** | `BookingDrawer` | page.tsx lines 3746–3825 | ~79 | Medium | **Medium** |
| **C5** | `EmojiPicker` (portal) | page.tsx lines 4344–4373 | ~29 | Low | **Low** |
| **C6** | `HelpModal` | page.tsx lines 4169–4325 | ~156 | Low | **Low** |
| **C7** | `SmartKeywordChipText` | page.tsx lines 822–953 | ~131 | Medium | **Medium** |
| **C8** | `FeedTimelineCard` (per item) | page.tsx lines 4045–4141 | ~96 | Low | **Medium** |
| **C9** | `Lightbox` | page.tsx lines 4327–4340 | ~13 | Low | **Low** |
| **C10** | `WhatsAppHooks` (custom hooks) | page.tsx effects | ~2300 | High | **High** |

### Extraction Strategy

| Priority | Extract as | Rationale |
|----------|-----------|-----------|
| **Phase H-1** | Custom hooks (`useWhatsAppMessages`, `useFeedAnalysis`, `useBooking`, `useRealtimeEvents`, `useEmojiPicker`) | Largest win: removes ~2300 lines of effect logic from the 4376-line component |
| **Phase H-2** | `ConversationPanel`, `ChatPanel`, `AssistantRail` | These are the three main layout columns — clear boundaries |
| **Phase H-3** | `SmartKeywordChipText`, `BookingDrawer`, `FeedTimelineCard` | Leaf components with clear props interface |
| **Phase H-4** | `HelpModal`, `EmojiPicker`, `Lightbox` | Low effort, low risk |
| **Post-H** | Bridge + Repository extraction | Depends on H-1 to H-4 stability |

---

## 8. Migration Phases

### Phase H-1: Custom Hooks Extraction
**Goal:** Extract stateful logic from `InboxPage` into custom hooks.

| Step | Hook | Extracted Logic | Est. Files |
|------|------|-----------------|------------|
| H-1.1 | `useWhatsAppMessages` | Polling, SSE, message CRUD, optimistic updates, status tracking | 2 |
| H-1.2 | `useFeedAnalysis` | `feedTimeline`, `feedAnalysisState`, typewriter effect, chip selection | 2 |
| H-1.3 | `useBooking` | Availability fetch, slot/stylist selection, booking confirmation | 2 |
| H-1.4 | `useRealtimeEvents` | EventSource setup, event dispatch to relevant hooks | 2 |
| H-1.5 | `useEmojiPicker` | Open/close, positioning, portal management | 2 |
| H-1.6 | `useInboxComposer` | Draft text, staged media, quoted reply, send logic | 2 |

**Verification:** Page.tsx reduces by ~2000 lines. All 70+ state variables move into hooks.

### Phase H-2: UI Component Extraction
**Goal:** Split JSX into standalone components.

| Step | Component | Props Interface | Est. Files |
|------|-----------|-----------------|------------|
| H-2.1 | `ConversationsPanel` | `threads, activeId, onSelectConversation, onCopyPhone` | 2 |
| H-2.2 | `ChatPanel` | `messages, activeChat, draftText, stagedMedia, ...callbacks` | 2 |
| H-2.3 | `AssistantRail` | `feedTimeline, feedAnalysisState, customerProfile, ...callbacks` | 2 |

**Verification:** Page.tsx JSX reduces by ~600 lines. Components become independently testable.

### Phase H-3: Leaf Components & Utilities
**Goal:** Extract remaining standalone UI pieces.

| Step | Component | Est. Files |
|------|-----------|------------|
| H-3.1 | `SmartKeywordChipText` → separate file | 2 |
| H-3.2 | `BookingDrawer` → separate component | 2 |
| H-3.3 | `FeedTimelineCard` → separate component | 2 |
| H-3.4 | Move helpers (`detectTimes`, `buildSmartDraft`, `serviceWindowFor`, `findMatchingSlot`) to `lib/` | 2 |

**Verification:** All helpers testable in isolation. Page.tsx becomes a thin composition layer.

### Phase H-4: Overlay Components
**Goal:** Extract low-risk overlay/modal components.

| Step | Component | Est. Files |
|------|-----------|------------|
| H-4.1 | `HelpModal` → separate component | 2 |
| H-4.2 | `CuratedEmojiPicker` → separate component | 2 |
| H-4.3 | `Lightbox` → separate component | 2 |
| H-4.4 | `InboxToast` → unified toast system | 2 |

### Phase H-5: Bridge Extraction
**Goal:** Create `InboxBridge` analogous to `HomeBridge`.

| Step | Bridge | Methods | Est. Files |
|------|--------|---------|------------|
| H-5.1 | `InboxBridge` | `getThreads`, `getMessages`, `sendMessage`, `toggleAutoReply`, `confirmBooking`, `getServiceWindow`, `getAvailability` | 2 |
| H-5.2 | `WhatsAppBridge` | `sendMessage`, `sendImage`, `sendReaction`, `fetchMedia` | 2 |

**Verification:** Inbox no longer calls `fetch()` directly. All API access goes through bridges.

### Phase H-6: Repository Extraction
**Goal:** Create repositories for inbox data sources.

| Step | Repository | Est. Files |
|------|-----------|------------|
| H-6.1 | `WhatsAppConversationRepository` | 2 |
| H-6.2 | `WhatsAppMessageRepository` | 2 |
| H-6.3 | `CustomerAssetRepository` | 2 |
| H-6.4 | `InboxAnalyticsRepository` | 2 |

### Phase H-7: Agent Integration
**Goal:** Connect inbox AI to the agent system.

| Step | Integration | Est. Files |
|------|-------------|------------|
| H-7.1 | Register inbox AI as a consumer on EventBus | 2 |
| H-7.2 | Replace `ai-concierge.ts` with agent-based pipeline | 3 |
| H-7.3 | Inbox → IntelligenceLayer bridge for unified insights | 2 |

---

## 9. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| 1 | **Circular dependencies** between hooks (message → feed → booking) | Medium | High | Define clear dependency order: message → feed → booking (not circular) |
| 2 | **Broken SSE/polling** during refactor | Medium | High | Phase extraction: extract hooks BEFORE moving components; test SSE after each step |
| 3 | **State duplication** across hooks/components | High | Medium | Use single source of truth per domain; hooks return state, not duplicate it |
| 4 | **Reactivity issues** with 27 refs | Medium | High | Refactor refs into hook internals; expose only stable callbacks |
| 5 | **Animation/timing regression** (typewriter, thread animations, swipe) | High | Medium | Extract animation logic with hooks; keep DOM refs isolated |
| 6 | **Performance degradation** from component re-renders | Low | Medium | Use `React.memo` on extracted leaf components; pass stable callbacks |
| 7 | **Breaking WhatsApp webhook** flow | Low | Very High | Do NOT touch webhook, normalizer, sender, or store in H-1 to H-4; read-only analysis |
| 8 | **Missing dependency** on `sidebarUnreadStore` (not yet created) | High | Low | Create as part of H-1 or stub import |

---

## 10. Estimated Checkpoints

| Phase | Checkpoint | Focus | Est. Files Affected | Est. Tests |
|-------|-----------|-------|--------------------|------------|
| H-0 | CP-44 | Architecture audit (current) | 0 (read-only) | 0 |
| H-1 | CP-45 | `useWhatsAppMessages` + `useRealtimeEvents` hooks | 5 | 30 |
| H-1 | CP-46 | `useFeedAnalysis` + `useInboxComposer` hooks | 5 | 25 |
| H-1 | CP-47 | `useBooking` + `useEmojiPicker` hooks | 4 | 20 |
| H-2 | CP-48 | `ConversationsPanel` component | 4 | 15 |
| H-2 | CP-49 | `ChatPanel` component | 4 | 20 |
| H-2 | CP-50 | `AssistantRail` component | 4 | 15 |
| H-3 | CP-51 | Leaf components (SmartKeywordChip, BookingDrawer, FeedTimelineCard) | 6 | 25 |
| H-3 | CP-52 | Utility extraction + integration tests | 5 | 30 |
| H-4 | CP-53 | Overlay components + toast system | 5 | 15 |
| H-4 | CP-54 | End-to-end integration tests for refactored inbox | 3 | 20 |
| H-5 | CP-55 | `InboxBridge` + `WhatsAppBridge` | 5 | 35 |
| H-5 | CP-56 | Bridge integration + mock tests | 3 | 20 |
| H-6 | CP-57 | `WhatsAppConversationRepository` + `WhatsAppMessageRepository` | 5 | 25 |
| H-6 | CP-58 | `CustomerAssetRepository` + `InboxAnalyticsRepository` | 5 | 20 |
| H-6 | CP-59 | Repository integration tests | 3 | 20 |
| H-7 | CP-60 | Agent integration (EventBus consumer, IntelligenceLayer bridge) | 5 | 25 |
| H-7 | CP-61 | Full pipeline validation + final audit | 4 | 30 |

**Total: 17 checkpoints** (H-0 through H-7, CP-44 to CP-61)

---

## 11. Estimated Files Affected

| Phase | New Files | Modified Files | Deleted Files | Total |
|-------|-----------|----------------|---------------|-------|
| H-1 | 6 (hooks) | 1 (page.tsx) | 0 | 7 |
| H-2 | 4 (components + CSS) | 1 (page.tsx) | 0 | 5 |
| H-3 | 6 (leaf components + lib) | 2 (page.tsx, lib index) | 0 | 8 |
| H-4 | 4 (overlay components) | 1 (page.tsx) | 0 | 5 |
| H-5 | 2 (bridges) | 3 (page.tsx, index exports) | 0 | 5 |
| H-6 | 4 (repositories) | 2 (index exports) | 0 | 6 |
| H-7 | 2 (consumers) | 3 (EventBus, types) | 0 | 5 |

**Cumulative estimate: ~41 files** over all phases.
**Page.tsx reduction:** From ~4376 lines to an estimated ~300–500 lines (composition layer only).

---

## Summary

| Aspect | Current State | Target State | Delta |
|--------|--------------|--------------|-------|
| **page.tsx size** | ~4376 lines | ~300–500 lines | −87% |
| **Custom hooks** | 0 | 6 | +6 |
| **UI components** | 3 (`Composer`, `MessageBubble`, `AIDrawer`) | 12+ | +9+ |
| **Bridges** | 0 inbox-specific | 2 (`InboxBridge`, `WhatsAppBridge`) | +2 |
| **Repositories** | 0 WhatsApp-specific | 4 | +4 |
| **Direct `fetch()` calls** | 10+ scattered across component | 0 (via bridges) | −10+ |
| **State variables in component** | ~70 | ~0 (moved to hooks) | −70 |
| **Agent integration** | None | EventBus consumer + IntelligenceLayer bridge | +2 |
| **Estimated checkpoints** | — | 17 (CP-44 to CP-61) | — |
| **Estimated files** | — | ~41 total across all phases | — |
