// ================================================================
// api/auth/login/route.ts — Login endpoint
// Autentica con Supabase y retorna sesión.
// ================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("[auth/login] POST /api/auth/login");

  try {
    const requestBody = await request.json();
    console.log("[auth/login] Body raw:", JSON.stringify(requestBody));
    const { email, password } = requestBody;

    if (!email || !password) {
      console.log("[auth/login] Error: email o password vacío");
      return NextResponse.json(
        { error: "Email y contraseña son requeridos." },
        { status: 400 },
      );
    }

    console.log("[auth/login] Email recibido:", email);

    // Crear response ANTES para que createClient pueda escribir cookies en él
    const res = NextResponse.json({ ok: true });
    const supabase = await createClient(res);

    console.log("[auth/login] Llamando signInWithPassword...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("[auth/login] signInWithPassword ERROR:", error.message, "status:", error.status);

      if (error.message.includes("Email not confirmed")) {
        console.log("[auth/login] → Causa: email no confirmado en Supabase Auth");
      } else if (error.message.includes("Invalid login credentials")) {
        console.log("[auth/login] → Causa: credenciales inválidas");
      }

      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 },
      );
    }

    if (!data.session) {
      console.log("[auth/login] signInWithPassword OK pero NO hay session en la respuesta");
      return NextResponse.json(
        { error: "No se pudo establecer la sesión." },
        { status: 500 },
      );
    }

    console.log("[auth/login] ✅ signInWithPassword EXITOSO");
    console.log("[auth/login]   user.id:", data.user.id);
    console.log("[auth/login]   session expires:", data.session.expires_at);

    // Escribir datos del usuario en el response que ya tiene las cookies
    const responseBody = JSON.stringify({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });

    return new Response(responseBody, {
      status: 200,
      headers: res.headers,
    });
  } catch (err) {
    console.error("[auth/login] EXCEPTION:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
