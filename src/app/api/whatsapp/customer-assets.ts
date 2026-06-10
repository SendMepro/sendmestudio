import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import type { WhatsAppInternalMessage } from "./store";

export type CustomerAssetType = "image" | "audio" | "video" | "document";

export type CustomerAsset = {
  id: string;
  conversationId: string;
  phone: string;
  customerName: string;
  type: CustomerAssetType;
  mimeType: string;
  originalMediaId: string;
  localPath: string | null;
  publicUrl: string | null;
  caption: string | null;
  receivedAt: string;
  source: "whatsapp";
  tags: string[];
  usageFlags: {
    diagnosis: boolean;
    campaignCandidate: boolean;
    beforeAfterCandidate: boolean;
  };
  rawMetaPayload: unknown;
  error?: {
    message: string;
    statusCode?: number;
    metaResponse?: unknown;
  };
};

type WhatsAppMediaMetadata = {
  url?: string;
  mime_type?: string;
  id?: string;
  file_size?: number;
  sha256?: string;
};

const assetsRoot = path.join(process.cwd(), "data", "customer-assets");
const assetsIndexFile = path.join(assetsRoot, "assets-index.json");

function graphApiVersion() {
  return process.env.WHATSAPP_GRAPH_API_VERSION || "v25.0";
}

function accessToken() {
  return process.env.WHATSAPP_ACCESS_TOKEN;
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function folderFor(type: CustomerAssetType) {
  if (type === "image") {
    return "images";
  }

  if (type === "document") {
    return "documents";
  }

  return type;
}

function extensionFor(mimeType: string, type: CustomerAssetType) {
  const extensionByMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "video/mp4": "mp4",
    "application/pdf": "pdf",
  };

  return extensionByMime[mimeType] ?? (type === "document" ? "bin" : type);
}

function receivedAtFor(timestamp: string) {
  const numericTimestamp = Number(timestamp);

  if (Number.isFinite(numericTimestamp) && numericTimestamp > 0) {
    return new Date(numericTimestamp * 1000).toISOString();
  }

  return new Date().toISOString();
}

async function ensureAssetsIndex() {
  await fs.mkdir(assetsRoot, { recursive: true });

  try {
    await fs.access(assetsIndexFile);
  } catch {
    await fs.writeFile(assetsIndexFile, JSON.stringify([], null, 2));
  }
}

export async function readCustomerAssetsIndex(): Promise<CustomerAsset[]> {
  await ensureAssetsIndex();

  try {
    const content = await fs.readFile(assetsIndexFile, "utf-8");
    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendCustomerAsset(asset: CustomerAsset) {
  const assets = await readCustomerAssetsIndex();
  assets.push(asset);
  await fs.writeFile(assetsIndexFile, JSON.stringify(assets, null, 2));
}

function baseAssetFor(
  message: WhatsAppInternalMessage,
  type: CustomerAssetType,
  mimeType: string
): CustomerAsset {
  const id = randomUUID();

  return {
    id,
    conversationId: message.conversationId,
    phone: message.phone,
    customerName: message.senderName,
    type,
    mimeType,
    originalMediaId: message.mediaId ?? "",
    localPath: null,
    publicUrl: `/api/customer-assets?id=${id}`,
    caption: message.content || null,
    receivedAt: receivedAtFor(message.timestamp),
    source: "whatsapp",
    tags: ["whatsapp", "customer-upload", type],
    usageFlags: {
      diagnosis: true,
      campaignCandidate: true,
      beforeAfterCandidate: false,
    },
    rawMetaPayload: message.raw,
  };
}

async function fetchWhatsAppMediaMetadata(mediaId: string) {
  const token = accessToken();

  if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN missing");
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion()}/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = (await response.json().catch(() => null)) as
    | WhatsAppMediaMetadata
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !data || !("url" in data) || !data.url) {
    const errorObj = data as any;
    throw Object.assign(
      new Error(
        (errorObj?.error?.message) ||
          `WhatsApp media metadata failed with ${response.status}`
      ),
      {
        statusCode: response.status,
        metaResponse: data,
      }
    );
  }

  return data;
}

async function downloadWhatsAppMedia(mediaUrl: string) {
  const token = accessToken();

  if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN missing");
  }

  const response = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const metaResponse = await response.text().catch(() => "");
    throw Object.assign(
      new Error(`WhatsApp media download failed with ${response.status}`),
      {
        statusCode: response.status,
        metaResponse,
      }
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function saveInboundCustomerAsset(message: WhatsAppInternalMessage) {
  if (
    message.direction !== "inbound" ||
    !message.mediaId ||
    (message.type !== "image" &&
      message.type !== "audio" &&
      message.type !== "video" &&
      message.type !== "document")
  ) {
    return null;
  }

  const assetType = message.type;
  let asset = baseAssetFor(message, assetType, "application/octet-stream");

  try {
    const metadata = await fetchWhatsAppMediaMetadata(message.mediaId);
    const mimeType = metadata.mime_type ?? asset.mimeType;
    const mediaBytes = await downloadWhatsAppMedia(metadata.url!);
    const safePhone = sanitizePathSegment(message.phone) || "unknown";
    const safeMediaId = sanitizePathSegment(message.mediaId) || asset.id;
    const folder = path.join(assetsRoot, safePhone, folderFor(assetType));
    const timestamp = asset.receivedAt.replace(/[:.]/g, "");
    const extension = extensionFor(mimeType, assetType);
    const fileName = `${timestamp}-${assetType}-${safeMediaId}.${extension}`;
    const localPath = path.join(folder, fileName);

    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(localPath, mediaBytes);

    asset = {
      ...asset,
      mimeType,
      localPath,
      publicUrl: `/api/customer-assets?id=${asset.id}`,
      rawMetaPayload: {
        webhook: message.raw,
        media: metadata,
      },
    };
  } catch (error) {
    const enrichedError = error as Error & {
      statusCode?: number;
      metaResponse?: unknown;
    };

    asset = {
      ...asset,
      publicUrl: null,
      error: {
        message: enrichedError.message,
        statusCode: enrichedError.statusCode,
        metaResponse: enrichedError.metaResponse,
      },
    };
  }

  await appendCustomerAsset(asset);

  return asset;
}
