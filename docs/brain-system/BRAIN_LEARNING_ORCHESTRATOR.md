# Brain Learning Orchestrator — Arquitectura General

> **Propósito**: Documentar la arquitectura general del sistema de aprendizaje del negocio (Brain Learning Center), el flujo de datos desde la ingesta hasta la generación de insights, y los estados por los que pasa cada archivo/aprendizaje.

---

## 1. Visión General

El **Brain Learning Orchestrator** es el núcleo del sistema de inteligencia del negocio. Su función es:

1. **Ingestar** cualquier señal del negocio (archivos, notas de voz, notas de texto, interacciones de clientes).
2. **Clasificar** automáticamente el tipo de contenido y determinar la ruta de procesamiento.
3. **Procesar** el contenido —inmediatamente si es ligero, o en cola nocturna si es pesado— para extraer información estructurada.
4. **Escribir** la información extraída en memorias persistentes (archivos Markdown y JSON).
5. **Actualizar** las métricas del Brain (confianza, estilo aprendido, talento, satisfacción, oportunidades).
6. **Reflejar** los insights en la UI del Brain Admin para que el dueño del negocio los vea.

```
┌──────────┐    ┌──────────────┐    ┌───────────────────┐    ┌──────────────┐
│  Ingesta  │───▶│ File Router  │───▶│ Immediate Processor│───▶│ AI Extraction│
│ (Upload,  │    │ (MIME +      │    │ or Nightly Queue  │    │ (Signals,    │
│  Voice,   │    │  SourceType) │    │                   │    │  Emotions,   │
│  Notes,   │    └──────────────┘    └───────────────────┘    │  Insights)   │
│  QR)      │                                                └──────┬───────┘
└──────────┘                                                       │
                                                                    ▼
┌──────────────┐    ┌───────────────────┐    ┌──────────────────────────┐
│ Brain Metrics│◀───│ Memory Writer     │◀───│ Structured Data          │
│ (Confianza,  │    │ (Markdown + JSON) │    │ (Extraction result)      │
│  Estilo,     │    └───────────────────┘    └──────────────────────────┘
│  Talento,    │
│  Satisfac.,  │    ┌───────────────────┐
│  Oportunid.) │───▶│ UI Insights       │
└──────────────┘    │ (Brain Admin)     │
                    └───────────────────┘
```

---

## 2. Flujo de Datos Detallado

### 2.1 Ingesta

| Fuente | Endpoint / Método | Archivo Clave |
|--------|-------------------|---------------|
| Archivo subido (drag & drop) | `POST /api/brain-admin/upload` | [`store.ts`](../../src/app/api/brain-admin/store.ts) → `saveBrainUpload()` |
| Nota de voz (grabación) | `POST /api/brain-admin/voice` | [`store.ts`](../../src/app/api/brain-admin/store.ts) → `saveVoiceBrainLearning()` |
| Nota de texto (colaborar) | `POST /api/brain-admin/audit-note` | [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts) |
| Subida desde celular (QR) | `POST /api/brain-admin/upload` (con `sourceType: "qr-upload"`) | [`brain-upload/page.tsx`](../../src/app/brain-upload/page.tsx) |
| Sugerencia del sistema | Generada internamente en `saveVoiceBrainLearning()` | [`store.ts`](../../src/app/api/brain-admin/store.ts) → `generateVoiceSuggestions()` |

### 2.2 File Router

El **File Router** determina:

1. **Carpeta destino en Google Drive** según MIME type y `sourceType` (ver [`BRAIN_FILE_ROUTING.md`](./BRAIN_FILE_ROUTING.md)).
2. **Ruta de procesamiento**: inmediato vs cola nocturna (ver [`BRAIN_PROCESSING_RULES.md`](./BRAIN_PROCESSING_RULES.md)).
3. **Tipo de almacenamiento** para el Storage Index (image, video, audio, pdf, text, markdown).

**Implementación**: [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts) → `getSubfolderName()` y [`store.ts`](../../src/app/api/brain-admin/store.ts) → `getStorageFolder()` / `getStorageTypeKey()`.

### 2.3 Procesamiento Inmediato vs Cola Nocturna

| Tipo de Contenido | Ruta | Razón |
|-------------------|------|-------|
| Texto plano (< 1 KB) | Inmediato | No requiere transcripción ni OCR |
| Notas de voz (< 30 s) | Inmediato | Transcripción rápida |
| Imagen suelta | Inmediato | Extracción ligera de metadatos |
| Audio largo (> 1 min) | **Cola nocturna** | Transcripción pesada |
| Video | **Cola nocturna** | Requiere extracción de audio + transcripción |
| PDF grande (> 5 MB) | **Cola nocturna** | Extracción de texto pesada |
| Lote de imágenes (> 5) | **Cola nocturna** | OCR por lotes |
| Chat exportado largo | **Cola nocturna** | Análisis contextual pesado |

Ver [`BRAIN_NIGHTLY_QUEUE.md`](./BRAIN_NIGHTLY_QUEUE.md) para detalles de la cola nocturna.

### 2.4 AI Extraction

La extracción de señales se realiza mediante [`extractBrainSignals()`](../../src/app/api/brain-admin/store.ts) en `store.ts`. Esta función analiza el texto sin procesar y devuelve un objeto `BrainExtraction`:

```typescript
type BrainExtraction = {
  signals: string[];           // Señales detectadas
  emotions: string[];          // Emociones identificadas
  insights: string[];          // Insights del negocio
  services: string[];          // Servicios mencionados
  objections: string[];        // Objeciones de clientes
  opportunities: string[];     // Oportunidades detectadas
  suggestedAction: string;     // Acción sugerida
};
```

### 2.5 Memory Writer

La información extraída se persiste en:

1. **Archivos Markdown** en `data/business-brain/{clientSlug}/memory/` — ver [`BRAIN_MEMORY_OUTPUTS.md`](./BRAIN_MEMORY_OUTPUTS.md).
2. **Archivos JSON** para datos estructurados (learning-events.json, brain-metrics.json, etc.).
3. **Storage Index** (`data/business-brain/storage-index.json`) para seguimiento de archivos.

### 2.6 Brain Metrics

Las métricas del Brain se calculan en [`brainSummaryFromRecords()`](../../src/app/api/brain-admin/store.ts) con reglas estrictas para evitar inflación:

| Métrica | Fórmula | Máximo |
|---------|---------|--------|
| Confianza del Brain | `min(records.length * 3.3, 100)` | 100 |
| Estilo aprendido | `min(uniqueServices * 10, 100)` | 100 |
| Talento del equipo | `min(stylistsDetected * 15, 100)` | 100 |
| Satisfacción social | `min(positiveSignals * 8, 100)` | 100 |
| Oportunidades detectadas | `min(opportunities * 12, 100)` | 100 |

### 2.7 UI Insights

Los insights se reflejan en la UI del Brain Admin ([`page.tsx`](../../src/app/brain-admin/page.tsx)) a través de:

- **Hero mini-cards**: Muestran las 5 métricas principales.
- **"Qué aprendió hoy el Brain"**: Sección que aparece después de procesar archivos, mostrando señales, emociones e insights.
- **"Nuevas señales detectadas"**: Badges con las señales más recientes.
- **Tabs**: trabajos, talento, satisfacción, campañas.
- **Storage section**: Barra de uso, desglose por tipo de archivo, actividad reciente.

---

## 3. Estados de un Archivo/Aprendizaje

Cada archivo o aprendizaje pasa por los siguientes estados:

```
uploaded ──▶ classified ──▶ queued ──▶ processing ──▶ processed
                                │                        │
                                │                        ├──▶ failed
                                │                        │
                                │                        └──▶ needs_review
                                │
                                └──▶ (immediate) ──▶ processing ──▶ ...
```

| Estado | Descripción |
|--------|-------------|
| `uploaded` | El archivo fue subido al servidor y almacenado en Google Drive |
| `classified` | El File Router determinó tipo, carpeta destino y ruta de procesamiento |
| `queued` | El archivo está en la cola nocturna esperando ser procesado |
| `processing` | El archivo está siendo procesado activamente (transcripción, extracción, etc.) |
| `processed` | El procesamiento terminó exitosamente y las memorias fueron escritas |
| `failed` | El procesamiento falló (archivo corrupto, timeout, error de API) |
| `needs_review` | El contenido requiere revisión humana (detección de datos sensibles, ambigüedad) |

---

## 4. Reglas de Negocio

### 4.1 Textos pequeños
- Textos de menos de 20 caracteres no se procesan (se descartan con log).
- Notas de voz con transcripción vacía se marcan como `failed`.

### 4.2 Notas manuales
- Las notas de texto pasan por una auditoría antes de guardarse (ver [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts)).
- La auditoría verifica: relevancia para el negocio, lenguaje inapropiado, datos sensibles (RUT, teléfono, email).

### 4.3 Imágenes
- Las imágenes se almacenan en Google Drive en la carpeta `/img`.
- No se procesan con OCR a menos que estén en la cola nocturna como parte de un lote.

### 4.4 Audios, Videos y PDFs
- Siempre van a la cola nocturna si superan los umbrales de tamaño/duración.
- Requieren transcripción (API externa por ahora, Whisper local en el futuro).

---

## 5. Archivos Clave del Sistema

| Archivo | Rol |
|---------|-----|
| [`store.ts`](../../src/app/api/brain-admin/store.ts) | Lógica central: tipos, I/O, extracción, métricas, upload |
| [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts) | Almacenamiento en Google Drive (OAuth + resumable upload) |
| [`upload/route.ts`](../../src/app/api/brain-admin/upload/route.ts) | API endpoint para subida de archivos |
| [`voice/route.ts`](../../src/app/api/brain-admin/voice/route.ts) | API endpoint para aprendizaje por voz |
| [`audit-note/route.ts`](../../src/app/api/brain-admin/audit-note/route.ts) | API endpoint para auditoría de notas |
| [`qr-token/route.ts`](../../src/app/api/brain-admin/qr-token/route.ts) | API endpoint para tokens QR |
| [`page.tsx`](../../src/app/brain-admin/page.tsx) | UI del Brain Admin |
| [`brain-admin.module.css`](../../src/app/brain-admin/brain-admin.module.css) | Estilos del Brain Admin |
| [`brain-upload/page.tsx`](../../src/app/brain-upload/page.tsx) | Página de subida desde celular vía QR |

---

## 6. Variables de Entorno Relevantes

| Variable | Descripción | Default |
|----------|-------------|---------|
| `GOOGLE_DRIVE_ENABLED` | Habilita/deshabilita la integración con Drive | `true` |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth 2.0 | — |
| `GOOGLE_CLIENT_SECRET` | Client Secret de OAuth 2.0 | — |
| `GOOGLE_REDIRECT_URI` | URI de redirección OAuth | `http://localhost:3000/api/google-drive/callback` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | ID de la carpeta raíz en Drive | — |
| `BRAIN_STORAGE_QUOTA_MB` | Cuota máxima de almacenamiento local | `5120` |

---

## 7. Dependencias Externas

| Dependencia | Uso |
|-------------|-----|
| Google Drive API v3 | Almacenamiento de archivos |
| Google OAuth 2.0 | Autenticación para Drive |
| API de transcripción (externa) | Transcripción de audios (temporal) |
| `api.qrserver.com` | Generación de códigos QR |

---

## 8. Diagrama de Archivos

```
src/
├── app/
│   ├── api/
│   │   └── brain-admin/
│   │       ├── store.ts              ← Lógica central
│   │       ├── upload/route.ts       ← Upload endpoint
│   │       ├── voice/route.ts        ← Voice endpoint
│   │       ├── audit-note/route.ts   ← Note audit endpoint
│   │       ├── qr-token/route.ts     ← QR token endpoint
│   │       ├── storage/route.ts      ← Storage stats endpoint
│   │       ├── session/route.ts      ← Session management
│   │       └── drive/route.ts        ← Drive sync endpoint
│   ├── brain-admin/
│   │   ├── page.tsx                  ← Brain Admin UI
│   │   └── brain-admin.module.css    ← Brain Admin styles
│   ├── brain-upload/
│   │   └── page.tsx                  ← QR mobile upload page
│   └── lib/
│       └── googleDriveBrainStorage.ts ← Drive storage logic
data/
└── business-brain/
    ├── drive-oauth.json              ← OAuth tokens
    ├── drive-sync-index.json         ← Drive sync index
    ├── qr-tokens.json                ← QR tokens store
    ├── storage-index.json            ← Storage index
    ├── uploads.json                  ← Upload records
    ├── suggestions/
    │   └── suggestions.json          ← Pending suggestions
    └── {clientSlug}/
        └── memory/                   ← Memory outputs
            ├── daily-learning.md
            ├── emotional-patterns.md
            └── ... (see BRAIN_MEMORY_OUTPUTS.md)
```
