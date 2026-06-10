# ATELIER_OPERATIONAL_FLOW_RESTRUCTURE

## Scope

Restructured only the Home / Atelier Intelligence information hierarchy.

No visual identity redesign was applied.
No color system was changed.

## Files Changed

- `src/app/page.tsx`
- `src/app/page.module.css`

## Goal Applied

The screen now answers these operational questions more directly:

1. What is happening now
2. Which client matters most
3. What requires attention
4. What the AI recommends
5. What action should be taken next

## Left Column

### Renamed

- `Today Flow` → `Agenda en tiempo real`

### Purpose clarified

The left column now behaves as a live operational timeline.

Each appointment card now includes:

- time
- client
- service
- current state
- staff assignment
- current service stage

Examples added:

- `Con Martina Salas`
- `Upgrade activo`
- `Esperando diagnóstico`
- `Color procesando`

This makes the column answer:

`¿Qué está pasando dentro del salón ahora mismo?`

## Center Hero

### Renamed

- `Atelier Intelligence` → `Prioridad operacional IA`

### Subtitle added

- `La IA detecta dónde existe mayor oportunidad, riesgo o atención inmediata.`

### Client priority card rebuilt

The card no longer reads as flat CRM metadata.

It now explains:

- who the priority client is
- what she booked
- when and with whom
- why she matters
- what opportunity exists
- what action is recommended
- what impact is expected

New structure:

- `Cliente prioritaria`
- `Carla Méndez`
- `Coloración Fantasía`
- `11:30 · Con Renata Ibarra`
- `Why this matters`
- `Opportunity detected`
- `Client value`
- `Recommended action`
- `Expected impact`

## KPI Row

### Renamed for business clarity

- `Ingreso real` → `Ventas confirmadas hoy`
- `Proyectado` → `Ingresos potenciales`
- `Ocupación` → `Capacidad ocupada`

### Meaning improved

- `Ventas confirmadas hoy`
  - `$2.840.000`
  - `+18% vs ayer`
- `Ingresos potenciales`
  - `$3.420.000`
  - `4 reservas aún no pagadas`
- `Capacidad ocupada`
  - `81%`
  - `Pico entre 11:00–16:00`

## Right Panel

### Renamed

- `Dossier privado` → `Dossier cliente`

### Rewritten as staff intelligence

The panel now answers:

`¿Qué debe saber el staff sobre esta clienta?`

Sections updated to:

- `Última visita`
- `Perfil emocional`
- `Hábitos`
- `Servicios favoritos`
- `Riesgo`
- `IA recomienda`

## Removed Disconnected Feeling

The screen is no longer organized as:

- pretty cards
- generic metadata
- disconnected insights

It is now organized as:

- live operations
- main AI priority
- business impact
- client guidance

## Validation

- Verified `/` returns `200`
- Confirmed updated content is mounted in the route:
  - `Agenda en tiempo real`
  - `Prioridad operacional IA`
  - `Ventas confirmadas hoy`
  - `Dossier cliente`

## Notes

The legacy bottom AI mini-card section was removed from the center flow because the priority client card now carries the main AI recommendation directly, which creates a clearer operational narrative.
