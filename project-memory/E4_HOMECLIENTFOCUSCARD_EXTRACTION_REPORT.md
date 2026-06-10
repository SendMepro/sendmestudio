# Phase E-4: HomeClientFocusCard Extraction Report

## Resumen
Extracted the client focus card (`<section className={styles.clientFocusCard}>`) from page.tsx into a standalone component.

## Componentes creados
1. **`src/components/home/ClientAvatar.tsx`** (30 lines) — Shared avatar component extracted from inline function in page.tsx. Used by both HomeClientFocusCard and the dossier section (remaining).
2. **`src/components/home/HomeClientFocusCard.tsx`** (118 lines) — Client focus card with avatar, LTV (or "Sin datos suficientes" for real clients), name, priority label, repurchase rate, service, time, stylist, reservation progress, "En construcción" badge for W5, service image, and AI recommendation box.

## Interfaces exportadas
- `AppointmentInfo` — Client appointment data (client, ltv, priorityLabel, repurchase, service, time, stylist, stylistImage, recommendation, impact)
- `ReservationProgress` — `{ label: string; progress: number }`

## Cambios en page.tsx
- +2 imports: `ClientAvatar`, `HomeClientFocusCard`
- Removed local `function ClientAvatar({...})` and `function clientInitialsFor({...})` (moved to ClientAvatar.tsx)
- Replaced 82 lines of inline JSX with `<HomeClientFocusCard ... />` (4 lines)
- Net reduction: ~89 lines (1774 → 1685)

## Props
- `selectedAppointment: AppointmentInfo` — required
- `isRealClient: boolean` — required (controls LTV display + W5 badge)
- `reservationProgress: ReservationProgress` — required

## Validación
- ✅ TypeScript: 0 new errors (only 2 pre-existing)
- ✅ Same layout: clientFocusCard → left (avatar + pills) → body (name, priority, service, meta, progress) → W5 badge → service image → AI note box
- ✅ Same conditional rendering for isRealClient (LTV vs placeholder, repurchase visibility, W5 badge)
- ✅ Same icons (ShoppingBag, Clock3, AIBadge)
- ✅ No CSS changes, no visual changes
- ✅ No business logic moved

## Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `src/components/home/ClientAvatar.tsx` | **CREATED** — Shared avatar component |
| `src/components/home/HomeClientFocusCard.tsx` | **CREATED** — Client focus card component |
| `src/app/page.tsx` | +2 imports, -82 inline lines, -17 lines local function; net -89 lines |

## Próximo paso
Phase E-5: Extract HomeDossier (hero card + dossier sections + widgets) — lines ~1448-1700
