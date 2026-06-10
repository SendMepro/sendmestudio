# W4B_LOADING_STATES_REPORT.md — Phase 2.9

## Resumen

**Fecha:** 2026-05-30T00:29 UTC
**Fase:** Phase 2.9 — W4-B Loading States
**Checkpoint:** 11 ✅
**Estado:** ✅ Completado

Se implementaron estados de carga (skeleton/loading UX) para el Appointment Flow List (W4). Ahora el usuario ve 3 cards skeleton con animación shimmer mientras se cargan los appointments. Al completarse la carga (éxito o error), los skeletons desaparecen y se muestran los appointments reales o mock.

---

## Files Modified

| Archivo | Tipo | Cambio |
|---------|:----:|--------|
| `src/app/page.tsx` | Logic + UI | +isLoadingAppointments state, +setIsLoadingAppointments(true/false), +skeleton cards render |
| `src/app/page.module.css` | CSS | +5 clases skeleton con animación shimmer (+39 líneas) |

## Archivos creados
| Archivo | Razón |
|---------|-------|
| `project-memory/W4B_LOADING_STATES_REPORT.md` | Reporte detallado |

---

### diff: page.tsx (+15 líneas)

**1. Nuevo state (1 línea):**
```diff
  const [modoTecnico, setModoTecnico] = useState(false);
+ const [isLoadingAppointments, setIsLoadingAppointments] = useState(true); // Phase 2.9
```

**2. Fetch wrapper con loading (4 líneas):**
```diff
  const loadAppointments = async () => {
+   setIsLoadingAppointments(true);
    try {
      ...
    } catch {
      ...
+   } finally {
+     if (!isCancelled) {
+       setIsLoadingAppointments(false);
+     }
    }
  };
```

**3. Skeleton render (49 líneas de template, ~9 líneas reales):**
```tsx
{isLoadingAppointments ? (
  <>
    <div className={`${styles.flowCard} ${styles.flowCardSkeleton}`}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.flowContent}>
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
        <div className={styles.skeletonLine} style={{ width: '85%' }} />
        <div className={styles.skeletonLine} style={{ width: '45%' }} />
      </div>
    </div>
    {/* +2 more skeleton cards with varied widths */}
  </>
) : (
  liveAppointments.map(...)
)}
```

### diff: page.module.css (+39 líneas)

```css
/* Phase 2.9: W4-B Loading States — skeleton cards for appointment list */
.flowCardSkeleton {
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
}

.skeletonAvatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: linear-gradient(...);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeletonLine {
  height: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: linear-gradient(...);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeletonLine:last-child {
  margin-bottom: 0;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Loading Behavior

| State | Visible | Descripción |
|-------|---------|-------------|
| **Loading (mount)** | 3 skeleton cards con shimmer | Se muestra mientras fetch está en progreso |
| **Loaded (success)** | Appointments reales + mock | Skeleton oculto, datos renderizados |
| **Loaded (error)** | Mock appointments | Skeleton oculto, mock data show, badges "Demo" |
| **After selection** | Dossier intacto | Selection/dossier logic unchanged |

### Timeline
```
t=0ms:     mount → isLoadingAppointments = true (desde useState)
t=0ms+:    skeleton shimmer visible
t≈500ms:   fetch resolves → setIsLoadingAppointments(false)
t≈500ms+:  appointments render, skeleton gone
```

---

## Validation Results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | Appointments still load | ✅ `fetch("/api/appointments")` unchanged |
| 2 | Selection still works | ✅ `onClick` → `setSelectedAppointmentId` unchanged |
| 3 | Dossier still works | ✅ `selectedAppointment` derivation unchanged |
| 4 | Mock/Live badges still work | ✅ `isMock` logic unchanged |
| 5 | No API changes | ✅ Same fetch endpoint |
| 6 | No repository changes | ✅ No repository touched |
| 7 | No bridge changes | ✅ No bridge touched |
| 8 | No adapter changes | ✅ No adapter touched |
| 9 | No logic changes (selection, dossier) | ✅ Pure additive loading state |
| 10 | Skeleton shows during fetch | ✅ `setIsLoadingAppointments(true)` before fetch starts |
| 11 | Skeleton hides after fetch (success) | ✅ `setIsLoadingAppointments(false)` in finally |
| 12 | Skeleton hides after fetch (error) | ✅ `finally` block ensures it |
| 13 | Compilación TypeScript | ✅ Solo error pre-existente en inbox |
| 14 | No business code changed | ✅ Messages/Campaigns/Meta/WhatsApp intactos |

---

## Rollback Instructions

| Escenario | Acción |
|-----------|--------|
| Remove loading state | Eliminar `isLoadingAppointments` state (+1 línea), quitar setIsLoadingAppointments (+4 líneas), quitar skeleton JSX (~49 líneas), restaurar `liveAppointments.map` directo |
| Remove CSS | Eliminar 39 líneas: `.flowCardSkeleton`, `.skeletonAvatar`, `.skeletonLine`, `@keyframes shimmer` |

### Rollback rápido page.tsx (4 cambios)

```typescript
// 1. Eliminar state:
- const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

// 2. Eliminar setIsLoadingAppointments(true) en loadAppointments:
- setIsLoadingAppointments(true);

// 3. Eliminar finally block:
- } finally {
-   if (!isCancelled) {
-     setIsLoadingAppointments(false);
-   }
- }

// 4. Reemplazar skeleton ternary con el map directo:
// Antes:
{isLoadingAppointments ? (<><div skel1/><div skel2/><div skel3/></>) : (liveAppointments.map(...)))}
// Después:
{liveAppointments.map((item, index) => (...)))}
```

### Rollback rápido page.module.css
Eliminar líneas 2139-2178 (`.flowCardSkeleton`, `.skeletonAvatar`, `.skeletonLine`, `@keyframes shimmer`)

---

## Architecture

No arquitectura nueva. Solo state + skeleton:

```
useState(true) ─→ isLoadingAppointments
                     │
                     ▼
    {isLoadingAppointments ? (
      <skeleton cards />      ← before fetch resolves
    ) : (
      liveAppointments.map()  ← after fetch (success or error)
    )}
```

```
Fetch lifecycle:
  loadAppointments()
    ├── setIsLoadingAppointments(true)    → skeleton appears
    ├── await fetch("/api/appointments")  → API call
    ├── setBookedAppointments(data)       → liveAppointments recomputed
    └── setIsLoadingAppointments(false)   → skeleton disappears, cards render
```

Sin cambios en:
- `src/bridges/`
- `src/repositories/`
- `src/adapters/`
- `src/agents/`
- `src/config/`

---

## Files Modified (total lines change)

| File | Added |
|------|:-----:|
| `src/app/page.tsx` | +15 líneas (1 state + 4 fetch wrapper + ~10 skeleton JSX) |
| `src/app/page.module.css` | +39 líneas (5 clases + keyframes) |
| **Total** | **+54 líneas** |
