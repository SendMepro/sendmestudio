# Sidebar Expand State Fix Report

## Summary

Moved sidebar expansion control from the sidebar surface into a real app shell grid so route content shifts when the sidebar expands.

## Files Changed

- `src/app/components/AppShell.tsx`
- `src/app/components/Sidebar.tsx`
- `src/app/components/Sidebar.module.css`
- `src/app/globals.css`
- Route pages now render content inside `AppShell` instead of owning a local sidebar column.

## App Shell Behavior

- `.app-shell` uses a two-column grid:
  - collapsed: `72px minmax(0, 1fr)`
  - expanded: `240px minmax(0, 1fr)`
- `.shared-sidebar` is clipped with `overflow: hidden`.
- `.app-main` has `min-width: 0`, `height: 100dvh`, and `overflow: hidden`.
- Hover, focus, or click on the sidebar sets the shell to `sidebar-expanded`.
- Home (`/`) stays expanded.

## Sidebar Label Fix

- Collapsed labels use `display: none`, `opacity: 0`, and are clipped by the sidebar column.
- Expanded labels use `display: block` and `opacity: 1`.
- The sidebar no longer widens as an overlay; the grid column owns the width.

## Validation

Browser measurements on `/studio-pulse`:

- Collapsed shell columns: `72px 1208px`
- Collapsed main x-position: `72`
- Collapsed label display: `none`
- Expanded shell columns: `240px 1040px`
- Expanded main x-position: `240`
- Expanded label display: `block`

Home (`/`) starts expanded with `Atelier Intelligence` active.

## Note

`npm run build` still reaches the Next.js production compile, then stops on the existing unrelated `GPUDevice` type error in `liquid-glass-studio-main/src/App.tsx`.
