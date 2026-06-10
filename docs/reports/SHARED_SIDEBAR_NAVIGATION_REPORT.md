# Shared Sidebar Navigation Report

## Summary

Unified app navigation into one shared sidebar component used across the dashboard and inner routes.

## Shared Component

- `src/app/components/Sidebar.tsx`
- `src/app/components/Sidebar.module.css`

## Menu Order

1. Agenda -> `/agenda`
2. Mensajes -> `/inbox`
3. Campañas -> `/campaigns`
4. Editorial -> `/editorial`
5. Atelier Intelligence -> `/`
6. Salon Intelligence -> `/salon-intelligence`
7. Muses -> `/clients`
8. Ventas -> `/analytics`
9. Studio Pulse -> `/studio-pulse`
10. Reportes -> `/analytics`
11. Inventario -> `/settings/atelier-memory`
12. Ajustes -> `/settings`

## Behavior

- Inner pages default to a collapsed icon-only sidebar.
- Hover, focus, or pointer interaction expands the shared sidebar and reveals labels.
- Home keeps the shared sidebar expanded.
- Active routes render with a lavender glass pill.
- Agenda, Mensajes, and Campañas are marked as primary priority items.
- Lower-priority items use softer visual treatment.
- Editorial is now visible in the shared menu.

## Route Coverage

The shared sidebar is mounted on:

- `/`
- `/agenda`
- `/analytics`
- `/campaigns`
- `/clients`
- `/editorial`
- `/inbox`
- `/salon-intelligence`
- `/settings`
- `/settings/atelier-memory`
- `/studio-pulse`

## Notes

- Added `src/app/agenda/page.tsx` so the required `/agenda` sidebar link resolves to an app route.
- The existing app uses `/analytics` for both Ventas and Reportes. Ventas owns the active state on `/analytics` to avoid duplicate active pills.
- `npm run build` still stops on an unrelated existing `GPUDevice` type error in `liquid-glass-studio-main/src/App.tsx`.
