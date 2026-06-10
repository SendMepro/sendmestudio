import { NextResponse } from "next/server";
import { isBrainAdminAuthenticated } from "../auth";
import { getStorageStats } from "../store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getStorageStats();

  return NextResponse.json({
    ok: true,
    ...stats,
  });
}
