# SendMe Studio Design System (DESIGN.md)

This document serves as the visual reference and design rules for building SendMe Studio CRM. It focuses on a luxurious, calm, and emotional user experience inspired by premium beauty brands and Apple glass aesthetics.

---

## 🎨 Design Guidelines

### 1. Color Palette
- **Background:** Very light warm off-white or pale blush (`#F8F6FB`) with subtle gradients.
- **Accents:** Gentle lavenders (`#B79CFF`), blush pinks (`#F7C7D9`), and soft cyan/light blue glows (`#D2F7FC`).
- **Text:** Dark grey/navy (`#1A1A2E`) to maintain readability without the harshness of pure black.

### 2. Glassmorphic Cards
- Every main panel (conversation list, chat view, analytics insights) must be a frosted glass card:
  - **Background:** Translucent white (`rgba(255, 255, 255, 0.65)`).
  - **Blur:** Backdrop filter set to `24px`.
  - **Border:** Thin translucent white border (`rgba(255, 255, 255, 0.8)`).
  - **Shadows:** Soft, lavender-tinted drop shadows (`rgba(183, 156, 255, 0.08)`).
  - **Corners:** Large rounded radius (`24px`).

### 3. Typography
- **Font Family:** Inter or system sans-serif.
- **Hierarchy:** Bold but elegant headings, medium weight body text, and uppercase labels.
- **Contrast:** High legibility against light glass backdrops.

### 4. Layout
- Clear two-column layout: Navigation/Filters on the left, primary workspaces on the right.
- Spacing must be generous and breathable to give a luxury spa feel.

### 5. Buttons and Tabs
- **Shape:** All buttons and active tabs must use soft pill designs (`rounded.pill`).
- **Styling:** Soft gradients (violet-to-pink) or translucent white backdrops with clear active focus.

---

## 🛠️ CSS Variables Reference
```css
:root {
  --background: #F8F6FB;
  --surface: rgba(255, 255, 255, 0.7);
  --accent-primary: #B79CFF;
  --accent-secondary: #F7C7D9;
  --accent-cyan: #D2F7FC;
  --text-primary: #1A1A2E;
  
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-shadow: rgba(183, 156, 255, 0.08);
}
```
