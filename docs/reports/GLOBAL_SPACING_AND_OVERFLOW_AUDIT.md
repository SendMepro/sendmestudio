# GLOBAL_SPACING_AND_OVERFLOW_AUDIT

## Scope

Global spacing and overflow cleanup pass focused on:

- shared card rhythm
- KPI card structure
- text wrapping
- safe widths
- overflow handling
- line-height consistency

No color redesign, layout redesign or route architecture changes were applied.

## Files Updated

- `src/app/globals.css`
- `src/app/page.module.css`
- `src/app/salon-intelligence/salon-intelligence.module.css`
- `src/app/campaigns/campaigns.module.css`

## Audited Surfaces

- Home / Atelier Intelligence KPI cards
- shared global KPI classes
- Salon Intelligence cards
- Campaign intelligence metrics row
- shared glass cards and support cards

## Fixes Applied

### 1. Global spacing tokens normalized

Updated shared spacing tokens to align with the approved scale:

- `--app-padding: 16px`
- `--panel-padding: 20px`
- `--card-padding: 20px`
- `--card-radius: 28px`
- `--card-radius-sm: 24px`

### 2. Shared KPI/card structure corrected

Normalized shared metric classes in `globals.css`:

- `.metric-card`
- `.kpi-card-clean`
- `.metric-label`
- `.kpi-label`
- `.metric-value`
- `.kpi-value`
- `.kpi-header`

Applied:

- left-aligned content flow
- `min-height: 164px`
- `overflow: hidden`
- `min-width: 0`
- safer label wrapping
- non-wrapping metric values
- softer meta separation

### 3. Global overflow protection added

Added `min-width: 0` and overflow protection to shared reusable cards:

- `.glass-card`
- `.glass-strong`
- `.level-support`
- `.level-utility`
- `.brand-example-card`
- `.card-compact`
- `.micro-card`
- `.concierge-card`
- `.home-card`
- `.home-hero-card`
- `.home-panel`
- `.home-rail-card`

### 4. Typography fit refined

Adjusted text rhythm globally:

- headers tightened toward approved range
- body copy reduced from `1.6` to `1.45` where shared
- card titles tightened to avoid bloated line boxes
- uppercase labels enlarged from tiny compressed sizes to more readable sizes

### 5. Home / Atelier Intelligence KPI cards fixed

In `page.module.css`:

- KPI grid gap normalized to `12px`
- KPI cards now use `18px` padding and `24px` radius
- metric cards no longer collapse vertically
- labels now balance and wrap safely
- values stay on one line
- detail/meta text has clearer separation

### 6. Salon Intelligence spacing normalized

In `salon-intelligence.module.css`:

- header and credit surfaces normalized to `24px`
- module cards standardized to `20px` padding / `12px` gap / `28px` radius
- impact cards and stat boxes normalized
- line-height tightened for cleaner vertical rhythm

### 7. Campaign metric block stabilized

In `campaigns.module.css`:

- metrics row gap reduced from `24px` to `12px`
- metric children now use `min-width: 0`
- dividers no longer collapse awkwardly
- values and pills are locked to single-line rendering

## Validation

Verified route responses after the pass:

- `/` → `200`
- `/salon-intelligence` → `200`
- `/campaigns` → `200`

## Remaining Debt

There are still multiple inline-style surfaces across:

- `src/app/analytics/page.tsx`
- `src/app/clients/page.tsx`
- `src/app/editorial/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/settings/atelier-memory/page.tsx`

These continue to use many non-token spacing values such as `10px`, `14px`, `18px`, `20px`, `24px`, `32px`, `40px` mixed inline. They are not structurally broken, but they should be migrated into shared classes or module CSS in a second cleanup pass.

## Acceptance Status

Improved in this pass:

- no clipped KPI values on the audited routes
- no text touching card borders in the corrected KPI/card systems
- less awkward wrapping in labels
- better vertical breathing
- safer content width handling

Still recommended next:

- remove remaining inline spacing values route by route
- normalize analytics and clients side panels to the same spacing primitives
- convert remaining ad hoc card paddings into shared spacing tokens
