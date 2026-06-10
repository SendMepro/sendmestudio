# CP-87 — Contacts + Muses Merge Report

**Date:** 2026-05-30T09:50 UTC  
**Status:** ✅ Complete — implementation merged  

---

## Summary

Muses dossier/portrait UI successfully merged into Contacts via a **detail drawer** (right-side overlay panel) with 3 tabs: Notes, History, AI Insights. The drawer is triggered by clicking any contact card.

---

## Changes Made

### 1. API Store — `src/app/api/customers/store.ts`

**New type:**
```ts
export type ServiceHistoryEntry = {
  service: string;
  date: string;
  specialist: string;
  price: string;
};
```

**Added to `CustomerProfile`:**
```ts
serviceHistory: ServiceHistoryEntry[];
```

**Seed data:** `MOCK_SERVICE_HISTORY` array (8 entries) populated on `readCustomers()` for any customer without existing history. Also seeds `notes` for customers without them.

**Profile construction sites updated** (3 sites):
- `importCustomers()` — carries over existing history
- `upsertCustomerFromMessage()` — carries over existing history  
- `addCustomerAsset()` — carried via spread operator

### 2. New Component — `src/app/contacts/ContactDetailDrawer.tsx` (197 lines)

**Props:**
- `customer: CustomerProfile | null` — null hides drawer
- `onClose: () => void`

**Sections:**
- **Portrait header** — initials avatar + tier badge + name
- **3-tab bar** — Notes | Historial | AI Insights
- **Notes tab:** Style dossier quote + details grid (phone, last visit, segment, consent status)
- **History tab:** Service history timeline with dot markers, service name, date/specialist, price
- **AI Insights tab:** AI recommendation card + LTV KPI card + requested services tag list

**Derived fields from API data:**
- `tier` → derived from `tags.includes("vip")` + `lifecycleStage`
- `initials` → derived from `firstName` / `displayName`
- `LTV` → static $117.000 (placeholder, same as Muses page)

### 3. CSS — `src/app/contacts/contacts.module.css` (+326 lines)

New classes added after line 327:
- `.drawerOverlay` — fixed overlay with backdrop blur
- `.drawer` — right-side panel (400px, slide-in animation)
- `.drawerClose` — absolute X button
- `.drawerHeader`, `.drawerAvatar`, `.drawerTierDot`, `.drawerKicker`, `.drawerTitle` — portrait header
- `.drawerTabs`, `.drawerTab`, `.drawerTabActive` — tab bar
- `.drawerContent`, `.drawerSection`, `.drawerSectionHeader` — content layout
- `.drawerQuote`, `.drawerDivider` — notes section
- `.drawerDetailsGrid`, `.drawerDetailRow` — details grid
- `.historyList`, `.historyItem`, `.historyDot`, `.historyBody`, `.historyService`, `.historyMeta`, `.historyPrice` — history timeline
- `.drawerInsightCard`, `.drawerInsightText` — AI insights
- `.drawerKpiCard`, `.drawerKpiLabel`, `.drawerKpiTrend`, `.drawerKpiValue`, `.drawerKpiSub` — KPI display
- `.drawerTagList`, `.drawerTag` — tag list
- `.drawerEmpty` — empty state

### 4. Page — `src/app/contacts/page.tsx` (updated)

**Changes:**
- Import `ContactDetailDrawer` component + `CustomerProfile` type
- Added `selectedCustomer` state
- Added `onClick` handler + `cursor: pointer` on each `.contactCard`
- Added `<ContactDetailDrawer>` after the main content, before `</AppShell>`

---

## File Changes Summary

| File | Δ Lines | Type |
|------|---------|------|
| `src/app/api/customers/store.ts` | +45 lines | New types + seed data |
| `src/app/contacts/ContactDetailDrawer.tsx` | **+197 lines** | **New component** |
| `src/app/contacts/contacts.module.css` | +326 lines | New CSS classes |
| `src/app/contacts/page.tsx` | +8 lines / −11 lines | Import + state + click handler |
| `src/app/clients/page.tsx` | **Unchanged** | Deferred — not deleted yet |
| **Total** | **~+565 lines** | |

---

## Build Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (no incremental) | ✅ **Passed** — no type errors |
| `npm run build` (next build) | ⚠️ **Pre-existing lock** — `.next\trace` EPERM (unrelated to our changes) |

**Note:** The `next build` failure is from a pre-existing filesystem permission issue on `.next\trace` — a known environment problem (same issue reported in previous checkpoints). Our code produces zero type errors.

---

## Verification Checklist

- [x] `serviceHistory[]` added to API type + all profile construction sites
- [x] Mock service history data seeded for existing customers
- [x] `ContactDetailDrawer` component created with 3 tabs
- [x] Drawer styles added to `contacts.module.css`
- [x] Click handler wired on contact cards
- [x] Drawer closes on overlay click, X button, press Escape (native)
- [x] Sidebar unchanged
- [x] Clients page untouched (deferred)
- [x] No new API endpoints
- [x] tsc --noEmit passes

---

## Next Steps (Future CPs)

| Priority | Task |
|----------|------|
| **1** | Restore `next build` (fix `.next` directory permissions / lock) |
| **2** | Remove `clients/page.tsx` and `api/clients/route.ts` |
| **3** | Remove "Muses" sidebar entry from `Sidebar.tsx` |
| **4** | Add image/photo URL to `CustomerProfile` for real avatars |
| **5** | Replace static LTV value with computed value from service history |
