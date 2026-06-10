# SENDME STUDIO — Architecture Report

> Generated: 2026-06-02  
> Project root: `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza`  
> This report is generated from actual source code inspection — it describes what exists, not what is planned.

---

## 1. Project Summary

| Field | Value |
|---|---|
| **Name** | `app-init` (package.json) |
| **Brand** | SendMe Studio — Luxury Salon OS |
| **Framework** | Next.js 16.2.6 (Turbopack) |
| **Runtime** | React 19.2.4 |
| **Language** | TypeScript 5 |
| **Build output** | Static + Server-rendered (hybrid) |
| **Package manager** | npm |
| **License** | Private — not specified |

### Pages (35 routes)

**Static (○):** `/`, `/admin`, `/admin/licenses`, `/admin/ai-costs`, `/agenda`, `/analytics`, `/brain`, `/brain-admin`, `/brain-upload`, `/calendar`, `/campaigns`, `/campaigns-v2`, `/clients`, `/contacts`, `/editorial`, `/growth`, `/inbox`, `/knowledge`, `/login`, `/mobile-upload`, `/news`, `/salon-intelligence`, `/settings`, `/settings/atelier-memory`, `/studio-pulse`, `/supervisor`

**Dynamic (ƒ):** ~60 API routes under `/api/*`

---

## 2. Technology Stack

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.4 |
| Icons | Lucide React | 1.16.0 |
| Animation | Framer Motion | 12.39.0 |
| Date picker | React Day Picker | 10.0.1 |
| Screenshot | html2canvas | 1.4.1 |
| Fonts | Inter, Montserrat, Outfit, Arimo (Google Fonts) | — |

### Backend / Infrastructure

| Layer | Implementation | Status |
|---|---|---|
| **API Layer** | Next.js Route Handlers (`/api/*`) | Active |
| **OR/Database** | **None** — no Prisma, Drizzle, or any ORM | N/A |
| **Database** | **None** — no PostgreSQL, MySQL, SQLite, or MongoDB | N/A |
| **Persistence** | JSON files via `fs.readFile/writeFile` (file-based store) | Active |
| **Hosting** | Not configured (no Dockerfile, no vercel.json) | Incomplete |
| **Auth** | Session-based via `/api/brain-admin/session`, brain-admin key only | Partial |
| **Queue** | None (no Bull, no RabbitMQ, no in-process queue) | N/A |
| **WebSockets** | Server-Sent Events via `/api/whatsapp/events` (GET stream) | Active |
| **Redis** | Not used | N/A |
| **Storage** | Local filesystem (`public/uploads/`) + Google Drive (service account) | Partial |

### External APIs / Services

| Service | Integration | Status |
|---|---|---|
| WhatsApp Cloud API (Meta) | Webhook + send messages | **Operational** |
| DeepSeek API | Chat completions (`deepseek-chat`) | **Operational** |
| Xiaomi MiMo API | Chat completions (`mimo-v2-pro`) | **Operational** |
| Google Drive API | Service account — brain storage | Partial |
| Google OAuth | User OAuth for Drive access | Partial |
| Meta Templates API | `/api/meta-templates` route | Placeholder |

### WhatsApp Infrastructure

| Component | File | Status |
|---|---|---|
| Webhook receiver | `src/app/api/whatsapp/webhook/route.ts` | **Operational** |
| Message sender | `src/app/api/whatsapp/sender.ts` | **Operational** |
| Message store | `src/app/api/whatsapp/store.ts` | **Operational** |
| AI Concierge | `src/app/api/whatsapp/ai-concierge.ts` | **Operational** |
| Booking context | `src/app/api/whatsapp/booking-context.ts` | **Operational** |
| Realtime events (SSE) | `src/app/api/whatsapp/realtime.ts` | **Operational** |
| Message normalizer | `src/app/api/whatsapp/normalizer.ts` | **Operational** |
| Customer assets | `src/app/api/whatsapp/customer-assets.ts` | **Operational** |

### AI Provider Configuration

| Env Variable | Value |
|---|---|
| `DEEPSEEK_API_KEY` | Configured |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | `deepseek-chat` |
| `XIAOMI_MIMO_API_KEY` | Configured (2 entries in env) |
| `XIAOMI_MIMO_BASE_URL` | `https://platform.xiaomimimo.com/v1` |
| `XIAOMI_MIMO_MODEL` | `mimo-v2-pro` |
| `AI_TASK_PROVIDER` | `customer_memory=xiaomi_mimo,whatsapp_reply=deepseek` |

---

## 3. Folder Structure

```
Salon_Belleza/
├── docs/                           # (empty, created for this report)
├── public/
│   └── img/                        # Static images, booking photos, icon.png
│       ├── booking/
│       └── ...
├── src/
│   ├── __tests__/                  # Jest tests
│   │   ├── RecommendationEngine.test.ts
│   │   ├── LearningEventRepository.test.ts
│   │   ├── IntelligenceLayer.test.ts
│   │   ├── IntelligenceEngine.test.ts
│   │   ├── HomeBridge.test.ts
│   │   ├── EventBus.test.ts
│   │   └── Consumers.test.ts
│   │
│   ├── adapters/
│   │   └── LocalStorageAdapter.ts
│   │
│   ├── agents/
│   │   ├── system/                 # System-level governance agents
│   │   │   ├── AgentRegistry.ts
│   │   │   ├── AgentInspector.ts
│   │   │   ├── AgentLifecycleAgent.ts
│   │   │   ├── SystemSupervisorAgent.ts
│   │   │   ├── HealthCheckAgent.ts
│   │   │   ├── RecoveryAgent.ts
│   │   │   ├── CuratorAgent.ts
│   │   │   ├── BusinessEventBus.ts
│   │   │   ├── adapters.ts
│   │   │   ├── contracts.ts
│   │   │   ├── startup.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── home/                   # Home dashboard agents
│   │   │   ├── HomeOrchestratorAgent.ts
│   │   │   ├── HomeMetricsAgent.ts
│   │   │   ├── HomeLearningAgent.ts
│   │   │   ├── HomeInspectorAgent.ts
│   │   │   ├── HomeHealthCheckAgent.ts
│   │   │   ├── HomeDataSourceAgent.ts
│   │   │   ├── HomeAIInsightAgent.ts
│   │   │   ├── EventBus.ts
│   │   │   ├── recommendations/
│   │   │   │   ├── types.ts
│   │   │   │   └── RecommendationEngine.ts
│   │   │   └── intelligence/
│   │   │       ├── types.ts
│   │   │       └── IntelligenceLayer.ts
│   │   │   └── consumers/
│   │   │       ├── ClientArrivalConsumer.ts
│   │   │       └── AppointmentSelectionConsumer.ts
│   │   │
│   │   ├── customer-context-agent.ts
│   │   └── customer-memory-agent.ts
│   │
│   ├── app/
│   │   ├── api/                    # All API route handlers (61 routes)
│   │   │   ├── admin/
│   │   │   │   ├── ai-costs/route.ts
│   │   │   │   └── licenses/route.ts
│   │   │   ├── analytics/
│   │   │   │   ├── config/route.ts
│   │   │   │   ├── daily/route.ts
│   │   │   │   ├── live/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── appointments/route.ts
│   │   │   ├── attribution/route.ts
│   │   │   ├── booking/availability/route.ts
│   │   │   ├── brain-admin/
│   │   │   │   ├── audit-note/route.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── drive/route.ts
│   │   │   │   ├── events/route.ts
│   │   │   │   ├── qr-token/route.ts
│   │   │   │   ├── queue/route.ts
│   │   │   │   ├── session/route.ts
│   │   │   │   ├── storage/route.ts
│   │   │   │   ├── store.ts
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── voice/route.ts
│   │   │   ├── calendar/
│   │   │   │   ├── appointments/[...]/route.ts
│   │   │   │   ├── appointments/route.ts
│   │   │   │   └── staff/route.ts
│   │   │   ├── campaign-assets/route.ts
│   │   │   ├── campaign-history/route.ts
│   │   │   ├── campaigns/[...]/route.ts
│   │   │   ├── campaigns/route.ts
│   │   │   ├── clients/route.ts
│   │   │   ├── customer-assets/route.ts
│   │   │   ├── customer-memory/[...]/route.ts
│   │   │   ├── customer-memory/route.ts
│   │   │   ├── customers/
│   │   │   │   ├── import/route.ts
│   │   │   │   ├── route.ts
│   │   │   │   ├── segments/route.ts
│   │   │   │   └── store.ts
│   │   │   ├── google-drive/
│   │   │   │   ├── auth/route.ts
│   │   │   │   ├── callback/route.ts
│   │   │   │   └── status/route.ts
│   │   │   ├── knowledge/
│   │   │   │   ├── faqs/route.ts
│   │   │   │   ├── route.ts
│   │   │   │   ├── services/route.ts
│   │   │   │   ├── store.ts
│   │   │   │   └── stylists/route.ts
│   │   │   ├── messages/route.ts
│   │   │   ├── meta-templates/route.ts
│   │   │   ├── supervisor/
│   │   │   │   ├── events/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── theme/tapices/route.ts
│   │   │   └── whatsapp/
│   │   │       ├── ai-concierge.ts
│   │   │       ├── booking-context.ts
│   │   │       ├── customer-assets.ts
│   │   │       ├── events/route.ts
│   │   │       ├── messages/route.ts
│   │   │       ├── mode/route.ts
│   │   │       ├── normalizer.ts
│   │   │       ├── reaction/route.ts
│   │   │       ├── realtime.ts
│   │   │       ├── send/route.ts
│   │   │       ├── sender.ts
│   │   │       ├── store.ts
│   │   │       └── webhook/route.ts
│   │   │
│   │   ├── components/             # Shared UI components
│   │   │   ├── AIBadge.tsx
│   │   │   ├── AppShell.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LiquidGlass.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── PageLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Sidebar.module.css
│   │   │   ├── sidebarUnreadStore.ts
│   │   │   ├── Skeleton.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── data/
│   │   │   └── salon-config-store.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── getCustomerAvatar.ts
│   │   │   ├── googleDriveBrainStorage.ts
│   │   │   └── serviceMatcher.ts
│   │   │
│   │   ├── [page modules]          # One folder per route
│   │   │   ├── admin/
│   │   │   ├── agenda/
│   │   │   ├── analytics/
│   │   │   ├── brain/
│   │   │   ├── brain-admin/
│   │   │   ├── brain-upload/
│   │   │   ├── calendar/
│   │   │   ├── campaigns/
│   │   │   ├── campaigns-v2/
│   │   │   ├── clients/
│   │   │   ├── contacts/
│   │   │   ├── editorial/
│   │   │   ├── growth/
│   │   │   ├── inbox/
│   │   │   ├── knowledge/
│   │   │   ├── login/
│   │   │   ├── mobile-upload/
│   │   │   ├── news/
│   │   │   ├── salon-intelligence/
│   │   │   ├── settings/
│   │   │   ├── studio-pulse/
│   │   │   └── supervisor/
│   │   │
│   │   ├── globals.css             # Global styles + design tokens
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   │
│   ├── bridges/
│   │   └── HomeBridge.ts
│   │
│   ├── components/                 # Feature components (not in app/)
│   │   ├── atelier/
│   │   │   ├── AIDrawer.tsx
│   │   │   ├── Composer.tsx
│   │   │   └── MessageBubble.tsx
│   │   ├── home/
│   │   │   ├── ClientAvatar.tsx
│   │   │   ├── HomeAppointmentFlow.tsx
│   │   │   ├── HomeClientFocusCard.tsx
│   │   │   ├── HomeDossier.tsx
│   │   │   ├── HomeHeader.tsx
│   │   │   ├── HomeIntelligenceInsights.tsx
│   │   │   ├── HomeKpiCards.tsx
│   │   │   ├── HomeSalonHero.tsx
│   │   │   └── dossier/
│   │   │       ├── HomeAIAlerts.tsx
│   │   │       ├── HomeAIRecommendation.tsx
│   │   │       ├── HomeArrivalBehavior.tsx
│   │   │       ├── HomeCustomerLTV.tsx
│   │   │       ├── HomeDossierHeroCard.tsx
│   │   │       ├── HomeEmotionalProfile.tsx
│   │   │       ├── HomeMaterialIntelligence.tsx
│   │   │       ├── HomeTechnicalHistory.tsx
│   │   │       └── HomeTechParameters.tsx
│   │   └── inbox/
│   │       ├── AssistantRail.tsx
│   │       ├── BookingDrawer.tsx
│   │       ├── ChatPanel.tsx
│   │       ├── ConversationsPanel.tsx
│   │       ├── CuratedEmojiPicker.tsx
│   │       ├── FeedTimelineCard.tsx
│   │       ├── HelpModal.tsx
│   │       ├── InboxToast.tsx
│   │       ├── Lightbox.tsx
│   │       ├── MessageBubbleItem.tsx
│   │       ├── SmartKeywordChipText.tsx
│   │       └── ThreadItem.tsx
│   │
│   ├── config/
│   │   ├── ai-pricing.ts
│   │   └── featureFlags.ts
│   │
│   ├── data/                      # JSON file stores
│   │   ├── ai-cost-store.ts
│   │   ├── attribution-store.ts
│   │   ├── calendar-store.ts
│   │   ├── campaigns-store.ts
│   │   ├── customer-memory-store.ts
│   │   ├── license-store.ts
│   │   └── staff-store.ts
│   │
│   ├── hooks/
│   │   ├── brain-admin/ (6 hooks)
│   │   └── inbox/ (7 hooks)
│   │
│   ├── lib/
│   │   ├── ai-router.ts           # Core AI provider router
│   │   └── liquidGL.d.ts
│   │
│   ├── repositories/              # Data access layer (Home section)
│   │   ├── AppointmentRepository.ts
│   │   ├── ClientRepository.ts
│   │   ├── KpiMetricsRepository.ts
│   │   ├── LearningEventRepository.ts
│   │   ├── PlatformHealthRepository.ts
│   │   └── WeatherRepository.ts
│   │
│   ├── skills/
│   │   └── emotional-salon/
│   │       └── EmotionalSalonOrchestrator.ts
│   │
│   └── system/
│       └── config.ts
│
├── .env.local                     # Environment variables
├── next.config.ts
├── package.json
├── tsconfig.json
└── ...

---

## 4. Modules — Status Overview

| Module | Route | Status | Description |
|---|---|---|---|
| **Home** | `/` | **Operational** | Dashboard with KPIs, dossier, appointment flow, intelligence insights. Real data from repositories. Mock data fallback in some widgets. |
| **Inbox (WhatsApp)** | `/inbox` | **Operational** | Full WhatsApp messaging interface. Threads, chat panel, assistant rail, AI drafts, booking concierge, emoji picker, lightbox, help modal. |
| **Campaigns** | `/campaigns` | **Operational (MVP)** | Campaign builder. Editor with AI suggestion pill, tone selector, templates (Instagram/WhatsApp/Nueva idea), emoji, font size, copy. Modal for "Preparar envío" with channel-specific options. |
| **Campaigns v2** | `/campaigns-v2` | **Placeholder** | Alternate version, not populated. |
| **Calendar** | `/calendar` | **Operational** | Agenda with react-day-picker. Appointment storage via JSON file. Staff data via `/api/calendar/staff`. |
| **Contacts** | `/contacts` | **Operational** | Contact list with detail drawer. Customer profiles. |
| **Clients** | `/clients` | **Operational** | Client management. CRUD via `/api/clients`. |
| **Analytics** | `/analytics` | **Operational** | Analytics dashboard. Real-time via SSE, daily snapshots, configurable. Attribution tracking. |
| **Growth** | `/growth` | **Operational** | Growth/marketing engine. Section info tooltips. |
| **Knowledge** | `/knowledge` | **Operational** | Knowledge base manager. Profile, services, stylists, FAQs, hours, AI rules. Full CRUD with auto-save. |
| **Brain Admin** | `/brain-admin` | **Operational** | Admin for Emotional Brain. File upload, voice notes, QR tokens, storage stats, learning timeline, notes/audit, authentication. Google Drive integration. |
| **Brain** | `/brain` | **Operational (partial)** | Agent view page. Lists agents via useBrainAgents hook. |
| **Brain Upload** | `/brain-upload` | **Placeholder** | Standalone upload page. |
| **Editorial** | `/editorial` | **Operational** | Editorial content management. Visual cards, hero layout. |
| **Agenda** | `/agenda` | **Operational** | Agenda view (separate from /calendar). |
| **Settings** | `/settings` | **Operational** | App settings. |
| **Settings / Atelier Memory** | `/settings/atelier-memory` | **Operational** | Inventory settings. |
| **Salon Intelligence** | `/salon-intelligence` | **Operational** | AI salon intelligence dashboard. |
| **Studio Pulse** | `/studio-pulse` | **Operational** | Studio health/pulse dashboard. |
| **Supervisor** | `/supervisor` | **Operational** | Agent system supervisor UI. Lists managed agents, heartbeats, health checks. |
| **News** | `/news` | **Operational** | News feed. |
| **Mobile Upload** | `/mobile-upload` | **Operational** | Mobile upload page for QR-based file transfer. |
| **Login** | `/login` | **Operational** | Login page (non-functional auth — brain-admin uses session API). |
| **Admin** | `/admin` | **Operational** | Admin dashboard. |
| **Admin / AI Costs** | `/admin/ai-costs` | **Operational** | AI cost tracking. Reads from `ai-cost-store.json`. |
| **Admin / Licenses** | `/admin/licenses` | **Operational** | License management. Reads from `license-store.json`. |

---

## 5. Module: Campaigns

### Files

| File | Purpose |
|---|---|
| `src/app/campaigns/page.tsx` | Main campaign builder page (578 lines) |
| `src/app/campaigns/campaigns.module.css` | Styles (1260+ lines, 22 kB) |
| `src/app/campaigns/templateWorkflow.ts` | Workflow logic |
| `src/app/campaigns/hooks/useCampaignTemplates.ts` | Template hook |
| `src/app/campaigns/hooks/useCampaignAudience.ts` | Audience selection hook |
| `src/app/campaigns/hooks/useCampaignVisuals.ts` | Visual/theme hook |
| `src/app/campaigns/hooks/useCampaignSafety.ts` | Safety checks hook |
| `src/app/campaigns/hooks/useCampaignMetaTemplates.ts` | Meta templates hook |
| `src/app/campaigns-v2/page.tsx` | Placeholder v2 |
| `src/app/api/campaigns/route.ts` | Campaigns CRUD API |
| `src/app/api/campaigns/[id]/route.ts` | Single campaign API |
| `src/app/api/campaign-history/route.ts` | Campaign history API |
| `src/app/api/campaign-assets/route.ts` | Campaign assets API |
| `src/data/campaigns-store.ts` | JSON file store |

### State (local, no global store)

- `body` : string — textarea content
- `showEmoji` : boolean
- `fontIdx` : number [0-2] — 13/14.5/17px
- `copied` : boolean — copy feedback
- `tone` : Tone — "lujo" \| "cercano" \| "promocional" \| "educativo"
- `showPrepModal` : boolean — "Preparar envío" modal
- `prep` : PrepData — channel, audience, schedule
- `campaignStatus` : CampaignStatus — "draft" \| "prepared" \| "sent"
- `isGeneratingAI` : boolean
- `aiSuggestions` : string[] — up to 3
- `activeSuggestionIndex` : number
- `toast` : string | null

### UI Layout

```
┌──────────────────────────────────────────────────────┐
│ Hero Banner (180px, L'Oréal-style image + overlay)   │
├───────────┬────────────────────────┬─────────────────┤
│ Sidebar   │ Editor Surface         │ Right Rail      │
│ │         │ ┌────────────────────┐ │ │               │
│ Card list │ │ Textarea           │ │ Campaign Status │
│           │ │          [<]1/3[>] │ │ Audience Segmts │
│           │ │          [✨ IA]   │ │ Quick Stats     │
│           │ └────────────────────┘ │                 │
│           │ Toolbar                │                 │
│           │ 😊 Aa– Aa Aa⁺         │                 │
│           │ Lujo 📸 IG 💬 WA 💡   │                 │
│           │ 📋 Copiar             │                 │
│           │                       │                 │
│           │ [Preparar envío]      │                 │
└───────────┴────────────────────────┴─────────────────┘
```

### AI Flow (current)

```
User clicks [✨ IA]
  → handleGenerateSuggestions()
  → isGeneratingAI = true
  → Uses improveText() + applyTone() 3 times with 500ms delay
  → Sets aiSuggestions[3], activeSuggestionIndex=0
  → User navigates via [<] [>]
  → Botón IA disabled after 3 suggestions generated
```

### Known Issues / Gaps

- **No real AI API** — `improveText()` and `applyTone()` use string replacement, not LLM
- **Demo data** — Campaigns list, audience segments, body text are hardcoded
- **No campaign persistence** — JSON store exists but page never saves/loads from API
- **No send integration** — "Enviar prueba" simulates with setTimeout
- **No scheduling UI** — Date/time fields in modal are read-only or placeholder
- **No real Meta Templates** — API route exists at `/api/meta-templates` but is not connected
- **Campaigns v2** is an empty placeholder
- **No campaign history** — `/api/campaign-history` exists but not used by page

---

## 6. AI System

### AI Router

**File:** `src/lib/ai-router.ts` (331 lines)  
**Type:** Runtime provider abstraction

**Exported:**
- `runAI(taskType, prompt, context)` — main entry point
- `hasDeepSeekConfig()`, `hasXiaomiMiMoConfig()` — env checks
- Types: `AITaskType`, `AIProvider`, `AIContext`, `AIResult`

**Supported task types:**
| Task | Env mapping | Used by |
|---|---|---|
| `whatsapp_reply` | `whatsapp_reply=deepseek` | WhatsApp concierge |
| `customer_memory` | `customer_memory=xiaomi_mimo` | Not used (planned) |
| `intent_classification` | — | Not used |
| `campaign_strategy` | — | Not used |
| `growth_analysis` | — | Not used |

**Provider routing:**
1. Explicit `provider` field in context
2. `AI_TASK_PROVIDER` env mapping
3. Fallback: DeepSeek

**DeepSeek config:** `deepseek-chat` via `https://api.deepseek.com`  
**Xiaomi MiMo config:** `mimo-v2-pro` via `https://platform.xiaomimimo.com/v1`

### Active AI Flows

#### WhatsApp Concierge (Operational, real DeepSeek)
1. Webhook → `generateConciergeDecision()` → rule-based intent detection
2. If `canAutoReply` → `generateDeepSeekConciergeReply()` → `runAI("whatsapp_reply")` → DeepSeek API
3. Result sent via WhatsApp Cloud API
4. Fallback chain: Xiaomi MiMo → DeepSeek → error

#### Booking Concierge (Operational, rule-based, no LLM)
- `booking-context.ts` manages multi-turn booking state
- Rule-based extraction of service/date/time
- No LLM involved

#### Campaigns AI (Placeholder, string replacement only)
- `improveText()` — replaces 3 hardcoded strings
- `applyTone()` — string substitutions per tone
- No LLM call

#### Customer Memory (Operational, rule-based MVP, no LLM)
- `customer-memory-agent.ts` — rule-based extraction
- `AI_TASK_PROVIDER` maps it to Xiaomi MiMo but no code calls `runAI` with `"customer_memory"`

---

## 7. Customer Memory Agent

**Files:**
- `src/agents/customer-memory-agent.ts` (451 lines)
- `src/agents/customer-context-agent.ts`
- `src/data/customer-memory-store.ts`
- `src/app/api/customer-memory/route.ts`
- `src/app/api/customer-memory/[phone]/route.ts`

### Architecture

```
WhatsApp webhook
  → processCustomerMemoryIfNeeded()  (fire-and-forget)
    → processCustomerMessage()
      → extractSignalsFromText()     rule-based, no LLM
      → deriveProfileFields()
      → upsertProfile()             JSON file
```

### Signal Types (7)

`transport` (0.85), `schedule` (0.7-0.8), `stylist` (0.9), `allergy` (0.75), `price_sensitivity` (0.65), `waiting_sensitivity` (0.65-0.7), `service_interest` (0.6)

### Storage
- **File:** `src/data/customer-memory-store.json`
- **No vector DB. No embeddings. No semantic search.**

### API
- `GET /api/customer-memory` — list all profiles
- `GET /api/customer-memory/[phone]` — get profile by phone

---

## 8. WhatsApp System

### Architecture Flow

```
Meta Cloud API
  ↓ (webhook POST)
/api/whatsapp/webhook/route.ts
  ↓
normalizeWhatsAppMessage()
  ↓
attachInboundAsset()          → saves media to /public/uploads/
upsertCustomerFromMessage()   → creates/updates CustomerProfile
saveWhatsAppMessage()         → stores in whatsapp-store.json
  ↓ (if isNew)
emitWhatsAppEvent()           → SSE broadcast
  ↓ (if autoReplyEnabled)
maybeSendAutoReply()
  ├→ processCustomerMemoryIfNeeded()  (fire-and-forget)
  ├→ generateBookingConciergeDecision() → rule-based booking
  └→ generateConciergeDecision()      → intent detection
      └→ generateDeepSeekConciergeReply() → runAI() → DeepSeek
```

### File Store
- `src/app/api/whatsapp/store.ts` (808 lines)
- **File:** `src/data/whatsapp-store.json`
- Stores `WhatsAppInternalMessage` and `WhatsAppConversation`

### Message Types: text, image, audio, video, document, reaction, status
### Modes: automatic (AI on), manual (AI off), scheduled (not impl), inherit (not impl)

### Realtime (SSE)
- Endpoint: `GET /api/whatsapp/events`
- Events: `new_message`, `conversation_updated`, `message_status_updated`, `ai_draft_ready`, `ai_auto_replied`, `ai_auto_reply_blocked`, `appointment_scheduled`

---

## 9. Database — There is none.

No PostgreSQL, MySQL, SQLite, MongoDB, or any other database. No ORM (no Prisma, Drizzle, TypeORM).

### JSON File Stores (14 stores)

| File | Path |
|---|---|
| `campaigns-store.json` | `src/data/` |
| `calendar-store.json` | `src/data/` |
| `customer-memory-store.json` | `src/data/` |
| `whatsapp-store.json` | `src/data/` |
| `customers-store.json` | `src/data/` |
| `attribution-store.json` | `src/data/` |
| `ai-cost-store.json` | `src/data/` |
| `license-store.json` | `src/data/` |
| `brain-admin-store.json` | `src/data/` |
| `learning-events.json` | `src/data/` |
| `knowledge-store.json` | `src/data/` |
| `salon-config-store.json` | `src/data/` |
| `staff-store.json` | `src/data/` |
| `booking-context.json` | `src/app/api/whatsapp/` |

### Pattern (uniform across all stores)

```typescript
const dataFile = path.join(process.cwd(), "src", "data", "store-name.json");
async function readStore() { return JSON.parse(await fs.readFile(dataFile)); }
async function writeStore(data) { await fs.writeFile(dataFile, JSON.stringify(data, null, 2)); }
```

### No Zustand, no Prisma, no schema — only `useState` and JSON files.

---

## 10. Agents Architecture

### System Governance Agents (7 agents)

| Agent | File | Status |
|---|---|---|
| AgentRegistry | `agents/system/AgentRegistry.ts` | Active |
| AgentInspector | `agents/system/AgentInspector.ts` | Active |
| CuratorAgent | `agents/system/CuratorAgent.ts` | Active |
| RecoveryAgent | `agents/system/RecoveryAgent.ts` | Active |
| HealthCheckAgent | `agents/system/HealthCheckAgent.ts` | Active |
| AgentLifecycleAgent | `agents/system/AgentLifecycleAgent.ts` | Active |
| SystemSupervisorAgent | `agents/system/SystemSupervisorAgent.ts` | Active |
| BusinessEventBus | `agents/system/BusinessEventBus.ts` | Active |

### Home Agents (7 agents)

| Agent | File | Status |
|---|---|---|
| HomeOrchestratorAgent | `agents/home/HomeOrchestratorAgent.ts` | Active |
| HomeMetricsAgent | `agents/home/HomeMetricsAgent.ts` | Active |
| HomeAIInsightAgent | `agents/home/HomeAIInsightAgent.ts` | Active |
| HomeLearningAgent | `agents/home/HomeLearningAgent.ts` | Active |
| HomeDataSourceAgent | `agents/home/HomeDataSourceAgent.ts` | Active |
| HomeInspectorAgent | `agents/home/HomeInspectorAgent.ts` | Active |
| HomeHealthCheckAgent | `agents/home/HomeHealthCheckAgent.ts` | Active |

### Plus: RecommendationEngine, IntelligenceLayer, 2 consumers, EmotionalSalonOrchestrator, CustomerMemoryAgent, CustomerContextAgent

**Registered agents in AgentRegistry: 27**

---

## 11. UI Design System

### Theme: Light/Dark via `data-theme` attribute

### Key Colors (Light)
- Primary: `#7c5cff`
- BG: `#f7f6fb`
- Champagne: `#c6a36d`
- Glass surface: `rgba(255,255,255,0.68)`
- Glass border: `rgba(197,184,229,0.25)`

### Typography
- Display: Outfit
- UI: Inter
- Fallbacks: Montserrat, Arimo

### Shared Components (10)

AppShell, Sidebar, StatusBadge, EmptyState, Skeleton, MetricCard, PageLayout, PageHeader, AIBadge, LiquidGlass

---

## 12. Environment Variables (17 variables)

`WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `XIAOMI_MIMO_API_KEY`, `XIAOMI_MIMO_BASE_URL`, `XIAOMI_MIMO_MODEL`, `AI_TASK_PROVIDER`, `BRAIN_ADMIN_KEY`, `GOOGLE_DRIVE_ENABLED`, `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `BRAIN_STORAGE_QUOTA_MB`, `NEXT_PUBLIC_LAN_HOST`

---

## 13. Critical Files (Top 50)

| # | Path | Purpose | Criticality |
|---|---|---|---|
| 1 | `src/lib/ai-router.ts` | AI provider routing | Critical |
| 2 | `src/app/api/whatsapp/webhook/route.ts` | WhatsApp webhook | Critical |
| 3 | `src/app/api/whatsapp/store.ts` | Message store | Critical |
| 4 | `src/app/api/whatsapp/sender.ts` | Message sender | Critical |
| 5 | `src/app/api/whatsapp/ai-concierge.ts` | AI concierge | Critical |
| 6 | `src/app/api/whatsapp/booking-context.ts` | Booking state | Critical |
| 7 | `src/app/api/whatsapp/realtime.ts` | SSE events | Critical |
| 8 | `src/app/api/whatsapp/normalizer.ts` | Message normalization | Critical |
| 9 | `src/agents/customer-memory-agent.ts` | Memory extraction | Critical |
| 10 | `src/agents/customer-context-agent.ts` | Context builder | Critical |
| 11 | `src/data/customer-memory-store.ts` | Memory store | Critical |
| 12 | `src/app/api/customers/store.ts` | Customer store | Critical |
| 13 | `src/app/globals.css` | Design system | High |
| 14 | `src/app/layout.tsx` | Root layout | High |
| 15 | `src/app/components/Sidebar.tsx` | Navigation | High |
| 16 | `src/app/components/AppShell.tsx` | Layout shell | High |
| 17 | `src/app/components/sidebarUnreadStore.ts` | Unread store | High |
| 18 | `src/app/inbox/page.tsx` | Inbox UI | High |
| 19 | `src/app/campaigns/page.tsx` | Campaigns UI | High |
| 20 | `src/app/page.tsx` | Home dashboard | High |
| 21 | `src/app/analytics/page.tsx` | Analytics UI | High |
| 22 | `src/app/brain-admin/page.tsx` | Brain admin UI | High |
| 23 | `src/app/knowledge/page.tsx` | Knowledge UI | High |
| 24 | `src/agents/system/AgentRegistry.ts` | Agent registry | High |
| 25 | `src/agents/system/SystemSupervisorAgent.ts` | Supervisor | High |
| 26 | `src/agents/system/BusinessEventBus.ts` | Event bus | High |
| 27 | `src/agents/system/startup.ts` | Startup sequence | High |
| 28 | `src/agents/home/HomeOrchestratorAgent.ts` | Home coordinator | High |
| 29 | `src/agents/home/recommendations/RecommendationEngine.ts` | Recommendations | High |
| 30 | `src/agents/home/intelligence/IntelligenceLayer.ts` | Intelligence | High |
| 31 | `src/repositories/AppointmentRepository.ts` | Appointment data | High |
| 32 | `src/repositories/ClientRepository.ts` | Client data | High |
| 33 | `src/repositories/LearningEventRepository.ts` | Learning events | High |
| 34 | `src/repositories/KpiMetricsRepository.ts` | KPI data | High |
| 35 | `src/bridges/HomeBridge.ts` | Home bridge | High |
| 36 | `src/app/lib/serviceMatcher.ts` | Text matcher | High |
| 37 | `src/components/inbox/ChatPanel.tsx` | Chat UI | High |
| 38 | `src/components/inbox/ConversationsPanel.tsx` | Conversation list | High |
| 39 | `src/components/inbox/AssistantRail.tsx` | AI rail | High |
| 40 | `src/hooks/inbox/useInboxThreads.ts` | Thread hook | High |
| 41 | `src/hooks/inbox/useInboxSelection.ts` | Selection hook | High |
| 42 | `src/app/api/appointments/route.ts` | Appointments API | High |
| 43 | `src/app/api/calendar/appointments/route.ts` | Calendar API | High |
| 44 | `src/app/api/campaigns/route.ts` | Campaigns API | Medium |
| 45 | `src/data/campaigns-store.ts` | Campaign store | Medium |
| 46 | `src/app/api/knowledge/store.ts` | Knowledge store | Medium |
| 47 | `src/config/ai-pricing.ts` | AI pricing | Medium |
| 48 | `src/config/featureFlags.ts` | Feature flags | Medium |
| 49 | `src/app/api/brain-admin/session/route.ts` | Admin auth | Medium |
| 50 | `src/agents/system/RecoveryAgent.ts` | Recovery | Medium |

---

## 14. Technical Debt

### Critical
1. **No real database** — JSON files only. No concurrency, no indexing, no migrations.
2. **No authentication** — Brain-admin key only. Login page is visual.
3. **No error boundaries** — Any React crash kills the entire UI.
4. **Hardcoded demo data** — Campaigns, audience segments, home metrics.
5. **Campaign AI is string replacement** — `improveText()` uses `.replace()`, not an LLM.
6. **Campaign send is simulated** — No actual WhatsApp integration from campaigns.
7. **WhatsApp store unbounded growth** — No pagination, archival, or TTL.
8. **Customer memory is rule-based only** — `runAI("customer_memory")` never called.
9. **No request validation** — Most API routes accept unvalidated input.
10. **No CSP or security headers** — `next.config.ts` is empty.

### High
11. Two Xiaomi MiMo API keys in env (one likely stale).
12. `next.config.ts` empty — no image domains, CORS, or headers.
13. No CI/CD — no Docker, no GitHub Actions, no deployment config.
14. No responsive design — assumes desktop viewport.
15. No monitoring — only `console.log`/`console.warn`.

---

## 15. Dependencies (package.json)

### Production (7)
next 16.2.6, react 19.2.4, react-dom 19.2.4, lucide-react 1.16.0, framer-motion 12.39.0, html2canvas 1.4.1, react-day-picker 10.0.1

### Dev (7)
typescript ^5, @types/react ^19, @types/react-dom ^19, @types/node ^20, eslint ^9, eslint-config-next 16.2.6, jest ^30.4.2, ts-jest ^29.4.11, @types/jest ^30.0.0

### Notable Absences
No database, no ORM, no state management, no HTTP client, no validation, no CSS framework, no queue, no cache, no auth library, no Testing Library.

---

*End of architecture report — generated from actual source code.*

