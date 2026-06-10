// ================================================================
// api/auth/logout/route.ts — Logout endpoint
// Cierra sesión en Supabase y limpia cookies.
// ================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[auth/logout] POST /api/auth/logout");

  try {
    const response = NextResponse.json({ ok: true });
    const supabase = await createClient(response);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[auth/logout] signOut error:", error.message);
      // Aún así limpiamos cookies y respondemos ok
    }

    // Limpiar todas las cookies de Supabase (con y sin prefijo de proyecto)
    const cookiesToClear = [
      "sb-peyujymnlntxqygrhqlw-auth-token",
      "sb-peyujymnlntxqygrhqlw-auth-token-code-verifier",
      "sb-providers-token",
    ];

    for (const name of cookiesToClear) {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    console.log("[auth/logout] ✅ Sesión cerrada, cookies limpiadas");
    return response;
  } catch (err) {
    console.error("[auth/logout] EXCEPTION:", err);
    return NextResponse.json(
      { error: "Error al cerrar sesión." },
      { status: 500 },
    );
  }
}
