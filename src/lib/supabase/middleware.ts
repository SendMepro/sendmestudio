// ================================================================
// lib/supabase/middleware.ts — Supabase middleware helper
// Se usa desde src/middleware.ts para refrescar la sesión.
// ================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr/dist/main/types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = request.cookies.getAll();
          return all;
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — importante para que el JWT esté actualizado
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.log(`[middleware] getUser() error: ${error.message}`);
  }

  return { supabaseResponse, user, supabase };
}
