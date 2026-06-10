# DESIGN_SYSTEM_RESPONSIVE_QA.md
## SendMeStudio — Luxury Responsive Layout & Visual QA Rules
### v1.0 — Mandatory UI/UX Engineering Rules

---

# PURPOSE

This document defines the mandatory responsive design, viewport behavior, overflow rules, layout measurements, scroll detection, spacing, and visual QA requirements for SendMeStudio.

SendMeStudio must feel like a luxury beauty operating system, but it must also be technically precise.

No screen may appear visually broken, cut off, clipped, cropped, or inaccessible.

The system must automatically detect when content exceeds the viewport and enable elegant scrolling instead of hiding content behind the browser footer or bottom edge.

---

# CORE PRINCIPLE

Luxury UI does not mean empty space.

Luxury UI means:

- balanced density
- clean hierarchy
- controlled spacing
- readable composition
- no visual noise
- no cropped components
- no inaccessible content
- no fake full-screen layouts that cut the footer

If a section does not fit vertically, the page must scroll elegantly.

Never force `height: 100vh` on content-heavy screens unless the internal panels handle overflow correctly.

---

# GLOBAL VIEWPORT RULES

## Desktop Base

```css
:root {
  --app-sidebar-width: 88px;
  --app-gap: 24px;
  --page-padding-x: 24px;
  --page-padding-y: 20px;
  --panel-radius: 28px;
  --card-radius: 22px;
}
```

## Main App Shell

```css
.app-shell {
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: var(--app-sidebar-width) 1fr;
  overflow-x: hidden;
}
```

Important:

- Use `100dvh`, not only `100vh`.
- `100dvh` adapts better to browser UI changes.
- The root shell may hide horizontal overflow.
- The page content must handle vertical overflow.

---

# PAGE CONTENT SCROLL RULE

Every route page must use:

```css
.page {
  min-height: 100dvh;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--page-padding-y) var(--page-padding-x);
  box-sizing: border-box;
}
```

Never use:

```css
.page {
  height: 100vh;
  overflow: hidden;
}
```

unless each internal column has its own scroll area.

---

# REQUIRED BOTTOM SAFETY SPACE

Every scrollable page must include bottom safe padding:

```css
.page {
  padding-bottom: max(48px, env(safe-area-inset-bottom));
}
```

For pages with fixed bottom composers, use:

```css
.page {
  padding-bottom: calc(140px + env(safe-area-inset-bottom));
}
```

---

# OVERFLOW DETECTION RULE

The UI must never allow content to disappear below the viewport.

Every main page should pass this test:

```js
function detectVerticalCutoff() {
  const body = document.body;
  const html = document.documentElement;

  const contentHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );

  const viewportHeight = window.innerHeight;

  return contentHeight > viewportHeight;
}
```

If `contentHeight > viewportHeight`, the page must allow vertical scrolling.

---

# QA DEBUG OVERFLOW HELPER

Add this temporary debug helper during development:

```js
function reportOverflowIssues() {
  const elements = document.querySelectorAll("*");
  const issues = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();

    if (rect.bottom > window.innerHeight + 2) {
      issues.push({
        element: el,
        bottom: rect.bottom,
        viewport: window.innerHeight,
        className: el.className,
      });
    }
  });

  console.table(issues);
  return issues;
}
```

Use this when screenshots show content cut at the bottom.

---

# ROUTE-SPECIFIC LAYOUT RULES

---

# 1. ANALYTICS PAGE

Route:

```txt
/analytics
```

Current issue observed:

- Right intelligence cards are being cut at the bottom.
- The last card is partially hidden.
- The page does not allow enough vertical scroll or bottom breathing room.

## Correct Layout

```css
.analytics-page {
  min-height: 100dvh;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px 48px;
  box-sizing: border-box;
}
```

## Grid Structure

```css
.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}
```

## Left Panel

```css
.analytics-main-panel {
  min-width: 0;
  border-radius: 32px;
  padding: 28px;
}
```

## Right Panel

```css
.analytics-intelligence-panel {
  min-width: 280px;
  max-height: none;
  overflow: visible;
}
```

If the viewport height is small:

```css
@media (max-height: 820px) {
  .analytics-intelligence-panel {
    max-height: calc(100dvh - 80px);
    overflow-y: auto;
    padding-right: 4px;
  }
}
```

## Analytics Cards

```css
.analytics-insight-card {
  min-height: 160px;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
}
```

Never let cards be hidden behind the page bottom.

---

# 2. STUDIO / CAMPAIGNS PAGE

Routes:

```txt
/studio
/campaigns
/narratives
```

Current issue observed:

- Composer/message field at the bottom is cut off.
- Main center content is too tall for viewport.
- Footer area does not trigger scroll.
- Left campaign column uses too much blank vertical space.

## Correct Page Rule

```css
.studio-page {
  min-height: 100dvh;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px 56px;
  box-sizing: border-box;
}
```

## Correct Grid

```css
.studio-grid {
  display: grid;
  grid-template-columns: 340px minmax(520px, 1fr) 300px;
  gap: 24px;
  align-items: start;
}
```

## Center Panel

```css
.studio-center-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
```

## AI Message Composer

The composer must never be clipped.

```css
.ai-message-composer {
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  border-radius: 24px;
  padding: 22px;
  margin-bottom: 32px;
}
```

If the composer is inside a panel:

```css
.center-panel-scroll {
  max-height: calc(100dvh - 80px);
  overflow-y: auto;
  padding-bottom: 48px;
}
```

---

# RESPONSIVE BREAKPOINTS

## Large Desktop

```css
@media (min-width: 1440px) {
  .studio-grid {
    grid-template-columns: 360px minmax(600px, 1fr) 320px;
  }

  .analytics-grid {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
```

## Standard Laptop

```css
@media (max-width: 1366px) {
  .studio-grid {
    grid-template-columns: 320px minmax(480px, 1fr) 280px;
    gap: 18px;
  }

  .analytics-grid {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 18px;
  }

  .panel {
    padding: 22px;
  }
}
```

## Small Laptop / Tablet Landscape

```css
@media (max-width: 1180px) {
  .studio-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .right-panel,
  .analytics-intelligence-panel {
    max-height: none;
    overflow: visible;
  }
}
```

## Tablet

```css
@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .page {
    padding: 16px;
  }
}
```

## Mobile

```css
@media (max-width: 640px) {
  .page {
    padding: 14px 12px 40px;
  }

  .panel {
    border-radius: 22px;
    padding: 18px;
  }

  .metric-card {
    min-height: 120px;
  }

  .hero-card {
    min-height: 220px;
  }
}
```

---

# HEIGHT RULES

Avoid rigid vertical locking.

Do not use:

```css
height: 100vh;
overflow: hidden;
```

on pages with dynamic cards, composers, forms, or campaign editors.

Use:

```css
min-height: 100dvh;
height: auto;
overflow-y: auto;
```

For internal scroll regions:

```css
.scroll-region {
  max-height: calc(100dvh - 120px);
  overflow-y: auto;
}
```

---

# FOOTER / BOTTOM CUT PREVENTION

Any component near the bottom must have:

```css
margin-bottom: 32px;
```

or the parent must have:

```css
padding-bottom: 48px;
```

For fixed action bars:

```css
.fixed-action-bar {
  position: sticky;
  bottom: 16px;
  margin-top: 24px;
}
```

Do not place important CTA buttons or composer fields at the very bottom without breathing room.

---

# SIDEBAR RULES

```css
.sidebar {
  width: 88px;
  min-height: 100dvh;
  position: sticky;
  top: 0;
  align-self: start;
}
```

If the sidebar icons exceed height:

```css
.sidebar-inner {
  height: 100dvh;
  overflow-y: auto;
  padding-bottom: 24px;
}
```

---

# GLASS PANEL RULES

Glass panels must not break layout.

```css
.glass-panel {
  border-radius: 28px;
  backdrop-filter: blur(24px) saturate(1.15);
  -webkit-backdrop-filter: blur(24px) saturate(1.15);
  overflow: hidden;
}
```

If the panel contains scrollable content:

```css
.glass-panel.scrollable {
  overflow-y: auto;
  overflow-x: hidden;
}
```

Do not use `overflow: hidden` on a parent if children need to scroll.

---

# TEXT DENSITY RULES

Luxury UI must remain readable but not wasteful.

## Headings

```css
.page-title {
  font-size: clamp(26px, 2vw, 42px);
  line-height: 1.05;
}
```

## Labels

```css
.kicker {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
```

## Body

```css
.body-copy {
  font-size: 14px;
  line-height: 1.55;
}
```

---

# COMPONENT MINIMUM SIZES

```css
.metric-card {
  min-height: 150px;
}

.insight-card {
  min-height: 156px;
}

.campaign-card {
  min-height: 88px;
}

.visual-anchor {
  min-height: 260px;
}

.composer {
  min-height: 136px;
}
```

On smaller heights:

```css
@media (max-height: 780px) {
  .metric-card {
    min-height: 120px;
  }

  .visual-anchor {
    min-height: 220px;
  }

  .panel {
    padding: 20px;
  }
}
```

---

# AUTOMATED VISUAL QA CHECKLIST

Every page must be tested at:

```txt
1920x1080
1440x900
1366x768
1280x720
1180x820
1024x768
768x1024
390x844
```

For each viewport verify:

- No card is cut off.
- No composer is hidden.
- No footer content disappears.
- If content exceeds height, page scrolls.
- Right panels remain accessible.
- Sidebar does not cover content.
- Buttons are reachable.
- Last item has at least 32px bottom space.
- No horizontal scroll unless intentionally designed.
- Glass panels do not clip children incorrectly.

---

# REQUIRED DEV DEBUG CSS

During development, temporarily enable:

```css
* {
  outline: 0 solid transparent;
}

.debug-overflow * {
  outline: 1px solid rgba(255, 0, 0, 0.12);
}
```

And JS:

```js
document.documentElement.classList.add("debug-overflow");
reportOverflowIssues();
```

Remove before production.

---

# ANTIGRAVITY / CODEX INSTRUCTION BLOCK

Use this exact instruction when asking the coding agent to fix the layout:

```txt
Fix the responsive layout and overflow behavior across all SendMeStudio pages.

The current pages are visually cut at the bottom, especially /analytics and /studio.
Do not redesign the visual identity.
Do not simplify the luxury UI.
Do not remove glassmorphism.

Implement the rules from DESIGN_SYSTEM_RESPONSIVE_QA.md:

1. Replace rigid height:100vh + overflow:hidden page containers with min-height:100dvh + overflow-y:auto.
2. Add bottom safe padding to all route pages.
3. Ensure /analytics right intelligence panel scrolls or the full page scrolls when content exceeds viewport.
4. Ensure /studio composer and bottom campaign fields are never clipped.
5. Use responsive grid breakpoints:
   - desktop: multi-column
   - <=1180px: single-column stacked
   - <=900px: hide sidebar or convert it to mobile nav
6. Add internal scroll only where needed.
7. Add a dev-only overflow detection helper that reports elements whose rect.bottom exceeds window.innerHeight.
8. Test at 1366x768 and 1280x720 specifically.
9. Preserve the luxury aesthetic: cream, pearl, champagne, soft glass, subtle shadows.
10. The final result must never hide content behind the viewport bottom.
```

---

# FINAL RULE

A beautiful UI that cuts content is not premium.

Premium means:

- everything breathes
- everything is reachable
- everything responds
- everything feels intentional

SendMeStudio must never show cropped panels, hidden composers, or inaccessible footer content.
