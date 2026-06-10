/**
 * googleDriveBrainStorage.ts
 *
 * OAuth 2.0 Google Drive integration for SendMe Studio Master Drive.
 * Uses a Master Admin Google account (OAuth) instead of Service Account.
 *
 * The refresh token is obtained once via the OAuth flow (/api/google-drive/callback)
 * and stored in data/business-brain/drive-oauth.json for reuse.
 *
 * Env vars:
 *   GOOGLE_DRIVE_ENABLED       — "true" to enable Drive uploads
 *   GOOGLE_CLIENT_ID           — OAuth client ID
 *   GOOGLE_CLIENT_SECRET       — OAuth client secret
 *   GOOGLE_REDIRECT_URI        — OAuth redirect URI (e.g. http://localhost:3000/api/google-drive/callback)
 *   GOOGLE_DRIVE_ROOT_FOLDER_ID — Root folder ID (client folder, e.g. MaiteGuerra.cl)
 */

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriveUploadResult = {
  fileId: string | null;
  folderPath: string;
  error: string | null;
};

export type DriveStatus = {
  enabled: boolean;
  connected: boolean;
  clientEmail: string;
  rootFolderId: string;
  lastUploadedFile: string;
  lastUploadedAt: string;
  lastUploadError: string;
  destinationFolder: string;
};

type OAuthTokenStore = {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
};

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const dataBrainRoot = path.join(process.cwd(), "data", "business-brain");
const oauthTokenPath = path.join(dataBrainRoot, "drive-oauth.json");

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || "";
}

function getClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || "";
}

function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google-drive/callback";
}

function getRootFolderId(): string {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
}

// ---------------------------------------------------------------------------
// isDriveEnabled
// ---------------------------------------------------------------------------

export function isDriveEnabled(): boolean {
  if (process.env.GOOGLE_DRIVE_ENABLED !== "true") {
    return false;
  }
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const rootFolderId = getRootFolderId();
  return Boolean(clientId && clientSecret && rootFolderId);
}

// ---------------------------------------------------------------------------
// OAuth Token Storage
// ---------------------------------------------------------------------------

async function readOAuthTokens(): Promise<OAuthTokenStore | null> {
  try {
    const content = await fs.readFile(oauthTokenPath, "utf8");
    return JSON.parse(content) as OAuthTokenStore;
  } catch {
    return null;
  }
}

async function writeOAuthTokens(tokens: OAuthTokenStore): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  await fs.writeFile(oauthTokenPath, JSON.stringify(tokens, null, 2));
}

// ---------------------------------------------------------------------------
// OAuth Token Acquisition (Refresh Token flow)
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for tokens (used in /api/google-drive/callback).
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} — ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!data.refresh_token) {
    throw new Error(
      "No refresh_token returned. Ensure the OAuth consent screen includes the 'offline' access type " +
      "and the prompt=consent parameter is used on first authorization."
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Store OAuth tokens after successful code exchange.
 */
export async function storeOAuthTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
  await writeOAuthTokens({
    refreshToken,
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  });
}

/**
 * Get a valid access token — refresh if expired.
 */
async function getAccessToken(): Promise<string> {
  const stored = await readOAuthTokens();

  if (!stored) {
    throw new Error(
      "Google Drive no conectado. Un administrador debe conectar la cuenta de Google " +
      "desde /api/google-drive/auth"
    );
  }

  // If token is still valid (5 min buffer), return it
  if (stored.accessToken && stored.expiresAt > Date.now() + 5 * 60 * 1000) {
    return stored.accessToken;
  }

  // Refresh the token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: stored.refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token: ${response.status} — ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  // Update stored tokens
  await writeOAuthTokens({
    refreshToken: stored.refreshToken,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Drive API helpers
// ---------------------------------------------------------------------------

/**
 * Append supportsAllDrives=true to a URL if not already present.
 */
function ensureSupportsAllDrives(url: string): string {
  return url.includes("supportsAllDrives=") ? url : `${url}${url.includes("?") ? "&" : "?"}supportsAllDrives=true`;
}

async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(ensureSupportsAllDrives(url), {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
  });
}

// ---------------------------------------------------------------------------
// Folder operations
// ---------------------------------------------------------------------------

export async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
  // Search for existing folder (include items from all drives for shared folders)
  let q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  const query = encodeURIComponent(q);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&includeItemsFromAllDrives=true`;

  const searchRes = await driveFetch(searchUrl, { cache: "no-store" });

  if (searchRes.ok) {
    const searchData = (await searchRes.json()) as { files?: { id: string }[] };
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createBody: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    createBody.parents = [parentId];
  }

  const createRes = await driveFetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Error creating folder '${name}': ${createRes.status} — ${errorText}`);
  }

  const createData = (await createRes.json()) as { id: string };
  return createData.id;
}

// ---------------------------------------------------------------------------
// Folder mapping
// ---------------------------------------------------------------------------

function getSubfolderName(fileName: string, mimeType: string, sourceType?: string): string {
  const ext = path.extname(fileName).toLowerCase();

  // Work uploads ("trabajo realizado") route to trabajos-realizados/ subfolders
  if (sourceType === "trabajo-realizado") {
    if (mimeType.startsWith("video/") || [".mp4", ".mov", ".m4v", ".webm", ".3gp", ".hevc"].includes(ext)) {
      return "trabajos-realizados/videos";
    }
    if (mimeType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return "trabajos-realizados/fotos";
    }
    return "trabajos-realizados/documentos";
  }

  // Images
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext) || mimeType.startsWith("image/")) {
    return "img";
  }
  // Audio — all mobile/exported audio formats route to /.mp3
  const audioExts = [
    ".mp3", ".wav", ".m4a", ".webm",
    ".aac", ".ogg", ".oga", ".opus", ".amr",
    ".caf", ".3gp", ".3gpp", ".m4r",
  ];
  const audioMimes = [
    "audio/",
    "audio/aac", "audio/ogg", "audio/opus", "audio/amr",
    "audio/3gpp", "audio/x-caf", "audio/mp4", "audio/x-m4a",
    "audio/mpeg", "audio/wav", "audio/webm",
  ];
  if (
    audioExts.includes(ext) ||
    audioMimes.some((m) => mimeType.startsWith(m) || mimeType === m) ||
    (ext === ".mp4" && mimeType.startsWith("audio/"))
  ) {
    return ".mp3";
  }
  // Markdown
  if (ext === ".md" || mimeType === "text/markdown") {
    return ".md";
  }
  // PDF
  if (ext === ".pdf" || mimeType === "application/pdf") {
    return ".pdf";
  }
  // TXT (default for text and unknown)
  return ".txt";
}

// ---------------------------------------------------------------------------
// Upload file to Drive — Resumable upload
// ---------------------------------------------------------------------------

async function uploadFileToDrive(
  name: string,
  mimeType: string,
  content: Buffer,
  parentId: string
): Promise<string> {
  const metadata = {
    name,
    parents: [parentId],
  };

  // Step 1: Create resumable upload session
  const sessionUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true";
  const sessionRes = await driveFetch(sessionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType,
      "X-Upload-Content-Length": String(content.length),
    },
    body: JSON.stringify(metadata),
  });

  if (!sessionRes.ok) {
    const errorText = await sessionRes.text();
    throw new Error(`Error creating upload session for '${name}': ${sessionRes.status} — ${errorText}`);
  }

  // Step 2: Read the Location header
  const location = sessionRes.headers.get("Location");
  if (!location) {
    throw new Error(`No Location header returned for resumable upload session of '${name}'`);
  }

  console.log(`[googleDriveBrainStorage] Resumable session created, uploading ${content.length} bytes...`);

  // Step 3: PUT the raw binary content to the session URI
  const uploadRes = await fetch(location, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(content.length),
    },
    body: new Uint8Array(content),
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Error uploading file content '${name}': ${uploadRes.status} — ${errorText}`);
  }

  // Step 4: Parse the response for the file ID
  const uploadData = (await uploadRes.json()) as { id: string };
  return uploadData.id;
}

// ---------------------------------------------------------------------------
// Ensure subfolder exists directly under root folder
// ---------------------------------------------------------------------------

async function ensureSubfolder(subfolderName: string): Promise<string> {
  const configuredRootId = getRootFolderId();

  if (!configuredRootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is required. It should point to the client folder (e.g., MaiteGuerra.cl).");
  }

  // The root folder IS the client folder. Just create/find the subfolder inside it.
  const subfolderId = await getOrCreateFolder(subfolderName, configuredRootId);
  return subfolderId;
}

// ---------------------------------------------------------------------------
// Sync index management
// ---------------------------------------------------------------------------

const driveIndexPath = path.join(dataBrainRoot, "drive-sync-index.json");

type DriveSyncIndex = {
  rootFolderId: string;
  rootFolderUrl: string;
  lastSyncAt: string;
  files: Record<string, unknown>;
  lastDetected: Record<string, number>;
  lastMessage: string;
  lastUploadedFile: string;
  lastUploadedAt: string;
  lastUploadError: string;
  destinationFolder: string;
};

async function readDriveIndex(): Promise<DriveSyncIndex> {
  try {
    await fs.mkdir(dataBrainRoot, { recursive: true });
    const content = await fs.readFile(driveIndexPath, "utf8");
    const parsed = JSON.parse(content);
    return {
      rootFolderId: typeof parsed.rootFolderId === "string" ? parsed.rootFolderId : "",
      rootFolderUrl: typeof parsed.rootFolderUrl === "string" ? parsed.rootFolderUrl : "",
      lastSyncAt: typeof parsed.lastSyncAt === "string" ? parsed.lastSyncAt : "",
      files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
      lastDetected: typeof parsed.lastDetected === "object" ? parsed.lastDetected : {},
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
      lastDetected: {},
      lastMessage: "Google Drive no conectado.",
      lastUploadedFile: "",
      lastUploadedAt: "",
      lastUploadError: "",
      destinationFolder: "",
    };
  }
}

async function writeDriveIndex(index: Partial<DriveSyncIndex>): Promise<void> {
  await fs.mkdir(dataBrainRoot, { recursive: true });
  const existing = await readDriveIndex();
  const merged = { ...existing, ...index };
  await fs.writeFile(driveIndexPath, JSON.stringify(merged, null, 2));
}

// ---------------------------------------------------------------------------
// Main entry point: uploadToMasterDrive
// ---------------------------------------------------------------------------

export async function uploadToMasterDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  sourceType?: string
): Promise<DriveUploadResult> {
  const result: DriveUploadResult = {
    fileId: null,
    folderPath: "",
    error: null,
  };

  // Check if Drive is enabled
  if (!isDriveEnabled()) {
    return result;
  }

  const configuredRootId = getRootFolderId();
  const subfolderName = getSubfolderName(fileName, mimeType, sourceType);
  const destinationFolder = `/${subfolderName}`;

  console.log(`[googleDriveBrainStorage] === UPLOAD TO MASTER DRIVE ===`);
  console.log(`[googleDriveBrainStorage] ROOT_FOLDER_ID (env): "${configuredRootId}"`);
  console.log(`[googleDriveBrainStorage] Subfolder name resolved: "${subfolderName}"`);
  console.log(`[googleDriveBrainStorage] Destination folder path: "${destinationFolder}"`);

  try {
    // Step 1: Resolve the real subfolder ID inside ROOT_FOLDER_ID
    const subfolderId = await ensureSubfolder(subfolderName);
    console.log(`[googleDriveBrainStorage] Resolved subfolderId: "${subfolderId}" (parent for upload)`);

    // Step 2: Upload file DIRECTLY into the resolved subfolder
    console.log(`[googleDriveBrainStorage] Upload parentId (final): "${subfolderId}"`);
    const fileId = await uploadFileToDrive(fileName, mimeType, buffer, subfolderId);

    result.fileId = fileId;
    result.folderPath = destinationFolder;

    console.log(`[googleDriveBrainStorage] ✅ Upload successful → Drive File ID: "${fileId}"`);
    console.log(`[googleDriveBrainStorage]    File: "${fileName}" → Folder: "${destinationFolder}" (${subfolderId})`);

    // Update sync index
    await writeDriveIndex({
      lastUploadedFile: fileName,
      lastUploadedAt: new Date().toISOString(),
      lastUploadError: "",
      destinationFolder,
      lastMessage: `Uploaded ${fileName} → ${destinationFolder}`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Drive upload error";
    result.error = errorMessage;

    console.error(`[googleDriveBrainStorage] ❌ Upload failed for '${fileName}': ${errorMessage}`);

    // Update sync index with error
    await writeDriveIndex({
      lastUploadError: errorMessage,
      destinationFolder,
      lastMessage: `Upload failed: ${errorMessage}`,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getDriveStatus
// ---------------------------------------------------------------------------

export async function getDriveStatus(): Promise<DriveStatus> {
  const enabled = isDriveEnabled();
  const index = await readDriveIndex();

  let connected = false;
  if (enabled) {
    try {
      await getAccessToken();
      connected = true;
    } catch {
      connected = false;
    }
  }

  return {
    enabled,
    connected,
    clientEmail: "OAuth Master Account",
    rootFolderId: getRootFolderId() || index.rootFolderId,
    lastUploadedFile: index.lastUploadedFile,
    lastUploadedAt: index.lastUploadedAt,
    lastUploadError: index.lastUploadError,
    destinationFolder: index.destinationFolder,
  };
}

// ---------------------------------------------------------------------------
// getAccessTokenForExternalUse (for sync operations in store.ts)
// ---------------------------------------------------------------------------

export async function getDriveAccessToken(): Promise<string> {
  return getAccessToken();
}

// ---------------------------------------------------------------------------
// OAuth URL builder (for /api/google-drive/auth)
// ---------------------------------------------------------------------------

export function getOAuthAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Check if OAuth tokens exist (for /api/google-drive/status)
// ---------------------------------------------------------------------------

export async function hasOAuthTokens(): Promise<boolean> {
  const stored = await readOAuthTokens();
  return stored !== null && Boolean(stored.refreshToken);
}
