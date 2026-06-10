import { NextResponse } from "next/server";
import { getOAuthAuthorizationUrl, isDriveEnabled } from "../../../lib/googleDriveBrainStorage";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-drive/auth
 *
 * Redirects the admin to Google's OAuth consent screen.
 * After authorization, Google redirects to /api/google-drive/callback.
 */
export async function GET() {
  if (!isDriveEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Google Drive Master no está habilitado. Configura GOOGLE_CLIENT_ID, " +
          "GOOGLE_CLIENT_SECRET y GOOGLE_DRIVE_ROOT_FOLDER_ID en .env.local",
      },
      { status: 400 }
    );
  }

  const authUrl = getOAuthAuthorizationUrl();
  return NextResponse.redirect(authUrl);
}
