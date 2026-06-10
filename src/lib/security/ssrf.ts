// ================================================================
// lib/security/ssrf.ts — Safe fetch wrapper (SSRF protection)
// ================================================================
// Previene Server-Side Request Forgery attacks.
// Solo permite https: URLs, bloquea IPs internas y privadas.
// ================================================================

import { logSsrfBlocked } from "./audit-log";

// RFC 1918 + loopback + link-local + CGNAT + cloud metadata
const BLOCKED_CIDRS = [
  { name: "loopback ipv4", prefix: "127.", prefixLength: 4 },
  { name: "loopback ipv4", prefix: "0.", prefixLength: 2 },
  { name: "cloud metadata", prefix: "169.254.", prefixLength: 9 },
  { name: "cg nat", prefix: "100.64.", prefixLength: 8 },
  { name: "private 10", prefix: "10.", prefixLength: 3 },
  { name: "private 172.16-31", prefix: "172.", prefixLength: 5 }, // Range check applied separately
  { name: "private 192.168", prefix: "192.168.", prefixLength: 9 },
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::ffff:127.0.0.1",
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.internal",
  "100.100.100.200", // Alibaba Cloud
];

const BLOCKED_PROTOCOLS = [
  "file:",
  "gopher:",
  "ftp:",
  "dict:",
  "ldap:",
  "data:",
  "blob:",
  "chrome:",
  "chrome-extension:",
  "file://",
];

function isPrivateIP(hostname: string): boolean {
  // IPv6 loopback
  if (hostname === "::1" || hostname.startsWith("::ffff:127.") || hostname.startsWith("fc") || hostname.startsWith("fd")) {
    return true;
  }

  // IPv4
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  if (first === 127) return true;
  if (first === 0) return true;
  if (first === 10) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 100 && second >= 64 && second <= 127) return true; // CGNAT

  return false;
}

function getHostnameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function isHostnameBlocked(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (isPrivateIP(lower)) return true;
  return false;
}

function isProtocolBlocked(url: string): boolean {
  const lower = url.toLowerCase();
  for (const proto of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(proto)) return true;
  }
  return false;
}

export interface SafeFetchOptions {
  /** Maximum time in ms before timeout. Default: 10000 (10s) */
  timeoutMs?: number;
  /** Whether to follow redirects. Default: true */
  followRedirects?: boolean;
  /** Additional headers to send */
  headers?: Record<string, string>;
  /** Request method. Default: GET */
  method?: string;
  /** Request body */
  body?: BodyInit | null;
}

/**
 * Safe fetch wrapper that blocks SSRF attempts.
 * Only allows https: URLs.
 * Blocks internal/private IPs, loopback, cloud metadata endpoints, and dangerous protocols.
 */
export async function safeServerFetch(
  url: string,
  options: SafeFetchOptions = {},
): Promise<Response> {
  const { timeoutMs = 10000, headers = {}, method = "GET", body = null } = options;

  // ── Validate protocol ──
  if (isProtocolBlocked(url)) {
    logSsrfBlocked({ url, ip: url, detail: `Protocol blocked: ${url.slice(0, 30)}` });
    throw new Error(`SSRF blocked: protocol not allowed for URL: ${url.slice(0, 50)}`);
  }

  // ── Require https: (except for allowed internal calls) ──
  if (!url.startsWith("https://")) {
    logSsrfBlocked({ url, detail: `Only https: allowed. URL: ${url.slice(0, 50)}` });
    throw new Error(`SSRF blocked: only https URLs are allowed: ${url.slice(0, 50)}`);
  }

  // ── Parse and validate hostname ──
  const hostname = getHostnameFromUrl(url);
  if (!hostname) {
    logSsrfBlocked({ url, detail: `Could not parse hostname from URL` });
    throw new Error(`SSRF blocked: invalid URL`);
  }

  if (isHostnameBlocked(hostname)) {
    logSsrfBlocked({ url, ip: hostname, detail: `Hostname blocked: ${hostname}` });
    throw new Error(`SSRF blocked: target hostname is not allowed: ${hostname}`);
  }

  // ── Execute fetch with timeout and redirect control ──
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "User-Agent": "SendMeStudio/1.0",
        ...headers,
      },
      body,
      signal: controller.signal,
      redirect: options.followRedirects !== false ? "follow" : "manual",
    });

    // If manual redirects, check the Location header for SSRF
    if (options.followRedirects === false && response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const redirectHostname = getHostnameFromUrl(location);
        if (redirectHostname && isHostnameBlocked(redirectHostname)) {
          logSsrfBlocked({
            url: location,
            ip: redirectHostname,
            detail: `Redirect to blocked hostname: ${redirectHostname}`,
          });
          throw new Error(`SSRF blocked: redirect to internal IP`);
        }
      }
    }

    return response;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url.slice(0, 100)}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates a URL for SSRF safety without executing the request.
 * Returns null if safe, or an error message string if blocked.
 */
export function validateUrlSafety(url: string): string | null {
  if (isProtocolBlocked(url)) return "Protocol not allowed";
  if (!url.startsWith("https://")) return "Only https URLs allowed";

  const hostname = getHostnameFromUrl(url);
  if (!hostname) return "Invalid URL";
  if (isHostnameBlocked(hostname)) return `Hostname blocked: ${hostname}`;

  return null;
}
