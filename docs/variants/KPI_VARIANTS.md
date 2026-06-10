# Variantes de iconografía — Dashboard Recepcionista IA

## A) Apple

```tsx
// ── Hero badge ──
<div style={{
  width: "28px", height: "28px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, var(--primary), #9b7dff)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <Sparkles size={13} strokeWidth={1.5} style={{ color: "#fff" }} />
</div>

// ── KPI container ──
<div style={{
  width: "24px", height: "24px",
  borderRadius: "6px",
  background: "rgba(0,0,0,0.04)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <card.icon size={13} strokeWidth={1.5} style={{ color: "var(--text-secondary)" }} />
</div>

// ── KPI value ──
<div style={{ fontSize: "1.4rem", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "2px" }}>
  {card.value}
</div>

// ── KPI label ──
<div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
  {card.label}
</div>
```

**Características:** Contenedor cuadrado pequeño (24×24, radius 6), sin fondo de color. Icono 13px sutil. Tipografía SF-style: weight 400, letter-spacing -0.02em. Label 11px regular weight. Valor 1.4rem más contenido.

---

## B) Linear

```tsx
// ── Hero badge ──
<div style={{
  width: "28px", height: "28px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, var(--primary), #9b7dff)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <Sparkles size={14} strokeWidth={1.5} style={{ color: "#fff" }} />
</div>

// ── KPI container ──
<div style={{
  width: "28px", height: "28px",
  borderRadius: "8px",
  background: "rgba(124,92,255,0.05)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <card.icon size={14} strokeWidth={1.5} style={{ color: "var(--text-secondary)" }} />
</div>

// ── KPI value ──
<div style={{ fontSize: "1.6rem", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "4px" }}>
  {card.value}
</div>

// ── KPI label ──
<div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.01em" }}>
  {card.label}
</div>
```

**Características:** Contenedor cuadrado 28×28 con radius 8 (coincide con hero). Fondo púrpura ultra sutil (0.05). Icono 14px. Valor semibold 1.6rem. Label 10.5px semibold.

---

## C) Stripe

```tsx
// ── Hero badge ──
<div style={{
  width: "32px", height: "32px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, var(--primary), #9b7dff)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <Sparkles size={15} strokeWidth={2} style={{ color: "#fff" }} />
</div>

// ── KPI container ──
<div style={{
  width: "32px", height: "32px",
  borderRadius: "10px",
  background: "rgba(0,0,0,0.03)",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  <card.icon size={15} strokeWidth={2} style={{ color: "var(--text)" }} />
</div>

// ── KPI value ──
<div style={{ fontSize: "1.8rem", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "4px" }}>
  {card.value}
</div>

// ── KPI label ──
<div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 450 }}>
  {card.label}
</div>
```

**Características:** Contenedor 32×32 (más presencia). strokeWidth 2 (iconos ligeramente más gruesos). Fondo gris neutro 0.03. Valor 1.8rem bold. Label 11px medium. Más peso visual en números.
