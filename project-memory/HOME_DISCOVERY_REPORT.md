# Home Discovery Report

## Project
Salon_Belleza (SendMe Studio)

## Date
2026-05-29 @ 23:15 UTC

## Phase
Phase 2.0 — Home Discovery & Mapping (Pre-Agent Creation)

## 1. Home Route Files

| File | Role | Lines |
|------|------|-------|
| `src/app/page.tsx` | Main Home page (dashboard) | ~1399 |
| `src/app/page.module.css` | Home styles | ~2110 |
| `src/app/components/AppShell.tsx` | Layout wrapper (sidebar + main) | 26 |
| `src/app/components/Sidebar.tsx` | Navigation sidebar | - |
| `src/app/components/Sidebar.module.css` | Sidebar styles | - |
| `src/app/components/AIBadge.tsx` | "AI" badge component | 15 |
| `src/app/components/LiquidGlass.tsx` | Glassmorphic UI element | - |
| `src/app/components/sidebarUnreadStore.ts` | Unread message store | 154 |

## 2. Home Components (inline in page.tsx)

The Home page uses inline components (no separate component files):

- `ClientAvatar` — Renders initials avatar
- `renderBilingual` — Bilingual display helper (ES/EN)
- Helper functions: `getClientIntelligence`, `formatClientName`, `getStylistFullName`, `stylistPhotoFor`, `getStageIcon`, `clientInitialsFor`, `chileMinutesNow`, `appointmentMinutes`, `appointmentProgress`, `chileTimeLabel`, `arrivalBehaviorLabel`, `calculatePlatformHealth`

## 3. Home Widgets / Cards Identified

| # | Widget | Location |
|---|--------|----------|
| 1 | **Salon Hero** (logo + branding) | Lines 936-944 |
| 2 | **Header Feed** (rotating operational tips) | Lines 946-964 |
| 3 | **Weather + Date/Time** | Lines 954-963 |
| 4 | **Appointment Flow List** (left column) | Lines 870-932 |
| 5 | **Client Focus Card** (selected appointment) | Lines 967-1032 |
| 6 | **KPI Row** (4 metric cards) | Lines 1034-1067 |
| 7 | **Platform Health Card** | Lines 1035-1050 |
| 8 | **Dossier: Emotional Profile** | Lines 1100-1162 |
| 9 | **Dossier: Material Intelligence** | Lines 1164-1203 |
| 10 | **Dossier: Customer Lifetime Value** | Lines 1206-1252 |
| 11 | **Dossier: Arrival Behavior** | Lines 1255-1277 |
| 12 | **Dossier: AI Alerts** | Lines 1280-1296 |
| 13 | **Dossier: AI Recommendation** | Lines 1299-1317 |
| 14 | **Dossier: Technical History** | Lines 1320-1347 |
| 15 | **Dossier: Technical Parameters (modo técnico)** | Lines 1350-1390 |

## 4. Home Metrics / KPIs

| Metric | Value (mock) | Source | Real/Mock |
|--------|-------------|--------|-----------|
| Ventas hoy | $2.840.000 | Hardcoded in `metrics` array | ❌ Mock |
| Potencial | $3.420.000 | Hardcoded | ❌ Mock |
| Ocupación | 81% | Hardcoded | ❌ Mock |
| Platform Health Score | 92% (Healthy) | localStorage templates | ⚠️ Partially real (reads localStorage) |

## 5. Data Sources

| Source | Type | Used By |
|--------|------|---------|
| Hardcoded `appointments` array | Inline data | Flow list, Client Focus, all dossier sections |
| `/api/appointments` endpoint | API (reads `data/appointments.json`) | Live appointment list (merged with hardcoded) |
| `localStorage("dashboard:arrival-records")` | Browser storage | Arrival behavior widget |
| `localStorage("campaigns:meta-templates")` | Browser storage | Platform Health score |
| `localStorage("campaigns:template-health-history")` | Browser storage | Platform Health score |
| `localStorage("modo-tecnico-ia")` | Browser storage | Tech mode toggle |
| `/img/booking/*.webp` | Static images | Stylist avatars |
| `/img/servicios/Balayage_Premium.png` | Static image | Service graphic |
| `/img/logo-white.svg` | Static image | Salon logo |

## 6. API / Service Dependencies

| Service | Endpoint | Import |
|---------|----------|--------|
| Appointments API | `GET /api/appointments` | Direct fetch in page.tsx |
| Unread Messages Store | `sidebarUnreadStore.ts` | Imported by Sidebar |

**Not directly imported by Home but relevant:**
- `src/app/api/whatsapp/store.ts` (analytics events)
- `src/app/api/whatsapp/realtime.ts` (appointment events)

## 7. WhatsApp Data Used by Home

- Appointments created from Inbox WhatsApp conversations appear in the live list
- No direct WhatsApp message data is displayed on Home
- `sidebarUnreadStore` shows unread count in sidebar (not Home page itself)

## 8. Meta Data Used by Home

- Campaign template rejection/risk data from localStorage (Platform Health card)
- No direct Meta API calls on the Home page

## 9. Local Database / Data Files

| File | Format | Content |
|------|--------|---------|
| `data/appointments.json` | JSON | Real appointments from WhatsApp bookings (may be empty) |
| `data/knowledge/` | JSON/MD | Services, FAQs, stylists (not directly used by Home) |
| `data/customers/` | JSON | Customer data (not directly used by Home) |

## 10. Business Brain Dependencies

- None directly. The Emotional Business Brain (`/brain-admin`) is a separate admin panel.
- Home does not import or query the brain.

## 11. AI / Insight Blocks

All AI blocks are powered by **hardcoded mock data** in `appointments[].clientIntelligence`:

- **Emotional Profile**: decision style, response style, ideal tone, anxiety level, price sensitivity, visual validation
- **Material Intelligence**: avg cost, brands, colorations, session time, margin
- **Customer Lifetime Value**: LTV, avg ticket, annual visits, repurchase
- **AI Alerts**: 3 per client (hardcoded)
- **AI Recommendations**: 3 per client (hardcoded)
- **Technical History**: tones used, recent services, observations, preferences
- **Technical Parameters** (tech mode): confidence score, temperature, embeddings distance

## 12. Loading States

- Appointment fetch: ✅ silent catch (keeps mock data on failure)
- Platform Health: ✅ fallback to default 92/Healthy
- No explicit loading spinners/skeletons for any widget

## 13. Error States

- Appointment fetch fails: ✅ silent, keeps mock data
- localStorage parse fails: ✅ try/catch with defaults
- No explicit error UI for any widget

## 14. Empty States

- No appointments: shows all mock data (the hardcoded appointments always render)
- No arrival records: shows "Sin registro de llegada"
- No booked appointments: silently merged into live list (mock data always present)

## 15. Hardcoded / Mock Data

| Data | Lines | Impact |
|------|-------|--------|
| `appointments` array (5 clients) | 29-339 | Core of ALL dossier and recommendation data |
| `defaultClientIntelligence` | 342-380 | Fallback for missing client data |
| `headerFeed` (6 items) | 389-414 | Rotating header tips |
| `metrics` (3 KPIs) | 416-420 | Sales, potential, occupancy |
| `stylistPhotos` | 422-430 | 7 stylist photos for hashing |
| Dashboard date | 27 | Hardcoded "Jueves, 21 de Mayo 2026" |

## 16. Real Data

| Data | Source | Limitations |
|------|--------|-------------|
| Booked appointments | `/api/appointments` | Only shows appointments from Inbox bookings |
| Platform Health | localStorage | Only works if campaign data was previously saved |
| Current time/date | `Date()` | Real-time clock (30s interval) |
| Arrival records | localStorage | Manual registration per appointment |

## 17. Data That Should Feed Intelligence

| Data Point | Currently Feed Intelligence? | Recommended Agent |
|------------|:---------------------------:|-------------------|
| Appointments created | ❌ No | HomeLearningAgent |
| Client arrival behavior | ❌ No | HomeLearningAgent |
| Platform health score | ❌ No | HomeLearningAgent |
| Emotional profile selections | ❌ No | HomeLearningAgent |
| Service preferences | ❌ No | HomeLearningAgent |
| LTV / repurchase rates | ❌ No | HomeLearningAgent |
| AI recommendation acceptance | ❌ No | HomeLearningAgent |
| Appointment status changes | ❌ No | HomeLearningAgent |

## 18. Broken or Unclear Data Flows

| Issue | Description | Risk |
|-------|-------------|------|
| **Mock data masks missing real data** | If `data/appointments.json` is empty, the page still looks fully functional | High — hard to debug |
| **Client dossier uses hardcoded IDs** | `ana-lopez`, `carla-mendez` are mock IDs that won't match real data | High — dossier broken for real appointments |
| **Platform Health uses localStorage** | Campaign data stored in browser, not server | Medium — not persistent across devices |
| **Arrival records in localStorage** | Lost on browser clear or device change | Low — acceptable for MVP |
| **Hardcoded date** | "Jueves, 21 de Mayo 2026" is hardcoded but real date also rendered | Low — cosmetic |
| **Merged appointment lists** | Live + mock data merged without deduplication or distinction | Medium — could show duplicates |
| **Stylist photos via hash** | Deterministic hash from name to a set of 7 photos | Low — acceptable for now |

## 19. Potential Agents Needed for Home

| Agent | Priority | Reason |
|-------|----------|--------|
| **HomeOrchestratorAgent** | Critical | Coordinate all widgets, merge data sources, manage state |
| **HomeDataSourceAgent** | Critical | Identify and resolve data provenance (mock vs real, localStorage vs API) |
| **HomeInspectorAgent** | High | Detect missing real data, broken dossier for real appointments |
| **HomeHealthCheckAgent** | High | Verify widget rendering, data freshness, API connectivity |
| **HomeLearningAgent** | High | Forward appointment data, client behavior, service preferences to Intelligence |
| **HomeMetricsAgent** | Medium | Calculate real KPI values instead of hardcoded metrics |
| **HomeAIInsightAgent** | Medium | Provide real AI insights instead of hardcoded recommendations |

## 20. What Should Not Be Touched During Home Refactor

- **AppShell layout** — works correctly, wraps all pages
- **Sidebar navigation** — shared across all sections
- **CSS module** (`page.module.css`) — styling only, no logic
- **AIBadge component** — simple reusable component
- **LiquidGlass component** — decorative only
- **sidebarUnreadStore** — shared across sections (Home just uses the sidebar)

## Summary

- **Home files found:** 1 main page, 1 CSS module, 4 components (shared)
- **Widgets found:** 15 widgets/sections
- **Data sources:** 3 API + 4 localStorage + hardcoded
- **Real vs mock data:** 90% mock, 10% real
- **AI/insight blocks found:** 7 dossier sections, all hardcoded
- **Home agents recommended:** 7 agents (5 critical, 2 medium)
- **Risks detected:** Mock data masking broken real flows, dossier broken for real appointments, no intelligence pipeline
- **Next exact step:** Create Home agents starting with HomeOrchestratorAgent, HomeDataSourceAgent, HomeInspectorAgent
