import { promises as fs } from "fs";
import path from "path";
import { matchTextToServices, normalizeSearchText } from "../../lib/serviceMatcher";
import {
  isDriveEnabled,
  uploadToMasterDrive,
  getDriveStatus as getServiceDriveStatus,
  getDriveAccessToken,
  getOrCreateFolder,
} from "../../lib/googleDriveBrainStorage";

export type BrainUploadRecord = {
  id: string;
  originalName: string;
  storedPath: string;
  sourceType: string;
  notes: string;
  uploadedAt: string;
  extracted: BrainExtraction;
};

export type BrainExtraction = {
  emotions: string[];
  objections: string[];
  bookingIntent: string;
  leadWarmth: "cold" | "warm" | "hot";
  hesitation: string[];
  serviceDemand: string[];
  emotionalTriggers: string[];
  successfulClosings: string[];
  frequentlyAskedQuestions: string[];
  upsellOpportunities: string[];
  conversionPatterns: string[];
  toneSignals: string[];
  visionPending: boolean;
};

export type BrainSuggestion = {
  id: string;
  title: string;
  category: string;
  impact: number;
  status: "pending" | "applied" | "dismissed";
  createdAt: string;
  source: "voice" | "drive";
  transcriptPath: string;
};

export type DriveBrainConfig = {
  rootFolderId: string;
  rootFolderUrl: string;
  connectedAt: string;
};

export type DriveSyncFile = {
  fileId: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  type: "image" | "txt" | "pdf" | "audio" | "md";
  path: string;
};

export type DriveSyncIndex = {
  rootFolderId: string;
  rootFolderUrl: string;
  lastSyncAt: string;
  files: Record<string, DriveSyncFile>;
  lastDetected: Record<DriveSyncFile["type"], number>;
  lastMessage: string;
  lastUploadedFile: string;
  lastUploadedAt: string;
  lastUploadError: string;
  destinationFolder: string;
};

// ---------------------------------------------------------------------------
// Storage index — tracks file metadata for quota & usage stats
// ---------------------------------------------------------------------------

export type StorageFileEntry = {
  filename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  folder: string;
  uploadedAt: string;
  driveFileId: string | null;
  source: string;
};

export type StorageIndex = {
  files: StorageFileEntry[];
  totalBytes: number;
  totalFiles: number;
  byType: {
    image: { bytes: number; files: number; lastUploadedAt: string };
    video: { bytes: number; files: number; lastUploadedAt: string };
    audio: { bytes: number; files: number; lastUploadedAt: string };
    pdf: { bytes: number; files: number; lastUploadedAt: string };
    text: { bytes: number; files: number; lastUploadedAt: string };
    markdown: { bytes: number; files: number; lastUploadedAt: string };
  };
};

// ---------------------------------------------------------------------------
// Brain Learning System — new data types & storage for "Sistema de aprendizaje del negocio"
// ---------------------------------------------------------------------------

export type BrainLearningSignal = {
  id: string;
  category: "conversation" | "service" | "objection" | "price" | "campaign" | "tone" | "satisfaction" | "talent";
  title: string;
  impact: number; // 0-100
  status: "new" | "applied" | "pending";
  createdAt: string;
  source: string;
};

export type BrainTalentEntry = {
  name: string;
  strengths: string[];
  detectedAt: string;
  signals: string[];
};

export type BrainSatisfactionSignal = {
  type: "positive" | "testimonial" | "review_opportunity";
  text: string;
  source: string;
  detectedAt: string;
};

export type BrainCampaignOpportunity = {
  id: string;
  title: string;
  narrative: string;
  signals: string[];
  impact: number;
  status: "new" | "active" | "completed";
};

export type BrainWorkEntry = {
  id: string;
  filename: string;
  serviceType: string;
  quality: number; // 0-100
  style: string;
  campaignPotential: boolean;
  isFeatured: boolean;
  uploadedAt: string;
  folder: string; // e.g., "trabajos-realizados/fotos", "trabajos-realizados/videos"
};

// ---------------------------------------------------------------------------
// Learning signals I/O
// ---------------------------------------------------------------------------

export async function readLearningSignals(): Promise<BrainLearningSignal[]> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "learning-signals.json"), "utf8");
    return JSON.parse(content) as BrainLearningSignal[];
  } catch {
    return [];
  }
}

export async function writeLearningSignals(signals: BrainLearningSignal[]): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "learning-signals.json"), JSON.stringify(signals, null, 2));
}

// ---------------------------------------------------------------------------
// Talent I/O
// ---------------------------------------------------------------------------

async function readTalent(): Promise<BrainTalentEntry[]> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "talent.json"), "utf8");
    return JSON.parse(content) as BrainTalentEntry[];
  } catch {
    return [];
  }
}

async function writeTalent(entries: BrainTalentEntry[]): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "talent.json"), JSON.stringify(entries, null, 2));
}

// ---------------------------------------------------------------------------
// Satisfaction I/O
// ---------------------------------------------------------------------------

async function readSatisfaction(): Promise<BrainSatisfactionSignal[]> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "satisfaction.json"), "utf8");
    return JSON.parse(content) as BrainSatisfactionSignal[];
  } catch {
    return [];
  }
}

async function writeSatisfaction(signals: BrainSatisfactionSignal[]): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "satisfaction.json"), JSON.stringify(signals, null, 2));
}

// ---------------------------------------------------------------------------
// Campaign opportunities I/O
// ---------------------------------------------------------------------------

async function readCampaigns(): Promise<BrainCampaignOpportunity[]> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "campaign-opportunities.json"), "utf8");
    return JSON.parse(content) as BrainCampaignOpportunity[];
  } catch {
    return [];
  }
}

async function writeCampaigns(opportunities: BrainCampaignOpportunity[]): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "campaign-opportunities.json"), JSON.stringify(opportunities, null, 2));
}

// ---------------------------------------------------------------------------
// Work entries I/O
// ---------------------------------------------------------------------------

async function readWorkEntries(): Promise<BrainWorkEntry[]> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "work-entries.json"), "utf8");
    return JSON.parse(content) as BrainWorkEntry[];
  } catch {
    return [];
  }
}

async function writeWorkEntries(entries: BrainWorkEntry[]): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "work-entries.json"), JSON.stringify(entries, null, 2));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getStorageFolder(mimeType: string, extension: string): string {
  const ext = extension.toLowerCase();
  if (mimeType.startsWith("image/")) return "/img";
  if (mimeType.startsWith("video/")) return "/video";
  if (mimeType.startsWith("audio/")) return "/.mp3";
  if (mimeType === "application/pdf" || ext === ".pdf") return "/.pdf";
  if (mimeType === "text/markdown" || ext === ".md") return "/.md";
  if (mimeType.startsWith("text/") || ext === ".txt") return "/.txt";
  return "/other";
}

function getStorageTypeKey(mimeType: string, extension: string): keyof StorageIndex["byType"] {
  const ext = extension.toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || ext === ".pdf") return "pdf";
  if (mimeType === "text/markdown" || ext === ".md") return "markdown";
  if (mimeType.startsWith("text/") || ext === ".txt") return "text";
  return "text";
}

async function readStorageIndex(): Promise<StorageIndex> {
  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "storage-index.json"), "utf8");
    return JSON.parse(content) as StorageIndex;
  } catch {
    return {
      files: [],
      totalBytes: 0,
      totalFiles: 0,
      byType: {
        image: { bytes: 0, files: 0, lastUploadedAt: "" },
        video: { bytes: 0, files: 0, lastUploadedAt: "" },
        audio: { bytes: 0, files: 0, lastUploadedAt: "" },
        pdf: { bytes: 0, files: 0, lastUploadedAt: "" },
        text: { bytes: 0, files: 0, lastUploadedAt: "" },
        markdown: { bytes: 0, files: 0, lastUploadedAt: "" },
      },
    };
  }
}

async function writeStorageIndex(index: StorageIndex): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(path.join(dataBrainRoot, "storage-index.json"), JSON.stringify(index, null, 2));
}

async function addToStorageIndex(
  filename: string,
  mimeType: string,
  sizeBytes: number,
  driveFileId: string | null,
  source: string
): Promise<StorageIndex> {
  const index = await readStorageIndex();
  const extension = path.extname(filename);
  const folder = getStorageFolder(mimeType, extension);
  const typeKey = getStorageTypeKey(mimeType, extension);
  const now = new Date().toISOString();

  const entry: StorageFileEntry = {
    filename,
    mimeType,
    extension,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    folder,
    uploadedAt: now,
    driveFileId,
    source,
  };

  index.files.push(entry);
  index.totalBytes += sizeBytes;
  index.totalFiles += 1;
  index.byType[typeKey].bytes += sizeBytes;
  index.byType[typeKey].files += 1;
  index.byType[typeKey].lastUploadedAt = now;

  await writeStorageIndex(index);
  return index;
}

export async function getStorageStats() {
  const index = await readStorageIndex();
  const quotaMB = Number(process.env.BRAIN_STORAGE_QUOTA_MB) || 5120;
  const quotaBytes = quotaMB * 1024 * 1024;
  const usedPercent = quotaBytes > 0 ? Math.round((index.totalBytes / quotaBytes) * 100) : 0;

  // Calculate inactivity
  const now = Date.now();
  const lastActivity = index.files.length > 0
    ? new Date(index.files[index.files.length - 1].uploadedAt).getTime()
    : 0;
  const daysSinceLastUpload = lastActivity > 0 ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)) : -1;

  let inactivityLevel: "active" | "attention" | "warning" | "danger" = "active";
  if (daysSinceLastUpload >= 15) inactivityLevel = "danger";
  else if (daysSinceLastUpload >= 8) inactivityLevel = "warning";
  else if (daysSinceLastUpload >= 4) inactivityLevel = "attention";

  return {
    totalBytes: index.totalBytes,
    totalFiles: index.totalFiles,
    totalFormatted: formatBytes(index.totalBytes),
    quotaBytes,
    quotaFormatted: formatBytes(quotaBytes),
    quotaMB,
    usedPercent: Math.min(usedPercent, 100),
    byType: index.byType,
    lastUploadedAt: index.files.length > 0 ? index.files[index.files.length - 1].uploadedAt : null,
    lastUploadedFile: index.files.length > 0 ? index.files[index.files.length - 1].filename : null,
    lastUploadedFolder: index.files.length > 0 ? index.files[index.files.length - 1].folder : null,
    daysSinceLastUpload,
    inactivityLevel,
    files: index.files.slice(-20).reverse(), // last 20 entries
  };
}

const brainRoot = path.join(process.cwd(), "business-brain");
const dataBrainRoot = path.join(process.cwd(), "data", "business-brain");
const folders = [
  "raw-conversations",
  "emotion-patterns",
  "campaign-analysis",
  "service-intents",
  "upsell-patterns",
  "closing-techniques",
  "brand-tone",
  "faq-evolution",
  "high-converting-replies",
];

const serviceSources = [
  { id: "balayage", keywords: ["balayage", "mechas", "rubios", "reflejos", "claritos", "babylights"] },
  { id: "coloracion-completa", keywords: ["color", "tinte", "raiz", "canas", "coloracion"] },
  { id: "corte-mujer", keywords: ["corte", "cortar", "puntas", "flequillo", "cambio look"] },
  { id: "brushing", keywords: ["brushing", "secado", "peinado"] },
  { id: "masajes-tratamientos-capilares", keywords: ["hidratacion", "tratamiento", "repair", "frizz", "cabello seco"] },
  { id: "alisado-organico", keywords: ["alisado", "botox", "frizz", "cabello liso"] },
  { id: "esmaltado-permanente", keywords: ["uñas", "unas", "esmaltado", "permanente"] },
  { id: "perfilado-cejas", keywords: ["cejas", "perfilado", "brows"] },
];

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function ensureBrainStorage() {
  await fs.mkdir(brainRoot, { recursive: true });
  await Promise.all(folders.map((folder) => fs.mkdir(path.join(brainRoot, folder), { recursive: true })));
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await Promise.all(["raw-voice", "transcripts", "suggestions", "drive-files", "drive-memory"].map((folder) => fs.mkdir(path.join(dataBrainRoot, folder), { recursive: true })));

  const uploadsFile = path.join(brainRoot, "uploads.json");
  const suggestionsFile = path.join(dataBrainRoot, "suggestions", "suggestions.json");
  const driveIndexFile = path.join(dataBrainRoot, "drive-sync-index.json");

  try {
    await fs.access(uploadsFile);
  } catch {
    await fs.writeFile(uploadsFile, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(suggestionsFile);
  } catch {
    await fs.writeFile(suggestionsFile, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(driveIndexFile);
  } catch {
    await fs.writeFile(driveIndexFile, JSON.stringify({
      rootFolderId: "",
      rootFolderUrl: "",
      lastSyncAt: "",
      files: {},
      lastDetected: { image: 0, txt: 0, pdf: 0, audio: 0, md: 0 },
      lastMessage: "Google Drive no conectado.",
      lastUploadedFile: "",
      lastUploadedAt: "",
      lastUploadError: "",
      destinationFolder: "",
    }, null, 2));
  }
}

async function readUploads() {
  await ensureBrainStorage();

  try {
    const content = await fs.readFile(path.join(brainRoot, "uploads.json"), "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as BrainUploadRecord[] : [];
  } catch {
    return [];
  }
}

async function writeUploads(records: BrainUploadRecord[]) {
  await ensureBrainStorage();
  await fs.writeFile(path.join(brainRoot, "uploads.json"), JSON.stringify(records, null, 2));
}

async function readSuggestions() {
  await ensureBrainStorage();

  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "suggestions", "suggestions.json"), "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as BrainSuggestion[] : [];
  } catch {
    return [];
  }
}

async function writeSuggestions(suggestions: BrainSuggestion[]) {
  await ensureBrainStorage();
  await fs.writeFile(path.join(dataBrainRoot, "suggestions", "suggestions.json"), JSON.stringify(suggestions, null, 2));
}

async function readDriveConfig(): Promise<DriveBrainConfig | null> {
  await ensureBrainStorage();

  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "drive-config.json"), "utf8");
    const parsed = JSON.parse(content);
    return typeof parsed.rootFolderId === "string" ? parsed as DriveBrainConfig : null;
  } catch {
    return null;
  }
}

async function writeDriveConfig(config: DriveBrainConfig) {
  await ensureBrainStorage();
  await fs.writeFile(path.join(dataBrainRoot, "drive-config.json"), JSON.stringify(config, null, 2));
}

async function readDriveIndex(): Promise<DriveSyncIndex> {
  await ensureBrainStorage();

  try {
    const content = await fs.readFile(path.join(dataBrainRoot, "drive-sync-index.json"), "utf8");
    const parsed = JSON.parse(content);
    return {
      rootFolderId: typeof parsed.rootFolderId === "string" ? parsed.rootFolderId : "",
      rootFolderUrl: typeof parsed.rootFolderUrl === "string" ? parsed.rootFolderUrl : "",
      lastSyncAt: typeof parsed.lastSyncAt === "string" ? parsed.lastSyncAt : "",
      files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
      lastDetected: {
        image: Number(parsed.lastDetected?.image ?? 0),
        txt: Number(parsed.lastDetected?.txt ?? 0),
        pdf: Number(parsed.lastDetected?.pdf ?? 0),
        audio: Number(parsed.lastDetected?.audio ?? 0),
        md: Number(parsed.lastDetected?.md ?? 0),
      },
      lastMessage: typeof parsed.lastMessage === "string" ? parsed.lastMessage : "",
      lastUploadedFile: typeof parsed.lastUploadedFile === "string" ? parsed.lastUploadedFile : "",
      lastUploadedAt: typeof parsed.lastUploadedAt === "string" ? parsed.lastUploadedAt : "",
      lastUploadError: typeof parsed.lastUploadError === "string" ? parsed.lastUploadError : "",
      destinationFolder: typeof parsed.destinationFolder === "string" ? parsed.destinationFolder : "",
    };
  } catch {
    return {
      rootFolderId: "",
      rootFolderUrl: "",
      lastSyncAt: "",
      files: {},
      lastDetected: { image: 0, txt: 0, pdf: 0, audio: 0, md: 0 },
      lastMessage: "Google Drive no conectado.",
      lastUploadedFile: "",
      lastUploadedAt: "",
      lastUploadError: "",
      destinationFolder: "",
    };
  }
}

async function writeDriveIndex(index: DriveSyncIndex) {
  await ensureBrainStorage();
  await fs.writeFile(path.join(dataBrainRoot, "drive-sync-index.json"), JSON.stringify(index, null, 2));
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalizeSearchText(word)));
}

function linesWith(text: string, words: string[]) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && includesAny(normalizeSearchText(line), words))
    .slice(0, 8);
}

export function extractBrainSignals(rawText: string, sourceType: string): BrainExtraction {
  const text = normalizeSearchText(rawText);
  const services = matchTextToServices(rawText, serviceSources).map((service) => service.id);
  const hasBookingIntent = includesAny(text, ["agenda", "agendar", "reserva", "reservar", "hora", "disponible", "cita"]);
  const hasPriceQuestion = includesAny(text, ["precio", "valor", "cuanto", "sale", "costo"]);
  const hasHesitation = includesAny(text, ["no se", "duda", "quizas", "caro", "despues", "lo pienso", "mas adelante"]);
  const hasPositiveClose = includesAny(text, ["gracias", "perfecto", "reservar", "confirmo", "agendado", "transferi", "voy"]);
  const isScreenshot = ["whatsapp-screenshot", "screenshot", "image"].includes(sourceType);

  return {
    emotions: unique([
      includesAny(text, ["feliz", "encanta", "emocionada", "lindo"]) ? "entusiasmo" : "",
      includesAny(text, ["miedo", "nerviosa", "no se", "duda"]) ? "inseguridad" : "",
      includesAny(text, ["urgente", "hoy", "mañana", "manana"]) ? "urgencia suave" : "",
      hasPriceQuestion ? "sensibilidad al precio" : "",
    ]),
    objections: unique([
      hasPriceQuestion ? "precio" : "",
      hasHesitation ? "duda / postergacion" : "",
      includesAny(text, ["tiempo", "demora", "cuanto dura"]) ? "duracion" : "",
      includesAny(text, ["daño", "danar", "maltratado", "quemado"]) ? "miedo a dañar el cabello" : "",
    ]),
    bookingIntent: hasBookingIntent ? "detected" : "not_detected",
    leadWarmth: hasBookingIntent || hasPositiveClose ? "hot" : services.length > 0 ? "warm" : "cold",
    hesitation: linesWith(rawText, ["no se", "quizas", "caro", "lo pienso", "duda", "mas adelante"]),
    serviceDemand: services,
    emotionalTriggers: unique([
      includesAny(text, ["natural", "sutil", "no tan", "elegante"]) ? "resultado natural y elegante" : "",
      includesAny(text, ["brillo", "luminoso", "glow"]) ? "brillo / luminosidad" : "",
      includesAny(text, ["confianza", "segura", "cambio"]) ? "confianza personal" : "",
    ]),
    successfulClosings: linesWith(rawText, ["confirmo", "agendado", "reservado", "perfecto", "te esperamos", "gracias"]),
    frequentlyAskedQuestions: linesWith(rawText, ["?", "precio", "donde", "horario", "demora", "estacionamiento"]),
    upsellOpportunities: unique([
      services.includes("balayage") ? "Gloss / Kerastase / ABC Redken despues de color" : "",
      services.includes("coloracion-completa") ? "Tratamiento repair o gloss de mantenimiento" : "",
      services.includes("brushing") ? "Tratamiento express antes del peinado" : "",
    ]),
    conversionPatterns: unique([
      hasPositiveClose ? "respuesta clara + disponibilidad + confirmacion simple" : "",
      hasBookingIntent ? "intencion de agenda despues de resolver duda principal" : "",
    ]),
    toneSignals: unique([
      includesAny(text, ["por favor", "gracias", "hola"]) ? "tono calido y educado" : "",
      includesAny(text, ["perfecto", "claro", "con gusto"]) ? "tono concierge resolutivo" : "",
    ]),
    visionPending: isScreenshot && rawText.trim().length < 40,
  };
}

function markdownList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- Sin señales suficientes todavía";
}

async function appendMemory(folder: string, fileName: string, title: string, items: string[], record: BrainUploadRecord) {
  const file = path.join(brainRoot, folder, fileName);
  const block = [
    `\n## ${title} · ${record.uploadedAt}`,
    `Source: ${record.originalName}`,
    markdownList(items),
    "",
  ].join("\n");

  await fs.appendFile(file, block);
}

async function writeLatestJson(folder: string, fileName: string, payload: unknown) {
  await fs.writeFile(path.join(brainRoot, folder, fileName), JSON.stringify(payload, null, 2));
}

export async function autoUploadToMasterDrive(fileName: string, mimeType: string, buffer: Buffer, sourceType?: string) {
  if (!isDriveEnabled()) {
    console.log("[BrainUpload] Google Drive Master no habilitado (GOOGLE_DRIVE_ENABLED=false o credenciales faltantes).");
    return null;
  }

  console.log("[BrainUpload] === INICIO SUBIDA A DRIVE MAESTRO ===");
  console.log(`[BrainUpload] Archivo detectado: "${fileName}"`);
  console.log(`[BrainUpload] MIME detectado: "${mimeType}"`);
  console.log(`[BrainUpload] Tipo de fuente: "${sourceType || "auto"}"`);

  const result = await uploadToMasterDrive(fileName, mimeType, buffer, sourceType);

  if (result.error) {
    console.log(`[BrainUpload] ❌ Error de subida: ${result.error}`);
  } else if (result.fileId) {
    console.log(`[BrainUpload] ✅ Subida exitosa a Drive`);
    console.log(`[BrainUpload]    → Carpeta destino: ${result.folderPath}`);
    console.log(`[BrainUpload]    → Drive File ID: ${result.fileId}`);
  }
  console.log("[BrainUpload] === FIN SUBIDA A DRIVE MAESTRO ===");

  return result;
}

export async function saveBrainUpload(file: File, sourceType: string, notes: string) {
  await ensureBrainStorage();

  const uploadedAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const extension = path.extname(file.name).toLowerCase();
  const storedName = `${uploadedAt.replace(/[:.]/g, "-")}-${id}-${safeFileName(file.name || "source")}`;
  const storedPath = path.join(brainRoot, "raw-conversations", storedName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(storedPath, bytes);

  const canReadText = [".txt", ".md", ".csv", ".json"].includes(extension) || file.type.startsWith("text/");
  const extractedText = canReadText ? bytes.toString("utf8") : notes;
  const extracted = extractBrainSignals(extractedText, sourceType);
  const record: BrainUploadRecord = {
    id,
    originalName: file.name,
    storedPath,
    sourceType,
    notes,
    uploadedAt,
    extracted,
  };
  const records = await readUploads();
  const nextRecords = [record, ...records];

  await writeUploads(nextRecords);
  await appendMemory("emotion-patterns", "emotion-patterns.md", "Emotion patterns", extracted.emotions, record);
  await appendMemory("closing-techniques", "closing-techniques.md", "Closing techniques", extracted.successfulClosings, record);
  await appendMemory("brand-tone", "brand-tone.md", "Brand tone signals", extracted.toneSignals, record);
  await appendMemory("faq-evolution", "faq-evolution.md", "FAQ evolution", extracted.frequentlyAskedQuestions, record);
  await appendMemory("upsell-patterns", "upsell-patterns.md", "Upsell opportunities", extracted.upsellOpportunities, record);
  await appendMemory("service-intents", "service-intents.md", "Service demand", extracted.serviceDemand, record);
  await appendMemory("campaign-analysis", "campaign-analysis.md", "Conversion patterns", extracted.conversionPatterns, record);
  await appendMemory("high-converting-replies", "high-converting-replies.md", "High converting replies", extracted.successfulClosings, record);
  await writeLatestJson("emotion-patterns", "patterns.json", nextRecords.map((item) => item.extracted.emotions).flat());
  await writeLatestJson("service-intents", "intents.json", nextRecords.map((item) => item.extracted.serviceDemand).flat());
  await writeLatestJson("campaign-analysis", "latest-summary.json", brainSummaryFromRecords(nextRecords));

  // Auto-upload to master Google Drive folder (pass sourceType for work folder routing)
  const driveResult = await autoUploadToMasterDrive(file.name, file.type || "application/octet-stream", bytes, sourceType);

  // Record in storage index for quota tracking
  const storageIndex = await addToStorageIndex(
    file.name,
    file.type || "application/octet-stream",
    bytes.length,
    driveResult?.fileId ?? null,
    sourceType
  );

  // Create memory-log.md entry for the Emotional Business Brain
  const emotionSummary = extracted.emotions.length > 0
    ? extracted.emotions.join(", ")
    : "No se detectaron señales emocionales suficientes";
  const serviceSummary = extracted.serviceDemand.length > 0
    ? extracted.serviceDemand.join(", ")
    : "No detectado";
  const insightSummary = extracted.conversionPatterns.length > 0
    ? extracted.conversionPatterns.join(", ")
    : "Aprendizaje en progreso — se necesitan más fuentes para generar patrones";

  const memoryLogPath = path.join(brainRoot, "memory-log.md");
  const memoryEntry = [
    "",
    `## Nueva memoria detectada`,
    `**Fecha:** ${new Date(uploadedAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}`,
    `**Tipo:** ${sourceType}`,
    `**Cliente:** ${process.env.CLIENT_ID || process.env.WORKSPACE_SLUG || "sendmestudio.cl"}`,
    `**Emoción detectada:** ${emotionSummary}`,
    `**Resumen:** ${extractedText.slice(0, 300)}${extractedText.length > 300 ? "..." : ""}`,
    `**Insights:** ${insightSummary}`,
    `**Temperatura:** ${extracted.leadWarmth === "hot" ? "🔥 Caliente" : extracted.leadWarmth === "warm" ? "🌤️ Tibia" : "❄️ Fría"}`,
    `**Acción sugerida:** ${extracted.bookingIntent === "detected"
      ? "Responder con claridad, proponer horarios concretos y confirmar el siguiente paso sin presión."
      : extracted.serviceDemand.length > 0
        ? "Convertir la duda en una respuesta concierge breve, cálida y orientada a resolver."
        : "Observar si este patrón se repite antes de convertirlo en aprendizaje."}`,
    "",
    `---`,
    "",
  ].join("\n");

  await fs.appendFile(memoryLogPath, memoryEntry);

  console.log(`[BrainUpload] ✅ Memoria registrada en business-brain/memory-log.md`);

  return {
    record,
    drive: driveResult
      ? {
          uploaded: Boolean(driveResult.fileId),
          fileId: driveResult.fileId,
          folderPath: driveResult.folderPath,
          error: driveResult.error,
        }
      : { uploaded: false, fileId: null, folderPath: "", error: null },
    memoryLogPath,
  };
}

function voiceLearningFileName(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `voice-learning-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}.md`;
}

function summarizeIssue(transcript: string, extraction: BrainExtraction) {
  if (extraction.objections.includes("precio")) {
    return "Confusión o sensibilidad sobre precio detectada en atención.";
  }

  if (extraction.bookingIntent === "detected") {
    return "Oportunidad de reserva que requiere respuesta clara y rápida.";
  }

  if (extraction.serviceDemand.length > 0) {
    return "Duda de servicio que puede mejorar con una respuesta más guiada.";
  }

  return transcript.split(/[.!?]/)[0]?.trim() || "Aprendizaje operativo del salón registrado por voz.";
}

function generateVoiceSuggestions(transcript: string, extraction: BrainExtraction, transcriptPath: string, createdAt: string): BrainSuggestion[] {
  const service = extraction.serviceDemand[0] ?? "concierge";
  const issue = summarizeIssue(transcript, extraction);
  const baseImpact = extraction.leadWarmth === "hot" ? 34 : extraction.leadWarmth === "warm" ? 26 : 18;

  return [
    {
      id: crypto.randomUUID(),
      title: `Mejorar respuesta de ${service}`,
      category: "Inbox",
      impact: baseImpact,
      status: "pending",
      createdAt,
      source: "voice",
      transcriptPath,
    },
    {
      id: crypto.randomUUID(),
      title: issue,
      category: "Knowledge",
      impact: Math.max(16, baseImpact - 4),
      status: "pending",
      createdAt,
      source: "voice",
      transcriptPath,
    },
    {
      id: crypto.randomUUID(),
      title: "Convertir aprendizaje diario en insight de campaña",
      category: "Campaigns",
      impact: Math.max(14, baseImpact - 8),
      status: "pending",
      createdAt,
      source: "voice",
      transcriptPath,
    },
  ];
}

function generateDriveSuggestions(file: DriveSyncFile, transcriptPath: string, createdAt: string): BrainSuggestion[] {
  const categoryByType: Record<DriveSyncFile["type"], string> = {
    image: "Screenshot learning",
    txt: "Knowledge",
    pdf: "Documentos",
    audio: "Voz",
    md: "Memory",
  };

  return [
    {
      id: crypto.randomUUID(),
      title: `Procesar aprendizaje desde ${file.name}`,
      category: categoryByType[file.type],
      impact: file.type === "md" || file.type === "txt" ? 28 : 18,
      status: "pending",
      createdAt,
      source: "drive",
      transcriptPath,
    },
  ];
}

function voiceMarkdown(transcript: string, extraction: BrainExtraction, createdAt: string) {
  const serviceAffected = extraction.serviceDemand[0] ?? "No detectado";
  const detectedIssue = summarizeIssue(transcript, extraction);

  return [
    `# Voice learning · ${createdAt}`,
    "",
    `date: ${createdAt}`,
    "source: voice note",
    "",
    "## Original transcript",
    transcript,
    "",
    "## Detected issue",
    detectedIssue,
    "",
    "## Service affected",
    serviceAffected,
    "",
    "## Customer concern",
    markdownList(extraction.objections),
    "",
    "## Emotional pattern",
    markdownList(extraction.emotions),
    "",
    "## Recommended action",
    extraction.bookingIntent === "detected"
      ? "Responder con claridad, proponer horarios concretos y confirmar el siguiente paso sin presión."
      : "Convertir la duda en una respuesta concierge breve, cálida y orientada a resolver.",
    "",
    "## Campaign insight",
    extraction.serviceDemand.length > 0
      ? `Crear mensajes educativos suaves para ${extraction.serviceDemand.join(", ")}.`
      : "Observar si este patrón se repite antes de convertirlo en campaña.",
    "",
    "## Inbox reply improvement",
    extraction.toneSignals.length > 0
      ? `Mantener ${extraction.toneSignals.join(", ")} y cerrar con una pregunta simple.`
      : "Usar tono cálido, directo y con una pregunta final accionable.",
    "",
    "## Knowledge update suggestion",
    extraction.frequentlyAskedQuestions.length > 0
      ? "Agregar esta pregunta frecuente a Knowledge Base si vuelve a aparecer."
      : "Revisar si este aprendizaje requiere nueva regla o FAQ.",
    "",
    "## Implementation status",
    "pending",
    "",
  ].join("\n");
}

export async function saveVoiceBrainLearning(audioFile: File | null, transcript: string) {
  await ensureBrainStorage();

  const createdAt = new Date();
  const uploadedAt = createdAt.toISOString();
  const id = crypto.randomUUID();
  const markdownName = voiceLearningFileName(createdAt);
  const transcriptPath = path.join(dataBrainRoot, "transcripts", markdownName);
  const extraction = extractBrainSignals(transcript, "voice-transcript");

  let audioPath = "";

  if (audioFile) {
    const extension = path.extname(audioFile.name) || ".webm";
    audioPath = path.join(dataBrainRoot, "raw-voice", `${markdownName.replace(".md", "")}-${id}${extension}`);
    const audioBytes = Buffer.from(await audioFile.arrayBuffer());
    await fs.writeFile(audioPath, audioBytes);
    
    // Auto-upload the audio file
    const audioDriveResult = await autoUploadToMasterDrive(audioFile.name || `${markdownName.replace(".md", "")}${extension}`, audioFile.type || "audio/webm", audioBytes);

    // Record audio in storage index
    await addToStorageIndex(
      audioFile.name || `${markdownName.replace(".md", "")}${extension}`,
      audioFile.type || "audio/webm",
      audioBytes.length,
      audioDriveResult?.fileId ?? null,
      "voice"
    );
  }

  const transcriptContent = voiceMarkdown(transcript, extraction, uploadedAt);
  await fs.writeFile(transcriptPath, transcriptContent);

  // Auto-upload the transcript markdown file
  const transcriptDriveResult = await autoUploadToMasterDrive(markdownName, "text/markdown", Buffer.from(transcriptContent, "utf8"));

  // Record transcript in storage index
  await addToStorageIndex(
    markdownName,
    "text/markdown",
    Buffer.from(transcriptContent, "utf8").length,
    transcriptDriveResult?.fileId ?? null,
    "voice"
  );

  const suggestions = generateVoiceSuggestions(transcript, extraction, transcriptPath, uploadedAt);
  const existingSuggestions = await readSuggestions();
  await writeSuggestions([...suggestions, ...existingSuggestions]);

  const record: BrainUploadRecord = {
    id,
    originalName: markdownName,
    storedPath: audioPath || transcriptPath,
    sourceType: "voice-transcript",
    notes: transcript,
    uploadedAt,
    extracted: extraction,
  };
  const records = await readUploads();
  const nextRecords = [record, ...records];

  await writeUploads(nextRecords);
  await appendMemory("emotion-patterns", "emotion-patterns.md", "Voice emotion patterns", extraction.emotions, record);
  await appendMemory("service-intents", "service-intents.md", "Voice service demand", extraction.serviceDemand, record);
  await appendMemory("campaign-analysis", "campaign-analysis.md", "Voice campaign insights", extraction.conversionPatterns, record);
  await writeLatestJson("campaign-analysis", "latest-summary.json", await brainSummaryFromRecords(nextRecords));

  return { record, suggestions };
}

export async function updateBrainSuggestionStatus(id: string, status: BrainSuggestion["status"]) {
  const suggestions = await readSuggestions();
  const nextSuggestions = suggestions.map((suggestion) =>
    suggestion.id === id ? { ...suggestion, status } : suggestion
  );
  await writeSuggestions(nextSuggestions);
  return nextSuggestions;
}

export function extractGoogleDriveFolderId(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  return folderMatch?.[1] ?? idMatch?.[1] ?? trimmed;
}

export function isBrainPlanActive() {
  return process.env.BRAIN_AI_PLAN_ACTIVE !== "false";
}

export async function saveDriveBrainConfig(rootFolderInput: string) {
  const rootFolderId = extractGoogleDriveFolderId(rootFolderInput);

  if (!rootFolderId) {
    throw new Error("Drive folder URL or ID is required.");
  }

  const existingIndex = await readDriveIndex();
  const rootFolderUrl = rootFolderInput.trim();
  const config: DriveBrainConfig = {
    rootFolderId,
    rootFolderUrl,
    connectedAt: new Date().toISOString(),
  };

  await writeDriveConfig(config);
  await writeDriveIndex({
    ...existingIndex,
    rootFolderId,
    rootFolderUrl,
    lastMessage: "Google Drive conectado. Sincroniza manualmente cuando quieras revisar contenido nuevo.",
  });

  return config;
}

async function listDriveChildren(folderId: string) {
  type DriveListResponse = {
    files?: Array<{
      id: string;
      name: string;
      mimeType: string;
      modifiedTime?: string;
    }>;
  };
  const token = await getDriveAccessToken();
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const fields = encodeURIComponent("files(id,name,mimeType,modifiedTime)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Google Drive responded ${response.status}.`);
  }
  const data = await response.json() as DriveListResponse;
  return data.files ?? [];
}

function driveTypeFromFolder(folderName: string): DriveSyncFile["type"] | null {
  const normalized = folderName.toLowerCase();
  if (normalized === "img") return "image";
  if (normalized === ".txt") return "txt";
  if (normalized === ".pdf") return "pdf";
  if (normalized === ".mp3") return "audio";
  if (normalized === ".md") return "md";
  return null;
}

function sourceTypeFromDriveType(type: DriveSyncFile["type"]) {
  const mapping: Record<DriveSyncFile["type"], string> = {
    image: "whatsapp-screenshot",
    txt: "drive-txt",
    pdf: "drive-pdf",
    audio: "voice-transcript",
    md: "drive-md",
  };
  return mapping[type];
}

async function downloadDriveFile(fileId: string) {
  const token = await getDriveAccessToken();
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar archivo Drive ${fileId}.`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function processDriveFile(file: DriveSyncFile) {
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const extension = path.extname(file.name) || `.${file.type}`;
  const safeName = `${createdAt.replace(/[:.]/g, "-")}-${id}-${safeFileName(file.name || file.fileId)}`;
  const localFilePath = path.join(dataBrainRoot, "drive-files", safeName);
  let text = `${file.name}\nTipo: ${file.type}\nOrigen: Google Drive ${file.path}`;

  try {
    const bytes = await downloadDriveFile(file.fileId);
    await fs.writeFile(localFilePath, bytes);

    if (file.type === "txt" || file.type === "md") {
      text = bytes.toString("utf8");
    } else if (file.type === "audio") {
      text = `Audio importado desde Google Drive: ${file.name}. Transcripción pendiente en flujo de voz.`;
    } else if (file.type === "pdf") {
      text = `PDF importado desde Google Drive: ${file.name}. Extracción profunda pendiente.`;
    } else if (file.type === "image") {
      text = `Imagen o screenshot importado desde Google Drive: ${file.name}. Aprendizaje visual pendiente.`;
    }
  } catch (error) {
    text = `${text}\nError de descarga: ${error instanceof Error ? error.message : "desconocido"}`;
  }

  const extraction = extractBrainSignals(text, sourceTypeFromDriveType(file.type));
  const memoryPath = path.join(dataBrainRoot, "drive-memory", `${safeName.replace(extension, "")}.md`);
  const memoryContent = [
    `# Drive learning · ${createdAt}`,
    "",
    `source: google drive`,
    `fileId: ${file.fileId}`,
    `fileName: ${file.name}`,
    `type: ${file.type}`,
    `modifiedTime: ${file.modifiedTime}`,
    "",
    "## Extracted text / notes",
    text,
    "",
    "## Service demand",
    markdownList(extraction.serviceDemand),
    "",
    "## Emotional signals",
    markdownList(extraction.emotions),
    "",
    "## Suggested next action",
    file.type === "audio"
      ? "Enviar este audio al flujo de transcripción cuando esté disponible la credencial de speech-to-text."
      : "Revisar el contenido y aplicar las sugerencias relevantes al Knowledge Base o campañas.",
    "",
  ].join("\n");
  await fs.writeFile(memoryPath, memoryContent);

  const record: BrainUploadRecord = {
    id,
    originalName: file.name,
    storedPath: localFilePath,
    sourceType: sourceTypeFromDriveType(file.type),
    notes: text,
    uploadedAt: createdAt,
    extracted: extraction,
  };
  const suggestions = generateDriveSuggestions(file, memoryPath, createdAt);

  return { record, suggestions };
}

export async function syncDriveBrainStorage() {
  await ensureBrainStorage();
  const config = await readDriveConfig();
  const existingIndex = await readDriveIndex();

  if (!isBrainPlanActive()) {
    return {
      ok: false,
      locked: true,
      message: "AI Brain plan no activo. Drive queda conectado, pero el aprendizaje está bloqueado.",
      index: existingIndex,
    };
  }

  if (!config?.rootFolderId) {
    return {
      ok: false,
      locked: false,
      message: "Conecta un folder de Google Drive antes de sincronizar.",
      index: existingIndex,
    };
  }

  if (!isDriveEnabled()) {
    const index = {
      ...existingIndex,
      rootFolderId: config.rootFolderId,
      rootFolderUrl: config.rootFolderUrl,
      lastSyncAt: new Date().toISOString(),
      lastMessage: "Google Drive Master no está habilitado o falta configuración de Service Account.",
    };
    await writeDriveIndex(index);
    return { ok: false, locked: false, message: index.lastMessage, index };
  }

  // The root folder ID already points to the client folder (e.g., MaiteGuerra.cl)
  // Subfolders (img, .txt, .pdf, .mp3, .md) are listed directly inside it.
  const targetFolderId = config.rootFolderId;

  const children = await listDriveChildren(targetFolderId);
  const foldersByType = children
    .filter((item) => item.mimeType === "application/vnd.google-apps.folder")
    .map((item) => ({ ...item, type: driveTypeFromFolder(item.name) }))
    .filter((item): item is typeof item & { type: DriveSyncFile["type"] } => Boolean(item.type));
  const detected: DriveSyncFile[] = [];

  for (const folder of foldersByType) {
    const files = await listDriveChildren(folder.id);
    for (const file of files) {
      detected.push({
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime ?? "",
        type: folder.type,
        path: `/${folder.name}/${file.name}`,
      });
    }
  }

  const newFiles = detected.filter((file) => {
    const known = existingIndex.files[file.fileId];
    return !known || known.modifiedTime !== file.modifiedTime;
  });
  const counts = { image: 0, txt: 0, pdf: 0, audio: 0, md: 0 };
  const records = await readUploads();
  const suggestions = await readSuggestions();
  const processedRecords: BrainUploadRecord[] = [];
  const processedSuggestions: BrainSuggestion[] = [];

  for (const file of newFiles) {
    counts[file.type] += 1;
    const processed = await processDriveFile(file);
    processedRecords.push(processed.record);
    processedSuggestions.push(...processed.suggestions);
  }

  if (processedRecords.length > 0) {
    const nextRecords = [...processedRecords, ...records];
    await writeUploads(nextRecords);
    await writeSuggestions([...processedSuggestions, ...suggestions]);
    await writeLatestJson("campaign-analysis", "latest-summary.json", brainSummaryFromRecords(nextRecords));
  }

  const nextIndex: DriveSyncIndex = {
    rootFolderId: config.rootFolderId,
    rootFolderUrl: config.rootFolderUrl,
    lastSyncAt: new Date().toISOString(),
    files: detected.reduce<Record<string, DriveSyncFile>>((acc, file) => {
      acc[file.fileId] = file;
      return acc;
    }, existingIndex.files),
    lastDetected: counts,
    lastMessage: newFiles.length > 0 ? "Nuevo contenido detectado." : "Sin contenido nuevo en Google Drive.",
    lastUploadedFile: existingIndex.lastUploadedFile || "",
    lastUploadedAt: existingIndex.lastUploadedAt || "",
    lastUploadError: existingIndex.lastUploadError || "",
    destinationFolder: existingIndex.destinationFolder || "",
  };
  await writeDriveIndex(nextIndex);

  return {
    ok: true,
    locked: false,
    message: nextIndex.lastMessage,
    index: nextIndex,
    newFiles: newFiles.length,
  };
}

export async function getDriveBrainStatus() {
  const config = await readDriveConfig();
  const index = await readDriveIndex();
  const serviceStatus = await getServiceDriveStatus();

  return {
    connected: Boolean(config?.rootFolderId) || serviceStatus.connected,
    enabled: serviceStatus.enabled,
    locked: !isBrainPlanActive(),
    rootFolderId: config?.rootFolderId ?? index.rootFolderId,
    rootFolderUrl: config?.rootFolderUrl ?? index.rootFolderUrl,
    lastSyncAt: index.lastSyncAt,
    lastDetected: index.lastDetected,
    lastMessage: !isBrainPlanActive()
      ? "AI Brain plan no activo."
      : index.lastMessage,
    // New fields from service
    lastUploadedFile: serviceStatus.lastUploadedFile || index.lastUploadedFile,
    lastUploadedAt: serviceStatus.lastUploadedAt || index.lastUploadedAt,
    lastUploadError: serviceStatus.lastUploadError || index.lastUploadError,
    destinationFolder: serviceStatus.destinationFolder || index.destinationFolder,
    clientEmail: serviceStatus.clientEmail,
  };
}

function percentage(value: number, max: number) {
  return Math.min(98, Math.round((value / Math.max(max, 1)) * 100));
}

function topItems(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
}

export function brainSummaryFromRecords(records: BrainUploadRecord[]) {
  const emotions = records.flatMap((record) => record.extracted.emotions);
  const services = records.flatMap((record) => record.extracted.serviceDemand);
  const closings = records.flatMap((record) => record.extracted.successfulClosings);
  const tones = records.flatMap((record) => record.extracted.toneSignals);
  const triggers = records.flatMap((record) => record.extracted.emotionalTriggers);
  const hotLeads = records.filter((record) => record.extracted.leadWarmth === "hot").length;

  // Compute unique service types detected (for "Estilo aprendido")
  const uniqueServices = [...new Set(services.filter(Boolean))];

  // Compute talent signals from records mentioning stylist/professional talent
  const talentSignals = records.filter((r) =>
    r.extracted.toneSignals.some((t) => /talento|estilista|profesional|artista/i.test(t))
  );

  // Compute positive satisfaction signals
  const satisfactionCount = records.filter((r) =>
    r.extracted.leadWarmth === "hot" || r.extracted.successfulClosings.length > 0
  ).length;

  return {
    uploadedConversations: records.length,
    premiumFeature: true,
    storage: {
      local: true,
      googleDrive: "optional_ready",
      s3: "optional_ready",
      supabase: "optional_ready",
    },
    metrics: {
      brainConfidence: percentage(records.length, 30),
      emotionalUnderstanding: percentage(emotions.length, 40),
      campaignAccuracy: percentage(closings.length + hotLeads, 24),
      conversionIntelligence: percentage(closings.length, 20),
      toneConsistency: percentage(tones.length, 30),
    },
    // New learning system metrics (no inflation)
    learningMetrics: {
      brainConfidence: Math.min(Math.round(records.length * 3.3), 100),
      estiloAprendido: Math.min(Math.round(uniqueServices.length * 10), 100),
      talentoEquipo: Math.min(Math.round(talentSignals.length * 15), 100),
      satisfaccionSocial: Math.min(Math.round(satisfactionCount * 8), 100),
      oportunidades: 0, // Will be populated from campaign-opportunities.json
    },
    topConvertingTones: topItems(tones),
    strongestEmotionalTriggers: topItems(triggers),
    serviceDemand: topItems(services),
    bestPerformingResponses: closings.slice(0, 5),
    lastUploads: records.slice(0, 6).map((record) => ({
      id: record.id,
      originalName: record.originalName,
      sourceType: record.sourceType,
      uploadedAt: record.uploadedAt,
      leadWarmth: record.extracted.leadWarmth,
      bookingIntent: record.extracted.bookingIntent,
    })),
  };
}

export async function getBrainSummary() {
  const records = await readUploads();
  const suggestions = await readSuggestions();
  const signals = await readLearningSignals();
  const talent = await readTalent();
  const satisfaction = await readSatisfaction();
  const campaigns = await readCampaigns();
  const workEntries = await readWorkEntries();

  const base = brainSummaryFromRecords(records);

  // Compute oportunidades count from campaigns
  const oportunidades = campaigns.filter((c) => c.status === "new" || c.status === "active").length;

  return {
    ...base,
    learningMetrics: {
      ...base.learningMetrics,
      oportunidades,
    },
    // New data arrays for the UI
    learningSignals: signals.slice(0, 20),
    newSignalsCount: signals.filter((s) => s.status === "new").length,
    talentEntries: talent,
    satisfactionSignals: satisfaction.slice(0, 10),
    campaignOpportunities: campaigns.filter((c) => c.status === "new" || c.status === "active").slice(0, 6),
    workEntries: workEntries.slice(0, 12),
    pendingSuggestions: suggestions.filter((suggestion) => suggestion.status === "pending").slice(0, 8),
    driveSync: await getDriveBrainStatus(),
  };
}

export async function ensureBrainReadme() {
  await ensureBrainStorage();
  const readme = path.join(brainRoot, "README.md");
  const content = [
    "# SendMe Studio Emotional Business Brain",
    "",
    "Portable, model-independent learning memory for GPT, Claude, DeepSeek, Gemini, MCP agents and local LLMs.",
    "",
    "This folder stores raw business conversations plus extracted Markdown and JSON memory.",
    "",
    "Folders:",
    ...folders.map((folder) => `- ${folder}/`),
    "- data/business-brain/raw-voice/",
    "- data/business-brain/transcripts/",
    "- data/business-brain/suggestions/",
    "",
  ].join("\n");

  try {
    await fs.access(readme);
  } catch {
    await fs.writeFile(readme, content);
  }
}

// ---------------------------------------------------------------------------
// Night Queue Engine — types & I/O for nightly processing
// ---------------------------------------------------------------------------

export type NightQueueJobType =
  | "transcribe_audio"
  | "analyze_video"
  | "extract_pdf"
  | "batch_ocr"
  | "emotional_clustering"
  | "campaign_generation"
  | "talent_analysis"
  | "social_satisfaction_analysis";

export type NightQueueStatus = "queued" | "processing" | "completed" | "failed" | "skipped";

export type NightQueueJob = {
  id: string;
  type: NightQueueJobType;
  status: NightQueueStatus;
  priority: number; // 1-10
  payload: {
    fileId: string;
    fileName: string;
    mimeType: string;
    sourceType?: string;
    uploadedAt: string;
    metadata?: Record<string, unknown>;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
};

export type NightQueueStore = {
  version: number;
  lastRun: string | null;
  queue: NightQueueJob[];
  history: NightQueueJob[];
};

const nightQueuePath = path.join(brainRoot, "night-queue");
const pendingJobsPath = path.join(nightQueuePath, "pending-jobs.json");
const completedJobsPath = path.join(nightQueuePath, "completed-jobs.json");
const failedJobsPath = path.join(nightQueuePath, "failed-jobs.json");
const nightlySummaryPath = path.join(nightQueuePath, "nightly-summary.md");

async function ensureNightQueueDirs(): Promise<void> {
  try {
    await fs.mkdir(nightQueuePath, { recursive: true });
  } catch {
    // directory exists
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureNightQueueDirs();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readPendingJobs(): Promise<NightQueueJob[]> {
  return readJsonFile<NightQueueJob[]>(pendingJobsPath, []);
}

export async function writePendingJobs(jobs: NightQueueJob[]): Promise<void> {
  await writeJsonFile(pendingJobsPath, jobs);
}

export async function readCompletedJobs(): Promise<NightQueueJob[]> {
  return readJsonFile<NightQueueJob[]>(completedJobsPath, []);
}

export async function writeCompletedJobs(jobs: NightQueueJob[]): Promise<void> {
  await writeJsonFile(completedJobsPath, jobs);
}

export async function readFailedJobs(): Promise<NightQueueJob[]> {
  return readJsonFile<NightQueueJob[]>(failedJobsPath, []);
}

export async function writeFailedJobs(jobs: NightQueueJob[]): Promise<void> {
  await writeJsonFile(failedJobsPath, jobs);
}

export async function addToNightQueue(
  type: NightQueueJobType,
  payload: NightQueueJob["payload"],
  priority: number
): Promise<NightQueueJob> {
  const jobs = await readPendingJobs();
  const job: NightQueueJob = {
    id: `nq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    status: "queued",
    priority,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  jobs.push(job);
  await writePendingJobs(jobs);
  return job;
}

/**
 * Decide if a file should go to the night queue based on size, type, and duration heuristics.
 */
export function shouldQueue(fileName: string, mimeType: string, bufferSize: number): boolean {
  // Videos always go to night queue
  if (mimeType.startsWith("video/")) return true;

  // Audios > 2 MB (~1 min in medium-quality MP3)
  if (mimeType.startsWith("audio/") && bufferSize > 2 * 1024 * 1024) return true;

  // PDFs > 5 MB
  if (mimeType === "application/pdf" && bufferSize > 5 * 1024 * 1024) return true;

  return false;
}

function getJobType(mimeType: string): NightQueueJobType {
  if (mimeType.startsWith("audio/")) return "transcribe_audio";
  if (mimeType.startsWith("video/")) return "analyze_video";
  if (mimeType === "application/pdf") return "extract_pdf";
  return "batch_ocr";
}

function getPriority(mimeType: string): number {
  if (mimeType.startsWith("audio/")) return 7;
  if (mimeType.startsWith("video/")) return 6;
  if (mimeType === "application/pdf") return 5;
  return 4;
}

/**
 * Process the night queue: run pending jobs within the configured window.
 * Max 1 heavy job active at a time.
 */
export async function processNightlyQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const pending = await readPendingJobs();
  const completed = await readCompletedJobs();
  const failed = await readFailedJobs();

  const now = new Date();
  const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3 hours window

  let processed = 0;
  let failedCount = 0;

  const heavyTypes: NightQueueJobType[] = ["transcribe_audio", "analyze_video", "extract_pdf"];
  let hasActiveHeavy = false;

  for (const job of pending) {
    if (job.status !== "queued") continue;
    if (new Date() >= endTime) break; // window exhausted

    // Max 1 heavy job at a time
    if (heavyTypes.includes(job.type)) {
      if (hasActiveHeavy) continue;
      hasActiveHeavy = true;
    }

    job.status = "processing";
    job.startedAt = new Date().toISOString();
    await writePendingJobs(pending);

    try {
      // Execute the job based on type
      await executeNightJob(job);
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      completed.push(job);
      processed++;
    } catch (error) {
      job.retryCount++;
      if (job.retryCount >= 3) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();
        failed.push(job);
        failedCount++;
      } else {
        job.status = "queued"; // retry later
      }
    }

    // Remove processed/failed from pending
    const idx = pending.findIndex((j) => j.id === job.id);
    if (idx !== -1) pending.splice(idx, 1);
  }

  await writePendingJobs(pending);
  await writeCompletedJobs(completed);
  await writeFailedJobs(failed);

  // Generate nightly summary
  await generateNightlySummary(completed, failed);

  return {
    processed,
    failed: failedCount,
    remaining: pending.filter((j) => j.status === "queued").length,
  };
}

async function executeNightJob(job: NightQueueJob): Promise<void> {
  // Placeholder — actual implementation will call transcription APIs, OCR, etc.
  // For now, we simulate processing by logging
  console.log(`[NightQueue] Processing job ${job.id}: ${job.type} — ${job.payload.fileName}`);

  // In future phases, this will:
  // - transcribe_audio: call Whisper API or external transcription
  // - analyze_video: extract audio track + transcribe
  // - extract_pdf: run PDF text extraction + OCR if needed
  // - batch_ocr: run OCR on image batches
  // - emotional_clustering: group emotional patterns
  // - campaign_generation: generate campaign suggestions
  // - talent_analysis: analyze team talent signals
  // - social_satisfaction_analysis: analyze satisfaction signals

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function generateNightlySummary(
  completed: NightQueueJob[],
  failed: NightQueueJob[]
): Promise<void> {
  await ensureNightQueueDirs();

  const today = new Date().toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [
    `# 🌙 Resumen Nocturno — ${today}`,
    "",
    `Procesados: ${completed.length} | Fallidos: ${failed.length}`,
    "",
  ];

  if (completed.length > 0) {
    lines.push("## ✅ Completados", "");
    for (const job of completed) {
      lines.push(`- **${job.type}**: ${job.payload.fileName}`);
    }
    lines.push("");
  }

  if (failed.length > 0) {
    lines.push("## ❌ Fallidos", "");
    for (const job of failed) {
      lines.push(`- **${job.type}**: ${job.payload.fileName} — ${job.error ?? "Error desconocido"}`);
    }
    lines.push("");
  }

  lines.push(`_Generado: ${new Date().toISOString()}_`, "");

  await fs.writeFile(nightlySummaryPath, lines.join("\n"), "utf-8");
}

/**
 * Get the latest nightly summary text for UI display.
 */
export async function getNightlySummary(): Promise<{
  hasSummary: boolean;
  summaryText: string;
  processedCount: number;
  failedCount: number;
}> {
  try {
    const completed = await readCompletedJobs();
    const failed = await readFailedJobs();
    const today = new Date().toISOString().slice(0, 10);

    // Only show today's results
    const todayCompleted = completed.filter((j) => j.completedAt?.startsWith(today));
    const todayFailed = failed.filter((j) => j.completedAt?.startsWith(today));

    if (todayCompleted.length === 0 && todayFailed.length === 0) {
      return { hasSummary: false, summaryText: "", processedCount: 0, failedCount: 0 };
    }

    const lines: string[] = [];
    for (const job of todayCompleted) {
      lines.push(`✓ ${job.type}: ${job.payload.fileName}`);
    }
    for (const job of todayFailed) {
      lines.push(`✗ ${job.type}: ${job.payload.fileName}`);
    }

    return {
      hasSummary: true,
      summaryText: lines.join("\n"),
      processedCount: todayCompleted.length,
      failedCount: todayFailed.length,
    };
  } catch {
    return { hasSummary: false, summaryText: "", processedCount: 0, failedCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Conversion Intelligence — metrics for business impact
// ---------------------------------------------------------------------------

export type ConversionMetrics = {
  conversionImpact: number;              // 0-100
  estimatedRevenueOpportunity: number;   // CLP
  retentionSignals: number;
  socialSatisfactionScore: number;       // 0-100
  visualCampaignPotential: number;       // 0-100
  conciergeEffectiveness: number;        // 0-100
};

const conversionMetricsPath = path.join(brainRoot, "conversion-metrics.json");

export async function readConversionMetrics(): Promise<ConversionMetrics> {
  return readJsonFile<ConversionMetrics>(conversionMetricsPath, {
    conversionImpact: 0,
    estimatedRevenueOpportunity: 0,
    retentionSignals: 0,
    socialSatisfactionScore: 0,
    visualCampaignPotential: 0,
    conciergeEffectiveness: 0,
  });
}

export async function writeConversionMetrics(metrics: ConversionMetrics): Promise<void> {
  await writeJsonFile(conversionMetricsPath, metrics);
}

export function calculateConversionMetrics(records: BrainUploadRecord[]): ConversionMetrics {
  const totalEmotions = records.reduce((sum, r) => sum + r.extracted.emotions.length, 0);
  const totalOpps = records.reduce((sum, r) => sum + r.extracted.upsellOpportunities.length, 0);
  const totalServices = records.reduce((sum, r) => sum + r.extracted.serviceDemand.length, 0);
  const totalPatterns = records.reduce((sum, r) => sum + r.extracted.conversionPatterns.length, 0);

  return {
    conversionImpact: Math.min(totalPatterns * 5, 100),
    estimatedRevenueOpportunity: totalOpps * 45000, // ~$45K CLP per opportunity detected
    retentionSignals: records.filter((r) => r.extracted.emotions.includes("satisfacción")).length,
    socialSatisfactionScore: Math.min(totalEmotions * 8, 100),
    visualCampaignPotential: Math.min(totalServices * 10, 100),
    conciergeEffectiveness: Math.min(records.length * 3, 100),
  };
}

// ---------------------------------------------------------------------------
// Brain Growth System — areas the Brain can still learn
// ---------------------------------------------------------------------------

export type GrowthArea = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "learning" | "learned";
  suggestedAt: string;
  signalsNeeded: number;
  signalsCollected: number;
};

const growthAreasPath = path.join(brainRoot, "growth-areas.json");

export async function readGrowthAreas(): Promise<GrowthArea[]> {
  return readJsonFile<GrowthArea[]>(growthAreasPath, [
    {
      id: "growth-default-001",
      title: "Servicios masculinos",
      description: "El Brain aún no ha procesado suficientes datos sobre servicios para hombres",
      status: "pending",
      suggestedAt: new Date().toISOString(),
      signalsNeeded: 5,
      signalsCollected: 0,
    },
    {
      id: "growth-default-002",
      title: "Coloración avanzada",
      description: "El Brain puede aprender más sobre técnicas de coloración avanzada",
      status: "pending",
      suggestedAt: new Date().toISOString(),
      signalsNeeded: 5,
      signalsCollected: 0,
    },
    {
      id: "growth-default-003",
      title: "Respuestas post venta",
      description: "El Brain aún no ha analizado suficientes interacciones de post venta",
      status: "pending",
      suggestedAt: new Date().toISOString(),
      signalsNeeded: 5,
      signalsCollected: 0,
    },
    {
      id: "growth-default-004",
      title: "Campañas de fidelización",
      description: "El Brain puede aprender patrones de fidelización de clientes",
      status: "pending",
      suggestedAt: new Date().toISOString(),
      signalsNeeded: 5,
      signalsCollected: 0,
    },
  ]);
}

export async function writeGrowthAreas(areas: GrowthArea[]): Promise<void> {
  await writeJsonFile(growthAreasPath, areas);
}

export function updateGrowthAreasFromRecords(
  areas: GrowthArea[],
  records: BrainUploadRecord[]
): GrowthArea[] {
  const allServiceDemand = records.flatMap((r) => r.extracted.serviceDemand);
  const allEmotionalTriggers = records.flatMap((r) => r.extracted.emotionalTriggers);
  const allConversionPatterns = records.flatMap((r) => r.extracted.conversionPatterns);
  const allToneSignals = records.flatMap((r) => r.extracted.toneSignals);

  return areas.map((area) => {
    let collected = 0;

    // Count signals that match this growth area
    switch (area.id) {
      case "growth-default-001": // Servicios masculinos
        collected = allServiceDemand.filter((s) =>
          /masculino|cabello hombre|corte hombre|barba/i.test(s)
        ).length;
        break;
      case "growth-default-002": // Coloración avanzada
        collected = allServiceDemand.filter((s) =>
          /coloración|tinte|mechas|balayage|babylight|airtouch/i.test(s)
        ).length;
        break;
      case "growth-default-003": // Respuestas post venta
        collected = [...allEmotionalTriggers, ...allConversionPatterns].filter((s) =>
          /post venta|seguimiento|reclamo|insatisfecho|devolución/i.test(s)
        ).length;
        break;
      case "growth-default-004": // Campañas de fidelización
        collected = [...allToneSignals, ...allConversionPatterns].filter((s) =>
          /fidelización|cliente recurrente|vuelve|membersía|lealtad/i.test(s)
        ).length;
        break;
    }

    const newStatus: GrowthArea["status"] =
      collected >= area.signalsNeeded ? "learned" : collected > 0 ? "learning" : "pending";

    return { ...area, signalsCollected: collected, status: newStatus };
  });
}
