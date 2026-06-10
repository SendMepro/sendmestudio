# AI_PRIORITY_MODULE_SIMPLIFICATION

## Scope

Simplified only the AI Priority module in the Home / Atelier Intelligence screen.

No full-page redesign was applied.

## Files Changed

- `src/app/page.tsx`
- `src/app/page.module.css`

## Goal Applied

The priority module was reduced so the user can understand it immediately, without long narrative blocks and without pushing the KPI row below the fold.

## Changes Applied

### 1. Priority client card simplified

Removed:

- `Why this matters`
- `Opportunity detected`
- long stacked operational paragraphs

Kept only:

- `Cliente prioritaria`
- client name
- service
- `11:30 · Renata Ibarra`
- `LTV $1.890.000`
- `86% recompra`
- `IA recomienda`
- `+$84.000 CLP estimados oportunidad detectada`

### 2. Visual structure tightened

The card now reads as:

- left: image
- right: compact summary
- bottom: one recommendation box spanning the module width

### 3. KPI row simplified

Shortened KPI labels to:

- `Ventas hoy`
- `Potencial`
- `Ocupación`

And kept one short meta line per card:

- `+18% vs ayer`
- `4 reservas sin pago`
- `Pico 11:00–16:00`

### 4. Height pressure reduced

Compressed:

- card padding
- vertical gaps
- KPI card min-height

This keeps the hero block and KPI row visible together more reliably.

### 5. Noise reduced

The module now uses:

- one kicker
- one strong client heading
- one compact value summary
- one recommendation box

## CSS Adjustments

Applied in the module:

- `clientFocusCard`
  - reduced padding
  - `max-height: 620px`
- `clientFocusBody`
  - reduced gap
- `clientFocusNoteBox`
  - spans full card width
- `kpiGrid`
  - preserved 3-column desktop structure
- `kpiCard`
  - reduced min-height from `164px` to `148px`
  - reduced internal gap

## Validation

- Verified `/` returns `200`
- Confirmed route content includes:
  - `Cliente prioritaria`
  - `Ventas hoy`
  - `Potencial`
  - `Ocupación`
  - `IA recomienda`

## Result

The module is now:

- shorter
- easier to scan
- more strategic
- less verbose
- more likely to keep KPIs visible immediately

without changing the page identity or overall layout.
