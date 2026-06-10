import { NextResponse } from "next/server";
import { isBrainAdminAuthenticated, isSuperAdminAuthenticated } from "../auth";
import { getBrainSummary, getDriveBrainStatus, saveDriveBrainConfig, syncDriveBrainStorage } from "../store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    driveSync: await getDriveBrainStatus(),
  });
}

export async function POST(request: Request) {
  if (!(await isSuperAdminAuthenticated())) {
    return NextResponse.json({ error: "Only super admin can change drive config" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rootFolder = typeof body.rootFolder === "string" ? body.rootFolder : "";

  try {
    await saveDriveBrainConfig(rootFolder);
    return NextResponse.json({
      ok: true,
      driveSync: await getDriveBrainStatus(),
      summary: await getBrainSummary(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar Google Drive." },
      { status: 400 }
    );
  }
}

export async function PUT() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sync = await syncDriveBrainStorage();
    return NextResponse.json({
      ok: sync.ok,
      sync,
      summary: await getBrainSummary(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo sincronizar Google Drive." },
      { status: 500 }
    );
  }
}
