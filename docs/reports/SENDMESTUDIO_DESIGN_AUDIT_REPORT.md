# SENDMESTUDIO_DESIGN_AUDIT_REPORT

## 1. Routes Reviewed

- `/`
- `/inbox`
- `/campaigns`
- `/editorial`
- `/analytics`
- `/clients`
- `/settings`
- `/salon-intelligence`
- `/studio-pulse`

Route expected but currently missing:

- `/agenda`

---

## 2. Problems Found

- The frontend currently uses multiple competing visual systems instead of one design constitution.
- Several routes mix inline styles with CSS modules and global utility styling, which breaks consistency.
- Visible UI still contains technical, placeholder or mock language.
- Multiple routes contain mojibake / encoding errors.
- Desktop layout control is inconsistent across routes.
- The sidebar system is inconsistent between the shared sidebar and the Home route.

---

## 3. Components / Files That Violate The Design System

### Critical foundation conflicts

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\globals.css`
  Multiple visual systems coexist here. It includes competing typography stacks, legacy tokens, dark theme logic, route-specific styling and conflicting layout rules. This is the biggest source of visual drift.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\components\Sidebar.tsx`
  Shared sidebar order, labels and active-state semantics do not match the recommended design constitution. Labels such as `Atelier`, `Narratives`, `Studio Vision`, `Vision Insights` and `Collection` are inconsistent with the official naming model.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\page.tsx`
  Home route uses a custom sidebar structure instead of the shared sidebar, creating a second navigation system.

### Route-specific visual violations

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\analytics\page.tsx`
  Heavy inline styling, generic BI/dashboard semantics, and weak premium hierarchy.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\campaigns\page.tsx`
  Visible mock/testing terminology and mixed English/system language in user-facing actions.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\editorial\page.tsx`
  Mixed route personalities, dense inline layout rules and unstable card behavior risk.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\clients\page.tsx`
  Dense admin-style dossier construction with many inline styles, weak naming consistency and visible encoding issues.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\settings\page.tsx`
  Exposes technical credentials/API concepts in visible UI and includes model/provider-like language inappropriate for salon-facing product surfaces.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\salon-intelligence\page.tsx`
  Correct feature concept, but current visible copy mixes English metrics with broken UTF-8 strings and a billing-like surface that needs stronger business abstraction.

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\studio-pulse\page.tsx`
  Strong concept, but visible encoding errors and mixed English/Spanish reduce polish.

---

## 4. Texts / Terminology That Are Wrong Or Inconsistent

### Mock / technical / generic labels still visible

- `src/app/campaigns/page.tsx`
  - `Mock approve`
  - `Submit to Meta`
  - `Draft`
  - `Pending Meta`

- `src/app/settings/page.tsx`
  - direct API-style secret exposure
  - `WhatsApp Business API`
  - `Motor IA`
  - `luxury-gpt`

- `src/app/analytics/page.tsx`
  - `Vision.`
  - `Vision Studio.`
  - `AI Strategist`
  These are inconsistent with the official naming model.

- `src/app/inbox/page.tsx`
  - `Inbox`
  - `Search thread`
  - `AI draft`
  - `Send draft`
  - `Reply suggestion ready`
  These are not yet aligned to the premium Spanish-first salon language system.

### Encoding / UTF-8 issues

Detected in:

- `src/app/page.tsx`
- `src/app/salon-intelligence/page.tsx`
- `src/app/studio-pulse/page.tsx`
- `src/app/clients/page.tsx`
- `src/app/settings/page.tsx`

Examples:

- `CampaÃ±as`
- `ColoraciÃ³n`
- `ConexiÃ³n`
- `salÃ³n`
- `dÃ­as`

---

## 5. Problems Of Layout

- `src/app/page.tsx` + `src/app/page.module.css`
  Home route has already required structural fixes and still remains tight at shorter desktop heights. It is the most fragile layout in the system.

- `src/app/analytics/page.tsx`
  The route is assembled through many inline containers and does not express a stable design-layout grammar.

- `src/app/clients/page.tsx`
  Three-column composition is visually dense and leans toward admin layout rather than premium dossier layout.

- `src/app/editorial/page.tsx`
  Hero, vocabulary cards and auxiliary sections follow different layout styles, which weakens route cohesion.

- `src/app/salon-intelligence/salon-intelligence.module.css`
  Uses `min-height: 100dvh` instead of hard viewport control and introduces a 4-column shell that does not align with the 3-column product principle.

---

## 6. Problems Of Scroll

- `src/app/analytics/analytics.module.css`
  Uses `min-height: 100dvh` plus `overflow-y: auto`, which strongly suggests route/body-style scrolling instead of a fully controlled viewport shell.

- `src/app/salon-intelligence/salon-intelligence.module.css`
  Uses `min-height` instead of fixed `height` and relies on multiple auto-scroll panels without a route-level fixed shell guarantee.

- `src/app/page.module.css`
  Desktop shell is controlled, but mobile fallback explicitly switches `.page` to `overflow: auto`; this is acceptable for mobile fallback but shows the route still depends on breakpoint-specific exceptions rather than a universal shell rule.

- `src/app/globals.css`
  Contains many competing scroll behaviors across route-specific classes, which increases the chance of regressions.

---

## 7. Problems Of Typography

- `src/app/globals.css`
  Multiple typography systems coexist:
  - `Outfit`
  - `Inter`
  - `SF Pro Display`
  - `Montserrat`
  - route variables like `var(--font-display)` and `var(--font-ui)`

- `src/app/campaigns/campaigns.module.css`
  Heavy repeated font declarations create route-specific typography drift.

- `src/app/inbox/page.tsx`
  Loads `Inter` and `Outfit` through `next/font` while the rest of the app relies on other route/global methods.

- `src/app/editorial/page.tsx`
  Visual tone reads more like mixed training surface + gallery than a controlled, single typography hierarchy.

---

## 8. Problems Of Sidebar

- `src/app/components/Sidebar.tsx`
  Shared sidebar order does not match the recommended official order.

- `src/app/components/Sidebar.tsx`
  Labels are inconsistent with the official terminology system:
  - `Atelier`
  - `Narratives`
  - `Studio Vision`
  - `Vision Insights`
  - `Collection`

- `src/app/page.tsx`
  Home route uses its own bespoke sidebar instead of the shared sidebar, creating system fragmentation.

- Across routes
  Sidebar behavior is not consistently label-first or icon-first; the Home sidebar and shared sidebar feel like two different products.

---

## 9. Problems Of Cards

- `src/app/page.tsx`
  Home cards have improved structurally but still need category discipline between operational, intelligence and context cards.

- `src/app/editorial/page.tsx`
  Vocabulary/editorial cards are visually rich, but the route risks feeling like a gallery rather than a training/product surface.

- `src/app/clients/page.tsx`
  Utility rail cards and dossier elements feel admin-heavy and over-instrumented.

- `src/app/analytics/page.tsx`
  KPI and support cards feel closer to a generic analytics template than to a salon intelligence system.

- `src/app/campaigns/page.tsx`
  Editor support cards and workflow actions mix editorial product intent with developer/test states.

---

## 10. Visually Broken Routes

Highest-risk routes:

- `/`
  Structurally fragile at constrained desktop heights.

- `/analytics`
  Most obviously template-like and least aligned with the luxury operating system direction.

- `/clients`
  Dense and admin-like rather than premium dossier-driven.

- `/salon-intelligence`
  Good concept, but currently undermined by encoding issues, English-heavy UI and layout deviation from the core shell.

- `/studio-pulse`
  Good concept, but encoding issues damage premium perception immediately.

Secondary-risk routes:

- `/campaigns`
- `/editorial`
- `/settings`
- `/inbox`

---

## 11. Quick Wins

- Remove all visible mock/testing labels from `campaigns/page.tsx`.
- Fix UTF-8 encoding in all affected route files.
- Standardize visible typography to one primary app stack.
- Unify sidebar order and labels in the shared sidebar.
- Replace technical or internal wording in `settings/page.tsx`.
- Normalize route shells to `height: 100dvh; overflow: hidden;`.

---

## 12. Critical Changes Recommended

1. Refactor `globals.css` into a smaller true token layer instead of a route-behavior catch-all.
2. Make the shared sidebar the single navigation system source of truth.
3. Standardize route shell architecture across all major product screens.
4. Remove visible secrets, model names and API-facing language from settings and intelligence surfaces.
5. Fix all mojibake / encoding corruption before any further visual polish work.
6. Re-audit `/analytics`, `/clients` and `/salon-intelligence` first; these are the least aligned routes after Home.

---

## 13. No Touch / Out Of Scope

Do not change during design-only correction phases:

- backend logic
- API routes
- auth
- database
- integrations
- billing implementation
- WhatsApp API internals
- Meta API internals
- OpenAI API internals

---

## 14. Files Most In Need Of Phase 1 Cleanup

- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\globals.css`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\components\Sidebar.tsx`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\analytics\page.tsx`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\clients\page.tsx`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\campaigns\page.tsx`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\salon-intelligence\page.tsx`
- `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza\src\app\studio-pulse\page.tsx`
