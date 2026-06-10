# CP-89 — Knowledge Page Extraction Plan

**Date:** 2026-05-30T18:59 UTC  
**Source:** `src/app/knowledge/page.tsx`  

---

## 1. Current Page Size

| Metric | Value |
|--------|-------|
| page.tsx | **718 lines** |
| knowledge.module.css | **403 lines** |
| Total (page + CSS) | **1,121 lines** |
| Components imported | **1** (`AppShell` from `../components/AppShell`) |
| Local components | **0** (everything is inline) |

---

## 2. Current Imports

| Import | Source | Type |
|--------|--------|------|
| `useEffect`, `useMemo`, `useRef`, `useState` | `react` | Hook |
| `BookOpen`, `CalendarDays`, `CheckCircle2`, `Clock`, `ImageIcon`, `MessageSquareText`, `Save`, `Scissors`, `ShieldCheck`, `Sparkles`, `Users` | `lucide-react` | Icon |
| `AppShell` | `../components/AppShell` | Layout wrapper |
| `styles` | `./knowledge.module.css` | CSS module |

**Total:** 3 import lines (2 external packages + 1 local component + 1 CSS module)

---

## 3. Current API Dependencies

| Endpoint | Method | Usage in page.tsx | Store support |
|----------|--------|-------------------|---------------|
| `/api/knowledge` | `GET` | `fetch("/api/knowledge")` → loads full `KnowledgeBundle` | ✅ `store.ts` (335 lines) |
| `/api/knowledge` | `POST` | `fetch("/api/knowledge", { body: knowledge })` → saves full bundle or single section | ✅ `store.ts` |
| `/api/knowledge/faqs` | `GET` | **Not used by page.tsx** (exists as standalone) | ✅ |
| `/api/knowledge/services` | `GET` | **Not used by page.tsx** (exists as standalone) | ✅ |
| `/api/knowledge/stylists` | `GET` | **Not used by page.tsx** (exists as standalone) | ✅ |

**All data flows through the single `GET /api/knowledge` + `POST /api/knowledge` endpoints.**  
The three standalone sub-routes exist but are **unused** by this page.

---

## 4. Store Dependencies (`src/app/api/knowledge/store.ts`)

| File | Lines | Purpose |
|------|-------|---------|
| `store.ts` | **335 lines** | File-based JSON persistence for 10 knowledge sections |
| `data/knowledge/*` (10 files) | — | JSON seed data (created on first read) |

The store:
- Reads/writes 10 individual JSON files under `data/knowledge/`
- Provides `defaultKnowledge` (267 lines of seed data with real salon defaults)
- Exports `readKnowledgeBundle()`, `writeKnowledgeBundle()`, `readKnowledgeSection()`, `writeKnowledgeSection()`
- Auto-creates missing files from defaults

---

## 5. Inline Code Analysis (page.tsx)

### Types / Constants (lines 20-109)

| Definition | Lines | Description |
|------------|-------|-------------|
| `KnowledgeBundle` type | **69 lines** (20-88) | Full interface — 10 sections with deeply nested types |
| `moduleWeights` | **7 lines** (90-97) | 6-module weight array for completion scoring |
| `modules` | **10 lines** (99-109) | 9-module nav array with icons |
| `aiRuleLabels` | **7 lines** (111-117) | Display labels for AI rule keys |

### Utility Functions (lines 119-175)

| Function | Lines | Purpose |
|----------|-------|---------|
| `isMeaningful()` | **15 lines** | Deep truthiness check for nested values |
| `sectionCompletion()` | **17 lines** | Completion ratio for a section value |
| `completionScore()` | **12 lines** | Weighted completion score (0-100) |
| `listText()` | **3 lines** | Array → comma string |
| `parseList()` | **6 lines** | Comma string → array |

### Component State & Effects (lines 177-225)

| Hook / Effect | Lines | Purpose |
|---------------|-------|---------|
| `useState<KnowledgeBundle>(null)` | — | Full knowledge state |
| `useState<ModuleId>("profile")` | — | Active module tab |
| `useState("Cargando")` | — | Save state UI |
| `useRef(false)` | — | Initial load guard |
| `useRef<number>(null)` | — | Debounce timer |
| `useMemo(completionScore)` | — | Derived score |
| `useEffect(fetch /api/knowledge)` | **19 lines** | Initial data load |
| `useEffect(auto-save with 650ms debounce)` | **18 lines** | Auto-save on change |

### Update Handlers (lines 227-294)

| Handler | Lines | Purpose |
|---------|-------|---------|
| `updateSection<T>()` | **6 lines** | Generic section updater |
| `updateProfile(field, value)` | **12 lines** | Profile field updater |
| `updateService(index, patch)` | **14 lines** | Service array patch |
| `updateStylist(index, patch)` | **13 lines** | Stylist array patch |
| `updateFaq(index, patch)` | **14 lines** | FAQ array patch |

### JSX Rendering (lines 296-717)

| Region | Lines | Description |
|--------|-------|-------------|
| Shell wrapper | **2 lines** | `<AppShell>` |
| **Left panel** (aside) | **37 lines** | Title block, score card, module nav (9 buttons) |
| **Main panel hero** | **12 lines** | Header with save pill |
| Loading state | **2 lines** | "Cargando conocimiento..." |
| **Profile module** | **50 lines** | 8 text inputs + 3 textareas |
| **Hours module** | **70 lines** | 7 day rows (2 inputs + checkbox), 3 more inputs |
| **Services module** | **54 lines** | Card list with name, desc, price, keywords, reply |
| **Team module** | **38 lines** | Card list with name, role, specialties, hours, bio |
| **FAQ module** | **31 lines** | Card list with question, answer, keywords, checkbox |
| **AI Rules module** | **30 lines** | Dynamic rules from `aiRules` object |
| **Booking/Support/Media module** | **39 lines** | JSON textarea editor |
| **Right panel** (aside) | **17 lines** | Next step card + weight legend |

---

## 6. Candidate Hooks

| Hook | Responsibility | Lines saved | Complexity |
|------|---------------|-------------|------------|
| **`useKnowledgeBundle`** | Fetch + state + auto-save + debounce | ~45 lines | Medium |
| **`useKnowledgeCompletion`** | Completion score memoization | ~50 lines (types + 3 utils) | Low |

**These are the ONLY hooks worth extracting.** The remaining logic is pure JSX rendering.

---

## 7. Candidate Components

| Component | Content | Lines saved (page) | CSS impact |
|-----------|---------|--------------------|------------|
| **`KnowledgeSidebar`** | Left panel: title, score card, nav | ~37 lines | Could move ~50 CSS selectors |
| **`KnowledgeHero`** | Main header + save pill | ~12 lines | Minimal |
| **`KnowledgeProfileForm`** | Profile fields (8 inputs + 3 textareas) | ~50 lines | ~20 CSS selectors |
| **`KnowledgeHoursForm`** | Hours grid + inputs | ~70 lines | ~15 CSS selectors |
| **`KnowledgeServicesForm`** | Service card list editing | ~54 lines | ~15 CSS selectors |
| **`KnowledgeTeamForm`** | Stylist card list editing | ~38 lines | ~10 CSS selectors |
| **`KnowledgeFaqForm`** | FAQ card list editing | ~31 lines | ~10 CSS selectors |
| **`KnowledgeAiRulesForm`** | Dynamic AI rules form | ~30 lines | ~10 CSS selectors |
| **`KnowledgeJsonEditor`** | JSON textarea for booking/support/media | ~39 lines | ~5 CSS selectors |
| **`KnowledgeRightPanel`** | Right aside: next step + weights | ~17 lines | ~10 CSS selectors |

---

## 8. Overlay / Extra Components

This page has **no overlays, modals, drawers, or dialogs.** The entire experience is a single-page form with three-column layout. No overlay extraction needed.

---

## 9. Estimated Checkpoints

| CP | Component | Lines moved | CSS moved | Est. reduction |
|----|-----------|-------------|-----------|----------------|
| **CP-90** | `hooks/useKnowledgeBundle.ts` + `hooks/useKnowledgeCompletion.ts` | ~95 | 0 | page: 718→623 |
| **CP-91** | `components/knowledge/KnowledgeSidebar.tsx` + `KnowledgeHero.tsx` | ~49 | ~50 CSS | page: 623→574 |
| **CP-92** | `components/knowledge/KnowledgeProfileForm.tsx` | ~50 | ~20 CSS | page: 574→524 |
| **CP-93** | `components/knowledge/KnowledgeHoursForm.tsx` | ~70 | ~15 CSS | page: 524→454 |
| **CP-94** | `components/knowledge/KnowledgeServicesForm.tsx` | ~54 | ~15 CSS | page: 454→400 |
| **CP-95** | `components/knowledge/KnowledgeTeamForm.tsx` | ~38 | ~10 CSS | page: 400→362 |
| **CP-96** | `components/knowledge/KnowledgeFaqForm.tsx` | ~31 | ~10 CSS | page: 362→331 |
| **CP-97** | `components/knowledge/KnowledgeAiRulesForm.tsx` | ~30 | ~10 CSS | page: 331→301 |
| **CP-98** | `components/knowledge/KnowledgeJsonEditor.tsx` | ~39 | ~5 CSS | page: 301→262 |
| **CP-99** | `components/knowledge/KnowledgeRightPanel.tsx` | ~17 | ~10 CSS | page: 262→245 |

**Total: 10 checkpoints**

---

## 10. Estimated Reduction

| Before | After | Reduction |
|--------|-------|-----------|
| **718 lines** (page.tsx) | **~245 lines** (page.tsx) | **~66%** |
| **403 lines** (CSS) | **~250 lines** (CSS, after distribution) | **~38%** |
| Files created | **12 new files** (2 hooks + 10 components) | — |

The page.tsx would shrink from 718 lines to **~245 lines** (a clean orchestration shell with imports + layout composition).

---

## 11. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Auto-save debounce + state consistency** | Medium | `useKnowledgeBundle` hook must maintain the same debounce (650ms) and guard (`didLoadRef`) behavior. Breakage would cause save loops or lost edits. |
| **KnowledgeBundle type duplicated in page.tsx** | High | The type is defined **both** in `page.tsx` (lines 20-88) **and** `store.ts` (line 267). The page's copy is the source of truth; the store only has `typeof defaultKnowledge`. Must consolidate to a shared file or eliminate duplication. |
| **`isMeaningful` / `sectionCompletion` / `completionScore` are tightly coupled** | Low | These 3 pure functions can be cleanly moved to `useKnowledgeCompletion` with no side effects. |
| **In-place array mutations (services, stylists, faqs)** | Medium | All update handlers use immutable patterns (`map`), so they are safe for extraction. |
| **JSON editor uses `try/catch` + updates `saveState`** | Low | The JSON editor component would need `saveState` as a prop or callback. Extract as a controlled component with `onChange` that calls `updateSection`. |
| **CSS.module might not split cleanly** | Medium | Some selectors in `knowledge.module.css` are shared across multiple sections (e.g., `.fieldGrid`, `.cardsGrid`, `.editCard`). Plan to keep shared styles in the parent CSS and only move section-specific styles to component CSS modules. |
| **Right panel weight card depends on `moduleWeights` constant** | Low | The `moduleWeights` array can be co-located with the component or kept as a shared constant. |
| **No existing tests for knowledge page** | Low | Manual QA needed after each CP. `tsc --noEmit` validation sufficient for type safety. |

---

## 12. Validation Checklist

### All Imports (page.tsx lines 1-18)
- [ ] `useEffect`, `useMemo`, `useRef`, `useState` from `react`
- [ ] `BookOpen`, `CalendarDays`, `CheckCircle2`, `Clock`, `ImageIcon`, `MessageSquareText`, `Save`, `Scissors`, `ShieldCheck`, `Sparkles`, `Users` from `lucide-react`
- [ ] `AppShell` from `../components/AppShell`
- [ ] `styles` from `./knowledge.module.css`

### All API Dependencies
- [ ] `GET /api/knowledge` — loads full bundle on mount
- [ ] `POST /api/knowledge` — saves full bundle or single section on auto-save
- [ ] (Unused but existing) `GET /api/knowledge/faqs`
- [ ] (Unused but existing) `GET /api/knowledge/services`
- [ ] (Unused but existing) `GET /api/knowledge/stylists`
- [ ] `store.ts` — `readKnowledgeBundle()`, `writeKnowledgeBundle()`, `writeKnowledgeSection()`
- [ ] `store.ts` — `defaultKnowledge` seed data (267 lines)
- [ ] `store.ts` — 10 JSON files under `data/knowledge/`
