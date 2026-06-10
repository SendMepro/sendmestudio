# CP-86 — Contacts Merge Audit: Absorb Clients/Muses

**Date:** 2026-05-30T09:37 UTC  
**Goal:** Determine whether `/clients` (Muses) can be safely merged into `/contacts`, and produce an implementation plan  
**Constraints:** No code changes, no file deletion, no sidebar changes, no API changes for this audit  

---

## 1. Current Contacts Structure

### File: `src/app/contacts/page.tsx` (206 lines)

**Sections rendered** (top → bottom):

| Section | CSS Class | Content | Lines |
|---------|-----------|---------|-------|
| 1. Hero panel | `.heroPanel` | Kicker "Audiencia CRM", title "Gestor de contactos", description paragraph, total count card | 113–124 |
| 2. Stats grid | `.statsGrid` | 4 KPI cards: VIP, Balayage, Inactivas, Leads cálidos | 126–131 |
| 3. Toolbar | `.toolbar` | Search box + 5 filter buttons (Todos, VIP, Balayage, Inactivas, Leads cálidos) | 133–153 |
| 4. Contacts panel | `.contactsPanel` | Header "Audiencia importada" + `visibleContacts.length` + "Importado desde CSV/XLSX" badge | 156–163 |
| 5. Contacts list | `.contactsList` | Scrollable list of `.contactCard` articles | 165–206 |

### Contact card layout (per item)
```
[avatar] [name + import badge]   [requested service]   [last visit]   [consent badge]
         [phone]
         [tags row]
```
- **CSS:** Grid layout: `48px | minmax(180px, 1fr) | minmax(120px, .5fr) | minmax(112px, .45fr) | auto`
- **Click action:** ✅ None — cards are pure display, no click handler

### Data flow
```
useEffect → fetch("/api/customers") → data.customers → customers state
                                                    → stats (derived)
                                                    → visibleContacts (derived: search + filter)
```

### Local helpers
| Helper | Purpose |
|--------|---------|
| `isImported()` | Checks `lifecycleStage === "imported"` or aiSummary contains "imported" |
| `isInactive()` | Returns true if no lastVisit or >60 days since last visit |
| `hasService()` | Checks `requestedServices` array for a service substring |
| `initialsFor()` | Derives 2-char initials from firstName, displayName, or phone |

---

## 2. Current `/api/customers` Data Shape

### Endpoint
```
GET /api/customers  →  { ok: true, customers: CustomerProfile[] }
```

### Full `CustomerProfile` (from `store.ts`)
```ts
{
  id: string;                     // UUID
  phone: string;                  // Normalized phone
  displayName: string;            // Full display name
  firstName: string;              // Extracted first name
  tags: string[];                 // e.g. ["vip", "balayage-interest", "whatsapp-consent"]
  interests: string[];            // e.g. ["balayage", "color"]
  requestedServices: string[];    // e.g. ["balayage"]
  lastVisit: string | null;       // ISO date string or null
  lastConversationAt: string;     // ISO timestamp
  preferredStylist: string | null;
  favoriteServices: string[];
  uploadedAssets: string[];
  campaignEligible: boolean;
  consentWhatsapp?: boolean;
  notes: string;                  // Free-text stylist notes
  aiSummary: string;              // AI-generated insight
  lifecycleStage: string;        // "imported", "lead", "new", "vip", etc.
}
```

### Data source
- **Persistence:** `data/customers/customers.json` (JSON file on disk)
- **Population:** CSV/XLSX import (Contacts page), WhatsApp auto-upsert (inbound messages)
- **Populated customers:** ✅ Yes, has real imported data

---

## 3. Existing Customer Fields vs. Muses Fields

| Clients/Muses field | API has it? | Mapping | Notes |
|--------------------|-------------|---------|-------|
| `id` (number) | ✅ `id` (string) | Cast to string | Contacts already uses `customer.id` as key |
| `name` | ✅ `displayName` + `firstName` | Use `displayName ?? firstName` | Same derivation as Contacts |
| `initials` | ❌ Not stored | Derive from name | Contacts already has `initialsFor()` helper |
| `tier` (VIP/New/Classic) | ⚠️ Not direct | `tags.includes("vip")` + `lifecycleStage` | "VIP" via tag, "New" via lifecycle, "Classic" → default |
| `avatar` (Unsplash URL) | ❌ Not stored | Use initials avatar | Contacts already uses initials-based avatar |
| `phone` | ✅ `phone` | Direct match | ✅ |
| `lastVisit` (formatted) | ✅ `lastVisit` (ISO) | Format ISO date | Contacts displays raw `lastVisit` or "Sin visita" |
| `notes` (dossier quote) | ✅ `notes` | Direct match | ✅ Rich text field |
| `insight` (AI rec) | ✅ `aiSummary` | Direct match | ✅ Already in API |
| `history[]` (service log) | ❌ **Not stored** | ❌ Missing | **Critical gap** — no service history with date/specialist/price |

---

## 4. Missing Fields for Muse/Dossier View

### 🔴 Critical: Service History
```ts
// Muses page has:
history: {
  service: string;    // e.g. "Balayage Premium + Hidratación"
  date: string;       // e.g. "10 May 2026"
  specialist: string; // e.g. "Sofía"
  price: string;      // e.g. "$85.000"
}[]
```

**API has:** `favoriteServices`, `requestedServices`, `preferredStylist` — but **no structured history with date and price**.

**Options:**
| Option | Description | Effort |
|--------|-------------|--------|
| A | Add `serviceHistory[]` to `CustomerProfile` in `store.ts` + CRUD | ~1h |
| B | Derive from `requestedServices` + `lastVisit` (lossy) | ~15min |
| C | New `/api/customers/[id]/history` endpoint backed by appointments | ~2h |

**Recommendation:** Option A (add to existing store) — minimal footprint, no new endpoint.

### 🟡 Medium: Avatar / Photo
Muses page shows real Unsplash images. API has no photo field.

**Option:** Use initials-based avatar (already done in Contacts). Can add `photoUrl` to `CustomerProfile` later.

### 🟡 Medium: Tier/Segment
Muses page has `tier: "VIP" | "New" | "Classic"`. API has `tags` + `lifecycleStage`.

**Mapping logic:**
```
if tags.includes("vip") AND lifecycleStage !== "imported" → "VIP"
elif lifecycleStage === "new" → "New"
else → "Classic"
```

Already partially done — Contacts filters by `tags.includes("vip")`.

---

## 5. Best Place to Add Muses UI into Contacts

### Current Contacts layout (single-column scroll)
```
[heroPanel]
[statsGrid]
[toolbar]
[contactsPanel]
  └── [contactsList]
        └── contactCard × N
```

### Recommended: Detail Drawer (Right-side panel)

```
[heroPanel]                     [———— detail drawer ————]
[statsGrid]                      [portrait header       
[toolbar]                         ┌──── avatar ────┐    
[contactsPanel]                   │  name + tier    │    
  └── [contactsList]              │  phone          │    
        └── contactCard  ←click→ └─────────────────┘    
             × N                   [Tabs or sections]     
                                   [Notes  |  History  |  AI Insights]
                                   [...content...]
```

**Implementation details:**

| Position | Placement | CSS | Trigger |
|----------|-----------|-----|---------|
| Detail drawer | Right side of `.contactsPage` | `position: sticky; right: 0; width: 380px` | Click on any `.contactCard` |

### Tab system inside drawer (reusing Brain Admin pattern)

| Tab | Content | Data source |
|-----|---------|-------------|
| **Dossier** | Portrait header + quote (notes) + tier badge | `customer.notes`, `tags`, `lifecycleStage` |
| **Experience** | Service history timeline (or placeholder) | ❌ Needs `serviceHistory[]` added to API |
| **AI Insights** | AI recommendation + LTV card | `customer.aiSummary` + derived from `favoriteServices` |

### Drawer close behavior
- Close button (×) in top-right
- Click outside drawer (overlay)
- Press Escape key

---

## 6. Merge Safety Assessment

### ✅ Why it's safe

| Factor | Assessment |
|--------|-----------|
| **API compatibility** | `/api/customers` is the same endpoint — Contacts already consumes all fields the muses page needs (except history) |
| **No data loss** | All muses mock data was invented/presentational — no real business data will be lost |
| **Sidebar unchanged** | `/clients` route stays; the merge is a UI enhancement within Contacts, not a route deletion |
| **Contacts still works standalone** | Drawer is optional — if API fails, Contacts table still renders normally |
| **No route conflicts** | Both pages share same domain (client/customer), same data source |

### ⚠️ Why it's careful

| Risk | Mitigation |
|------|-----------|
| Contacts is 206 lines → could grow 40-60% | Extract drawer into separate component + CSS module |
| Click handler on contact cards changes UX (currently no click behavior) | Add click as progressive enhancement — cards still work without it |
| Service history gap | Add `serviceHistory[]` to API store before implementing History tab |
| Contacts was well-structured; adding drawer could make it messy | Keep drawer component independent, compose into page |

### Verdict: **✅ SAFE TO MERGE**

No breaking changes, no route conflicts, same data source. The only prerequisite is adding `serviceHistory` to the API store.

---

## 7. Implementation Plan

### Phase breakdown

| Step | Task | Files changed | Lines Δ | API change? | Risk |
|------|------|---------------|---------|-------------|------|
| **1** | Add `serviceHistory[]` to `CustomerProfile` in `store.ts` | `api/customers/store.ts` | +15 | ✅ Yes | 🟢 Low |
| **2** | Create `contacts/ContactDrawer.tsx` component | NEW: `contacts/ContactDrawer.tsx` | +120 | ❌ No | 🟢 Low |
| **3** | Add drawer styles to `contacts.module.css` | `contacts/contacts.module.css` | +80 | ❌ No | 🟢 Low |
| **4** | Add click handler + drawer state to `contacts/page.tsx` | `contacts/page.tsx` | +25 | ❌ No | 🟢 Low |

### Component: `ContactDrawer`

```
Props:
  customer: CustomerProfile | null   // null = hidden
  onClose: () => void

States:
  activeTab: "dossier" | "experience" | "insights"

Sections:
  ┌─────────────────────────┐
  │  [×]                    │  ← close button
  │  ┌────┐                 │
  │  │avat│  Name           │  ← portrait header
  │  │ ar │  Tier badge     │
  │  └────┘  Phone          │
  │  ───────────────────────│
  │  [Dossier|Exp|Insights] │  ← 3-tab bar
  │  ───────────────────────│
  │                         │
  │  Tab content:           │
  │  - Dossier: notes quote │
  │  - Experience: timeline │
  │  - Insights: AI summary │
  │                         │
  └─────────────────────────┘
```

### Changes to `contacts/page.tsx`

```diff
- // No click behavior on contactCard
+ // Add onClick that sets selectedCustomer state
+ const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
+ 
+ // In return:
+ <ContactDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
```

### UI borrow from Muses page (no visual redesign)

| Muses element | → Contacts Drawer tab | Lines influenced |
|---------------|----------------------|-----------------|
| Portrait header (avatar + name + tier + icon) | Dossier tab — top section | clients/page.tsx 109–123 |
| Style dossier quote (`"{notes}"`) | Dossier tab — body | clients/page.tsx 127–135 |
| Experience log (service history rows) | Experience tab — timeline | clients/page.tsx 139–151 |
| AI recommendation block | Insights tab — top | clients/page.tsx 170–182 |
| LTV/KPI card | Insights tab — stats | clients/page.tsx 161–168 |
| Dossier details (phone, last visit, segment) | Dossier tab — details grid | clients/page.tsx 185–199 |

### What NOT to borrow

| Muses element | Reason to skip |
|---------------|----------------|
| Left column (muse list) | Contacts already has a better list with search + filters |
| Right column (intelligence rail) | Too wide for a drawer; flatten into tabs |
| Hardcoded Unsplash avatars | Use initials-based avatars (already in Contacts) |
| Inline styles | Use CSS module (already in Contacts) |

---

## 8. Timeline

| Step | Est. time | Dependencies |
|------|-----------|-------------|
| 1. Add `serviceHistory` to store | ~30 min | None |
| 2. Create `ContactDrawer` component | ~45 min | Step 1 |
| 3. Add drawer styles | ~20 min | Step 2 |
| 4. Wire up page.tsx | ~15 min | Step 2 |
| **Total** | **~2h** | — |

---

## 9. Risks Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Service history not in API | 🔴 High | Add to store.ts before implementing |
| Drawer makes contacts page too wide | 🟡 Medium | Drawer overlays, doesn't push layout (use `position: fixed` or overlay) |
| Click handler changes current UX | 🟢 Low | Progressive enhancement — no click = no drawer, page works as before |
| CSS module grows 40% | 🟢 Low | 80 new lines vs 347 existing — acceptable |
| Builder costs may spread to contacts for the first time | 🟢 Low | Contacts is 206 lines with clean structure — easy to maintain |

---

## 10. Conclusion

```
Contacts Current:  206 lines (production-ready, real API)
Clients (Muses):   200 lines (mock data, inline styles)

Merge outcome:     Contacts → ~300 lines (adding drawer component + styles)
                   Clients → stays at 200 lines (deferred, unmodified)
                   ───────────────────────────────────
                   Net: 506 lines → 300 lines of active code (−206, −41%)

Verdict:           ✅ SAFE to merge
Prerequisite:      Add serviceHistory to CustomerProfile in API store
Style approach:    New CSS classes in contacts.module.css (no new inline styles)
Risk:              Low — no breaking changes, no route conflicts
```
