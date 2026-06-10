# FRONT_DESIGN_AUDIT_SYSTEM.md

## Objetivo

Auditar exclusivamente el frontend visual de SendMeStudio.

Este documento NO debe modificar lógica de negocio, backend, API, base de datos ni flujos funcionales.

El objetivo es revisar:

- diseño visual
- distribución de pantallas
- jerarquía
- espaciado
- legibilidad
- consistencia de componentes
- errores de UI
- textos mal escritos
- nombres inconsistentes
- iconografía
- cards mal ubicadas
- scrolls incorrectos
- exceso de blanco
- falta de bordes/sombras
- elementos cortados
- componentes montados unos sobre otros
- rutas que no respetan el sistema visual

---

## Alcance

Revisar solo:

```txt
src/app/**/*.tsx
src/app/**/*.css
src/app/**/*.module.css
src/components/**/*.tsx
src/components/**/*.css
src/styles/**/*.css
```

No tocar:

- backend
- API routes
- database
- auth
- integrations
- billing
- WhatsApp API
- Meta API
- OpenAI API

## Principio principal

SendMeStudio debe sentirse como:

Luxury Salon Operating System

No como:

- CRM genérico
- dashboard SaaS barato
- admin template
- landing page rota
- poster gallery
- crypto dashboard
- ERP

## 1. Auditoría de Layout

Revisar cada ruta:

- `/`
- `/inbox`
- `/campaigns`
- `/editorial`
- `/analytics`
- `/clients`
- `/agenda`
- `/settings`
- `/salon-intelligence`
- `/studio-pulse`

Para cada ruta verificar:

- que no haya scroll del body
- que el viewport esté controlado
- que los paneles tengan altura correcta
- que los scrolls internos sean invisibles
- que no haya elementos cortados abajo
- que no haya paneles chocando
- que el sidebar no invada otros paneles
- que la página se entienda en 1366x768

Regla:

```css
page-root {
  height: 100dvh;
  overflow: hidden;
}
```

Los únicos scrolls permitidos deben ser internos:

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

## 2. Auditoría de Sistema Visual

Verificar que toda la app use el mismo lenguaje:

- soft glass
- pearl/lavender
- sombras suaves
- bordes delicados
- tipografía sans elegante
- iconos finos
- buen contraste
- UI premium

Eliminar o corregir:

- emojis como iconos de UI
- iconos gruesos
- colores duros
- sombras negras fuertes
- cards demasiado blancas
- cards sin borde
- textos invisibles
- elementos con opacidad excesiva
- cards gigantes sin propósito

## 3. Auditoría Tipográfica

Usar solo fuentes sans elegantes:

- Inter
- Outfit
- General Sans
- Satoshi
- Plus Jakarta Sans
- SF Pro Display

No usar:

- Times
- Georgia
- serif
- Comic-like fonts
- fuentes pesadas tipo dashboard común

Revisar:

- headings
- labels
- botones
- cards
- sidebar
- inputs
- textarea
- métricas
- captions

Reglas:

```css
font-family: Inter, Outfit, system-ui, sans-serif;
```

Jerarquía:

- Título principal: claro, elegante, no gigante
- Subtítulo: legible
- Labels: uppercase pequeño, pero visible
- Body: sans limpio
- KPIs: alto contraste, peso 500/600

## 4. Auditoría de Terminología

Reemplazar en toda la UI:

`Maison` → `Salon`

Mantener:

- Atelier
- Muse
- Ritual
- Concierge
- Editorial
- Signature

Eliminar textos genéricos:

- Home
- Dashboard
- Admin
- System Status
- Ready
- Lv 2
- Mock approve
- Mock reject

Reemplazarlos por lenguaje útil:

- Salon Intelligence
- Client Intelligence
- AI Suggestions
- Today Flow
- Next Muse
- Studio Pulse
- Salon Status
- Meta Approval

## 5. Auditoría de Sidebar

El sidebar debe ser consistente en toda la app.

Revisar:

- orden de íconos
- estado activo
- badges
- separación visual
- alineación
- tamaño de íconos
- hover
- tooltip
- labels

Orden recomendado:

- Salon Intelligence
- Messages
- Campaigns
- Editorial
- Agenda
- Muses
- Sales
- Studio Pulse
- Reports
- Inventory
- Settings

Reglas visuales:

- iconos lineales finos
- no emojis
- no íconos coloridos
- active state lavender glass
- badge rojo/rosa solo para unread messages
- separación suave entre sidebar y contenido

## 6. Auditoría por Pantalla

### Salon Intelligence / Home

Debe responder:

- quién viene ahora
- qué pasa hoy
- cuánto entra
- qué recomienda la IA
- qué clientes necesitan atención
- qué servicios crecen
- si hay incidencias

Corregir si:

- parece dashboard genérico
- hay mucho blanco vacío
- no se entiende el propósito
- la agenda parece decorativa
- el panel derecho no aporta valor

### Inbox

Debe sentirse como:

`iMessage + Luxury Concierge + Google AI`

Revisar:

- bubbles
- AI draft
- lista de conversaciones
- panel derecho
- avatares
- mensajes cortados
- scroll interno

No debe parecer:

- CRM chat vacío

### Campaigns

Debe ser:

`Narrative / Campaign Studio`

Aquí sí pueden existir cards más editoriales.

Debe contener:

- narrativa
- body post
- versiones WhatsApp/Instagram
- aprobación Meta
- estado de campaña
- CTA
- copy profesional con hook/body/CTA/hashtags

Evitar:

- botones técnicos arriba del editor
- cards vacías
- cajas blancas sin propósito

### Editorial

Debe enseñar lenguaje y estilo.

Vocabulary puede tener cards visuales horizontales.

Pero revisar:

- que el footer no tape texto
- que no haya hover agresivo
- que no se monten fuentes
- que no haya serif antigua
- que las tarjetas no estén rotas

### Studio Pulse

Debe ser módulo de incidencias y mejora continua.

Debe separar:

- Incidents
- Client Feedback
- Studio Suggestions
- AI Observations

Debe permitir:

- crear incidencia
- observación silenciosa
- sugerencia de mejora
- reclamo cliente
- recomendación IA

### Salon Intelligence Usage / AI Credits

Debe mostrar consumo IA como:

- Salon Intelligence Credits
- AI Concierge Actions
- Campaign Generations
- Clients Assisted
- AI Revenue Impact

No mostrar:

- tokens
- OpenAI
- GPT
- API cost

## 7. Auditoría de Cards

Cada card debe tener propósito.

Clasificar:

### Operational cards

- agenda
- reservas
- ingresos
- recompra
- ocupación
- clientes nuevos

Deben ser compactas, claras, legibles.

### Editorial cards

- campaigns
- vocabulary
- narrative studio

Pueden ser más visuales.

### Intelligence cards

- AI suggestions
- client dossier
- insights
- trends

Deben mostrar acción clara.

Eliminar:

- cards vacías
- cards decorativas sin dato
- cards con demasiado texto
- cards con imagen sin propósito
- cards con footer montado
- cards demasiado blancas sin borde

## 8. Auditoría de Datos y Métricas Visuales

Los KPIs del salón deben estar conectados a reservas.

Revisar que existan o preparar espacio para:

- ingresos reales
- ingresos proyectados
- reservas hoy
- reservas confirmadas
- no show
- cancelaciones
- clientes nuevos
- recompra
- ticket promedio
- ocupación
- LTV
- clientes en riesgo
- conversión WhatsApp
- campañas activas
- IA utilizada
- incidencias abiertas

Diferenciar:

`Ingreso proyectado ≠ ingreso real pagado`

## 9. Auditoría de Textos Mal Escritos

Buscar errores como:

- `ColoraciÃ³n`
- `ConexiÃ³n`
- `Lumiere` mal escrito
- `Salon` con acento inconsistente
- textos mezclados inglés/español sin intención

Corregir encoding UTF-8.

Ejemplos correctos:

- Coloración
- Conexión
- Lumière
- Salón
- Hidratación
- Narrativa
- Campaña

## 10. Auditoría de Botones

Todo botón debe decir claramente qué hace.

Evitar:

- Launch
- System Status
- Mock approve
- Mock reject
- Ready
- Lv 2

Preferir:

- Lanzar campaña
- Enviar a Meta
- Aprobar plantilla
- Rechazar plantilla
- Ver ficha completa
- Generar mensaje
- Crear incidencia
- Ver sugerencias IA

## 11. Auditoría Responsive

Probar visualmente:

- 1366x768
- 1440x900
- 1920x1080
- tablet width
- mobile width

En desktop:

- 3 columnas máximo
- sidebar fijo
- paneles internos scroll

En mobile:

- sidebar colapsado
- cards una columna
- contenido prioritario primero

## 12. Reporte Requerido

Crear archivo:

`FRONT_DESIGN_AUDIT_REPORT.md`

Debe contener:

1. Rutas revisadas
2. Problemas encontrados
3. Componentes inconsistentes
4. Textos mal escritos
5. Problemas de layout
6. Problemas de scroll
7. Problemas de tipografía
8. Problemas de sidebar
9. Problemas de cards
10. Cambios recomendados
11. Quick wins
12. Cambios críticos
13. No tocar

## Instrucción para Codex / Antigravity

Ejecutar primero auditoría.

NO rediseñar todavía.

NO hacer cambios masivos sin reporte.

Primero detectar:

- qué está mal
- dónde está mal
- por qué está mal
- qué archivo lo provoca
- qué se recomienda corregir

Luego entregar:

`FRONT_DESIGN_AUDIT_REPORT.md`

Después recién aplicar cambios por fases.

## Regla final

No buscamos más “cosas bonitas”.

Buscamos:

- coherencia visual
- claridad operacional
- jerarquía premium
- experiencia luxury salon

El frontend debe sentirse como:

`un sistema operativo premium para dirigir un salón de belleza con IA`

No como:

`un collage de dashboards bonitos`
