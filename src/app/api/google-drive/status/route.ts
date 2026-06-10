import { NextResponse } from "next/server";
import {
  isDriveEnabled,
  hasOAuthTokens,
  getDriveStatus,
} from "../../../lib/googleDriveBrainStorage";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-drive/status
 *
 * Returns the current Google Drive connection status.
 * Used by the brain-admin UI to show Drive state.
 */
export async function GET() {
  const enabled = isDriveEnabled();
  const hasTokens = await hasOAuthTokens();
  const status = enabled && hasTokens ? await getDriveStatus() : null;

  return NextResponse.json({
    ok: true,
    enabled,
    hasTokens,
    connected: status?.connected ?? false,
    status,
  });
}
