# W5 — Safe Placeholder for Real Clients (Phase B-2)

## Resumen

W5 (Client Focus Card) mostraba datos mockeados ("LTV Nuevo", "0% repurchase") para clientes reales provenientes de API. Esta fase agrega placeholders seguros para clientes reales sin modificar la lógica de negocio subyacente.

## Cambios realizados

### page.tsx (+4 líneas lógica, +1 derivación)

- **Derivación** (`isRealClient`): `const isRealClient = !selectedAppointment.isMock;`
  - Se coloca junto a `reservationProgress`, en el bloque de derivaciones del appointment seleccionado.
- **Placeholder LTV**: Condicional en el `<span>` de LTV. Si `isRealClient`, muestra `"Sin datos suficientes"` con estilo itálico/gris en vez del valor mockeado.
- **Placeholder repurchase**: El bloque `clientFocusRepurchase` (icono ShoppingBag + texto) se renderiza solo cuando `!isRealClient`.
- **Badge "En construcción"**: Se agrega al final del `clientFocusBody`, antes del `serviceGraphicImage`, visible solo para `isRealClient`.

### page.module.css (+30 líneas CSS)

- `.clientFocusValuePillEmpty`: Gris, itálico, `font-size: 11.5px` — placeholder de LTV sin datos.
- `.w5PlaceholderBadge`: Pill amarillo suave con borde dorado, tipografía pequeña (11px).
- `.w5PlaceholderDot`: Punto decorativo de 6px para el badge.

## Comportamiento por tipo de appointment

| Escenario | LTV | Repurchase | Badge |
|---|---|---|---|
| Mock (isMock: true) | "LTV {valor}" | "{valor}%" | No visible |
| Real (isMock: false) | "Sin datos suficientes" | Oculto | "En construcción" |

## No se modificó

- `agents/` — sin cambios
- `bridge/` — sin cambios
- `adapter/` — sin cambios
- `app/agents/` — sin cambios
- Feature flags — sin cambios
- Lógica de negocio (`getClientIntelligence`, `appointmentProgress`, dossier) — intacta
- Datos de appointment (`ltv`, `repurchase`) — se siguen cargando pero no se muestran para real clients

## Archivos tocados

- `src/app/page.tsx` — derivación + 3 condicionales JSX
- `src/app/page.module.css` — 3 clases CSS nuevas (30 líneas)

## Checkpoint-13

Creado tras validación exitosa: TypeScript compila sin errores, lógica condicional probada contra isMock flag, placeholders no afectan flujo mock existente.

## Próximos pasos sugeridos

- **W8–W10, W12–W14** (Dossier sections): Aplicar mismo patrón de placeholder condicional usando `isRealClient`.
- **W5 Repository**: Cuando se construya `ClientFocusRepository`, reemplazar placeholders con datos reales.
