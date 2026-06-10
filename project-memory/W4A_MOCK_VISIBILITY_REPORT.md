# W4A_MOCK_VISIBILITY_REPORT.md — Phase 2.8

## Resumen

**Fecha:** 2026-05-30T00:22 UTC
**Fase:** Phase 2.8 — W4-A Mock Visibility
**Checkpoint:** 10 ✅
**Estado:** ✅ Completado

Se agregó visibilidad explícita de appointments mock vs reales en el Appointment Flow List (W4). Ahora cada tarjeta muestra un badge "Demo" (amarillo) o "Live" (verde). No se modificó ninguna lógica de selección, carga, error, repositorio o bridge.

---

## Files Modified

| Archivo | Tipo | Cambio |
|---------|:----:|--------|
| `src/app/page.tsx` | UI | +isMock flag en merge, +data-mock attr, +badge render |
| `src/app/page.module.css` | CSS | +.flowBadgeMock, +.flowBadgeLive estilos |

### diff: page.tsx

**bookedAppointments (real API) — +1 línea:**
```diff
  return {
    ...
    impact: "Booking",
+   isMock: false, // Phase 2.8: Real API data
    dossierSections: [
```

**appointments (mock) — +1 línea:**
```diff
  return {
    ...item,
    client: clientName,
    stylist: stylistName,
    stylistImage: stylistPhotoFor(stylistName),
+   isMock: true, // Phase 2.8: Hardcoded demo data
  };
```

**Card article attribute — +1 línea:**
```diff
  <article
    className={styles.flowCard}
    data-tone={item.tone}
+   data-mock={item.isMock ? "true" : "false"}
    data-last={...}
```

**Badge in flowPills — +2 líneas:**
```diff
  <div className={styles.flowPills}>
+   {item.isMock && <span className={styles.flowBadgeMock}>Demo</span>}
+   {!item.isMock && <span className={styles.flowBadgeLive}>Live</span>}
    <span className={styles.flowStatus} data-tone={item.tone}>
```

### diff: page.module.css (+24 líneas)

```css
/* Phase 2.8: Mock/Live badges for W4 appointment cards */
.flowBadgeMock,
.flowBadgeLive {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  white-space: nowrap;
}

.flowBadgeMock {
  background: rgba(255, 200, 55, 0.18);   /* gold tint */
  color: rgba(170, 120, 10, 0.95);
  border: 1px solid rgba(255, 200, 55, 0.30);
}

.flowBadgeLive {
  background: rgba(75, 200, 120, 0.15);    /* green tint */
  color: rgba(30, 130, 70, 0.92);
  border: 1px solid rgba(75, 200, 120, 0.28);
}
```

---

## Visual Changes

| Appointment type | Badge | Badge color | Card border |
|-----------------|-------|-------------|-------------|
| Real (API data) | `Live` | Green tint | unchanged |
| Mock (hardcoded demo) | `Demo` | Gold tint | unchanged (no border change — pure additive) |

No card borders, shadows, or layout were modified. Only the badge is additive.

---

## Validation Results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | Appointments still render | ✅ Same `.map()` loop, same structure |
| 2 | Selection still works | ✅ `onClick` → `setSelectedAppointmentId` unchanged |
| 3 | Dossier still works | ✅ `selectedAppointment` derivation unchanged |
| 4 | No API changes | ✅ `fetch("/api/appointments")` unchanged |
| 5 | No repository changes | ✅ No repository touched |
| 6 | No bridge changes | ✅ No bridge touched |
| 7 | No adapter changes | ✅ No adapter touched |
| 8 | No logic changes | ✅ isMock is purely additive — not read by any logic |
| 9 | No loading logic changes | ✅ `useEffect` fetch unchanged |
| 10 | No error logic changes | ✅ Silent catch preserved |
| 11 | Compilación TypeScript | ✅ Solo error pre-existente en inbox |
| 12 | Messages/Campaigns/Meta/WhatsApp | ✅ Ninguno tocado |

---

## Rollback Instructions

| Escenario | Acción |
|-----------|--------|
| Remove badges | Eliminar las 2 líneas de badge + los 2 isMock flags en merge |
| Remove data-mock attr | Eliminar la línea `data-mock` en el `<article>` |
| Remove CSS | Eliminar las 24 líneas de `.flowBadgeMock` / `.flowBadgeLive` |
| Rollback completo | Revertir page.tsx + page.module.css |

### Rollback rápido (3 cambios en page.tsx, 1 en CSS)

```typescript
// 1. page.tsx — eliminar isMock de bookedAppointments:
- isMock: false, // Phase 2.8: Real API data

// 2. page.tsx — eliminar isMock de appointments:
- isMock: true, // Phase 2.8: Hardcoded demo data

// 3. page.tsx — eliminar badge render:
- {item.isMock && <span className={styles.flowBadgeMock}>Demo</span>}
- {!item.isMock && <span className={styles.flowBadgeLive}>Live</span>}

// 4. page.module.css — eliminar 24 líneas de .flowBadgeMock / .flowBadgeLive
```

---

## Architecture

No arquitectura nueva. Solo datos de UI transparente:

```
liveAppointments merge
  ├── bookedAppointments.map → { ...isMock: false }
  └── appointments.map       → { ...isMock: true }
         │
         ▼
    liveAppointments.map → <article data-mock={...}>
                            └── badge "Demo" | "Live"
```

Sin cambios en:
- `src/bridges/`
- `src/repositories/`
- `src/adapters/`
- `src/agents/`
- `src/config/`

---

## Files Modified (total lines changed)

| File | Added | Removed | Net |
|------|:-----:|:-------:|:---:|
| `src/app/page.tsx` | 5 | 0 | +5 |
| `src/app/page.module.css` | 24 | 0 | +24 |
| **Total** | **29** | **0** | **+29** |
