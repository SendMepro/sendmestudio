# Brain Memory Outputs — Salidas de Memoria del Sistema

> **Propósito**: Documentar la estructura de todos los archivos de memoria que el Brain Learning Orchestrator genera y mantiene, tanto en formato Markdown (legible para humanos) como JSON (estructurado para máquinas).

---

## 1. Ubicación de las Memorias

Todas las memorias se almacenan en:

```
data/business-brain/{clientSlug}/memory/
```

Donde `{clientSlug}` es el identificador del cliente (ej: `sendmestudio`). Actualmente, el sistema opera con un solo cliente, por lo que los archivos se encuentran directamente en:

```
data/business-brain/
```

---

## 2. Archivos Markdown (Legibles para Humanos)

### 2.1 `daily-learning.md`

**Propósito**: Resumen diario de todo lo que el Brain aprendió en el día.

```markdown
# Aprendizaje Diario — {fecha}

## Resumen del Día
{Resumen generado automáticamente con los eventos del día}

## Señales Detectadas
- {señal 1}
- {señal 2}

## Emociones Identificadas
- {emoción 1}
- {emoción 2}

## Insights del Negocio
- {insight 1}
- {insight 2}

## Servicios Mencionados
- {servicio 1}
- {servicio 2}

## Objeciones de Clientes
- {objeción 1}

## Oportunidades Detectadas
- {oportunidad 1}

## Acción Sugerida
{Acción concreta sugerida por el Brain}
```

**Campos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha` | string | Fecha en formato ISO (YYYY-MM-DD) |
| `Resumen del Día` | string | Resumen generado por IA de los eventos del día |
| `Señales Detectadas` | string[] | Lista de señales de negocio detectadas |
| `Emociones Identificadas` | string[] | Emociones de clientes identificadas |
| `Insights del Negocio` | string[] | Aprendizajes y observaciones |
| `Servicios Mencionados` | string[] | Servicios de los que se habló |
| `Objeciones de Clientes` | string[] | Objeciones comunes de clientes |
| `Oportunidades Detectadas` | string[] | Oportunidades de negocio |
| `Acción Sugerida` | string | Acción recomendada |

---

### 2.2 `emotional-patterns.md`

**Propósito**: Patrones emocionales detectados en las interacciones con clientes.

```markdown
# Patrones Emocionales

## Última Actualización
{timestamp ISO}

## Patrones Positivos
- {patrón}: {frecuencia} veces — {ejemplo}

## Patrones Negativos
- {patrón}: {frecuencia} veces — {ejemplo}

## Tendencias
- {tendencia emocional observada}
```

---

### 2.3 `objections.md`

**Propósito**: Registro de objeciones comunes de clientes para entrenar al equipo en cómo responderlas.

```markdown
# Objeciones de Clientes

## Última Actualización
{timestamp ISO}

## Objeciones Registradas
1. **{objeción}**
   - Frecuencia: {número}
   - Contexto: {contexto}
   - Respuesta sugerida: {respuesta}

2. **{objeción}**
   - ...
```

---

### 2.4 `service-intents.md`

**Propósito**: Intenciones de servicio detectadas — qué servicios están pidiendo los clientes y cómo.

```markdown
# Intenciones de Servicio

## Última Actualización
{timestamp ISO}

## Servicios con Mayor Demanda
1. **{servicio}** — {frecuencia} solicitudes
   - Intenciones comunes: {frases de clientes}
   - Precio promedio: ${monto}

2. **{servicio}** — ...
```

**Archivo JSON complementario**: `data/business-brain/service-intents/intents.json`

---

### 2.5 `successful-sales-language.md`

**Propósito**: Lenguaje de ventas que ha funcionado — frases y enfoques que han convertido clientes.

```markdown
# Lenguaje de Ventas Exitoso

## Última Actualización
{timestamp ISO}

## Frases que Funcionaron
- "{frase}" — {contexto} — {resultado}

## Enfoques Exitosos
- {enfoque}: {descripción}

## Upsell Patterns
- {patrón de venta cruzada}
```

**Archivo JSON complementario**: `data/business-brain/upsell-patterns/upsell-patterns.md`

---

### 2.6 `campaign-temperature.md`

**Propósito**: Temperatura de campañas — qué tan receptivos están los clientes a campañas actuales.

```markdown
# Temperatura de Campañas

## Última Actualización
{timestamp ISO}

## Campañas Activas
- **{campaña}**: {temperatura}% — {comentario}

## Señales de Interés
- {señal de interés detectada}

## Señales de Desinterés
- {señal de desinterés detectada}
```

---

### 2.7 `concierge-tone.md`

**Propósito**: Tono de atención aprendido — cómo prefiere el cliente ser atendido basado en interacciones pasadas.

```markdown
# Tono de Atención Aprendido

## Última Actualización
{timestamp ISO}

## Preferencias de Tono
- Formal/Informal: {nivel}
- Emojis: {sí/no} — {frecuencia}
- Horario preferido de contacto: {horario}
- Canales preferidos: {canales}

## Frases de Cliente que Definen el Tono
- "{frase del cliente}" → {interpretación}
```

---

### 2.8 `technical-history.md`

**Propósito**: Historial técnico de servicios realizados — qué servicios, con qué productos, resultados.

```markdown
# Historial Técnico

## Última Actualización
{timestamp ISO}

## Servicios Realizados
1. **{fecha}** — {servicio}
   - Cliente: {nombre o anónimo}
   - Productos usados: {productos}
   - Técnica: {técnica}
   - Resultado: {resultado}
   - Notas: {notas}
```

---

### 2.9 `team-talent.md`

**Propósito**: Registro del talento del equipo — habilidades, especialidades, áreas de mejora.

```markdown
# Talento del Equipo

## Última Actualización
{timestamp ISO}

## Miembros del Equipo
1. **{nombre}**
   - Especialidades: {especialidades}
   - Fortalezas: {fortalezas}
   - Áreas de mejora: {áreas}
   - Clientes que lo piden: {frecuencia}

## Habilidades del Equipo
- {habilidad}: {nivel} — {miembros que la dominan}
```

---

### 2.10 `social-satisfaction.md`

**Propósito**: Satisfacción social — menciones en redes sociales, reseñas, comentarios.

```markdown
# Satisfacción Social

## Última Actualización
{timestamp ISO}

## Menciones Positivas
- "{mención}" — {fuente} — {fecha}

## Menciones Negativas
- "{mención}" — {fuente} — {fecha}

## Reseñas
- ⭐⭐⭐⭐⭐ {cantidad}
- ⭐⭐⭐⭐ {cantidad}
- ⭐⭐⭐ {cantidad}
- ⭐⭐ {cantidad}
- ⭐ {cantidad}

## Tendencias
- {tendencia observada}
```

---

## 3. Archivos JSON (Estructurados para Máquinas)

### 3.1 `memory-index.json`

**Propósito**: Índice maestro de todas las memorias disponibles.

```json
{
  "version": 1,
  "lastUpdated": "2026-05-28T07:00:00.000Z",
  "memories": [
    {
      "id": "mem-001",
      "type": "daily-learning",
      "title": "Aprendizaje Diario — 2026-05-27",
      "path": "daily-learning.md",
      "createdAt": "2026-05-27T23:00:00.000Z",
      "updatedAt": "2026-05-27T23:00:00.000Z",
      "summary": "Resumen corto del contenido",
      "signalCount": 5,
      "tags": ["servicios", "clientes", "ventas"]
    }
  ]
}
```

### 3.2 `learning-events.json`

**Propósito**: Registro cronológico de todos los eventos de aprendizaje.

```json
{
  "version": 1,
  "events": [
    {
      "id": "evt-001",
      "type": "upload",
      "sourceType": "upload",
      "timestamp": "2026-05-27T15:30:00.000Z",
      "fileName": "nota-cliente.txt",
      "extraction": {
        "signals": ["La clienta quedó feliz con su balayage"],
        "emotions": ["feliz", "satisfecha"],
        "insights": ["Prefiere agendar por WhatsApp"],
        "services": ["balayage"],
        "objections": [],
        "opportunities": ["Ofrecer mantenimiento a los 3 meses"],
        "suggestedAction": "Agregar recordatorio de mantenimiento"
      },
      "driveFileId": "1abc...",
      "status": "processed"
    }
  ]
}
```

### 3.3 `processing-queue.json`

**Propósito**: Cola de procesamiento nocturno (ver [`BRAIN_NIGHTLY_QUEUE.md`](./BRAIN_NIGHTLY_QUEUE.md)).

```json
{
  "version": 1,
  "lastRun": "2026-05-28T05:00:00.000Z",
  "queue": [
    {
      "id": "a1b2c3d4-...",
      "type": "transcribe_audio",
      "status": "queued",
      "priority": 7,
      "payload": {
        "fileId": "1abc...",
        "fileName": "consulta-cliente.m4a",
        "mimeType": "audio/mp4",
        "uploadedAt": "2026-05-27T15:30:00.000Z"
      },
      "createdAt": "2026-05-27T15:30:00.000Z",
      "retryCount": 0
    }
  ],
  "history": []
}
```

### 3.4 `brain-metrics.json`

**Propósito**: Métricas actuales del Brain.

```json
{
  "version": 1,
  "lastUpdated": "2026-05-28T07:00:00.000Z",
  "metrics": {
    "brainConfidence": 42,
    "learnedStyle": 30,
    "teamTalent": 15,
    "socialSatisfaction": 24,
    "detectedOpportunities": 12
  },
  "history": [
    {
      "date": "2026-05-27",
      "metrics": {
        "brainConfidence": 38,
        "learnedStyle": 30,
        "teamTalent": 15,
        "socialSatisfaction": 16,
        "detectedOpportunities": 12
      }
    }
  ]
}
```

---

## 4. Estructura de Cada Memoria

Cada entrada de memoria (ya sea en Markdown o JSON) incluye los siguientes campos:

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `date` | string (ISO) | Fecha del evento | Sí |
| `source` | string | Origen: `upload`, `voice`, `note`, `suggestion`, `social`, `manual` | Sí |
| `type` | string | Tipo de memoria: `daily-learning`, `emotional-pattern`, `objection`, `service-intent`, `sales-language`, `campaign-temperature`, `concierge-tone`, `technical-history`, `team-talent`, `social-satisfaction` | Sí |
| `summary` | string | Resumen del contenido | Sí |
| `emotionalSignals` | string[] | Señales emocionales detectadas | No |
| `servicesDetected` | string[] | Servicios mencionados | No |
| `objections` | string[] | Objeciones de clientes | No |
| `opportunities` | string[] | Oportunidades detectadas | No |
| `suggestedAction` | string | Acción sugerida | No |
| `status` | string | Estado: `active`, `archived`, `superseded` | Sí |

---

## 5. Ciclo de Vida de las Memorias

```
Creación (evento de aprendizaje)
    │
    ├── Estado: active
    │
    ├── Actualización (nuevo evento del mismo tipo)
    │   └── La memoria existente se actualiza con nuevos datos
    │
    ├── Supersede (evento más relevante reemplaza al anterior)
    │   └── Estado: superseded (la anterior)
    │   └── Estado: active (la nueva)
    │
    └── Archivo (después de 90 días sin actualización)
        └── Estado: archived
```

---

## 6. Notas para Implementación Futura

1. **Memorias por cliente**: Cuando el sistema soporte múltiples clientes, las memorias se organizarán en `data/business-brain/{clientSlug}/memory/`.
2. **Búsqueda semántica**: Implementar búsqueda por similitud semántica en las memorias usando embeddings.
3. **Resumen semanal**: Generar automáticamente un resumen semanal a partir de los daily-learning.md.
4. **Exportación**: Permitir exportar todas las memorias como un solo archivo ZIP.
5. **Versiones**: Mantener versiones anteriores de las memorias cuando se actualizan (git-like).
6. **Notificaciones**: Enviar resumen diario de memorias al dueño del negocio por WhatsApp/email.
