# CP-85 Extraction Plan — Clients/Muses Page (200 lines)

**Status:** 📋 Audit complete — extraction plan ready  
**Source file:** `src/app/clients/page.tsx`  
**Sidebar label:** "Muses" → `/clients`  
**Current size:** 200 lines  
**Target:** ~80-100 lines  

---

## 1. Current State

### File: `src/app/clients/page.tsx` (200 lines)

**Data:** ✅ Hardcoded `muses` array (3 items) — **no API integration**  
**API:** ❌ No fetch calls — pure static mock data  
**CSS:** ❌ No CSS module — all inline styles via `style={{}}`  
**Sidebar:** ✅ Linked from Grupo "Contenido" → "Muses"  

### What the page renders
- **Left column:** Searchable list of 3 muses with avatar, name, tier, last visit
- **Center column:** Selected muse portrait with header + style dossier quote + experience log (history table)
- **Right column:** Intelligence rail — LTV display, AI recommendation, dossier details (phone, last ritual, segment)

### Current data shape (hardcoded `muses` array)
```ts
{
  id: number;           // numeric
  name: string;
  initials: string;
  tier: "VIP" | "New" | "Classic";
  avatar: string;       // Unsplash URL
  phone: string;
  lastVisit: string;    // formatted date string
  notes: string;
  insight: string;      // AI-style recommendation
  history: {            // service history
    service: string;
    date: string;
    specialist: string;
    price: string;
  }[];
}
```

---

## 2. Existing API: `/api/customers`

### Endpoint
```
GET /api/customers → { ok: true, customers: CustomerProfile[] }
```

### API `CustomerProfile` shape (from `store.ts`)
```ts
{
  id: string;               // UUID
  phone: string;
  displayName: string;
  firstName: string;
  tags: string[];           // e.g. ["vip", "balayage-interest"]
  interests: string[];
  requestedServices: string[];
  lastVisit: string | null;  // ISO date or null
  lastConversationAt: string;
  preferredStylist: string | null;
  favoriteServices: string[];
  uploadedAssets: string[];
  campaignEligible: boolean;
  consentWhatsapp?: boolean;
  notes: string;
  aiSummary: string;
  lifecycleStage: string;    // e.g. "imported", "lead", "vip"
}
```

### Data persistence
- **Type:** JSON file on disk (`data/customers/customers.json`)
- **Source:** Imported from CSV/XLSX via the contacts page, auto-created from WhatsApp messages, or manually
- **Used by:** Contacts page (reads), WhatsApp store (upserts from messages)

---

## 3. Gap Analysis: Hardcoded → API

| Field in clients page | API has it? | Mapping / Notes |
|-----------------------|-------------|-----------------|
| `id` | ✅ `id` (string vs number) | Convert to string |
| `name` | ✅ `displayName` ✅ `firstName` | Use `displayName ?? firstName` |
| `initials` | ❌ Not stored | Derived from `firstName` (already done in contacts page) |
| `tier` | ⚠️ Not direct | `tags.includes("vip")` + `lifecycleStage` → derive |
| `avatar` | ❌ Not stored | Use fallback generated avatar / initials |
| `phone` | ✅ `phone` | Direct match |
| `lastVisit` | ✅ `lastVisit` (ISO) | Format for display |
| `notes` | ✅ `notes` | Direct match |
| `insight` | ✅ `aiSummary` | Direct match |
| `history[]` | ❌ Not stored | Requires new API endpoint or field |

### Critical Gap: Service History
The `history[]` array (service date, specialist, price) **does not exist** in the API. This is the most valuable data in the muses view. Two options:

- **Option A** (recommended): Add a `/api/customers/[id]/history` endpoint backed by appointment data
- **Option B** (fast path): Remove history display and use `favoriteServices` + `requestedServices` instead
- **Option C** (safer for CP-85): Keep history as a separate static fallback, add API integration in a later CP

**Recommendation for CP-85:** Option A — add history field to API or create a sub-endpoint. Without it, the muses page loses its primary value.

---

## 4. Extraction Plan

### Phase breakdown

| CP | Task | Est. Δ | Description |
|----|------|--------|-------------|
| **CP-85a** | Add history field to API + route | — | Add `serviceHistory[]` to `CustomerProfile` in `store.ts`, create `GET /api/customers/[id]` or extend existing route |
| **CP-85b** | Create `useClientsData` hook | ~40 lines | Fetch from `/api/customers`, manage selection state, format data for view |
| **CP-85c** | Create `MuseList` component | ~50 lines | Left column: search + list with avatar/initials, name, tier, last visit |
| **CP-85d** | Create `MusePortrait` component | ~50 lines | Center column: header + dossier quote + service history |
| **CP-85e** | Create `MuseIntelligenceRail` component | ~40 lines | Right column: LTV, AI insight, dossier details |
| **CP-85f** | Update page.tsx integration | ~20 lines | Replace inline JSX with components, integrate hook |

### Estimated reduction
- **Before:** 200 lines (all inline)
- **After:** ~80-100 lines (7-line hook + 3 components × ~30 lines average)
- **Reduction:** ~50-60%

### Estimated checkpoints: 3-5 (depending on API changes)

### Candidate hook: `useClientsData`
```
States: museList, activeMuseId, searchQuery
Data: fetch("/api/customers") → map to Muse type
Derived: filtered muses, active muse
```

### Candidate components
| Component | Est. Lines | Props | Purpose |
|-----------|-----------|-------|---------|
| `MuseList` | ~50 | `muses`, `activeId`, `searchQuery`, `onSelect`, `onSearchChange` | Left column |
| `MusePortrait` | ~50 | `muse` | Center column: header + dossier + history |
| `MuseIntelligenceRail` | ~40 | `muse` | Right column: LTV + AI insight + details |

---

## 5. CSS Assessment

**Current state:** 100% inline styles (`style={{}}`) — no CSS module imported  
**Contacts page:** Uses `contacts.module.css` — has a CSS module to reference  
**Risk:** Extracting components will need a CSS module. Two options:

- **Option A** (recommended): Create `clients.module.css` — allows clean extraction, no visual changes
- **Option B**: Keep inline styles in extracted components

**Recommendation:** Option A — it's one file and eliminates future style tech debt.

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Service history not in API | 🔴 High | Add to store.ts / create sub-route in CP-85a |
| Avatar not in API | 🟡 Medium | Use initials-based fallback (contacts page already does this) |
| Tier/segment not directly stored | 🟡 Medium | Derive from `tags` + `lifecycleStage` (contacts page has precedent) |
| No CSS module yet | 🟢 Low | Create `clients.module.css` |
| `initials` derivation | 🟢 Low | Reuse `firstName` logic from contacts page |
| Page is small (200 lines) | 🟢 Low | Low risk of breaking; easy to roll back |

---

## 7. Recommended Order

| Step | Action | Risk | Effort |
|------|--------|------|--------|
| **0** | **Pre-CP-85a:** Add service history to API (`store.ts`, `route.ts`) | 🔴 High | ~2h |
| **1** | CP-85a: Create `useClientsData` hook | 🟢 Low | ~30 min |
| **2** | CP-85b: Create `MuseList` component | 🟢 Low | ~20 min |
| **3** | CP-85c: Create `MusePortrait` component | 🟢 Low | ~30 min |
| **4** | CP-85d: Create `MuseIntelligenceRail` component | 🟢 Low | ~20 min |
| **5** | CP-85e: Update page.tsx, create CSS module | 🟢 Low | ~15 min |

**Total:** ~3-5 checkpoints, ~4 hours, 200 → ~80-100 lines
