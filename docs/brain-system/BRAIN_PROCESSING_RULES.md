# Brain Processing Rules — Reglas de Decisión de Procesamiento

> **Propósito**: Documentar las reglas de decisión que determinan si un archivo se procesa inmediatamente o se envía a la cola nocturna, las reglas de auditoría de contenido, y las reglas de transcripción.

---

## 1. Decisión: Procesamiento Inmediato vs Cola Nocturna

### 1.1 Árbol de Decisión

```
¿El archivo es un video?
    ├── Sí → Cola nocturna (siempre)
    └── No → ¿El archivo es un audio?
        ├── Sí → ¿Duración > 1 minuto?
        │       ├── Sí → Cola nocturna
        │       └── No → Procesamiento inmediato
        └── No → ¿El archivo es un PDF?
            ├── Sí → ¿Tamaño > 5 MB?
            │       ├── Sí → Cola nocturna
            │       └── No → Procesamiento inmediato
            └── No → ¿Es un lote de imágenes (>5 en 1h)?
                ├── Sí → Cola nocturna
                └── No → Procesamiento inmediato
```

### 1.2 Reglas en Pseudocódigo

```typescript
function shouldQueue(fileName: string, mimeType: string, buffer: Buffer): boolean {
  // Videos siempre a cola nocturna
  if (mimeType.startsWith("video/")) return true;

  // Audios > 2 MB (~1 minuto en MP3 de calidad media)
  if (mimeType.startsWith("audio/") && buffer.length > 2 * 1024 * 1024) return true;

  // PDFs > 5 MB
  if (mimeType === "application/pdf" && buffer.length > 5 * 1024 * 1024) return true;

  // Lote de imágenes: se detecta por frecuencia de subida
  // (implementación futura: contar imágenes en los últimos 60 minutos)

  return false;
}
```

### 1.3 Excepciones

- **Notas de voz** (`sourceType = "voice"`): Siempre se procesan inmediatamente, independientemente de la duración. La transcripción se hace en el frontend (Web Speech API) y solo se envía el texto al servidor.
- **QR Upload** (`sourceType = "qr-upload"`): Sigue las reglas estándar. Si es un audio largo o video, va a cola nocturna.
- **Trabajos realizados** (`sourceType = "trabajo-realizado"`): Las fotos se procesan inmediatamente. Los videos van a cola nocturna.

---

## 2. Reglas de Auditoría de Contenido

### 2.1 Auditoría de Notas de Texto

Cuando un usuario escribe una nota mediante el modal "Colaborar con notas", el texto pasa por una auditoría antes de guardarse. La auditoría se implementa en [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts).

#### 2.1.1 Flujo de Auditoría

```
Texto ingresado
    │
    ├── 1. Verificar lenguaje inapropiado
    │       ├── ¿Contiene palabras bloqueadas? → not_suitable ❌
    │       └── No → continuar
    │
    ├── 2. Verificar relevancia para el negocio
    │       ├── ¿Contiene 0 keywords de negocio? → out_of_context ⚠️
    │       └── ≥ 1 keyword → continuar
    │
    ├── 3. Verificar datos sensibles
    │       ├── ¿Contiene RUT chileno? → needs_edit ✏️
    │       ├── ¿Contiene número de teléfono? → needs_edit ✏️
    │       ├── ¿Contiene email? → needs_edit ✏️
    │       └── No → approved ✅
    │
    └── Resultado final
```

#### 2.1.2 Posibles Resultados

| Resultado | Descripción | Acción |
|-----------|-------------|--------|
| `approved` | La nota es relevante y no contiene datos sensibles | Se guarda automáticamente |
| `needs_edit` | La nota contiene datos sensibles (RUT, teléfono, email) | Se muestra advertencia y se permite editar antes de guardar |
| `out_of_context` | La nota no contiene términos relacionados al negocio | Se muestra advertencia pero se permite guardar si el usuario confirma |
| `not_suitable` | La nota contiene lenguaje inapropiado | Se bloquea el guardado |

#### 2.1.3 Palabras Bloqueadas

El sistema mantiene una lista de palabras bloqueadas que incluye:
- Lenguaje ofensivo y groserías.
- Términos políticos, deportivos o religiosos no relacionados al negocio.
- SPAM o referencias a otros negocios.

**Ubicación**: Constante `BLOCKED_WORDS` en [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts).

#### 2.1.4 Keywords de Negocio

El sistema busca coincidencias con una lista de ~100 términos relacionados al negocio de la peluquería y estética:

| Categoría | Ejemplos |
|-----------|----------|
| Servicios | corte, color, balayage, mechas, alisado, keratina, botox capilar, peinado, maquillaje, manicure, pedicure, cejas, pestañas |
| Productos | shampoo, acondicionador, mascarilla, aceite, serum, spray, cera, gel |
| Técnicas | babylight, airtouch, ombre, degradado, iluminación, visagismo |
| Clientes | cliente, cita, reserva, hora agendada, fidelización, experiencia |
| Negocio | salón, peluquería, estética, precio, promoción, campaña, red social, Instagram, Facebook, TikTok |
| Resultados | satisfecho, feliz, recomendación, resultados, transformación, cambio de look |

**Ubicación**: Constante `BUSINESS_KEYWORDS` en [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts).

#### 2.1.5 Detección de Datos Sensibles

Patrones regex utilizados:

```typescript
const SENSITIVE_PATTERNS = [
  /^\d{1,2}\.\d{3}\.\d{3}[-]\d{1}$/m,  // RUT chileno (12.345.678-9)
  /\b\d{9}\b/,                            // RUT sin puntos
  /\+56\s?\d{8,9}/,                       // Teléfono Chile
  /\b\d{8,}\b/,                           // Número largo
  /[\w.-]+@[\w.-]+\.\w+/,                 // Email
];
```

---

## 3. Reglas de Transcripción

### 3.1 Transcripción de Notas de Voz

Actualmente, la transcripción de notas de voz se realiza en el **frontend** usando la **Web Speech API** (`SpeechRecognition`).

#### 3.1.1 Flujo Actual

```
Usuario graba audio (navegador)
    │
    ├── Web Speech API transcribe en tiempo real
    │   (SpeechRecognition → interimResults + finalResult)
    │
    ├── Usuario puede editar la transcripción antes de enviar
    │
    └── Se envía el texto transcripto al servidor (POST /api/brain-admin/voice)
        El servidor NO recibe el audio, solo el texto
```

#### 3.1.2 Limitaciones

- **Web Speech API** solo funciona en navegadores basados en Chromium (Chrome, Edge).
- No funciona en Safari o Firefox sin polyfill.
- La calidad de la transcripción depende del micrófono y el acento del usuario.
- No hay soporte para español latinoamericano optimizado (usa el modelo genérico de `es`).

#### 3.1.3 Implementación en [`page.tsx`](../../src/app/brain-admin/page.tsx)

```typescript
const SpeechRecognition =
  (window as SpeechRecognitionWindow).SpeechRecognition ||
  (window as SpeechRecognitionWindow).webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "es-CL";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      setTranscript(prev => prev + " " + finalTranscript);
    }
  };
}
```

### 3.2 Transcripción de Audios (Futuro — Cola Nocturna)

Para audios largos (> 1 minuto) que van a la cola nocturna, se requiere una API de transcripción del lado del servidor.

#### 3.2.1 Opción Actual (API Externa)

```typescript
async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  // Usar API de transcripción externa (ej: OpenAI Whisper API, Google Speech-to-Text)
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: mimeType }));
  formData.append("model", "whisper-1");
  formData.append("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  });

  const data = await response.json();
  return data.text;
}
```

#### 3.2.2 Opción Futura (Whisper Local)

```typescript
// Cuando el servidor tenga capacidad de GPU o suficiente CPU:
// Usar whisper.cpp o faster-whisper para transcripción local
// Ventaja: sin costos de API, sin límites de tasa, privacidad de datos
```

### 3.3 Reglas de Transcripción

1. **No bloquear la UI**: La transcripción nunca debe bloquear la respuesta de la API. Si es pesada, va a cola nocturna.
2. **Idioma**: Siempre español (`es` o `es-CL`).
3. **Fallback**: Si la API de transcripción falla, el trabajo se marca como `failed` con el error correspondiente y se reintenta hasta 3 veces.
4. **Límite de duración**: Audios de más de 30 minutos se dividen en segmentos de 15 minutos para transcripción.

---

## 4. Reglas de Extracción de Señales

### 4.1 Función `extractBrainSignals()`

Ubicación: [`store.ts`](../../src/app/api/brain-admin/store.ts).

```typescript
export function extractBrainSignals(rawText: string, sourceType: string): BrainExtraction
```

#### 4.1.1 Reglas de Extracción

| Tipo de Señal | Cómo se Detecta | Ejemplo |
|---------------|-----------------|---------|
| `signals` | Líneas que contienen palabras clave de servicio, emoción o negocio | "La clienta quedó feliz con su balayage" |
| `emotions` | Palabras de emoción positiva/negativa | feliz, contenta, encantada, frustrada, insegura |
| `insights` | Patrones de aprendizaje, observaciones del negocio | "Los clientes prefieren agendar por Instagram" |
| `services` | Términos de la lista de servicios | balayage, corte, manicure, keratina |
| `objections` | Frases de objeción de clientes | "es muy caro", "no me queda bien", "me da miedo" |
| `opportunities` | Patrones de oportunidad de venta | "podríamos ofrecer", "falta promocionar", "hay demanda" |
| `suggestedAction` | Acción concreta sugerida | "Crear campaña de balayage para julio" |

#### 4.1.2 Reglas de Validación

- Textos de menos de **20 caracteres** se descartan (no generan señales).
- Textos que contienen solo palabras bloqueadas se descartan.
- Las señales duplicadas se eliminan (usando `Set` o `filter`).
- Máximo **10 señales** por extracción (para evitar ruido).

---

## 5. Reglas de Métricas

### 5.1 Sin Inflación

Las métricas del Brain tienen reglas estrictas para evitar inflación artificial:

```typescript
// Ejemplo de cálculo en brainSummaryFromRecords()
const learningMetrics = {
  brainConfidence: Math.min(records.length * 3.3, 100),
  learnedStyle: Math.min(uniqueServices * 10, 100),
  teamTalent: Math.min(stylistsDetected * 15, 100),
  socialSatisfaction: Math.min(positiveSignals * 8, 100),
  detectedOpportunities: Math.min(opportunities * 12, 100),
};
```

**Reglas**:
- Ninguna métrica puede superar **100**.
- Las métricas solo aumentan con datos reales (no con valores por defecto).
- Si no hay datos suficientes, la métrica se muestra como `0` (no como "N/A" o valores inventados).

### 5.2 Almacenamiento

Las métricas se almacenan en `data/business-brain/brain-metrics.json` y se actualizan después de cada procesamiento exitoso.

---

## 6. Resumen de Reglas

| # | Regla | Aplica a |
|---|-------|----------|
| 1 | Videos siempre a cola nocturna | Upload |
| 2 | Audios > 2 MB a cola nocturna | Upload |
| 3 | PDFs > 5 MB a cola nocturna | Upload |
| 4 | Notas de voz siempre inmediatas | Voice |
| 5 | Texto < 20 caracteres se descarta | Extracción |
| 6 | Notas con palabras bloqueadas → `not_suitable` | Auditoría |
| 7 | Notas sin keywords de negocio → `out_of_context` | Auditoría |
| 8 | Notas con RUT/teléfono/email → `needs_edit` | Auditoría |
| 9 | Máximo 3 reintentos por trabajo de cola | Cola nocturna |
| 10 | Máximo 1 trabajo pesado activo a la vez | Cola nocturna |
| 11 | Métricas no pueden superar 100 | Métricas |
| 12 | No inflar métricas con datos por defecto | Métricas |
| 13 | Transcripción no bloquea la UI | Transcripción |
| 14 | QR token expira en 15 minutos | QR Upload |
| 15 | QR upload máximo 50 MB | QR Upload |
