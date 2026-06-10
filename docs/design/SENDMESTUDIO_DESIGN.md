# SENDMESTUDIO_DESIGN

## Purpose

`SENDMESTUDIO_DESIGN.md` is the permanent visual source of truth for the SendMeStudio frontend.

This file exists to stop visual drift, generic SaaS output and route-by-route inconsistency.

All future UI work must be evaluated against this document before implementation.

---

## 1. Design Philosophy

SendMeStudio is not:

- a generic CRM
- an admin dashboard
- a crypto panel
- an ERP
- a Bootstrap template

SendMeStudio is:

`Luxury Salon Operating System`

The interface must feel:

- premium
- editorial
- soft
- calm
- intelligent
- feminine
- precise
- emotionally aware

The product should feel inspired by:

- Apple
- Dior Beauty
- L’Oréal Professionnel
- Aesop
- Linear
- Notion AI
- soft glass UI
- luxury editorial beauty systems

---

## 2. Core Product Feeling

Every screen should answer:

1. What matters most here?
2. What action should happen next?
3. What is the emotional tone of this surface?
4. Does this look expensive and restrained?

If a screen feels like:

- a dashboard template
- a component collage
- a technical control panel
- a loud design experiment

then it fails the design system.

---

## 3. Visual Identity

### Visual qualities

- pearl white foundations
- lavender restraint
- soft layered glass
- delicate borders
- quiet contrast
- editorial spacing
- elegant sans typography
- thin line iconography

### Avoid

- harsh color saturation
- neon accents
- thick borders
- black heavy shadows
- aggressive gradients
- decorative noise without purpose
- emoji-style iconography

---

## 4. Color Tokens

### Base

```css
--color-bg-base: #fbfaff;
--color-bg-elevated: rgba(255, 255, 255, 0.72);
--color-bg-glass: rgba(255, 255, 255, 0.55);
--color-bg-glass-strong: rgba(255, 255, 255, 0.68);
--color-bg-soft: #f5f1ff;
```

### Text

```css
--color-text-primary: rgba(20, 18, 28, 0.92);
--color-text-secondary: rgba(70, 64, 84, 0.72);
--color-text-muted: rgba(90, 84, 105, 0.56);
--color-text-faint: rgba(90, 84, 105, 0.42);
```

### Accent

```css
--color-accent-primary: #7c5cff;
--color-accent-soft: rgba(124, 92, 255, 0.12);
--color-accent-glow: rgba(124, 92, 255, 0.18);
--color-accent-warm: #c6a36d;
```

### Semantic

```css
--color-success-soft: rgba(87, 199, 133, 0.14);
--color-warning-soft: rgba(214, 174, 100, 0.16);
--color-danger-soft: rgba(214, 132, 132, 0.16);
```

### Rule

Semantic colors should be softened and glass-friendly.

Never use:

- Bootstrap blue
- bright red
- neon green
- pure black surfaces

---

## 5. Typography Tokens

### Official typography system

SendMeStudio uses a two-part sans system.

- Editorial voice: `Inter Tight`, with the role of a restrained display family.
- Product UI: `Inter`, with tighter operational spacing and cleaner small-size rendering.

This is a translation layer of the original `Haas + Inter Display` methodology into the currently approved SendMeStudio stack.

### Sub-system logic

- Editorial surfaces use `Inter Tight` at modest weights to simulate a calm display voice.
- Pricing, billing and AI capacity surfaces use `Inter` at slightly unusual mid-weights to create a distinct but controlled commercial sub-system.
- Body, labels, buttons and dense UI continue using `Inter`.

### Approved stacks

Primary stack:

```css
font-family: Inter, "SF Pro Display", system-ui, sans-serif;
```

Editorial display stack:

```css
font-family: "Inter Tight", Inter, "SF Pro Display", system-ui, sans-serif;
```

Optional approved alternates:

- General Sans
- Satoshi
- Plus Jakarta Sans

### Not allowed

- serif display fonts in product UI
- Times
- Georgia
- Montserrat as primary app UI font
- comic or playful fonts
- techno fonts

### Weight rules

- Standard UI: `400 / 500 / 600`
- Editorial display: `400 / 500`
- Pricing sub-system: `475 / 575` when the chosen font/rendering path supports it

If the environment or browser does not support those exact intermediate weights reliably, fall back to:

- `500` instead of `475`
- `600` instead of `575`

### Type scale

#### display-xl

```css
font-family: "Inter Tight", Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 48px;
line-height: 1.1;
font-weight: 500;
letter-spacing: 0;
```

Use for:

- long-form article `h2`
- major editorial product statements

#### display-lg

```css
font-family: "Inter Tight", Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 40px;
line-height: 1.2;
font-weight: 400;
letter-spacing: 0;
```

Use for:

- homepage hero `h1`
- major route-level lead statements

#### display-md

```css
font-family: "Inter Tight", Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 32px;
line-height: 1.2;
font-weight: 400;
letter-spacing: 0;
```

Use for:

- feature heads
- large intelligence card titles

#### title-lg

```css
font-size: 24px;
line-height: 1.35;
font-weight: 400;
letter-spacing: 0.12px;
```

Use for:

- section titles
- strategic block titles

#### title-md

```css
font-size: 20px;
line-height: 1.5;
font-weight: 400;
letter-spacing: 0;
```

Use for:

- sub-section titles
- mid-level explanatory modules

#### title-sm

```css
font-size: 18px;
line-height: 1.4;
font-weight: 500;
letter-spacing: 0;
```

Use for:

- article or card titles
- compact intelligence cards

#### label-md

```css
font-size: 16px;
line-height: 1.4;
font-weight: 500;
letter-spacing: 0;
```

Use for:

- demo-card titles
- value labels that behave like mini-heads

#### button

```css
font-size: 16px;
line-height: 1.4;
font-weight: 500;
letter-spacing: 0;
```

Use for:

- CTA labels
- pill actions

#### body-md

```css
font-size: 14px;
line-height: 1.25;
font-weight: 400;
letter-spacing: 0;
```

Use for:

- body copy
- top navigation
- footer text

#### caption

```css
font-size: 14px;
line-height: 1.35;
font-weight: 500;
letter-spacing: 0.16px;
```

Use for:

- captions
- meta
- short supporting descriptors

#### legal

```css
font-size: 13.12px;
line-height: 1.2;
font-weight: 600;
letter-spacing: 0;
```

Use for:

- cookie/legal CTA
- highly compact compliance actions

#### pricing-display

```css
font-family: Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 44.8px;
line-height: 1.1;
font-weight: 475;
letter-spacing: 0;
```

Use for:

- pricing or billing `h1`
- AI plan hero values

#### pricing-section

```css
font-family: Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 28px;
line-height: 1.2;
font-weight: 475;
letter-spacing: 0;
```

Use for:

- plan comparison section heads
- AI capacity section titles

#### pricing-card-title

```css
font-family: Inter, "SF Pro Display", system-ui, sans-serif;
font-size: 20px;
line-height: 1.3;
font-weight: 475;
letter-spacing: 0;
```

Use for:

- tier card names
- plan names

### Operational label override

For uppercase operational labels and kickers, keep the product system:

```css
font-size: 11px;
line-height: 1.2;
font-weight: 600;
letter-spacing: 0.18em;
text-transform: uppercase;
opacity: 0.6;
```

---

## 6. Spacing Tokens

```css
--space-4: 4px;
--space-8: 8px;
--space-10: 10px;
--space-12: 12px;
--space-14: 14px;
--space-16: 16px;
--space-18: 18px;
--space-20: 20px;
--space-24: 24px;
--space-28: 28px;
--space-32: 32px;
--space-40: 40px;
```

### Rule

Spacing should feel cinematic and controlled.

Never pack more text into a card than the spacing can support.

---

## 7. Border Radius Tokens

```css
--radius-pill: 999px;
--radius-sm: 14px;
--radius-md: 18px;
--radius-lg: 24px;
--radius-xl: 28px;
--radius-panel: 30px;
--radius-hero: 32px;
```

---

## 8. Shadow Tokens

```css
--shadow-soft: 0 10px 40px rgba(80, 70, 140, 0.06);
--shadow-card: 0 2px 12px rgba(80, 70, 140, 0.04);
--shadow-panel: 0 24px 70px rgba(40, 30, 80, 0.08);
--shadow-accent: 0 16px 36px rgba(124, 92, 255, 0.18);
```

### Rule

Shadows must soften hierarchy, not dramatize it.

Never use:

- black heavy drop shadows
- large hard shadows
- shadow as the only separation device

---

## 9. Glass System

### Official glass

```css
background: rgba(255, 255, 255, 0.55);
backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.45);
box-shadow: 0 8px 30px rgba(40, 30, 90, 0.06);
```

### Glass rules

- glass must remain subtle
- blur must support readability
- borders must stay delicate
- elevated cards may use slightly denser white

### Avoid

- extreme blur
- exaggerated glow
- frosted effects so strong that text loses contrast
- neumorphism

---

## 10. Layout Rules

### Global desktop layout

Default rule:

```css
.page-root {
  height: 100dvh;
  overflow: hidden;
}
```

Preferred structure:

```txt
Sidebar | Main Content | Context Rail
```

### Column logic

- main content: primary decision area
- context rail: supporting intelligence
- sidebar: quiet navigation only

### Safe layout rules

All grid children must include:

```css
min-width: 0;
overflow: hidden;
```

Only internal panels may scroll:

```css
.scroll-area {
  overflow-y: auto;
  scrollbar-width: none;
}

.scroll-area::-webkit-scrollbar {
  width: 0;
  height: 0;
}
```

### Never allow

- body scroll on desktop product routes
- text overlapping image areas
- cards leaking content
- columns colliding
- panels taller than viewport without internal scroll strategy

---

## 11. Sidebar Rules

### Official sidebar behavior

- thin, calm, premium
- line icons only
- lavender glass active state
- no visual noise
- subtle separator between sidebar and content

### Recommended order

1. Salon Intelligence
2. Messages
3. Campaigns
4. Editorial
5. Agenda
6. Muses
7. Sales
8. Studio Pulse
9. Reports
10. Inventory
11. Settings

### Sidebar styling

```css
gap: 18px;
padding: 24px;
border-right: 1px solid rgba(140, 120, 255, 0.08);
```

### Rules

- icon strokes must remain thin
- no emoji-like symbols
- no colorful multi-tone icons
- unread badge can use red/pink accent only for messaging urgency

---

## 12. Card Types

Every card must belong to one of these categories.

### A. Operational Card

Examples:

- agenda
- reservations
- occupancy
- income
- repurchase

Rules:

- compact
- fast to scan
- low copy density
- strong number-to-label hierarchy

### B. Editorial Card

Examples:

- campaigns
- narrative studio
- vocabulary

Rules:

- may use imagery
- may use layered overlays
- may feel more atmospheric
- still must preserve readability

### C. Intelligence Card

Examples:

- AI suggestions
- client dossier
- client intelligence
- trends
- risk signals

Rules:

- must explain action or opportunity
- must communicate priority
- must not be decorative only

---

## 13. Route-Specific Rules

### `/`

Must answer:

- who is next
- what is happening today
- how healthy the salon is
- what AI recommends

Avoid:

- decorative agenda cards
- oversized portrait blocks with overlapping text
- empty white zones without purpose

### `/inbox`

Must feel like:

`Luxury Concierge Messaging`

Avoid:

- generic CRM chat styling
- awkward bilingual labels
- broken avatar/message spacing

### `/campaigns`

Must feel like:

`Narrative Studio`

Avoid:

- technical Meta controls dominating UI
- mock-only terminology visible to end users
- empty white cards

### `/editorial`

Must feel like:

`Editorial training and voice system`

Avoid:

- aggressive mixed styles
- broken card footers
- overly experimental gallery behavior

### `/analytics`

Must feel like:

`Salon Performance Intelligence`

Avoid:

- inline-style dashboard construction
- generic BI panel feeling
- body scroll routes

### `/clients`

Must feel like:

`Muse dossier and relationship intelligence`

Avoid:

- admin directory tables
- technical labels
- dense utility rail clutter

### `/studio-pulse`

Must feel like:

`Operational intelligence and continuous improvement`

Avoid:

- Jira/Trello aesthetics
- issue-tracker heaviness
- encoding errors

### `/salon-intelligence`

Must express:

- AI capacity
- AI business impact
- elegant billing abstraction

Avoid:

- token language
- platform vendor references
- developer billing UI

### `/settings`

Must feel like:

`Studio configuration`

Avoid:

- raw credentials in exposed UI
- internal model names
- developer control language

---

## 14. Terminology Rules

### Use

- Salon Intelligence
- Client Intelligence
- Narrative Studio
- Muse
- Ritual
- Concierge
- Editorial
- Insights
- Studio Pulse

### Avoid

- Home
- Dashboard
- Admin
- System
- Ready
- Level
- Mock approve
- Mock reject
- technical provider names

### Naming consistency

`Maison` must not appear in visible UI.

---

## 15. Iconography Rules

- line icons only
- thin stroke
- monochrome or soft lavender tint
- no playful color
- no emoji substitutes

Preferred families:

- Lucide
- Phosphor thin
- equivalent outlined premium icon sets

---

## 16. Component Rules

### Buttons

Every button must state a clear action.

Prefer:

- Ver ficha completa
- Generar mensaje
- Lanzar campaña
- Enviar a Meta
- Crear incidencia

Avoid:

- Launch
- Ready
- Mock approve
- Mock reject
- System Status

### Inputs

- clean sans typography
- subtle border
- no harsh technical placeholder text

### Badges

- small
- elegant
- never dominant

### Dossiers

- use section dividers
- short readable paragraphs
- no text overlay on imagery

---

## 17. Do / Don’t Rules

### Do

- use quiet hierarchy
- constrain card content
- let text wrap naturally
- keep routes readable at 1366x768
- use invisible internal scrolls only where necessary
- preserve strong visual purpose per card

### Don’t

- add cards without purpose
- use giant decorative portraits in dense dashboards
- mix 3+ typography systems
- expose mock or technical terminology
- rely on inline styles as a design system
- let text sit on top of images without protection

---

## 18. Component Examples

### Example: operational KPI card

```css
.metric-card {
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(35, 30, 60, 0.08);
  box-shadow: var(--shadow-panel);
}
```

### Example: dossier section

```css
.dossier-section {
  padding: 14px 0;
  border-bottom: 1px solid rgba(35, 30, 60, 0.06);
}
```

### Example: horizontal focus card

```css
.client-focus-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  overflow: hidden;
}

.client-focus-card * {
  min-width: 0;
}
```

---

## 19. Acceptance Criteria

A screen passes the design system only if:

1. There is no body scroll on desktop product routes.
2. No text overlaps another element.
3. No card content leaks outside its card.
4. Typography uses approved families and hierarchy.
5. Sidebar behavior is consistent with the system.
6. Cards have a clear category and purpose.
7. Terminology is premium, useful and non-technical.
8. The route is readable at 1366x768.
9. Context rails support the main action instead of competing with it.
10. The overall experience feels like a luxury salon operating system.

---

## 20. Enforcement Rule

Before implementing or modifying any frontend route, component or card:

1. compare against `SENDMESTUDIO_DESIGN.md`
2. audit spacing, hierarchy and terminology
3. identify any violations
4. only then implement changes

This file is the permanent design constitution for SendMeStudio.
