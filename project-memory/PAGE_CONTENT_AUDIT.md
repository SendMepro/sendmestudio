# PAGE CONTENT AUDIT

**Date:** 2026-05-30T09:20 UTC  
**Source:** All 17 page.tsx files + sidebar configuration  

---

## 1. Complete Page Inventory

Sorted by line count (largest → smallest).

| # | Route | File | Lines | Real Content | Real API | Mock Data | Placeholder | Prod Ready | Est. Complete |
|---|-------|------|-------|-------------|----------|-----------|-------------|------------|---------------|
| 1 | `/inbox` | `inbox/page.tsx` | 1,515 | ✅ Full messaging UI | ✅ WhatsApp API (hooks) | ✅ Threads seed data (static) | ❌ None | **✅ Yes** | **100%** |
| 2 | `/` (Home) | `page.tsx` | 1,313 | ✅ Full dashboard | ✅ Bridge + APIs (agents) | ✅ Appointments (hardcoded) | ❌ None | **⚠️ Partial** | **85%** |
| 3 | `/campaigns` | `campaigns/page.tsx` | 965 | ✅ Full campaign manager | ❌ localStorage only | ✅ Campaign templates (hardcoded) | ❌ None | **⚠️ Partial** | **70%** |
| 4 | `/brain-admin` | `brain-admin/page.tsx` | 861 | ✅ Brain admin panel | ✅ 12 API endpoints (hooks) | ✅ emptySummary seed | ❌ None | **✅ Yes** | **100%** (refactor 50%) |
| 5 | `/knowledge` | `knowledge/page.tsx` | 717 | ✅ Knowledge base editor | ✅ `/api/knowledge` CRUD | ❌ Fresh state if empty | ❌ None | **✅ Yes** | **90%** |
| 6 | `/mobile-upload` | `mobile-upload/page.tsx` | 670 | ✅ File upload UI | ✅ Brain upload API | ❌ None | ❌ None | **✅ Yes** | **100%** |
| 7 | `/brain-upload` | `brain-upload/page.tsx` | 628 | ✅ File upload UI | ✅ Brain upload API | ❌ None | ❌ None | **✅ Yes** | **100%** |
| 8 | `/studio-pulse` | `studio-pulse/page.tsx` | 351 | ✅ Studio dashboard | ❌ Static mock data only | ✅ pulseSignals (hardcoded) | ❌ None | **⚠️ Partial** | **50%** |
| 9 | `/editorial` | `editorial/page.tsx` | 289 | ✅ Editorial calendar | ❌ Static mock data only | ✅ calendar data (hardcoded) | ❌ None | **⚠️ Partial** | **50%** |
| 10 | `/contacts` | `contacts/page.tsx` | 206 | ✅ Customer profiles | ✅ `/api/customers` | ❌ Falls back to empty | ❌ None | **✅ Yes** | **95%** |
| 11 | `/clients` (Muses) | `clients/page.tsx` | 200 | ✅ VIP muses list | ❌ Static mock data only | ✅ muses (hardcoded) | ❌ None | **⚠️ Partial** | **40%** |
| 12 | `/analytics` | `analytics/page.tsx` | 167 | ✅ Analytics dashboard | ❌ Static mock data only | ✅ KPI_DATA + INSIGHTS (hardcoded) | ❌ None | **⚠️ Partial** | **40%** |
| 13 | `/settings` | `settings/page.tsx` | 146 | ✅ Settings form | ❌ Local state only | ✅ Default values | ❌ None | **⚠️ Partial** | **40%** |
| 14 | `/settings/atelier-memory` | `settings/atelier-memory/page.tsx` | 138 | ✅ Atelier settings | ❌ Local state only | ✅ Default values | ❌ None | **⚠️ Partial** | **40%** |
| 15 | `/salon-intelligence` | `salon-intelligence/page.tsx` | 128 | ✅ Module cards UI | ❌ Static mock data only | ✅ modules (hardcoded) | ❌ None | **⚠️ Partial** | **30%** |
| 16 | `/agenda` | `agenda/page.tsx` | 108 | ✅ Day agenda | ✅ `/api/appointments` | ✅ agendaItems fallback | ❌ None | **✅ Yes** | **90%** |
| 17 | `/login` | `login/page.tsx` | 72 | ✅ Login form | ❌ Mock timeout redirect | ❌ None | ❌ None | **⚠️ Partial** | **60%** |

**Missing route:** `/ventas` — sidebar entry with no corresponding page (404).

---

## 2. Page Classification

### ✅ Production-Ready (8 pages)
Pages with real API data, full functionality, no stubs:
| Route | Lines | API |
|-------|-------|-----|
| `/inbox` | 1,515 | WhatsApp + SSE |
| `/brain-admin` | 861 | 12 Brain endpoints |
| `/contacts` | 206 | `/api/customers` |
| `/agenda` | 108 | `/api/appointments` |
| `/knowledge` | 717 | `/api/knowledge` CRUD |
| `/mobile-upload` | 670 | Brain upload API |
| `/brain-upload` | 628 | Brain upload API |
| `/` (Home) | 1,313 | Bridge + agents + APIs ⚠️ (mock appointments) |

### ⚠️ Static/Mock-Only Pages (8 pages)
Pages with hardcoded data, no API integration — they render real UI but data is fake:
| Route | Lines | Data Source |
|-------|-------|-------------|
| `/studio-pulse` | 351 | `pulseSignals` mock array |
| `/editorial` | 289 | Static calendar data |
| `/clients` (Muses) | 200 | `muses` mock array |
| `/analytics` | 167 | `KPI_DATA` + `INSIGHTS` mock |
| `/settings` | 146 | Local state, defaults |
| `/settings/atelier-memory` | 138 | Local state, defaults |
| `/salon-intelligence` | 128 | `modules` mock array |
| `/login` | 72 | `setTimeout` redirect (no real auth) |

### 🔴 Broken (1 route)
| Route | Problem |
|-------|---------|
| `/ventas` | No page file exists — sidebar links to 404 |

---

## 3. Data Source Summary

| Data Source | Pages Using It |
|-------------|----------------|
| **Real API calls** (`fetch`) | agenda, contacts, knowledge, mobile-upload, brain-upload, brain-admin (via hooks), home (via bridge) |
| **localStorage only** | campaigns (templates), home (arrival records) |
| **Hardcoded static data** | studio-pulse, editorial, clients, analytics, salon-intelligence |
| **Local state only (no persistence)** | settings, atelier-memory, login |
| **No data at all** | — |

---

## 4. Rankings

### Most Complete Pages
1. **`/inbox`** — Full WhatsApp messaging with real-time SSE, real API, 6 extracted hooks, 6 components
2. **`/brain-admin`** — 12 API endpoints, real-time SSE, file upload, voice, notes, QR, auth — 19 extracted files
3. **`/knowledge`** — Full CRUD editor with auto-save, 9 modules, completion scoring
4. **`/contacts`** — Real customer API with search, filter, pagination
5. **`/agenda`** — Real appointments API with static fallback

### Highest Business Value
1. **`/inbox`** — Core WhatsApp communication with clients
2. **`/` (Home)** — Daily operational dashboard for salon staff
3. **`/campaigns`** — Marketing campaign management (partial — localStorage only)
4. **`/brain-admin`** — Business intelligence upload/processing
5. **`/contacts`** — Customer relationship management

### Fastest to Finish (mock→real API conversion)
1. **`/clients` (Muses)** — 200 lines, simple static array → `/api/customers` already exists (used by contacts page) — **~2h**
2. **`/analytics`** — 167 lines, 3 KPI cards + 3 insights → could reuse `/api/analytics` — **~2h**
3. **`/salon-intelligence`** — 128 lines, 6 static module cards → could use brain-admin data — **~1h**
4. **`/settings`** — 146 lines, local state → `/api/settings` — **~2h**
5. **`/settings/atelier-memory`** — 138 lines, local state → `/api/settings/atelier` — **~2h**
6. **`/studio-pulse`** — 351 lines, complex mock signals → `/api/studio/pulse` — **~4h**
7. **`/editorial`** — 289 lines, static calendar → `/api/editorial` — **~4h**
8. **`/login`** — 72 lines, fake auth → real auth — **~3h**

---

## 5. Total Lines Breakdown

| Category | Lines | % of Total |
|----------|-------|------------|
| **Production pages** (8 pages) | 6,018 | 65% |
| **Static/mock pages** (8 pages) | 1,691 | 18% |
| **Broken routes** (1 route) | 0 | 0% |
| **Project root (not pages)** | ~1,545 | 17% |
| **Total all page.tsx** | **~9,254** | 100% |

---

## 6. Key Observations

1. **Inbox is the most complete page** at 1,515 lines — already extracted into hooks + components, real WhatsApp API, SSE, full feature set
2. **Brain-admin raw functionality is complete** — the refactor (50% done) is cosmetic/sizing only, not feature-gap
3. **Campaigns use localStorage instead of API** — data is persisted only in browser, lost on clear or different device
4. **Studio-pulse and editorial have the most detailed mock data** — they look real but have zero API integration
5. **Settings pages have zero persistence** — refresh loses all changes
6. **Login uses fake auth** — `setTimeout` redirect, no actual authentication (separate from brain-admin auth)
7. **All static-mock pages render meaningful UI** — they're not empty stubs, they just lack real data connections

---

## 7. Recommended Action Order

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| **1** | Create `/ventas` page or remove sidebar entry | 5 min | Fixes 404 |
| **2** | Complete brain-admin refactor (CP-85 onward) | ~9 CPs | Reduces largest page further |
| **3** | Connect campaigns to real API (replace localStorage) | 1-2 CPs | Data persistence |
| **4** | Connect clients/muses to `/api/customers` | 1 CP | Reuses existing endpoint |
| **5** | Connect analytics to `/api/analytics` | 1 CP | Real metrics |
| **6** | Connect settings to persistence layer | 1-2 CPs | Data persistence |
| **7** | Connect studio-pulse to real data | 2-3 CPs | Real signals |
| **8** | Connect editorial to real data | 2 CPs | Real calendar |
| **9** | Connect salon-intelligence to real data | 1 CP | Real modules |
| **10** | Implement real login auth | 1 CP | Security |
