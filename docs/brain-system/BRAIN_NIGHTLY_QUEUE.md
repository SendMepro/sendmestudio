# Brain Nightly Queue — Sistema de Cola Nocturna

> **Propósito**: Documentar el sistema de procesamiento nocturno para tareas pesadas que no deben ejecutarse durante el horario laboral para evitar sobrecarga del servidor.

---

## 1. Motivación

El Brain Learning Orchestrator recibe archivos de diversos tipos durante el día. Algunos requieren procesamiento intensivo (transcripción de audio, OCR de imágenes, análisis de video). Para evitar:

- **Sobrecarga del servidor** durante horas de trabajo.
- **Timeouts** en las respuestas de la API.
- **Bloqueo de la UI** del Brain Admin.

Se implementa una **cola nocturna** que procesa estos trabajos entre las **02:00 y 05:00** (hora local del servidor, configurada como `America/Santiago`).

---

## 2. ¿Qué va a la Cola Nocturna?

### 2.1 Reglas de Decisión

| Tipo de Contenido | Condición | Acción |
|-------------------|-----------|--------|
| Audio | Duración > 1 minuto | Cola nocturna |
| Audio | Duración ≤ 1 minuto | Procesamiento inmediato |
| Video | Cualquier duración | Cola nocturna |
| Video | `sourceType = "trabajo-realizado"` | Cola nocturna (prioridad media) |
| PDF | Tamaño > 5 MB | Cola nocturna |
| PDF | Tamaño ≤ 5 MB | Procesamiento inmediato |
| Lote de imágenes | Más de 5 imágenes en 1 hora | Cola nocturna (OCR por lotes) |
| Imagen suelta | 1 imagen | Procesamiento inmediato |
| Chat exportado | Cualquier tamaño | Cola nocturna |
| Texto plano | Cualquier tamaño | Procesamiento inmediato |
| Nota de voz | Transcripción < 30 s | Procesamiento inmediato |

### 2.2 Tipos de Trabajo (Jobs)

| Job ID | Descripción | Peso |
|--------|-------------|------|
| `transcribe_audio` | Transcripción de audio a texto usando API externa (futuro: Whisper local) | Pesado |
| `analyze_video` | Extracción de audio del video + transcripción | Muy pesado |
| `extract_pdf` | Extracción de texto de PDF (con OCR si es necesario) | Medio |
| `batch_screenshot_ocr` | OCR por lotes para múltiples imágenes | Medio |
| `generate_memory_summary` | Generación de resumen de memorias del día | Ligero |
| `update_brain_metrics` | Recalcular métricas del Brain basado en nuevos datos | Ligero |

---

## 3. Arquitectura de la Cola

### 3.1 Archivo de Cola

La cola se persiste en `data/business-brain/processing-queue.json`.

```typescript
type QueueEntry = {
  id: string;                    // UUID del trabajo
  type: QueueJobType;            // Tipo de trabajo
  status: QueueStatus;           // Estado actual
  priority: number;              // Prioridad (1-10, 10 = más alta)
  payload: {                     // Datos del trabajo
    fileId: string;              // ID del archivo en Drive
    fileName: string;            // Nombre del archivo
    mimeType: string;            // Tipo MIME
    sourceType?: string;         // Contexto de subida
    uploadedAt: string;          // Timestamp ISO de subida
    metadata?: Record<string, unknown>; // Metadatos adicionales
  };
  createdAt: string;             // Timestamp ISO de creación
  startedAt?: string;            // Timestamp ISO de inicio de procesamiento
  completedAt?: string;          // Timestamp ISO de finalización
  error?: string;                // Mensaje de error si falló
  retryCount: number;            // Número de reintentos
};

type QueueJobType =
  | "transcribe_audio"
  | "analyze_video"
  | "extract_pdf"
  | "batch_screenshot_ocr"
  | "generate_memory_summary"
  | "update_brain_metrics";

type QueueStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";
```

### 3.2 Estructura del Archivo

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
        "fileName": "consulta-cliente-2026-05-27.m4a",
        "mimeType": "audio/mp4",
        "sourceType": undefined,
        "uploadedAt": "2026-05-27T15:30:00.000Z"
      },
      "createdAt": "2026-05-27T15:30:00.000Z",
      "retryCount": 0
    }
  ],
  "history": [
    // Trabajos completados en ejecuciones anteriores
  ]
}
```

---

## 4. Ciclo de Ejecución Nocturna

### 4.1 Horario

- **Inicio**: 02:00 AM (hora local, `America/Santiago`).
- **Fin**: 05:00 AM (hora local).
- **Ventana máxima**: 3 horas.

### 4.2 Reglas de Ejecución

1. **Máximo 1 trabajo pesado activo** a la vez (para no saturar CPU/memoria).
2. Los trabajos ligeros (`generate_memory_summary`, `update_brain_metrics`) se ejecutan al final.
3. Si la ventana de 3 horas se agota, los trabajos restantes quedan en `queued` para la próxima noche.
4. **Reintentos**: máximo 3 intentos por trabajo. Si falla 3 veces, se marca como `failed`.
5. **Timeout por trabajo**: 30 minutos para trabajos pesados, 5 minutos para ligeros.

### 4.3 Orden de Prioridad

```
1. transcribe_audio       (prioridad 7) — los audios tienen contexto temporal valioso
2. analyze_video          (prioridad 6)
3. extract_pdf            (prioridad 5)
4. batch_screenshot_ocr   (prioridad 4)
5. generate_memory_summary (prioridad 2) — se ejecuta al final
6. update_brain_metrics    (prioridad 1) — se ejecuta al final
```

Dentro del mismo tipo, se ordena por `uploadedAt` (más antiguo primero).

---

## 5. Implementación Propuesta

### 5.1 API Endpoint

```
POST /api/brain-admin/queue/process
```

- **Autenticación**: Requiere sesión de super admin.
- **Trigger**: Puede ejecutarse manualmente desde el Brain Admin o mediante un cron job.
- **Respuesta**: `{ processed: number, failed: number, remaining: number }`.

### 5.2 Cron Job (Producción)

En producción, se recomienda un cron job que ejecute el endpoint a las 02:00 AM:

```bash
# Linux (crontab)
0 2 * * * curl -X POST https://sendmestudio.com/api/brain-admin/queue/process \
  -H "Authorization: Bearer <super-admin-token>"
```

En desarrollo local, se puede ejecutar manualmente desde el Brain Admin.

### 5.3 Función Principal

```typescript
async function processNightlyQueue(): Promise<ProcessResult> {
  const queue = await readProcessingQueue();
  const now = new Date();
  const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3 horas

  let processed = 0;
  let failed = 0;

  for (const entry of queue.queue.filter(e => e.status === "queued")) {
    if (new Date() >= endTime) break; // Ventana agotada

    // Máximo 1 trabajo pesado a la vez
    if (isHeavyJob(entry.type) && hasActiveHeavyJob(queue)) {
      continue;
    }

    entry.status = "processing";
    entry.startedAt = new Date().toISOString();
    await writeProcessingQueue(queue);

    try {
      await processJob(entry);
      entry.status = "completed";
      entry.completedAt = new Date().toISOString();
      processed++;
    } catch (error) {
      entry.retryCount++;
      if (entry.retryCount >= 3) {
        entry.status = "failed";
        entry.error = error.message;
        failed++;
      } else {
        entry.status = "queued"; // Reintentar
      }
    }

    await writeProcessingQueue(queue);
  }

  queue.lastRun = new Date().toISOString();
  await writeProcessingQueue(queue);

  return { processed, failed, remaining: queue.queue.filter(e => e.status === "queued").length };
}
```

---

## 6. Integración con el Sistema Actual

### 6.1 Punto de Inserción en la Cola

Cuando un archivo se sube mediante [`saveBrainUpload()`](../../src/app/api/brain-admin/store.ts), después de almacenarlo en Drive, el sistema debe decidir:

```typescript
// Pseudocódigo — decisión de encolar
if (shouldQueue(fileName, mimeType, buffer)) {
  await addToProcessingQueue({
    type: getJobType(mimeType),
    payload: { fileId: driveResult.fileId, fileName, mimeType, uploadedAt: new Date().toISOString() },
    priority: getPriority(mimeType),
  });
  // No se ejecuta extracción inmediata
} else {
  // Procesamiento inmediato (como ahora)
  const extraction = extractBrainSignals(text, sourceType);
  await appendMemory(...);
}
```

### 6.2 Función `shouldQueue()`

```typescript
function shouldQueue(fileName: string, mimeType: string, buffer: Buffer): boolean {
  if (mimeType.startsWith("video/")) return true;
  if (mimeType.startsWith("audio/") && buffer.length > 1024 * 1024 * 2) return true; // > 2 MB
  if (mimeType === "application/pdf" && buffer.length > 5 * 1024 * 1024) return true; // > 5 MB
  // Más reglas según necesidad
  return false;
}
```

---

## 7. Estados y Transiciones

```
         ┌────────────────────────────────────────────┐
         │                                            │
         ▼                                            │
    ┌─────────┐    ┌────────────┐    ┌───────────┐    │
    │ queued  │───▶│ processing │───▶│ completed │    │
    └─────────┘    └────────────┘    └───────────┘    │
         │              │                              │
         │              ▼                              │
         │         ┌──────────┐                        │
         └────────▶│  failed  │────────────────────────┘
                    └──────────┘   (retryCount < 3)
                         │
                         ▼
                    ┌──────────┐
                    │  skipped │ (retryCount >= 3)
                    └──────────┘
```

---

## 8. Notas para Implementación Futura

1. **WebSocket**: Notificar al Brain Admin en tiempo real cuando un trabajo nocturno se complete.
2. **Prioridad dinámica**: Aumentar prioridad de trabajos que llevan más de 48 horas en cola.
3. **Límite por tipo**: Máximo 5 trabajos de transcripción por ejecución nocturna.
4. **API de transcripción**: Actualmente usar API externa. Migrar a Whisper local cuando el servidor lo soporte.
5. **Dashboard de cola**: Agregar vista en Brain Admin para monitorear estado de la cola.
6. **Notificaciones**: Enviar notificación al dueño del negocio cuando haya nuevos insights disponibles después del procesamiento nocturno.
