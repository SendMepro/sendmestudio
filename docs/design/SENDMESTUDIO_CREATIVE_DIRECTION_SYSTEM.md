# SENDMESTUDIO_CREATIVE_DIRECTION_SYSTEM.md

# Objetivo

Este documento define la dirección creativa oficial de SendMeStudio.

NO es un simple CRM.

NO es un dashboard SaaS.

NO es un panel administrativo tradicional.

SendMeStudio debe sentirse como:

```txt
Luxury Salon Operating System

Inspirado en:

Apple
Dior Beauty
L’Oréal Professionnel
Aesop
Tesla UI minimalism
Notion AI
Linear
Arc Browser
Editorial luxury systems
```

## PRINCIPIO PRINCIPAL

Toda nueva pantalla, card, módulo o componente debe responder:

¿Esto se siente premium, editorial, elegante y emocional?

Si parece:

- dashboard genérico
- bootstrap
- ERP
- template SaaS
- crypto app
- admin panel

Entonces:

`ESTÁ MAL.`

## SISTEMA VISUAL OFICIAL

### 1. Estética

La interfaz debe sentirse:

- calmada
- suave
- premium
- femenina
- editorial
- moderna
- silenciosa
- inteligente
- cinematográfica
- elegante

Nunca:

- agresiva
- colorida
- gamer
- startup
- saturada

### 2. Filosofía de diseño

SendMeStudio debe sentirse como:

`Un concierge inteligente para salones premium.`

No como:

`software técnico`

La IA debe sentirse:

- invisible
- elegante
- útil
- contextual

Nunca:

- robótica
- técnica
- compleja

### 3. Layout System

Toda pantalla debe usar:

Regla de 3 columnas

- Sidebar
- Contenido principal
- Panel contextual

Jerarquía:

- 70% contenido
- 20% contexto
- 10% navegación

Nunca:

- grids saturados
- demasiadas cards
- paneles gigantes
- bloques sin respiración

### 4. Sidebar oficial

El sidebar debe:

- ser fino
- silencioso
- elegante
- consistente

Debe sentirse:

`Apple + Arc + Linear`

Nunca:

- grueso
- oscuro pesado
- lleno de iconos
- visualmente ruidoso

#### Sidebar spacing

```css
gap: 18px;
padding: 24px;
border-right: 1px solid rgba(140,120,255,.08);
```

### 5. Tipografía oficial

SOLO usar:

- Inter
- Inter Tight
- General Sans
- Satoshi
- Plus Jakarta Sans
- SF Pro Display

Nunca usar:

- serif
- comic
- grotescas pesadas
- techno fonts

#### Jerarquía tipográfica

#### Sub-sistema editorial/comercial

SendMeStudio adopta una interpretación interna del sistema `Haas + Inter Display`:

- voz editorial: `Inter Tight` en pesos moderados `400 / 500`
- voz de pricing, billing y capacidad IA: `Inter` en pesos intermedios `475 / 575` cuando el render lo permita
- fallback operativo:
  - `500` en vez de `475`
  - `600` en vez de `575`

Esto permite que pricing y `Salon Intelligence Credits` se sientan como un sub-sistema comercial distinto sin romper la coherencia global.

Titles

```css
font-weight: 600;
letter-spacing: -0.04em;
line-height: 1;
```

Labels

```css
font-size: 11px;
letter-spacing: .18em;
text-transform: uppercase;
opacity: .6;
```

Body

```css
font-size: 15px;
line-height: 1.6;
font-weight: 400;
```

### 6. Sistema de cards

Toda card debe pertenecer a UNA categoría:

#### A. Operational Card

Ejemplos:

- agenda
- ingresos
- reservas
- recompra

Deben ser:

- compactas
- claras
- rápidas de leer

#### B. Editorial Card

Ejemplos:

- campañas
- narratives
- vocabulary

Aquí sí:

- fotografía
- glass
- cinematic
- overlays
- portraits

#### C. Intelligence Card

Ejemplos:

- IA insights
- client intelligence
- salon health
- predictions

Deben:

- entregar acción
- explicar oportunidad
- mostrar prioridad

### 7. Uso de imágenes

Las imágenes SIEMPRE deben:

- verse premium
- tener iluminación editorial
- sentirse reales
- parecer campaña beauty

Nunca:

- stock barato
- imágenes random
- fotos low quality
- recortes malos

#### Regla de integración

Las imágenes NO dominan el dashboard operativo.

Las imágenes:

- acompañan
- humanizan
- suavizan

No:

- destruyen jerarquía
- rompen layout

### 8. Sistema Glass

Glass permitido:

- suave
- apenas visible
- premium
- translúcido

Nunca:

- glass exagerado
- blur extremo
- neumorphism
- glow gamer

#### Glass oficial

```css
background: rgba(255,255,255,.55);
backdrop-filter: blur(18px);
border: 1px solid rgba(255,255,255,.45);
box-shadow:
0 8px 30px rgba(40,30,90,.06);
```

### 9. Sombras oficiales

Sombras SIEMPRE suaves.

Nunca:

- negras
- duras
- tipo bootstrap

#### Shadow tokens

```css
--shadow-soft:
0 10px 40px rgba(80,70,140,.06);

--shadow-card:
0 2px 12px rgba(80,70,140,.04);
```

### 10. Colores oficiales

Base:

- Pearl white
- Lavender
- Soft lilac
- Warm gray
- Soft graphite

Accent:

- Luxury violet
- Editorial lavender

Nunca:

- azul bootstrap
- rojo fuerte
- verde neon
- gradients saturados

### 11. IA visual

La IA debe sentirse:

`asistente invisible premium`

No:

`chatbot técnico`

Evitar:

- loaders agresivos
- mensajes técnicos
- GPT references
- token language

### 12. Terminología oficial

Usar:

- Salon Intelligence
- Client Intelligence
- Narrative Studio
- Editorial
- Muse
- Ritual
- Concierge
- Studio Pulse
- Insights

Evitar:

- Dashboard
- Admin
- Mock
- System
- Ready
- Home
- Level

### 13. Regla de simplicidad

Cada pantalla debe responder:

`¿Cuál es la acción principal aquí?`

Si hay:

- demasiadas cards
- demasiadas acciones
- demasiados focos
- demasiadas imágenes

Entonces:

`reducir.`

### 14. Filosofía UX

El sistema debe sentirse:

`Luxury software for humans.`

No:

`software para ingenieros.`

### 15. Auditoría automática

Cada nueva pantalla debe revisarse según:

- jerarquía
- spacing
- tipografía
- respiración
- propósito
- claridad
- coherencia
- lujo visual

### 16. Regla final

NO agregar componentes solo porque “se ven bonitos”.

Todo componente debe:

- tener propósito
- ayudar operación
- mejorar lectura
- aumentar percepción premium

### 17. Resultado esperado

La experiencia completa debe sentirse como:

`El sistema operativo premium de nueva generación para salones de belleza impulsados por IA.`

No como:

`No como:`
