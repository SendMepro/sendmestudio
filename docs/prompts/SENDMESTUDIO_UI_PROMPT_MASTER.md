# SENDMESTUDIO_UI_PROMPT_MASTER.md
## Pixel-Perfect Glass Luxury OS — Light & Dark Theme
### v1.0 — Mandatory Design Direction for SendMeStudio

---

# 1. OBJETIVO

Construir la interfaz de **SendMeStudio** de forma **pixel-perfect** basada en la referencia visual aprobada:

- Light Glass Theme
- Dark Glass Theme
- Luxury Beauty Operating System
- Editorial CRM / Concierge AI Interface
- Glassmorphism real, suave, premium y funcional

La interfaz debe sentirse como:

```txt
Apple VisionOS + Aesop + Dior Beauty + Luxury Salon Concierge
```

NO debe sentirse como:

```txt
CRM genérico
Dashboard SaaS
Admin panel
Software empresarial
UI developer-style
```

---

# 2. REFERENCIA VISUAL OBLIGATORIA

La UI debe seguir exactamente la dirección visual de la imagen de referencia:

- Layout de 4 columnas en desktop
- Sidebar izquierdo fijo
- Lista de conversaciones
- Área central de chat
- Panel derecho de IA contextual
- Panel derecho adicional de acciones rápidas
- Light Theme arriba
- Dark Theme abajo
- Mismo layout para ambos temas
- Solo cambia la paleta, sombras, blur y profundidad

---

# 3. PRINCIPIOS VISUALES

## 3.1 Principios generales

```yaml
visual_principles:
  - glassmorphism_premium
  - soft_luxury
  - editorial_spacing
  - one_primary_focus
  - low_cognitive_noise
  - calm_interaction
  - cinematic_depth
  - pixel_perfect_alignment
```

## 3.2 Prohibido

```yaml
avoid:
  - dashboard_look
  - hard_borders
  - aggressive_shadows
  - corporate_blue
  - childish_colors
  - excessive_cards
  - heavy_black_light_theme
  - pure_white_flat_background
  - fake_glass_without_depth
  - cramped_layout
  - random_spacing
  - inconsistent_radius
```

## 3.3 Obligatorio

```yaml
must_have:
  - consistent_grid
  - consistent_spacing
  - consistent_blur
  - consistent_radius
  - real_visual_hierarchy
  - readable_text
  - elegant_empty_space
  - responsive_behavior
  - no_bottom_cutoff
  - no_horizontal_overflow
```

---

# 4. DESIGN TOKENS

---

# 4.1 Light Glass Theme

```css
:root[data-theme="light"] {
  --bg-base: #f7f6fb;
  --bg-soft: #fbf9ff;
  --bg-glass: rgba(255, 255, 255, 0.52);
  --bg-glass-strong: rgba(255, 255, 255, 0.74);

  --primary: #7c5cff;
  --primary-soft: #eee8ff;
  --primary-glow: rgba(124, 92, 255, 0.22);

  --champagne: #c6a36d;
  --pearl: #f5f1ea;
  --lavender: #e8ddff;

  --text-primary: #11111a;
  --text-secondary: #6c6a7a;
  --text-muted: #9b98a8;

  --border-soft: rgba(255, 255, 255, 0.72);
  --border-glass: rgba(180, 170, 210, 0.24);

  --shadow-glass: 0 24px 80px rgba(80, 60, 140, 0.10);
  --shadow-soft: 0 10px 40px rgba(40, 30, 80, 0.08);
  --shadow-purple: 0 18px 48px rgba(124, 92, 255, 0.22);

  --blur-glass: blur(24px) saturate(1.18);
  --blur-soft: blur(16px) saturate(1.08);
}
```

---

# 4.2 Dark Glass Theme

```css
:root[data-theme="dark"] {
  --bg-base: #080812;
  --bg-soft: #10101b;
  --bg-glass: rgba(255, 255, 255, 0.055);
  --bg-glass-strong: rgba(255, 255, 255, 0.085);

  --primary: #8a78ff;
  --primary-soft: rgba(138, 120, 255, 0.18);
  --primary-glow: rgba(138, 120, 255, 0.30);

  --champagne: #d7b87c;
  --pearl: #f2ecff;
  --lavender: #bca8ff;

  --text-primary: #f3f2f7;
  --text-secondary: #aaa1b3;
  --text-muted: #7f778a;

  --border-soft: rgba(255, 255, 255, 0.12);
  --border-glass: rgba(255, 255, 255, 0.10);

  --shadow-glass: 0 28px 90px rgba(0, 0, 0, 0.45);
  --shadow-soft: 0 14px 50px rgba(0, 0, 0, 0.32);
  --shadow-purple: 0 20px 60px rgba(124, 92, 255, 0.30);

  --blur-glass: blur(26px) saturate(1.22);
  --blur-soft: blur(18px) saturate(1.1);
}
```

---

# 5. TIPOGRAFÍA

Usar una tipografía elegante, limpia y moderna.

Preferencias:

```txt
Inter
Satoshi
SF Pro Display
Neue Haas Grotesk
```

## Escala

```css
.h1 {
  font-size: 28px;
  line-height: 1.18;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.h2 {
  font-size: 20px;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.body {
  font-size: 14px;
  line-height: 1.6;
  font-weight: 400;
}

.small {
  font-size: 12px;
  line-height: 1.5;
}

.meta {
  font-size: 10px;
  line-height: 1.4;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 600;
}
```

---

# 6. GRID PRINCIPAL DESKTOP

## Layout obligatorio

```css
.app-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 280px 320px minmax(520px, 1fr) 320px;
  gap: 24px;
  padding: 24px;
  box-sizing: border-box;
  overflow-x: hidden;
}
```

## Columnas

```yaml
columns:
  sidebar:
    width: 280px
    purpose: navigation_brand_identity

  conversations:
    width: 320px
    purpose: conversation_list

  chat:
    width: flexible
    min_width: 520px
    purpose: main_focus

  ai_panel:
    width: 320px
    purpose: contextual_intelligence
```

---

# 7. FONDO GENERAL

El fondo debe tener profundidad suave.

## Light

```css
body[data-theme="light"] {
  background:
    radial-gradient(circle at 85% 15%, rgba(124, 92, 255, 0.16), transparent 32%),
    radial-gradient(circle at 15% 90%, rgba(198, 163, 109, 0.12), transparent 30%),
    linear-gradient(135deg, #f8f7fb 0%, #ffffff 42%, #efe9ff 100%);
}
```

## Dark

```css
body[data-theme="dark"] {
  background:
    radial-gradient(circle at 86% 18%, rgba(124, 92, 255, 0.26), transparent 34%),
    radial-gradient(circle at 16% 88%, rgba(198, 163, 109, 0.10), transparent 28%),
    linear-gradient(135deg, #05050b 0%, #0b0b16 46%, #160f2c 100%);
}
```

---

# 8. GLASS COMPONENT SYSTEM

## Base glass card

```css
.glass-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-glass);
}
```

## Strong glass

```css
.glass-strong {
  background: var(--bg-glass-strong);
  border: 1px solid var(--border-soft);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
}
```

---

# 9. SIDEBAR

## Estructura

```yaml
sidebar:
  width: 280px
  radius: 24px
  padding: 24px
  layout: vertical
```

## CSS

```css
.sidebar {
  width: 280px;
  min-height: calc(100dvh - 48px);
  padding: 24px;
  border-radius: 24px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

## Item activo

```css
.nav-item.active {
  background: linear-gradient(135deg, var(--primary), rgba(124, 92, 255, 0.72));
  color: white;
  box-shadow: 0 12px 32px var(--primary-glow);
}
```

---

# 10. LISTA DE CONVERSACIONES

## CSS

```css
.conversation-list {
  width: 320px;
  min-height: calc(100dvh - 48px);
  padding: 24px;
  border-radius: 24px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-soft);
}
```

## Item conversación

```css
.conversation-item {
  min-height: 72px;
  padding: 14px;
  border-radius: 18px;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 12px;
  align-items: center;
}

.conversation-item:hover {
  background: var(--bg-glass-strong);
}
```

---

# 11. CHAT CENTRAL

El chat central es el foco principal.

```css
.chat-panel {
  min-width: 520px;
  min-height: calc(100dvh - 48px);
  padding: 24px;
  border-radius: 28px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-glass);
  display: flex;
  flex-direction: column;
}
```

## Header del chat

```css
.chat-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

## Área de mensajes

```css
.messages-area {
  flex: 1;
  padding: 24px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
```

## Burbujas

```css
.message-bubble {
  max-width: 62%;
  padding: 18px 20px;
  border-radius: 22px;
  line-height: 1.55;
}

.message-bubble.client {
  align-self: flex-start;
  background: var(--bg-glass-strong);
  color: var(--text-primary);
}

.message-bubble.studio {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--primary), #b28cff);
  color: white;
  box-shadow: var(--shadow-purple);
}
```

## Composer

```css
.composer {
  min-height: 64px;
  padding: 12px 16px;
  border-radius: 22px;
  background: var(--bg-glass-strong);
  border: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  gap: 12px;
}
```

---

# 12. PANEL IA CONTEXTUAL

El panel derecho NO debe competir con el chat.

Debe sentirse como inteligencia ambiental.

```css
.ai-panel {
  width: 320px;
  min-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
```

## Card IA

```css
.ai-card {
  padding: 22px;
  border-radius: 24px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-soft);
}
```

## Acciones rápidas

```css
.quick-action {
  min-height: 72px;
  padding: 18px;
  border-radius: 18px;
  background: var(--bg-glass-strong);
  border: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

---

# 13. LIGHT / DARK THEME SWITCH

La estructura visual NO cambia.

Solo cambian:

```yaml
theme_changes:
  - background
  - glass_opacity
  - shadows
  - text_colors
  - borders
  - glow_strength
```

No modificar:

```yaml
do_not_change_between_themes:
  - layout
  - spacing
  - component_size
  - column_widths
  - typography_scale
  - hierarchy
```

---

# 14. JERARQUÍA VISUAL

```yaml
visual_hierarchy:
  primary_focus:
    element: chat_panel
    dominance: 1.0

  secondary:
    elements:
      - conversation_list
      - ai_context_panel
    dominance: 0.55

  tertiary:
    elements:
      - sidebar
      - metadata
      - small_buttons
    dominance: 0.28
```

---

# 15. MICROINTERACCIONES

```css
.interactive {
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 220ms ease,
    border-color 220ms ease;
}

.interactive:hover {
  transform: translateY(-2px);
}

.interactive:active {
  transform: scale(0.98);
}
```

---

# 16. RESPONSIVE

## >= 1440px

```css
.app-shell {
  grid-template-columns: 280px 320px minmax(520px, 1fr) 320px;
}
```

## 1024px — 1439px

```css
.app-shell {
  grid-template-columns: 88px 300px minmax(480px, 1fr) 300px;
}

.sidebar {
  width: 88px;
}
```

## 768px — 1023px

```css
.app-shell {
  grid-template-columns: 280px 1fr;
}

.ai-panel {
  display: none;
}
```

## <= 767px

```css
.app-shell {
  grid-template-columns: 1fr;
  padding: 14px;
}

.sidebar,
.conversation-list,
.ai-panel {
  display: none;
}

.chat-panel {
  min-width: 0;
  min-height: calc(100dvh - 28px);
}
```

---

# 17. REGLAS DE QA VISUAL

La implementación debe pasar estos criterios:

```yaml
qa:
  - same_layout_as_reference
  - same_light_dark_structure
  - no_random_spacing
  - no_cutoff_bottom
  - no_horizontal_scroll
  - no_hard_borders
  - no_flat_white_panels
  - no_flat_black_panels
  - all_text_readable
  - chat_is_primary_focus
  - ai_panel_supports_not_competes
  - sidebar_is_quiet
  - glass_has_depth
```

---

# 18. PROMPT PARA CODEX / ANTIGRAVITY

Usar este bloque directamente:

```txt
Rebuild the SendMeStudio interface to match the approved pixel-perfect Light Glass and Dark Glass reference.

Important:
- Do not create a generic CRM.
- Do not create a normal SaaS dashboard.
- Follow SENDMESTUDIO_UI_PROMPT_MASTER.md exactly.
- The layout must use the same four-column structure:
  280px sidebar / 320px conversations / flexible chat / 320px AI panel.
- The chat is the main hero focus.
- The AI panel must feel ambient and supportive, not heavy.
- Implement both light and dark themes using the same layout.
- Only the theme tokens should change between light and dark.
- Preserve glassmorphism, translucent layers, soft purple/champagne accents, rounded corners, blur and depth.
- Use consistent spacing: 24px shell padding, 24px column gap, 24px panel padding.
- Avoid hard borders, flat cards, dashboard look, and excessive boxes.
- Add responsive breakpoints exactly as defined.
- Ensure no bottom cutoff, no horizontal overflow, and scroll only where necessary.
- Make it look like Apple VisionOS + Aesop + Dior Beauty, not a CRM.
- The result must feel pixel-perfect against the reference image.
```

---

# 19. DEV ACCEPTANCE CHECKLIST

Before marking complete, verify:

```txt
[ ] Light theme matches reference structure.
[ ] Dark theme matches reference structure.
[ ] Sidebar position, width and spacing are consistent.
[ ] Conversation list width is 320px desktop.
[ ] Chat panel is central focus.
[ ] AI panel is exactly supportive, not visually dominant.
[ ] All columns align vertically.
[ ] Padding is consistent.
[ ] Border radius is consistent.
[ ] Background has premium depth.
[ ] Glass cards are translucent but readable.
[ ] No component is clipped.
[ ] No bottom cutoff.
[ ] No horizontal overflow.
[ ] Responsive views work.
[ ] Theme switch does not break layout.
```

---

# 20. FINAL RULE

The interface must whisper luxury.

Not scream software.

SendMeStudio should feel like a premium emotional operating system for beauty studios.
