# Brain File Routing — Reglas de Enrutamiento en Google Drive

> **Propósito**: Documentar cómo el sistema determina la carpeta destino en Google Drive para cada archivo subido, basado en su tipo MIME, extensión y `sourceType`.

---

## 1. Función Principal

El enrutamiento se realiza en [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts) mediante la función `getSubfolderName(fileName, mimeType, sourceType?)`.

```typescript
function getSubfolderName(fileName: string, mimeType: string, sourceType?: string): string
```

**Parámetros**:
- `fileName`: Nombre del archivo (incluye extensión).
- `mimeType`: Tipo MIME del archivo (ej: `image/jpeg`, `audio/mpeg`).
- `sourceType` (opcional): Indica el contexto de la subida. Valores posibles:
  - `"trabajo-realizado"` → Enruta a subcarpetas de `trabajos-realizados/`.
  - `"qr-upload"` → Mismo comportamiento que subida normal (usa solo MIME).
  - `undefined` / cualquier otro → Enrutamiento estándar por MIME.

---

## 2. Reglas de Enrutamiento

### 2.1 Enrutamiento Estándar (por MIME type)

| Tipo MIME / Extensión | Carpeta Destino |
|-----------------------|-----------------|
| `image/*`, `.jpg`, `.jpeg`, `.png`, `.webp` | `/img` |
| `audio/*`, `.mp3`, `.wav`, `.aac`, `.ogg`, `.oga`, `.opus`, `.amr`, `.caf`, `.3gp`, `.3gpp`, `.m4a`, `.m4r`, `.mp4` (con audio mime) | `/.mp3` |
| `text/markdown`, `.md` | `/.md` |
| `application/pdf`, `.pdf` | `/.pdf` |
| `text/plain`, `.txt` | `/.txt` |

### 2.2 Enrutamiento para Trabajos Realizados (`sourceType = "trabajo-realizado"`)

| Tipo de Archivo | Carpeta Destino |
|-----------------|-----------------|
| Imagen (`image/*`) | `trabajos-realizados/fotos` |
| Video (`video/*`) | `trabajos-realizados/videos` |
| Cualquier otro tipo | `trabajos-realizados/documentos` |

### 2.3 Enrutamiento para QR Upload (`sourceType = "qr-upload"`)

Se comporta exactamente igual que el enrutamiento estándar (sección 2.1). El `sourceType` "qr-upload" solo afecta el flujo de autenticación (token QR), no el enrutamiento en Drive.

---

## 3. Formatos de Audio Soportados

Lista completa de extensiones de audio que el sistema reconoce y enruta a `/.mp3`:

| Extensión | MIME type |
|-----------|-----------|
| `.mp3` | `audio/mpeg` |
| `.wav` | `audio/wav` |
| `.aac` | `audio/aac` |
| `.ogg` | `audio/ogg` |
| `.oga` | `audio/ogg` |
| `.opus` | `audio/opus` |
| `.amr` | `audio/amr` |
| `.caf` | `audio/x-caf` |
| `.3gp` | `audio/3gpp` |
| `.3gpp` | `audio/3gpp` |
| `.m4a` | `audio/mp4` |
| `.m4r` | `audio/mp4` |
| `.mp4` (con MIME audio) | `audio/mp4` |

> **Nota**: Los archivos `.mp4` se detectan como audio solo si su MIME type comienza con `audio/`. Si el MIME es `video/mp4`, se enrutan como video.

---

## 4. Formatos de Video Soportados

| Extensión | MIME type |
|-----------|-----------|
| `.mp4` | `video/mp4` |
| `.webm` | `video/webm` |
| `.mov` | `video/quicktime` |
| `.avi` | `video/x-msvideo` |
| `.mkv` | `video/x-matroska` |
| `.flv` | `video/x-flv` |
| `.wmv` | `video/x-ms-wmv` |
| `.m4v` | `video/x-m4v` |
| `.3gp` | `video/3gpp` |
| `.3gpp` | `video/3gpp` |

> **Nota**: Los videos no tienen una carpeta dedicada en el enrutamiento estándar actual. Si se sube un video sin `sourceType = "trabajo-realizado"`, se enruta según su MIME type a la carpeta que corresponda (actualmente no hay una carpeta `/video` definida, por lo que se usa el MIME directamente como nombre de carpeta).

---

## 5. Flujo de Enrutamiento

```
Archivo subido
    │
    ├── ¿sourceType = "trabajo-realizado"?
    │       ├── Sí → ¿image/*? → trabajos-realizados/fotos
    │       │         ¿video/*? → trabajos-realizados/videos
    │       │         otro      → trabajos-realizados/documentos
    │       └── No  → continuar con MIME
    │
    ├── ¿image/*?           → /img
    ├── ¿audio/*?           → /.mp3
    ├── ¿text/markdown?     → /.md
    ├── ¿application/pdf?   → /.pdf
    ├── ¿text/plain?        → /.txt
    └── otro                → /{mimeType} (fallback)
```

---

## 6. Implementación

### 6.1 `getSubfolderName()` en [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts)

```typescript
function getSubfolderName(fileName: string, mimeType: string, sourceType?: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // Trabajos realizados routing
  if (sourceType === "trabajo-realizado") {
    if (mimeType.startsWith("image/")) return "trabajos-realizados/fotos";
    if (mimeType.startsWith("video/")) return "trabajos-realizados/videos";
    return "trabajos-realizados/documentos";
  }

  // Standard MIME routing
  if (mimeType.startsWith("image/")) return "img";
  if (mimeType.startsWith("audio/")) return ".mp3";
  if (mimeType === "text/markdown" || ext === "md") return ".md";
  if (mimeType === "application/pdf" || ext === "pdf") return ".pdf";
  if (mimeType === "text/plain" || ext === "txt") return ".txt";

  return mimeType.replace("/", "-");
}
```

### 6.2 `ensureSubfolder()` en [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts)

Busca la subcarpeta dentro de `GOOGLE_DRIVE_ROOT_FOLDER_ID`. Si no existe, la crea.

```typescript
async function ensureSubfolder(subfolderName: string): Promise<string> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;
  // Busca carpeta por nombre dentro de rootId
  // Si no existe, la crea con mimeType: "application/vnd.google-apps.folder"
  // Retorna el ID de la carpeta
}
```

### 6.3 `uploadToMasterDrive()` en [`googleDriveBrainStorage.ts`](../../src/app/lib/googleDriveBrainStorage.ts)

Función principal que orquesta el enrutamiento y la subida:

```typescript
export async function uploadToMasterDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  sourceType?: string
): Promise<DriveUploadResult> {
  const subfolderName = getSubfolderName(fileName, mimeType, sourceType);
  const parentId = await ensureSubfolder(subfolderName);
  const driveResult = await uploadFileToDrive(fileName, mimeType, buffer, parentId);
  return driveResult;
}
```

---

## 7. Storage Index (Mapeo Local)

Además del enrutamiento en Drive, el sistema mantiene un índice local en [`store.ts`](../../src/app/api/brain-admin/store.ts) que clasifica los archivos para la UI de almacenamiento:

| Tipo MIME / Extensión | Clave en Storage Index |
|-----------------------|----------------------|
| `image/*` | `image` |
| `video/*` | `video` |
| `audio/*` | `audio` |
| `application/pdf` | `pdf` |
| `text/plain`, `.txt` | `text` |
| `text/markdown`, `.md` | `markdown` |

**Funciones**:
- [`getStorageFolder()`](../../src/app/api/brain-admin/store.ts) → Determina la carpeta lógica para el Storage Index.
- [`getStorageTypeKey()`](../../src/app/api/brain-admin/store.ts) → Determina la clave de tipo para el desglose `byType`.

---

## 8. Notas para Implementación Futura

- Agregar carpeta `/video` para enrutamiento estándar de videos.
- Agregar carpeta `/documentos` para documentos generales (PDF, DOCX, etc.).
- Considerar enrutamiento por `sourceType = "cliente"` para archivos compartidos por clientes.
- Evaluar la necesidad de subcarpetas por fecha (`/img/2026/05/`) para mejor organización.
