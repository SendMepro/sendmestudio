# SIDEBAR ROUTES AUDIT

**Date:** 2026-05-30T09:16 UTC  
**Source file:** `src/app/components/Sidebar.tsx`  

---

## 1. Sidebar Structure Overview

**File:** `src/app/components/Sidebar.tsx` (295 lines)  
**State management:** `src/app/components/sidebarUnreadStore.ts` (154 lines)  
**CSS:** `src/app/components/Sidebar.module.css`

### Layout
- **Top items** (always visible, 5 items)
- **Collapsible groups** (3 groups, 9 items, all closed by default)
- **Profile footer** (static avatar + text)

---

## 2. Complete Sidebar Item Inventory

### Top Items (always visible)

| # | Label | Route | Icon | Page Exists? | Lines | Status | Data Source |
|---|-------|-------|------|-------------|-------|--------|-------------|
| 1 | **Home** | `/` | `House` | ✅ `src/app/page.tsx` | **1,313** | ✅ Active | Bridge + Agents + Real API calls |
| 2 | **Mensajes** | `/inbox` | `MessageSquare` | ✅ `src/app/inbox/page.tsx` | **1,515** | ✅ Active | WhatsApp API + real-time SSE |
| 3 | **Campañas** | `/campaigns` | `Send` | ✅ `src/app/campaigns/page.tsx` | **965** | ⚠️ Large | Campaign API |
| 4 | **Contactos** | `/contacts` | `Users` | ✅ `src/app/contacts/page.tsx` | **206** | ✅ Active | Customer profiles API |
| 5 | **Agenda** | `/agenda` | `CalendarDays` | ✅ `src/app/agenda/page.tsx` | **108** | ✅ Active | Appointments data |

---

### Group: Inteligencia (collapsible, default: closed)

| # | Label | Route | Icon | Page Exists? | Lines | Status | Data Source |
|---|-------|-------|------|-------------|-------|--------|-------------|
| 6 | **Emotional Brain** | `/brain-admin` | `Heart` + 💎 gem | ✅ `src/app/brain-admin/page.tsx` | **861** | 🔄 In refactor (50%) | Brain API (upload, voice, QR, SSE, notes) |
| 7 | **Inteligencia Salón** | `/salon-intelligence` | `Sparkles` | ✅ `src/app/salon-intelligence/page.tsx` | **128** | ✅ Active | Intelligence insights |
| 8 | **Pulso Studio** | `/studio-pulse` | `Activity` | ✅ `src/app/studio-pulse/page.tsx` | **351** | ✅ Active (badge: "Nuevo") | Studio metrics |

---

### Group: Contenido (collapsible, default: closed)

| # | Label | Route | Icon | Page Exists? | Lines | Status | Data Source |
|---|-------|-------|------|-------------|-------|--------|-------------|
| 9 | **Editorial** | `/editorial` | `BookOpen` | ✅ `src/app/editorial/page.tsx` | **289** | ✅ Active | Editorial calendar |
| — | ~~**Muses**~~ | ~~`/clients`~~ | ~~`Users`~~ | ⏳ `src/app/clients/page.tsx` | **200** | 🔴 **REMOVED from sidebar (CP-88)** — files kept as deferred, merged into Contacts detail drawer | Deprecated / deferred |
| 10 | **Base de conocimiento** | `/knowledge` | `Database` | ✅ `src/app/knowledge/page.tsx` | **717** | ✅ Active | Knowledge base API |

---

### Group: Negocio (collapsible, default: closed)

| # | Label | Route | Icon | Page Exists? | Lines | Status | Data Source |
|---|-------|-------|------|-------------|-------|--------|-------------|
| 12 | **Reportes** | `/analytics` | `BarChart3` | ✅ `src/app/analytics/page.tsx` | **167** | ✅ Active | Analytics data |
| 13 | **Ventas** | `/ventas` | `ShoppingBag` | ❌ **NO PAGE** | — | 🔴 BROKEN | — |
| 14 | **Inventario** | `/settings/atelier-memory` | `Package` | ✅ `src/app/settings/atelier-memory/page.tsx` | **138** | ✅ Active | Atelier/inventory settings |
| 15 | **Ajustes** | `/settings` | `Settings` | ✅ `src/app/settings/page.tsx` | **146** | ✅ Active | Settings form |

---

## 3. Summary Table

| Total sidebar items | 14 |
|---------------------|-----|
| Pages that exist | **14 / 15** (1 deprecated/deferred: `/clients`) |
| Broken routes (no page) | **1** (`/ventas`) |
| Auxiliary pages (no sidebar link) | **4** |
| Root `.md` files linked to pages | **0** (none directly imported by any page) |

---

## 4. Issues Found

### 🔴 Issue #1: `/ventas` — Broken Route (404)

- **Sidebar label:** "Ventas"
- **Route:** `/ventas`
- **Directory:** `src/app/ventas/` **does not exist**
- **Impact:** Clicking "Ventas" in sidebar navigates to `/ventas` which returns a 404
- **Recommendation:** Either:
  - Create a `src/app/ventas/page.tsx` with the Sales page (optionally using data from analytics/campaigns), or
  - Remove the entry from `Sidebar.tsx` (line 90), or
  - Comment it out with a TODO note

### 🟡 Issue #2: Auxiliary Pages Not Linked from Sidebar

These pages exist but have **no sidebar entry**:

| Page | Route | Lines | Purpose |
|------|-------|-------|---------|
| `mobile-upload/page.tsx` | `/mobile-upload` | 670 | Mobile file upload (QR-scanned) |
| `brain-upload/page.tsx` | `/brain-upload` | 628 | Desktop file upload |
| `login/page.tsx` | `/login` | 72 | Standalone login form |
| `settings/atelier-memory/page.tsx` | `/settings/atelier-memory` | 138 | ✅ Already linked as "Inventario" |

**Note:** `/mobile-upload` and `/brain-upload` are likely navigated programmatically (e.g., from QR scan or brain-admin), not from sidebar. This is **intentional**, not an issue. `/login` is reached via auth flow.

### 🟢 Issue #3: Root `.md` Files

- **Zero** `.md` files outside `project-memory/` or `docs/` are imported or consumed by any page
- All project documentation `.md` files live under `project-memory/` and are used only for agent/developer reference, not at runtime
- ✅ No cleanup needed

---

## 5. Page-by-Page Assessment

| Route | Real Content? | Real Data? | Placeholder? | Assessment |
|-------|--------------|------------|-------------|------------|
| `/` | ✅ Yes | ✅ Yes | No | Full app with agents, bridge, APIs |
| `/inbox` | ✅ Yes | ✅ Yes | No | Full WhatsApp messaging |
| `/campaigns` | ✅ Yes | ✅ Yes | No | Campaign management |
| `/contacts` | ✅ Yes | ✅ Yes | No | Customer profiles |
| `/agenda` | ✅ Yes | ✅ Yes | No | Appointment calendar |
| `/brain-admin` | ✅ Yes | ✅ Yes | No | Brain admin (being refactored) |
| `/salon-intelligence` | ✅ Yes | ✅ Yes | No | Intelligence insights |
| `/studio-pulse` | ✅ Yes | ✅ Yes | No | Studio metrics |
| `/editorial` | ✅ Yes | ✅ Yes | No | Editorial calendar |
| `/clients` | ✅ Yes | ⚠️ Static | No | Static mock data for "Muses" |
| `/knowledge` | ✅ Yes | ✅ Yes | No | Knowledge base |
| `/analytics` | ✅ Yes | ✅ Yes | No | Analytics dashboard |
| `/ventas` | ❌ N/A | ❌ N/A | ❌ N/A | **404 — no page** |
| `/settings/atelier-memory` | ✅ Yes | ✅ Yes | No | Atelier settings |
| `/settings` | ✅ Yes | ✅ Yes | No | Settings form |
| `/mobile-upload` | ✅ Yes | ✅ Yes | No | QR upload target (no sidebar) |
| `/brain-upload` | ✅ Yes | ✅ Yes | No | Desktop upload (no sidebar) |
| `/login` | ✅ Yes | ✅ No | Yes | Minimal login form (no sidebar) |

---

## 6. Recommended Action Order (Safest → Riskier)

| Step | Action | Risk | Effort |
|------|--------|------|--------|
| **1** | Fix `/ventas` broken route (create page or remove sidebar entry) | 🔴 Low | ~5 min |
| **2** | Complete Brain Admin refactor (CP-85 onward) | 🟡 Medium | ~9 CPs |
| **3** | Refactor campaigns page (965 lines) | 🟡 Medium | ~5 CPs |
| **4** | Refactor inbox page (1,515 lines) | 🟡 High | ~8 CPs |
| **5** | Refactor home page remaining sections (1,313 lines) | 🟡 Medium | ~4 CPs |

---

## 7. File Map

```
src/app/components/
├── Sidebar.tsx          ← Sidebar definition (routes, groups, icons, labels)
├── Sidebar.module.css   ← Sidebar styles
├── sidebarUnreadStore.ts← Unread message badge state management
├── AppShell.tsx         ← Layout shell that renders Sidebar
├── AIBadge.tsx          ← AI badge component
└── LiquidGlass.tsx      ← Decorative component
```
