// ================================================================
// middleware.ts — Next.js middleware (Edge Runtime)
// Solo verifica sesión Supabase y redirige a login si no hay.
// NO usa Prisma (no soportado en Edge).
// La validación de licencia/tenant se hace en:
//   - API routes via requireTenant (Node.js runtime)
//   - Client components via useAuth + /api/auth/session
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/license-expired",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/callback",
  "/api/auth/register",
  "/api/auth/session",
  "/_next",
  "/favicon",
  "/images",
  "/fonts",
];

// Rutas de webhook que usan verificación propia (WhatsApp)
const WEBHOOK_ROUTES = [
  "/api/whatsapp/webhook",
  "/api/whatsapp/events",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const reqId = crypto.randomUUID?.()?.slice(0, 8) || "xxxx";

  console.log(`[middleware:${reqId}] → ${request.method} ${pathname}`);

  // Siempre permitir rutas públicas
  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Siempre permitir webhooks (tienen su propia verificación)
  if (WEBHOOK_ROUTES.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Refrescar sesión y obtener usuario
  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    console.log(`[middleware:${reqId}] ⛔ No hay sesión, redirigiendo a /login`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`[middleware:${reqId}] ✅ Sesión válida: ${user.email}`);
  return addSecurityHeaders(supabaseResponse);
}

/**
 * Agrega headers de seguridad a todas las respuestas
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // CSP básico — Next.js maneja inline scripts con nonces
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js necesita unsafe-inline/eval para hot reload
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // Strict-Transport-Security se configura mejor en Nginx
  // response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  return response;
}

// Configurar rutas que ejecutan el middleware
export const config = {
  matcher: [
    // Skip static files and internal Next.js routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
