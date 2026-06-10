// ================================================================
// lib/supabase/server.ts — Supabase server client
// Crea un cliente autenticado usando las cookies de la request.
// Acepta un response opcional para escribir cookies en Route Handlers.
// ================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr/dist/main/types";

export async function createClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Intentar escribir en cookieStore (funciona en Server Components)
              try {
                cookieStore.set(name, value, options);
              } catch {}

              // También escribir en el response (funciona en Route Handlers)
              if (response) {
                response.cookies.set(name, value, options);
              }
            });
          } catch {
            // Silencioso — el middleware refresca sesiones
          }
        },
      },
    },
  );
}
