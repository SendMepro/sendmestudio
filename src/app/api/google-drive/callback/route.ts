import { NextResponse } from "next/server";
import { exchangeCodeForTokens, storeOAuthTokens } from "../../../lib/googleDriveBrainStorage";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-drive/callback
 *
 * Handles the OAuth callback from Google.
 * Exchanges the authorization code for access + refresh tokens,
 * stores them in data/business-brain/drive-oauth.json,
 * then redirects to the brain-admin page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("[GoogleDrive OAuth] Authorization denied:", error);
    return NextResponse.redirect(
      new URL("/brain-admin?driveError=" + encodeURIComponent(`Autorización denegada: ${error}`), request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/brain-admin?driveError=" + encodeURIComponent("No se recibió código de autorización."), request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeOAuthTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);

    console.log("[GoogleDrive OAuth] ✅ Tokens obtenidos y almacenados correctamente.");

    return NextResponse.redirect(
      new URL("/brain-admin?driveSuccess=conectado", request.url)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[GoogleDrive OAuth] ❌ Error intercambiando código:", message);

    return NextResponse.redirect(
      new URL("/brain-admin?driveError=" + encodeURIComponent(message), request.url)
    );
  }
}
