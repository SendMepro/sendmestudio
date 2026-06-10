# GROWTH_DESIGN.md — Rediseño Ejecutivo

> Versión: 2.0 — Filosofía ejecutiva
> Alineado con: SENDMESTUDIO_DESIGN.md, MASTER_VISUAL_IDENTITY.md

---

## Filosofía

La página `/growth` debe responder solo 4 preguntas:

1. **¿Dónde estoy?** — Meta, avance, estado
2. **¿Cuánto falta?** — Brecha numérica, requisitos
3. **¿Qué debo hacer?** — Campañas priorizadas con impacto
4. **¿Quién responde?** — Responsables asignados, equipo

Todo lo demás es secundario o se elimina.

---

## Reglas de eliminación

- Sin badges decorativos ("En desarrollo", "Premium" repetido)
- Sin chips de IA duplicados
- Sin donuts, gráficos decorativos
- Sin widgets sin datos reales (toggle IA sin backend)
- Sin información repetida en múltiples formatos
- Sin textos menores a 10px (salvo metadata mínima)
- Sin más de 3 niveles visuales por card
- Sin datos sueltos fuera de cards

---

## Arquitectura (7 secciones)

### 1. Centro de Comando
Hero principal. Meta del mes ($8.0M), barra de avance (61%), cifras clave (actual, faltan, responsable, rol). Sin decoración.

### 2. Brecha Comercial
Faltan $3.1M. Tres requisitos numéricos (27 reservas, +8% ticket, <5% cancelaciones). Footnote IA sutil.

### 3. Plan de Ataque
4 cards verticales con hero visual, título, impacto, probabilidad, coach, botón. Grid 4 columnas.

### 4. Orquestación
Pipeline horizontal: Meta → Diagnóstico → Plan → Campañas → Reservas → Resultado. Sin bordes de card, flujo continuo.

### 5. Responsables
4 personas (Maite, Director IA, Administradora, Dueños) con avatar, rol, estado simple.

### 6. Rendimiento del Equipo
5 cards premium con nombre, rating, stats (reservas, completadas, canceladas, cumplimiento, generado).

### 7. Training AI Mode
Al final. Sin protagonismo visual. Badge premium, descripción.

---

## Estilos

- CSS modules locales en `page.module.css`
- Sin dependencias externas (excepto AppShell)
- Glassmorphism consistente con el ecosistema
- SF Pro / Inter typography
- Lucide icons, stroke 1.5
- Responsive: desktop 4 cols → tablet 2 cols → mobile 1 col
