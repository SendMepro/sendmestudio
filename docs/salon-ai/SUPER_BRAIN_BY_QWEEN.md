 SALON_BRAIN.md - Cerebro Autónomo para Salón de Belleza
# 💇‍♀️ SALON_BRAIN.md v1.0
## Cerebro Cognitivo para Gestión Inteligente de Salón de Belleza

> **Propósito**: Aprender de cada cliente, predecir necesidades, optimizar agenda, sugerir promociones y automejorar la experiencia del cliente mediante memoria dual y agentes especializados.

---

## 🔰 CAPA 0: IDENTIDAD DEL SALÓN

```yaml
identity:
  name: "SalonBrain"
  business_type: "Beauty Salon / Hair & Wellness"
  mission: >
    Convertir cada visita en una experiencia personalizada, 
    anticipar necesidades del cliente y maximizar retención 
    mediante inteligencia de datos y automejora continua.
  
  core_values:
    - "Personalización: Cada cliente es único"
    - "Anticipación: Saber qué necesita antes de que lo pida"
    - "Retención: Fidelizar es más rentable que captar"
    - "Eficiencia: Agenda llena, sin estrés"

  success_metrics:
    - "Tasa de re-agendamiento: >75%"
    - "Ticket promedio por cliente: +15% trimestral"
    - "Reducción de no-shows: <10%"
    - "Satisfacción post-servicio: >4.5/5"



ESTRUCTURA DEL SISTEMA (Enfoque Salón)
salon_brain/
├── salon_brain.md          # ← ESTE ARCHIVO: Núcleo orquestador
├── IDENTITY.md             # Misión y valores del salón
├── STATE.md                # Estado actual: agenda, clientes activos, alertas
│
├── memory/
│   ├── deep/               # Conocimiento permanente
│   │   ├── client_profiles/       # Historial estructurado por cliente
│   │   ├── service_timing_rules.md # Tiempos entre servicios (ej: tinte cada 6-8 sem)
│   │   ├── promotion_playbook.md   # Catálogo de promociones probadas
│   │   ├── seasonal_patterns.md    # Comportamiento por temporada
│   │   └── staff_expertise.md      # Habilidades por estilista
│   │
│   └── temporary/          # Contexto por sesión/cliente
│       ├── session_{client_id}/
│       │   ├── last_visit.md       # Detalles de última cita
│       │   ├── next_suggested.md   # Próximo servicio sugerido
│       │   ├── promotion_fit.md    # Promoción personalizada calculada
│       │   └── conversation_log.md # Notas de consulta actual
│
├── agents/                 # Agentes especializados
│   ├── template_agent.md
│   ├── scheduler.md        # Gestiona agenda y recordatorios
│   ├── retention.md        # Predice cuándo un cliente podría irse
│   ├── promoter.md         # Diseña promociones personalizadas
│   ├── color_tracker.md    # Calcula timing para retoque de color
│   └── feedback_analyzer.md # Analiza reseñas y sugerencias
│
├── integrations/           # Conexiones externas
│   ├── google_sheets.md    # Esquema para sincronizar hoja de clientes
│   ├── whatsapp_api.md     # Plantillas para mensajes automatizados
│   └── pos_connector.md    # Integración con sistema de caja
│
├── tasks/                  # Cola de acciones
│   ├── today.md            # Acciones para hoy (recordatorios, follow-ups)
│   ├── this_week.md        # Planificación semanal
│   └── completed/          # Historial de acciones ejecutadas
│
└── logs/                   # Auditoría y aprendizaje
    ├── decisions_log.md    # Por qué se sugirió X promoción a Y cliente
    ├── improvements.md     # Lecciones aprendidas y reglas actualizadas
    └── metrics_weekly.md   # Reporte automático de KPIs


🔄 CICLO PRINCIPAL: DE LA CITA A LA FIDELIZACIÓN
Fase 1: RECEPCIÓN DE DATOS DEL CLIENTE

[INPUT_HOOK]
Cuando un cliente agenda, visita o es consultado:

1. 📥 Consultar `integrations/google_sheets.md` para:
   - Historial de servicios: [{fecha}, {servicio}, {estilista}, {precio}]
   - Preferencias: [tono_de_color, tipo_de_cabello, productos_usados]
   - Fechas clave: [cumpleaños, última_visita, próxima_cita_sugerida]

2. 🔍 Calcular métricas clave:
   ```yaml
   client_health:
     days_since_last_visit: {calcular}
     avg_visit_frequency: {ej: "cada 45 días"}
     lifetime_value: {suma_histórica}
     risk_of_churn: {bajo|medio|alto}  # Basado en patrones de inactividad


🎯 Activar agente según contexto:
Si "última visita fue tinte" → activar color_tracker.md
Si "no ha venido en 60+ días" → activar retention.md
Si "cumpleaños en 7 días" → activar promoter.md



### Fase 2: CÁLCULO INTELIGENTE DE NECESIDADES
```markdown
[SERVICE_TIMING_ENGINE]
Para servicios recurrentes (ej: coloración):

REGLA BASE en `memory/deep/service_timing_rules.md`:
```yaml
hair_color_retouch:
  standard_interval_days: 42  # 6 semanas
  adjustment_factors:
    hair_growth_rate: {rápido: -7 días, lento: +7 días}
    color_type: {balayage: +14 días, raíz_sólida: -7 días}
    client_preference: {mantener_perfecto: -7 días, estilo_desgastado: +14 días}

CÁLCULO DINÁMICO:
Tomar fecha de último tinte: 2026-04-01
Aplicar regla base: +42 días → 2026-05-13
Ajustar por factores del cliente:
Crecimiento rápido: -7 días → 2026-05-06
Prefiere raíz perfecta: -7 días → 2026-04-29
Resultado: Próximo retoque sugerido: 2026-04-29 ± 3 días
✅ Guardar en memory/temporary/session_{id}/next_suggested.md
📱 Programar recordatorio automático vía integrations/whatsapp_api.md



### Fase 3: GENERACIÓN DE SUGERENCIAS PERSONALIZADAS
```markdown
[PROMOTION_GENERATOR]
Activado por agente `promoter.md`:

INPUT:
```yaml
client_context:
  last_service: "Balayage + Corte"
  spend_last_3_visits: "$180, $195, $210"
  products_bought: ["shampoo_color_protect", "mascarilla_hidratacion"]
  upcoming_event: null  # o "boda en 30 días"

LÓGICA DE DECISIÓN:
SI cliente_compra_productos_retail Y no_ha_probado_nuevo:
  → Sugerir: "Pack mantenimiento color: 15% OFF en tu próximo shampoo + mascarilla"

SI días_para_próximo_servicio < 7 Y agenda_tiene_huecos:
  → Sugerir: "Reserva esta semana y recibe brillo gratuito"

SI cliente_alto_valor Y cumpleaños_en_14_días:
  → Sugerir: "Regalo de cumpleaños: tratamiento de keratina a 50% OFF"

SI cliente_riesgo_abandono:
  → Sugerir: "Te extrañamos: 20% OFF en tu próximo servicio + café de cortesía"

OUTPUT en promotion_fit.md:
suggested_promotion:
  title: "Mantenimiento Color Premium"
  description: "15% OFF en productos de mantenimiento + diagnóstico gratuito de color"
  validity_days: 14
  channel: "whatsapp"  # o "email", "in-salon"
  expected_uplift: "+$35 en ticket promedio"
  confidence: 0.87



---

## 🤖 AGENTES ESPECIALIZADOS (Ejemplos Prácticos)

### `agents/color_tracker.md` - Experto en Cronograma de Color
```markdown
# 🎨 Color Tracker Agent

> **Rol**: Calcular timing óptimo para retoques de coloración y sugerir mantenimiento

## 📥 Entrada Esperada
```yaml
input:
  client_id: "{ID}"
  last_color_service:
    date: "YYYY-MM-DD"
    type: "root_touchup|balayage|full_color|highlights"
    color_brand: "{opcional}"
  client_profile:
    hair_growth: "fast|medium|slow"
    style_preference: "perfect_roots|lived_in|experimental"
    budget_tier: "standard|premium|luxury"



 Salida Requerida
output:
  next_recommended_date: "YYYY-MM-DD"
  date_range_flex: "±3 días"
  service_suggestion: "Root touchup + gloss treatment"
  prep_notes: "Sugerir mascarilla 3 días antes para mejor absorción"
  urgency_level: "low|medium|high"  # Para priorizar recordatorios
  confidence_score: 0.0-1.0






🔄 Lógica Principal
Consultar memory/deep/service_timing_rules.md para intervalo base
Ajustar por factores individuales del cliente
Cruzar con disponibilidad de agenda (agents/scheduler.md)
Generar recomendación con margen de flexibilidad
Si confidence < 0.7 → flag para revisión humana
🛠️ Herramientas
read: ["memory/deep/client_profiles/*", "integrations/google_sheets.md"]
write: ["tasks/today.md", "memory/temporary/session_*/next_suggested.md"]
execute: ["calcular_fecha_proyectada", "validar_disponibilidad_agenda"]




### `agents/promoter.md` - Diseñador de Promociones Inteligentes
```markdown
# 🎁 Promoter Agent

> **Rol**: Crear promociones personalizadas que aumenten retención y ticket promedio

## 🎯 Objetivo Único
Generar 1-3 ofertas relevantes por cliente, basadas en historial, timing y comportamiento.

## 📊 Fuentes de Datos Clave
- `memory/deep/promotion_playbook.md`: Promociones probadas y sus resultados
- `memory/deep/seasonal_patterns.md`: Comportamiento por mes/temporada
- `memory/temporary/session_*/`: Contexto inmediato del cliente

## 💡 Reglas de Personalización
```yaml
personalization_rules:
  - IF client_ltv > percentile_75:
      offer_type: "exclusivity"  # Acceso anticipado, servicios premium
  - IF client_has_not_returned_in_60_days:
      offer_type: "win_back"  # Descuento agresivo + gesto personal
  - IF client_buys_retail_regularly:
      offer_type: "bundle"  # Pack servicio + producto con ahorro
  - IF upcoming_season = "summer":
      boost: "proteccion_solar_cabello"  # Promocionar tratamientos UV

 Formato de Salida

promotion_card:
  headline: "{título atractivo y personalizado}"
  value_prop: "{qué gana el cliente en 1 frase}"
  offer_details:
    discount: "15% OFF"  # o "2x1", "gratis con compra", etc.
    applicable_services: ["color", "corte", "tratamiento"]
    validity: "14 días"
  call_to_action: "Reserva antes del {fecha} y menciona este código: COLOR15"
  channel_recommendation: "whatsapp"  # Según preferencia del cliente
  expected_metrics:
    redemption_rate_estimate: "35-50%"
    avg_ticket_uplift: "+$28"








---

## 📊 INTEGRACIÓN CON GOOGLE SHEETS (Ejemplo Práctico)

### `integrations/google_sheets.md`
```markdown
# 🔗 Esquema de Sincronización con Google Sheets

## Hoja: "Clientes_Activos"
| Columna | Tipo | Propósito | Ejemplo |
|---------|------|-----------|---------|
| client_id | string | ID único | "CLT-2847" |
| name | string | Nombre completo | "María González" |
| phone | string | WhatsApp para recordatorios | "+5215512345678" |
| last_visit | date | Última cita registrada | "2026-04-01" |
| last_service | string | Servicio principal | "Balayage + Corte" |
| next_suggested | date | Próxima cita calculada | "2026-05-06" |
| color_notes | text | Preferencias de color | "Tono 7.1, evitar amarillo, raíz cada 6 sem" |
| product_prefs | list | Productos que compra | ["shampoo_color_protect", "aceite_argan"] |
| ltv_tier | enum | Segmentación por valor | "premium" |
| churn_risk | enum | Alerta de posible abandono | "medium" |
| birthday | date | Para promociones personales | "1990-08-15" |
| notes | text | Observaciones del estilista | "Prefiere citas por la tarde, alérgica a fragancias" |

## 🔁 Flujo de Sincronización
```yaml
sync_schedule:
  read_from_sheet: "cada 1 hora"  # Para actualizar contexto en tiempo real
  write_to_sheet: "tras cada acción crítica"  # Ej: nueva cita sugerida, promoción enviada
  
  fields_auto_updated:
    - "next_suggested"  # Por color_tracker.md
    - "churn_risk"      # Por retention.md
    - "last_promotion_sent"  # Por promoter.md
    
  manual_override:
    - Estilista puede editar "notes" o "color_notes" directamente en Sheets
    - Cambios se reflejan en brain en <5 min


⚠️ Reglas de Seguridad
Solo lectura para agentes automáticos, excepto campos marcados como "writable"
Cambios críticos (ej: eliminar cliente) requieren aprobación humana
Logs de todos los cambios en logs/decisions_log.md



---

## 🎯 EJEMPLO DE FLUJO COMPLETO: "María necesita retoque de color"

```markdown
[SCENARIO] Cliente: María González (CLT-2847)
Último servicio: Balayage + Corte el 2026-04-01
Hoja de Sheets actualizada: ✅

PASO 1: Brain detecta que hoy es 2026-05-20
→ Calcula: 49 días desde último tinte
→ Regla base: 42 días para balayage
→ Ajuste: María tiene crecimiento rápido (-7 días) → fecha ideal: 2026-05-06
→ Estado: "Retraso de 14 días" → activar `retention.md`

PASO 2: Agente `retention.md` analiza:
- María es cliente premium (LTV alto)
- No ha respondido a recordatorio automático de la semana pasada
- Historial: siempre ha sido puntual, esto es inusual

→ Hipótesis: "Posible conflicto de agenda o insatisfacción no expresada"

PASO 3: Brain decide estrategia de re-engagement:
```yaml
action_plan:
  primary: "Mensaje personalizado vía WhatsApp (no genérico)"
  message_template: >
    "Hola María 👋, notamos que tu balayage está listo para un refresh. 
    ¿Todo bien? Si hay algo en lo que podamos ayudarte (horarios, estilo, etc.), 
    estamos aquí para ti. Como cliente premium, tienes prioridad para esta semana 🌟"
  
  secondary: "Si no responde en 48h → ofrecer incentivo suave"
  fallback_promotion:
    title: "Prioridad Premium"
    offer: "Agenda esta semana y recibe tratamiento de brillo gratuito"
    urgency: "Solo 3 cupos disponibles para clientes premium"

  human_handoff: "Si María responde con queja → notificar a dueña del salón para llamada personal"




PASO 4: Ejecución y seguimiento:
Enviar mensaje vía integrations/whatsapp_api.md
Registrar en logs/decisions_log.md: "2026-05-20 | retention.md | re-engagement | CLT-2847 | mensaje personalizado enviado"
Programar check en 48h: si no hay respuesta, activar fallback_promotion
PASO 5: Aprendizaje post-acción:
Si María responde y agenda → actualizar client_profiles/CLT-2847.md: "responde mejor a mensajes personales que a recordatorios automáticos"
Si no responde y finalmente viene sin incentivo → ajustar regla: "para clientes premium, esperar 21 días antes de activar re-engagement"
Registrar lección en memory/deep/lessons_learned.md







---

## 📈 AUTOMEJORA: CÓMO EL CEREBRO APRENDE DEL SALÓN

```markdown
[REFLECTION_CYCLE]
Ejecutar cada domingo a las 20:00 (post-cierre):

1. 📊 Analizar métricas de la semana:
   ```yaml
   weekly_review:
     appointments_kept: 87%  # vs meta 90%
     promotions_redeemed: 42%  # vs meta 35% ✅
     avg_ticket_change: +$18  # vs meta +$15 ✅
     client_feedback_avg: 4.7/5  # vs meta 4.5 ✅







🔍 Identificar patrones:
"Promociones enviadas los martes tienen 23% más redención que los viernes"
"Clientes que reciben mensaje personalizado + incentivo suave tienen 3x más probabilidad de re-agendar"
"Recordatorios de color enviados 3 días antes de la fecha ideal tienen mejor respuesta que los enviados el día exacto"
🛠️ Actualizar reglas en memory/deep/:
markdown


## Regla actualizada en promotion_playbook.md:
- ANTES: "Enviar promociones en días aleatorios"
- DESPUÉS: "Priorizar martes y miércoles para envío de promociones; evitar viernes post-18:00"

## Nueva regla en service_timing_rules.md:
- "Para clientes premium con historial puntual: enviar recordatorio de color 3 días ANTES de la fecha calculada, no el día exacto"





🧪 Probar hipótesis de mejora:


experiment_next_week:
  hypothesis: "Mensajes con emoji de estrella 🌟 aumentan apertura en clientes premium"
  test_group: "50% de clientes premium reciben mensaje con 🌟, 50% sin"
  success_metric: "Tasa de apertura +15% en grupo con emoji"
  duration: "1 semana"



📝 Registrar en logs/improvements.md:
"2026-05-25 | Actualizado promotion_playbook.md | Basado en análisis de 127 promociones enviadas en mayo | Impacto esperado: +8% en redención"


---

## 🚀 INICIO RÁPIDO: PRIMEROS 7 DÍAS

```markdown
[QUICKSTART_SALON]

DÍA 1: Configuración básica
✅ Crear estructura de directorios sugerida
✅ Conectar `integrations/google_sheets.md` con tu hoja real de clientes
✅ Poblar `memory/deep/service_timing_rules.md` con 3-5 servicios principales de tu salón

DÍA 2: Primer agente activo
✅ Activar `agents/color_tracker.md` para clientes con historial de color
✅ Ejecutar prueba con 5 clientes: ¿las fechas sugeridas coinciden con tu experiencia?

DÍA 3: Personalización inicial
✅ Revisar `memory/deep/client_profiles/` y añadir notas clave de 10 clientes frecuentes
✅ Configurar `integrations/whatsapp_api.md` con plantilla de mensaje básico

DÍA 4: Primera promoción inteligente
✅ Activar `agents/promoter.md` para clientes con cumpleaños en los próximos 14 días
✅ Enviar 3 promociones de prueba y registrar respuesta

DÍA 5: Reflexión manual
✅ Ejecutar ciclo de reflexión manual: ¿qué funcionó? ¿qué ajustar?
✅ Actualizar 1 regla en `memory/deep/` basada en observaciones

DÍA 6: Escalar gradualmente
✅ Activar recordatorios automáticos para 20 clientes con retoque de color pendiente
✅ Monitorear tasa de respuesta vs recordatorios manuales previos

DÍA 7: Plan de crecimiento
✅ Definir 1 nuevo agente a crear (ej: `feedback_analyzer.md` para reseñas de Google)
✅ Establecer métrica clave a mejorar en los próximos 30 días

[PRIMERA_METASUGERIDA]
goal: "Aumentar re-agendamiento de clientes de color en 15% en 30 días"
baseline: "Actual: 68% de clientes de color re-agendan dentro de ventana ideal"
actions:
  - "Activar color_tracker.md para 100% de clientes con historial de color"
  - "Personalizar mensajes de recordatorio con nombre y tono específico"
  - "Ofrecer incentivo suave (brillo gratuito) para quienes agenden dentro de ventana"
success_criteria: "78% de re-agendamiento en ventana ideal al día 30"



🛡️ PROTOCOLOS DE SEGURIDAD Y CONTROL HUMANO

[SAFETY_FIRST]

### Aprobación Humana Requerida Para:
```yaml
human_approval_for:
  - "Enviar promoción con descuento >30%"
  - "Modificar nota crítica en perfil de cliente (ej: 'alérgico a X')"
  - "Cancelar o reprogramar cita de cliente sin confirmación explícita"
  - "Crear nuevo agente con acceso a datos sensibles"


Transparencia Total:
Cada sugerencia generada incluye: confidence_score y reasoning_summary
Estilista puede ver en cualquier momento: "¿Por qué se sugirió esta promoción?"
Logs inmutables en logs/decisions_log.md: nunca se editan, solo se añaden
Pausa de Emergencia:
Si >3 clientes reportan "mensaje no deseado" en 24h → pausar envíos automáticos
Notificar a dueño del salón con reporte detallado
Reanudar solo tras revisión manual y ajuste de reglas
Privacidad del Cliente:
Datos sensibles (teléfono, notas personales) encriptados en reposo
Clientes pueden solicitar "modo mínimo": solo recordatorios esenciales, sin promociones
Cumplimiento con regulaciones locales de protección de datos (ej: LFPDPPP en México)



---

> 💡 **Nota Final para Dueños de Salón**: 
> Este cerebro no reemplaza tu intuición ni la relación humana con tus clientes. 
> Es una herramienta que amplifica tu capacidad de cuidar a cada persona, 
> recordando detalles que se escapan, anticipando necesidades y liberándote 
> de tareas repetitivas para que enfoques tu energía en lo que más importa: 
> crear experiencias inolvidables. 
> 
> **Tu primera tarea**: Ejecutar el ciclo de reflexión después de 7 días 
> y proponer la primera mejora para `salon_brain.md v1.1`. 🌟

📦 ARCHIVOS COMPLEMENTARIOS LISTOS PARA USAR
memory/deep/service_timing_rules.md - Ejemplo inicial:


# ⏱️ Reglas de Timing por Servicio

## Coloración de Cabello
```yaml
root_touchup:
  base_interval_days: 42
  adjustments:
    hair_growth:
      fast: -7
      slow: +7
    style_preference:
      perfect_roots: -7
      lived_in: +14
    color_type:
      permanent: 0
      demi_permanent: +7
  reminder_schedule:
    - "3 días antes de fecha ideal: mensaje suave"
    - "1 día antes: recordatorio con disponibilidad"
    - "Fecha ideal + 3 días: incentivo suave si no ha agendado"

balayage_highlights:
  base_interval_days: 56  # 8 semanas
  adjustments:
    maintenance_level:
      high: -14  # Cliente que quiere mantener perfecto
      low: +21   # Cliente que prefiere estilo desgastado
  prep_recommendation: "Mascarilla hidratante 48h antes para mejor resultado"

Tratamientos de Mantenimiento
keratin_treatment:
  base_interval_days: 90
  warning_signs: ["frizz_regresa", "brillo_disminuye"]
  upsell_opportunity: "Ofrecer mini-tratamiento a los 60 días para extender duración"

scalp_care:
  base_interval_days: 30
  seasonal_boost: "Verano: +15% en demanda por protección solar"




### `tasks/today.md` - Ejemplo de cola diaria:
```markdown
# 📋 Acciones para Hoy - 2026-05-20

## 🔔 Recordatorios Programados
| Cliente | Servicio Sugerido | Fecha Ideal | Canal | Estado |
|---------|------------------|-------------|-------|--------|
| María G. | Retoque raíz + gloss | 2026-05-06 | WhatsApp | ⏳ Pendiente |
| Ana L. | Mantenimiento keratina | 2026-05-22 | SMS | ✅ Enviado |
| Carla M. | Corte + hidratación | 2026-05-20 | In-salon | 🔄 En consulta |

## 🎁 Promociones para Enviar
| Cliente | Promoción | Razón | Confianza |
|---------|-----------|-------|-----------|
| Sofía R. | "Brillo gratuito con reserva esta semana" | Cumpleaños en 5 días | 0.91 |
| Luis D. | "15% OFF en productos de mantenimiento" | Compró shampoo hace 45 días | 0.84 |

## ⚠️ Alertas de Retención
| Cliente | Días sin visitar | Acción Recomendada |
|---------|-----------------|-------------------|
| Patricia V. | 75 días | Mensaje personalizado + oferta win-back |
| Diego M. | 90 días | Contactar por teléfono (no solo mensaje) |

> ✏️ **Nota**: Priorizar mensajes antes de las 11:00 AM para mayor apertura.



✅ Listo para implementar: Copia SALON_BRAIN.md, conecta tu Google Sheet,
y comienza con el [QUICKSTART_SALON]. En 7 días tendrás un sistema que
aprende de tus clientes, anticipa sus necesidades y te ayuda a crecer —
sin perder el toque humano que hace especial a tu salón. 💇‍♀️✨



CEREBRO AUTÓNOMO MODULAR - DOCUMENTO MAESTRO
Sistema de Aprendizaje Continuo, Memoria Dual y Delegación Inteligente para Negocios
📑 ÍNDICE DE CONTENIDOS
Arquitectura Conceptual
Plantilla Base: BRAIN.md
Síntesis Funcional
Implementación para Negocio: SALON_BRAIN.md
Archivos Complementarios y Reglas
Guía de Implementación
🧠 1. ARQUITECTURA CONCEPTUAL DEL CEREBRO AUTÓNOMO
Fundamentos Arquitectónicos
La concepción de un archivo .md como un "cerebro autónomo" exige un cambio desde la documentación estática hacia un paradigma de sistema dinámico y distribuido. La solución más robusta no reside en un archivo monolítico, sino en una arquitectura modular basada en un sistema de archivos, donde cada componente tiene una responsabilidad bien definida y una interfaz clara de entrada/salida.
Esta filosofía se alinea con principios como:
✅ Una etapa, un trabajo: Cada agente se centra en una única tarea.
✅ Texto plano como interfaz: Markdown/JSON como lenguaje común entre componentes.
✅ Carga de contexto por capas: Aísla información relevante, evitando sobrecarga cognitiva.
✅ Contrato primero: Roles, inputs, outputs y validaciones explícitas en cada archivo.
¿Por qué Modular y no Monolítico?
Característica
Enfoque Monolítico
Enfoque Modular (Basado en Archivos)
Estructura
Un único archivo .md
Sistema de directorios y archivos interconectados
Escalabilidad
Limitada y compleja
Alta: nuevas capacidades = nuevos archivos .md
Interfaz
Informal, interpretación interna
Formalizada (Markdown/JSON como contrato)
Transparencia
Baja ("caja negra")
Alta: cada paso genera un archivo verificable
Portabilidad
Depende del entorno
100% versionable con Git, copiable entre máquinas
Principio Central
El "mejor .md" no es un archivo singular, sino un ecosistema de archivos .md interconectados que actúan como agentes, contratos, historiales y bases de conocimiento. Esta arquitectura transforma el Markdown de un formato de almacenamiento a un lenguaje de especificación y orquestación para un sistema cognitivo distribuido.
📦 2. PLANTILLA BASE: BRAIN.md


# 🧠 BRAIN.md v1.0
## Cerebro Autónomo Modular con Memoria y Delegación Inteligente

> **Propósito**: Este archivo es el núcleo orquestador de un sistema cognitivo autónomo que aprende, se automejora, gestiona memoria temporal/profunda y crea agentes dinámicos para tareas complejas.

---

## 🔰 CAPA 0: IDENTIDAD Y MISIÓN

```yaml
identity:
  name: "AutonomousBrain"
  version: "1.0.0"
  mission: >
    Aprender continuamente de la aplicación, optimizar procesos, 
    delegar inteligentemente y evolucionar mediante reflexión estructurada.
  
  core_values:
    - "Transparencia: Cada decisión debe ser trazable"
    - "Eficiencia: Minimizar redundancias y sobrecarga cognitiva"
    - "Adaptabilidad: Crear agentes cuando falten capacidades"
    - "Mejora continua: Convertir errores en conocimiento persistente"

  success_metrics:
    - "Tasa de resolución autónoma de tareas"
    - "Reducción de errores recurrentes"
    - "Tiempo de adaptación a nuevos dominios"
    - "Calidad de agentes generados dinámicamente"

brain_system/
├── brain.md                 # ← ESTE ARCHIVO: Núcleo orquestador
├── IDENTITY.md              # Identidad y valores (inmutable)
├── STATE.md                 # Estado actual de ejecución
├── WORKFLOW_PLAN.md         # Plan estratégico activo
│
├── memory/
│   ├── deep/                # Conocimiento persistente
│   │   ├── rules_and_guidelines.md
│   │   ├── voice_guide.md
│   │   ├── known_pitfalls.md
│   │   ├── lessons_learned.md
│   │   └── domain_knowledge/
│   │
│   └── temporary/           # Contexto efímero por sesión
│       ├── session_{ID}/
│       │   ├── user_input.md
│       │   ├── working_notes.md
│       │   └── intermediate_results.md
│
├── agents/                  # Agentes especializados (dinámicos)
│   ├── template_agent.md    # Plantilla para crear nuevos agentes
│   ├── researcher.md        # Ejemplo: Agente de investigación
│   ├── coder.md             # Ejemplo: Agente de codificación
│   └── critic.md            # Ejemplo: Agente de validación
│
├── tasks/                   # Cola y seguimiento de tareas
│   ├── backlog.md           # Tareas pendientes
│   ├── in_progress.md       # Tareas en ejecución
│   └── completed/           # Historial de tareas resueltas
│
└── logs/                    # Auditoría y reflexión
    ├── execution_log.md
    ├── reflection_log.md
    └── improvement_log.md



⚙️ MOTOR DE ORQUESTACIÓN: CICLO PRINCIPAL
Fase 1: RECEPCIÓN Y ANÁLISIS DE ENTRADA

[INPUT_HOOK]
Cuando llega una nueva solicitud:

1. 📥 Registrar en `memory/temporary/session_{timestamp}/user_input.md`
2. 🔍 Clasificar tipo de tarea:
   - [ ] Conocimiento existente → Consultar `memory/deep/`
   - [ ] Habilidad conocida → Delegar a agente existente
   - [ ] Nueva capacidad → Activar protocolo de creación de agente
   - [ ] Tarea compleja → Descomponer en sub-tareas

3. 🎯 Definir criterios de éxito explícitos
4. 📋 Generar ticket en `tasks/backlog.md`

Fase 2: EVALUACIÓN DE CAPACIDADES

[CAPABILITY_CHECK]
Antes de actuar, preguntar:

□ ¿Tengo esta habilidad en `memory/deep/domain_knowledge/`?
□ ¿Existe un agente en `agents/` que pueda ejecutar esto?
□ ¿Necesito combinar múltiples agentes?
□ ¿Debo crear un nuevo agente especializado?

[DECISION_TREE]
SI capacidad_existe Y agente_disponible:
  → Delegar inmediatamente
  
SI capacidad_existe PERO no_agente:
  → Ejecutar directamente + registrar patrón para futuro agente
  
SI no_capacidad:
  → ACTIVAR: Protocolo de Creación de Agente Dinámico


Fase 3: EJECUCIÓN Y COORDINACIÓN
[EXECUTION_PROTOCOL]
Para cada tarea delegada:

1. 📄 Preparar contrato de agente:
   ```yaml
   agent_contract:
     task_id: "{UUID}"
     agent: "{agent_name}"
     input: "path/to/INPUT.md"
     expected_output: "path/to/OUTPUT.md"
     constraints:
       - "No modificar archivos fuera de scope"
       - "Tiempo máximo: {timeout}"
       - "Validación requerida: {true/false}"
     success_criteria: "{definir métricas objetivas}"


🚀 Ejecutar agente (simulado o real)
🔎 Validar resultado:
¿Cumple criterios de éxito?
¿Formato de salida correcto?
¿Sin efectos secundarios no deseados?
📦 Integrar resultado o solicitar re-intento


---

## 🤖 PROTOCOLO DE CREACIÓN DINÁMICA DE AGENTES

```markdown
[AGENT_CREATION_PROTOCOL]
Activar cuando: "Tarea no puede ser resuelta con recursos actuales"

PASO 1: Análisis de brecha de capacidad
```yaml
gap_analysis:
  task_description: "{descripción}"
  missing_capabilities:
    - "{habilidad_faltante_1}"
    - "{habilidad_faltante_2}"
  complexity_score: 1-10
  urgency: low/medium/high

PASO 2: Diseño del agente

new_agent_spec:
  name: "{Role}_{Name}"  # Ej: "Researcher_Rita"
  purpose: "{objetivo_único}"
  input_format: "{estructura_esperada}"
  output_format: "{estructura_requerida}"
  tools_needed:
    - "{herramienta_1}"
    - "{herramienta_2}"
  constraints:
    - "{límite_1}"
    - "{límite_2}"
  validation_method: "{cómo_verificar_resultado}"


PASO 3: Generación del archivo del agente
→ Crear agents/{agent_name}.md basado en agents/template_agent.md
PASO 4: Registro en memoria profunda
→ Añadir entrada en memory/deep/domain_knowledge/agent_registry.md
PASO 5: Prueba piloto
→ Ejecutar tarea original con nuevo agente
→ Si falla: ajustar contrato y reintentar (máx. 3 veces)
→ Si éxito: promover a agente disponible

---

## 🧠 SISTEMA DE MEMORIA DUAL

### Memoria Profunda (`memory/deep/`)
```markdown
[DEEP_MEMORY_PROTOCOL]
Propósito: Conocimiento persistente que mejora con el tiempo

Estructura:
├── rules_and_guidelines.md
│   # Reglas de decisión, patrones de éxito/fracaso
│   # Se actualiza tras cada reflexión post-ejecución
│
├── voice_guide.md
│   # Estilo de comunicación, tono, formato de respuestas
│
├── known_pitfalls.md
│   # Errores comunes y cómo evitarlos
│   # Formato: "Si {condición}, entonces {acción_correctiva}"
│
├── lessons_learned.md
│   # Registro estructurado de aprendizajes:
│   ```yaml
│   lesson:
│     date: "{timestamp}"
│     context: "{situación}"
│     error: "{qué_salió_mal}"
│     insight: "{lección_extraída}"
│     rule_added: "{referencia_a_rules_and_guidelines}"
│   ```
│
└── domain_knowledge/
    # Conocimiento específico por dominio
    # Ej: coding_patterns.md, research_methods.md, etc.



Memoria Temporal (memory/temporary/)
[TEMPORARY_MEMORY_PROTOCOL]
Propósito: Contexto efímero para ejecución de tareas

Reglas de gestión:
✅ Crear nueva sesión para cada tarea principal
✅ Limpiar sesión tras 24h de inactividad o tarea completada
✅ Promover insights valiosos a `memory/deep/` antes de limpiar

Estructura por sesión:
session_{timestamp}/
├── user_input.md          # Solicitud original
├── context_snapshot.md    # Estado del sistema al iniciar
├── working_notes.md       # Notas de proceso (borrador)
├── agent_outputs/         # Resultados de agentes delegados
├── decision_log.md        # Razonamiento de decisiones clave
└── final_output.md        # Resultado entregado al usuario

[CLEANUP_RULE]
AL terminar tarea:
  FOR each file in session:
    IF contiene "insight_valioso" OR "patrón_repetible":
      → Extraer y añadir a `memory/deep/`
    ELSE:
      → Archivar en `logs/completed/session_{id}.zip`
      → Eliminar de `temporary/`


🔄 CICLO DE AUTOMEJORA Y REFLEXIÓN
[SELF_IMPROVEMENT_LOOP]
Ejecutar tras CADA tarea completada (éxito o fracaso):

PASO 1: Evaluación de resultado
```yaml
post_task_review:
  task_id: "{id}"
  outcome: success/partial/failure
  metrics:
    time_taken: "{duration}"
    resources_used: ["{agent1}", "{agent2}"]
    user_satisfaction: 1-5  # Si disponible
  deviation_from_plan: "{descripción}"

PASO 2: Análisis de causa raíz (solo si no fue éxito perfecto)
ROOT_CAUSE_ANALYSIS:
- ¿Fallo en comprensión de la tarea?
- ¿Agente inadecuado o mal configurado?
- ¿Falta de conocimiento en `memory/deep/`?
- ¿Error en coordinación entre agentes?
- ¿Limitación técnica no anticipada?

PASO 3: Generación de mejora
improvement_action:
  type: update_rule | create_agent | refine_contract | add_knowledge
  target_file: "path/to/file.md"
  change_description: "{qué_cambiar_y_por_qué}"
  expected_impact: "{beneficio_proyectado}"

PASO 4: Implementación y validación
Aplicar cambio en archivo objetivo
Ejecutar prueba de regresión con tarea similar
Si mejora confirmada: mantener cambio
Si empeora: revertir y registrar en known_pitfalls.md
PASO 5: Registro en logs/improvement_log.md


---

## 📋 PLANTILLA DE AGENTE (`agents/template_agent.md`)

```markdown
# 🤖 {AGENT_NAME}

> **Rol**: {descripción_concisa_del_propósito}
> **Estado**: active | experimental | deprecated
> **Creado**: {timestamp}
> **Última actualización**: {timestamp}

## 🎯 Objetivo Único
{Una sola responsabilidad clara. Ej: "Extraer conclusiones clave de documentos técnicos"}

## 📥 Formato de Entrada Esperado
```yaml
input:
  required_fields:
    - field_name: "{nombre}"
      type: "{string|list|object}"
      description: "{propósito}"
  optional_fields:
    - ...
  constraints:
    - "{límite_de_tamaño}"
    - "{formato_específico}"


Formato de Salida Requerido
output:
  structure:
    summary: "{resumen_ejecutivo}"
    details: "{análisis_detallado}"
    confidence: 0.0-1.0
    sources: ["{referencias}"]
  validation_rules:
    - "Debe incluir al menos 3 puntos clave"
    - "Confidence < 0.5 requiere flag de revisión humana"


Herramientas y Permisos
capabilities:
  - read: ["memory/deep/*", "tasks/*"]
  - write: ["agents/{this_agent}/OUTPUT.md"]
  - execute: ["{herramienta_1}", "{herramienta_2}"]
  - deny: ["memory/deep/rules_and_guidelines.md", "brain.md"]


🔄 Proceso de Ejecución
Leer INPUT.md y validar formato
Consultar memory/deep/ para contexto relevante
Ejecutar lógica principal
Validar resultado contra output.validation_rules
Escribir en OUTPUT.md y señalar completado
🚨 Manejo de Errores
Si entrada inválida: escribir error en OUTPUT.md con error_type: "invalid_input"
Si herramienta falla: reintentar 1 vez, luego reportar
Si timeout: guardar progreso parcial y marcar status: "incomplete"
📈 Métricas de Rendimiento (auto-registradas)
metrics:
  executions_total: 0
  success_rate: 0.0
  avg_execution_time: 0s
  last_failure_reason: null



---

## 🚦 ESTADO ACTUAL DEL SISTEMA (`STATE.md` - Ejemplo)

```markdown
# 📊 SYSTEM STATE

## Última actualización: {timestamp}

### 🔄 Ciclo Actual
- Fase: {receiving | analyzing | executing | reflecting}
- Tarea activa: `{task_id}` o `null`
- Agentes activos: [`{agent1}`, `{agent2}`] o `[]`

### 📈 Métricas en Tiempo Real
```yaml
performance:
  tasks_completed_today: 12
  avg_resolution_time: "4.2min"
  autonomous_success_rate: "94%"
  agents_created_this_week: 2
  memory_deep_size: "2.4MB"
  memory_temp_sessions: 3


⚠️ Alertas Activas
Ninguna
Agente Researcher_Rita con tasa de error >15% → Revisar contrato
🎯 Próxima Acción Programada
next_action:
  trigger: "task_completion"
  action: "run_reflection_cycle"
  target: "last_completed_task"


---

## 🛡️ PROTOCOLOS DE SEGURIDAD Y CONTROL

```markdown
[SECURITY_PROTOCOLS]

### Principio de Mínimo Privilegio
- Cada agente recibe SOLO los permisos necesarios para su tarea
- Permisos se otorgan por sesión y se revocan al finalizar
- Acceso a `memory/deep/` es de solo-lectura para agentes, excepto `lessons_learned.md`

### Aprobación Humana para Acciones Críticas
```yaml
human_approval_required_for:
  - "Modificar `brain.md` o `IDENTITY.md`"
  - "Eliminar archivos de `memory/deep/`"
  - "Crear agente con permisos de escritura en múltiples directorios"
  - "Ejecutar tareas con impacto externo (APIs, sistemas de producción)"


Auditoría y Trazabilidad
Cada acción del sistema genera entrada en logs/execution_log.md
Formato: {timestamp} | {actor} | {action} | {target} | {result}
Logs son inmutables: solo append, nunca edit/delete
Mecanismo de Pausa de Emergencia
Si se detectan >3 errores consecutivos del mismo tipo:
Pausar ejecución de nuevos agentes
Notificar a supervisor humano
Generar reporte automático en logs/critical_incident.md
Esperar aprobación para reanudar

---

## 📜 LICENCIA Y METADATOS

```yaml
metadata:
  created: "2026-05-20"
  author: "AutonomousBrain System"
  license: "MIT - Uso libre con atribución"
  compatibility:
    - "LLM APIs: OpenAI, Anthropic, Open Source"
    - "File system: Cualquier OS con soporte Markdown"
    - "Version control: Git recomendado"
  
  versioning:
    strategy: "Semantic Versioning (MAJOR.MINOR.PATCH)"
    changelog_location: "logs/improvement_log.md"
    
  contribution:
    new_agents: "Crear desde `template_agent.md` y registrar en `agent_registry.md`"
    memory_updates: "Solo vía protocolo de reflexión post-ejecución"
    core_changes: "Requieren aprobación humana y prueba de regresión"

---

## 🔍 3. EN SÍNTESIS: ¿QUÉ HACE ESTE CEREBRO?

### 🎯 Función Principal
**Es un sistema cognitivo modular que aprende, delega y evoluciona solo**, usando archivos `.md` como su "lenguaje de pensamiento" y memoria.

### 🔁 Ciclo Básico de Operación



RECIBE → Una tarea o pregunta
ANALIZA → ¿Puedo resolverla con lo que sé?
DECIDE → ✅ Sí → Ejecuto/Delego | ❌ No → Creo agente nuevo
EJECUTA → Coordina, gestiona memoria, produce resultado
REFLEXIONA → ¿Qué aprendí? ¿Qué puedo mejorar?
EVOLUCIONA → Actualiza conocimiento permanente

### 🧩 5 Capacidades Clave
| Capacidad | ¿Qué hace? | Ejemplo práctico |
|-----------|-----------|-----------------|
| **🧠 Memoria Dual** | Separa lo efímero (tarea actual) de lo permanente (reglas, lecciones) | Guarda contexto en `temp/`, pero aprende reglas nuevas en `deep/` |
| **🤖 Delegación Inteligente** | Evalúa límites y asigna a agentes especializados | "Investiga X" → activa `Researcher_Rita`; "Escribe código" → usa `Coder_Alex` |
| **🔄 Autocreación de Agentes** | Si falta habilidad, diseña y genera un nuevo agente `.md` | Nunca hizo "análisis de sentimientos" → crea `Sentiment_Sam.md` |
| **📈 Automejora Continua** | Tras cada tarea reflexiona y actualiza reglas | Si omite detalles, añade: "Todo resumen debe incluir nombres de API" |
| **🛡️ Control y Seguridad** | Permisos por agente, logs inmutables, pausa ante errores críticos | Agente nuevo no borra archivos; si falla 3 veces, pide ayuda humana |

> 💡 **En una frase**: Es un sistema que no solo ejecuta tareas, sino que aprende de ellas, se organiza para delegarlas y se mejora a sí mismo con el tiempo —todo en Markdown.

---

## 💇‍♀️ 4. IMPLEMENTACIÓN PARA NEGOCIO: `SALON_BRAIN.md`

```markdown
# 💇‍♀️ SALON_BRAIN.md v1.0
## Cerebro Cognitivo para Gestión Inteligente de Salón de Belleza

> **Propósito**: Aprender de cada cliente, predecir necesidades, optimizar agenda, sugerir promociones y automejorar la experiencia del cliente mediante memoria dual y agentes especializados.

---

## 🔰 CAPA 0: IDENTIDAD DEL SALÓN

```yaml
identity:
  name: "SalonBrain"
  business_type: "Beauty Salon / Hair & Wellness"
  mission: >
    Convertir cada visita en una experiencia personalizada, 
    anticipar necesidades del cliente y maximizar retención 
    mediante inteligencia de datos y automejora continua.
  
  core_values:
    - "Personalización: Cada cliente es único"
    - "Anticipación: Saber qué necesita antes de que lo pida"
    - "Retención: Fidelizar es más rentable que captar"
    - "Eficiencia: Agenda llena, sin estrés"

  success_metrics:
    - "Tasa de re-agendamiento: >75%"
    - "Ticket promedio por cliente: +15% trimestral"
    - "Reducción de no-shows: <10%"
    - "Satisfacción post-servicio: >4.5/5"

ESTRUCTURA DEL SISTEMA (Enfoque Salón)
salon_brain/
├── salon_brain.md          # ← ESTE ARCHIVO: Núcleo orquestador
├── IDENTITY.md             # Misión y valores del salón
├── STATE.md                # Estado actual: agenda, clientes activos, alertas
│
├── memory/
│   ├── deep/               # Conocimiento permanente
│   │   ├── client_profiles/       # Historial estructurado por cliente
│   │   ├── service_timing_rules.md # Tiempos entre servicios
│   │   ├── promotion_playbook.md   # Catálogo de promociones probadas
│   │   ├── seasonal_patterns.md    # Comportamiento por temporada
│   │   └── staff_expertise.md      # Habilidades por estilista
│   │
│   └── temporary/          # Contexto por sesión/cliente
│       ├── session_{client_id}/
│       │   ├── last_visit.md       # Detalles de última cita
│       │   ├── next_suggested.md   # Próximo servicio sugerido
│       │   ├── promotion_fit.md    # Promoción personalizada calculada
│       │   └── conversation_log.md # Notas de consulta actual
│
├── agents/                 # Agentes especializados
│   ├── template_agent.md
│   ├── scheduler.md        # Gestiona agenda y recordatorios
│   ├── retention.md        # Predice cuándo un cliente podría irse
│   ├── promoter.md         # Diseña promociones personalizadas
│   ├── color_tracker.md    # Calcula timing para retoque de color
│   └── feedback_analyzer.md # Analiza reseñas y sugerencias
│
├── integrations/           # Conexiones externas
│   ├── google_sheets.md    # Esquema para sincronizar hoja de clientes
│   ├── whatsapp_api.md     # Plantillas para mensajes automatizados
│   └── pos_connector.md    # Integración con sistema de caja
│
├── tasks/                  # Cola de acciones
│   ├── today.md            # Acciones para hoy
│   ├── this_week.md        # Planificación semanal
│   └── completed/          # Historial de acciones ejecutadas
│
└── logs/                   # Auditoría y aprendizaje
    ├── decisions_log.md    # Por qué se sugirió X promoción
    ├── improvements.md     # Lecciones aprendidas y reglas actualizadas
    └── metrics_weekly.md   # Reporte automático de KPIs

🔄 CICLO PRINCIPAL: DE LA CITA A LA FIDELIZACIÓN
Fase 1: RECEPCIÓN DE DATOS DEL CLIENTE
[INPUT_HOOK]
Cuando un cliente agenda, visita o es consultado:

1. 📥 Consultar `integrations/google_sheets.md` para:
   - Historial de servicios: [{fecha}, {servicio}, {estilista}, {precio}]
   - Preferencias: [tono_de_color, tipo_de_cabello, productos_usados]
   - Fechas clave: [cumpleaños, última_visita, próxima_cita_sugerida]

2. 🔍 Calcular métricas clave:
   ```yaml
   client_health:
     days_since_last_visit: {calcular}
     avg_visit_frequency: {ej: "cada 45 días"}
     lifetime_value: {suma_histórica}
     risk_of_churn: {bajo|medio|alto}

 Activar agente según contexto:
Si "última visita fue tinte" → activar color_tracker.md
Si "no ha venido en 60+ días" → activar retention.md
Si "cumpleaños en 7 días" → activar promoter.md


### Fase 2: CÁLCULO INTELIGENTE DE NECESIDADES
```markdown
[SERVICE_TIMING_ENGINE]
Para servicios recurrentes (ej: coloración):

REGLA BASE en `memory/deep/service_timing_rules.md`:
```yaml
hair_color_retouch:
  standard_interval_days: 42  # 6 semanas
  adjustment_factors:
    hair_growth_rate: {rápido: -7 días, lento: +7 días}
    color_type: {balayage: +14 días, raíz_sólida: -7 días}
    client_preference: {mantener_perfecto: -7 días, estilo_desgastado: +14 días}

CÁLCULO DINÁMICO:
Tomar fecha de último tinte: 2026-04-01
Aplicar regla base: +42 días → 2026-05-13
Ajustar por factores del cliente:
Crecimiento rápido: -7 días → 2026-05-06
Prefiere raíz perfecta: -7 días → 2026-04-29
Resultado: Próximo retoque sugerido: 2026-04-29 ± 3 días
✅ Guardar en memory/temporary/session_{id}/next_suggested.md
📱 Programar recordatorio automático vía integrations/whatsapp_api.md


### Fase 3: GENERACIÓN DE SUGERENCIAS PERSONALIZADAS
```markdown
[PROMOTION_GENERATOR]
Activado por agente `promoter.md`:

INPUT:
```yaml
client_context:
  last_service: "Balayage + Corte"
  spend_last_3_visits: "$180, $195, $210"
  products_bought: ["shampoo_color_protect", "mascarilla_hidratacion"]
  upcoming_event: null  # o "boda en 30 días"

LÓGICA DE DECISIÓN:
SI cliente_compra_productos_retail Y no_ha_probado_nuevo:
  → Sugerir: "Pack mantenimiento color: 15% OFF en tu próximo shampoo + mascarilla"

SI días_para_próximo_servicio < 7 Y agenda_tiene_huecos:
  → Sugerir: "Reserva esta semana y recibe brillo gratuito"

SI cliente_alto_valor Y cumpleaños_en_14_días:
  → Sugerir: "Regalo de cumpleaños: tratamiento de keratina a 50% OFF"

SI cliente_riesgo_abandono:
  → Sugerir: "Te extrañamos: 20% OFF en tu próximo servicio + café de cortesía"

OUTPUT en promotion_fit.md:
suggested_promotion:
  title: "Mantenimiento Color Premium"
  description: "15% OFF en productos de mantenimiento + diagnóstico gratuito de color"
  validity_days: 14
  channel: "whatsapp"  # o "email", "in-salon"
  expected_uplift: "+$35 en ticket promedio"
  confidence: 0.87



---

## 🤖 AGENTES ESPECIALIZADOS (Ejemplos Prácticos)

### `agents/color_tracker.md`
```markdown
# 🎨 Color Tracker Agent
> **Rol**: Calcular timing óptimo para retoques de coloración y sugerir mantenimiento

## 📥 Entrada Esperada
```yaml
input:
  client_id: "{ID}"
  last_color_service:
    date: "YYYY-MM-DD"
    type: "root_touchup|balayage|full_color|highlights"
  client_profile:
    hair_growth: "fast|medium|slow"
    style_preference: "perfect_roots|lived_in|experimental"

📤 Salida Requerida
output:
  next_recommended_date: "YYYY-MM-DD"
  date_range_flex: "±3 días"
  service_suggestion: "Root touchup + gloss treatment"
  urgency_level: "low|medium|high"
  confidence_score: 0.0-1.0


🔄 Lógica Principal
Consultar service_timing_rules.md para intervalo base
Ajustar por factores individuales
Cruzar con disponibilidad de agenda
Generar recomendación con margen de flexibilidad

### `agents/promoter.md`
```markdown
# 🎁 Promoter Agent
> **Rol**: Crear promociones personalizadas que aumenten retención y ticket promedio

## 💡 Reglas de Personalización
```yaml
personalization_rules:
  - IF client_ltv > percentile_75:
      offer_type: "exclusivity"
  - IF client_has_not_returned_in_60_days:
      offer_type: "win_back"
  - IF client_buys_retail_regularly:
      offer_type: "bundle"
  - IF upcoming_season = "summer":
      boost: "proteccion_solar_cabello"

 Formato de Salida
promotion_card:
  headline: "{título atractivo}"
  value_prop: "{qué gana el cliente en 1 frase}"
  offer_details:
    discount: "15% OFF"
    validity: "14 días"
  call_to_action: "Reserva antes del {fecha} y menciona este código: COLOR15"
  expected_metrics:
    redemption_rate_estimate: "35-50%"
    avg_ticket_uplift: "+$28"












































---

## 📊 INTEGRACIÓN CON GOOGLE SHEETS

```markdown
# 🔗 Esquema de Sincronización con Google Sheets

## Hoja: "Clientes_Activos"
| Columna | Tipo | Propósito | Ejemplo |
|---------|------|-----------|---------|
| client_id | string | ID único | "CLT-2847" |
| name | string | Nombre completo | "María González" |
| phone | string | WhatsApp | "+5215512345678" |
| last_visit | date | Última cita | "2026-04-01" |
| last_service | string | Servicio principal | "Balayage + Corte" |
| next_suggested | date | Próxima cita calculada | "2026-05-06" |
| color_notes | text | Preferencias | "Tono 7.1, raíz cada 6 sem" |
| product_prefs | list | Productos que compra | ["shampoo_color_protect"] |
| ltv_tier | enum | Segmentación | "premium" |
| churn_risk | enum | Alerta abandono | "medium" |
| birthday | date | Promociones personales | "1990-08-15" |

## 🔁 Flujo de Sincronización
- read_from_sheet: "cada 1 hora"
- write_to_sheet: "tras cada acción crítica"
- manual_override: "Estilista puede editar notes directamente"
- security: "Solo lectura para agentes, excepto campos writables"



EJEMPLO DE FLUJO COMPLETO
[SCENARIO] Cliente: María González (CLT-2847)
Último servicio: Balayage el 2026-04-01

PASO 1: Brain detecta 49 días sin visita
→ Regla base: 42 días para balayage
→ Ajuste: Crecimiento rápido → fecha ideal: 2026-05-06
→ Estado: "Retraso de 14 días" → activar `retention.md`

PASO 2: Agente `retention.md` analiza:
- Cliente premium, siempre puntual → Hipótesis: conflicto de agenda o insatisfacción

PASO 3: Estrategia de re-engagement:
```yaml
action_plan:
  primary: "Mensaje personalizado vía WhatsApp"
  message_template: >
    "Hola María 👋, notamos que tu balayage está listo para un refresh. 
    ¿Todo bien? Como cliente premium, tienes prioridad para esta semana 🌟"
  secondary: "Si no responde en 48h → ofrecer incentivo suave"
  fallback_promotion:
    title: "Prioridad Premium"
    offer: "Agenda esta semana y recibe tratamiento de brillo gratuito"
  human_handoff: "Si hay queja → notificar a dueña para llamada"


PASO 4: Aprendizaje post-acción:
Si responde y agenda → actualizar perfil: "responde mejor a mensajes personales"
Si no responde y viene sin incentivo → ajustar regla: "esperar 21 días antes de re-engagement"
Registrar lección en lessons_learned.md

---

## 📈 AUTOMEJORA: CÓMO APRENDE DEL SALÓN

```markdown
[REFLECTION_CYCLE]
Ejecutar cada domingo a las 20:00:

1. 📊 Analizar métricas semanales (re-agendamiento, redención, ticket, feedback)
2. 🔍 Identificar patrones: "Promos los martes tienen 23% más redención"
3. 🛠️ Actualizar reglas en `memory/deep/`
4. 🧪 Probar hipótesis: "Emoji 🌟 aumenta apertura en clientes premium"
5. 📝 Registrar en `logs/improvements.md`



 INICIO RÁPIDO: PRIMEROS 7 DÍAS

[QUICKSTART_SALON]
DÍA 1: Configurar estructura y conectar Google Sheets
DÍA 2: Activar `color_tracker.md` para 5 clientes de prueba
DÍA 3: Añadir notas clave de 10 clientes frecuentes a `client_profiles/`
DÍA 4: Configurar WhatsApp API y enviar 3 promos de prueba
DÍA 5: Ejecutar reflexión manual y actualizar 1 regla
DÍA 6: Activar recordatorios automáticos para 20 clientes
DÍA 7: Definir 1 nuevo agente y establecer meta a 30 días

[PRIMERA_METASUGERIDA]
goal: "Aumentar re-agendamiento de clientes de color en 15% en 30 días"
baseline: "Actual: 68% re-agendan en ventana ideal"
success_criteria: "78% de re-agendamiento al día 30"

🛡️ PROTOCOLOS DE SEGURIDAD
[SAFETY_FIRST]
human_approval_for:
  - "Enviar promoción con descuento >30%"
  - "Modificar nota crítica en perfil de cliente"
  - "Cancelar o reprogramar cita sin confirmación"
  - "Crear agente con acceso a datos sensibles"

Transparencia Total: Cada sugerencia incluye `confidence_score` y `reasoning_summary`
Pausa de Emergencia: >3 clientes reportan "mensaje no deseado" → pausar y notificar
Privacidad: Datos sensibles encriptados, cumplimiento con regulaciones locales


---

## 🛠️ 5. ARCHIVOS COMPLEMENTARIOS Y REGLAS DEL SISTEMA

### `memory/deep/service_timing_rules.md`
```markdown
# ⏱️ Reglas de Timing por Servicio

## Coloración de Cabello
```yaml
root_touchup:
  base_interval_days: 42
  adjustments:
    hair_growth: {fast: -7, slow: +7}
    style_preference: {perfect_roots: -7, lived_in: +14}
  reminder_schedule:
    - "3 días antes: mensaje suave"
    - "1 día antes: recordatorio con disponibilidad"
    - "+3 días sin agenda: incentivo suave"

balayage_highlights:
  base_interval_days: 56
  adjustments:
    maintenance_level: {high: -14, low: +21}
  prep_recommendation: "Mascarilla hidratante 48h antes"


Tratamientos
keratin_treatment:
  base_interval_days: 90
  upsell_opportunity: "Mini-tratamiento a los 60 días"

scalp_care:
  base_interval_days: 30
  seasonal_boost: "Verano: +15% demanda"


### `tasks/today.md` (Ejemplo de Cola Diaria)
```markdown
# 📋 Acciones para Hoy - 2026-05-20

## 🔔 Recordatorios Programados
| Cliente | Servicio Sugerido | Fecha Ideal | Canal | Estado |
|---------|------------------|-------------|-------|--------|
| María G. | Retoque raíz + gloss | 2026-05-06 | WhatsApp | ⏳ Pendiente |
| Ana L. | Mantenimiento keratina | 2026-05-22 | SMS | ✅ Enviado |

## 🎁 Promociones para Enviar
| Cliente | Promoción | Razón | Confianza |
|---------|-----------|-------|-----------|
| Sofía R. | "Brillo gratuito con reserva" | Cumpleaños en 5 días | 0.91 |
| Luis D. | "15% OFF en productos" | Compró shampoo hace 45 días | 0.84 |

## ⚠️ Alertas de Retención
| Cliente | Días sin visitar | Acción Recomendada |
|---------|-----------------|-------------------|
| Patricia V. | 75 días | Mensaje personalizado + win-back |
| Diego M. | 90 días | Contactar por teléfono |


📥 6. GUÍA DE IMPLEMENTACIÓN
Crea la carpeta raíz: mkdir salon_brain && cd salon_brain
Guarda este archivo como salon_brain.md
Estructura de directorios: Ejecuta en terminal:


mkdir -p memory/deep/{client_profiles,domain_knowledge} memory/temporary agents integrations tasks/completed logs


Conecta tu negocio: Reemplaza integrations/google_sheets.md con tu hoja real de clientes (o usa CSV/Notion/Airtable si prefieres)
Ejecuta el ciclo: Sigue el [QUICKSTART_SALON] paso a paso
Reflexiona semanalmente: El sistema aprende solo si ejecutas el ciclo de reflexión cada 7 días
💡 Nota Final: Este cerebro no reemplaza tu intuición ni la relación humana. Es una herramienta que amplifica tu capacidad de cuidar a cada persona, recordando detalles que se escapan, anticipando necesidades y liberándote de tareas repetitivas. Tu primera tarea: ejecutar el ciclo de reflexión después de 7 días y proponer la primera mejora para v1.1. 🌟
Documento generado para implementación inmediata. Compatible con cualquier sistema de archivos, Git, y LLMs modernos. Última actualización: Mayo 2026.