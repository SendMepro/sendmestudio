import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { networkInterfaces } from "os";
import { isBrainAdminAuthenticated } from "../auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BRAIN_ROOT = path.join(process.cwd(), "data", "business-brain");
const QR_TOKENS_FILE = path.join(BRAIN_ROOT, "qr-tokens.json");

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface QrTokenEntry {
  token: string;
  shortCode: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  clientSlug: string;
}

function getUploadBase(): string {
  // 1. Env override (LAN host configurado)
  const envHost = process.env.NEXT_PUBLIC_LAN_HOST;
  if (envHost) {
    return envHost.replace(/\/+$/, "");
  }

  // 2. Fallback: IP local detectada
  const ip = getLocalIP();
  const port = process.env.PORT || "3000";

  if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
    return `http://${ip}:${port}`;
  }

  // 3. Último recurso
  return `http://localhost:${port}`;
}

function getLocalIP(): string {
  try {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] ?? []) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {
    // fallback
  }
  return "localhost";
}

async function readQrTokens(): Promise<QrTokenEntry[]> {
  try {
    const content = await fs.readFile(QR_TOKENS_FILE, "utf8");
    return JSON.parse(content) as QrTokenEntry[];
  } catch {
    return [];
  }
}

async function writeQrTokens(tokens: QrTokenEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(QR_TOKENS_FILE), { recursive: true });
  await fs.writeFile(QR_TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getClientSlug(): string {
  return process.env.CLIENT_ID || process.env.WORKSPACE_SLUG || "sendmestudio.cl";
}

// ─── POST: Generate a new QR token ─────────────────────────────────────────
export async function POST() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tokens = await readQrTokens();

    // Clean up expired tokens
    const now = Date.now();
    const activeTokens = tokens.filter((t) => t.expiresAt > now && !t.used);

    // Generate unique token
    const token = crypto.randomUUID();
    const shortCode = generateShortCode();
    const clientSlug = getClientSlug();
    const localIP = getLocalIP();
    const port = process.env.PORT || "3000";

    const entry: QrTokenEntry = {
      token,
      shortCode,
      createdAt: now,
      expiresAt: now + TOKEN_EXPIRY_MS,
      used: false,
      clientSlug,
    };

    await writeQrTokens([...activeTokens, entry]);

    return NextResponse.json({
      ok: true,
      token,
      shortCode,
      localIP,
      port,
      uploadUrl: `${getUploadBase()}/mobile-upload?session=${token}`,
      expiresAt: entry.expiresAt,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      clientSlug,
    });
  } catch (error) {
    console.error("[qr-token] Error generating token:", error);
    return NextResponse.json({ error: "Error al generar el código QR." }, { status: 500 });
  }
}

// ─── GET: Validate a QR token (used by /brain-upload page) ──────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token requerido." }, { status: 400 });
  }

  try {
    const tokens = await readQrTokens();
    const now = Date.now();

    const entry = tokens.find((t) => t.token === token);

    if (!entry) {
      return NextResponse.json({
        valid: false,
        error: "Este enlace expiró. Genera un nuevo QR desde Brain Admin.",
        expired: true,
      }, { status: 401 });
    }

    if (entry.used) {
      return NextResponse.json({
        valid: false,
        error: "Este código ya fue utilizado. Genera un nuevo QR desde Brain Admin.",
        expired: true,
      }, { status: 401 });
    }

    if (now > entry.expiresAt) {
      return NextResponse.json({
        valid: false,
        error: "Este enlace expiró. Genera un nuevo QR desde Brain Admin.",
        expired: true,
      }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      token: entry.token,
      shortCode: entry.shortCode,
      clientSlug: entry.clientSlug,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      expiresAt: entry.expiresAt,
    });
  } catch (error) {
    console.error("[qr-token] Error validating token:", error);
    return NextResponse.json({ error: "Error al validar el token." }, { status: 500 });
  }
}

// ─── PUT: Mark a token as used (after successful upload) ────────────────────
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido." }, { status: 400 });
    }

    const tokens = await readQrTokens();
    const entry = tokens.find((t) => t.token === token);

    if (!entry) {
      return NextResponse.json({ error: "Token no encontrado." }, { status: 404 });
    }

    entry.used = true;
    await writeQrTokens(tokens);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[qr-token] Error marking token as used:", error);
    return NextResponse.json({ error: "Error al actualizar el token." }, { status: 500 });
  }
}
