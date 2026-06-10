# Salon Terminology Migration Report

## Scope

- Replaced visible UI usage of `Maison` with `Salon` across the SendMeStudio app under `src/`.
- Preserved luxury identity terms intentionally:
  - `Atelier`
  - `Muse`
  - `Ritual`
  - `Concierge`
  - `Signature`
  - `Editorial`

## Areas Updated

- Home / dashboard
- Analytics
- Campaigns
- Editorial modules
- Settings / Atelier Memory
- Generated campaign copy
- Visible mock data and prefilled textareas

## Files Changed

- `src/app/page.tsx`
- `src/app/analytics/page.tsx`
- `src/app/campaigns/page.tsx`
- `src/app/editorial/page.tsx`
- `src/app/settings/atelier-memory/page.tsx`

## Examples Migrated

- `Maison Vision` → `Salon Vision`
- `Maison Performance` → `Salon Performance`
- `Maison Styling` → `Salon Styling`
- `Maison Editorial` → `Salon Editorial`
- `Maison Standard` → `Salon Standard`
- `Voice of the Maison` → `Voice of the Salon`
- `Nueva narrativa Maison` → `Nueva narrativa Salon`
- `#MaisonBeauty` → `#SalonBeauty`

## Verification

- Global search run with `rg -ni "maison" src`
- Result: no remaining `Maison` / `maison` matches in `src/`

## Notes

- `metaTemplateName` was also updated from `maison_template_*` to `salon_template_*` to keep visible draft/template naming aligned with the new terminology.
