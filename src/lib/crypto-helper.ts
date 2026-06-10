// ================================================================
// lib/crypto-helper.ts — Encriptación/Desencriptación de datos sensibles
// Usa AES-256-GCM con key derivada de APP_ENCRYPTION_KEY.
// ================================================================

// Usar Web Crypto API (disponible en Node 18+ y Edge Runtime)
// La key debe ser de 32 bytes para AES-256

let _cachedKey: CryptoKey | null = null;

async function deriveKey(): Promise<CryptoKey | null> {
  if (_cachedKey) return _cachedKey;

  const rawKey = process.env.APP_ENCRYPTION_KEY;
  if (!rawKey || rawKey.length < 32) return null;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(rawKey.padEnd(32, "x").slice(0, 32)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  _cachedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(rawKey.slice(0, 16)),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return _cachedKey;
}

/**
 * Encripta un string con AES-256-GCM.
 * Retorna formato: base64(iv):base64(ciphertext)
 * Si no hay APP_ENCRYPTION_KEY configurada, retorna el texto plano (fallback seguro).
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  const key = await deriveKey();
  if (!key) return plaintext; // Fallback: sin encriptación

  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  // Formato: base64(iv):base64(ciphertext)
  const ivB64 = Buffer.from(iv).toString("base64");
  const ctB64 = Buffer.from(ciphertext).toString("base64");
  return `${ivB64}:${ctB64}`;
}

/**
 * Desencripta un string previamente encriptado con encrypt().
 * Si el formato no es el esperado, asume que es texto plano (fallback).
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext || !ciphertext.includes(":")) return ciphertext;

  const key = await deriveKey();
  if (!key) return ciphertext;

  try {
    const [ivB64, ctB64] = ciphertext.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const ct = Buffer.from(ctB64, "base64");

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("[crypto-helper] Decrypt failed:", err);
    return ciphertext; // Fallback: retornar como está
  }
}

/**
 * Verifica si la encriptación está configurada y funcional.
 */
export function isEncryptionEnabled(): boolean {
  return Boolean(process.env.APP_ENCRYPTION_KEY && process.env.APP_ENCRYPTION_KEY.length >= 32);
}
