import { NextResponse } from "next/server";
import {
  clearBrainAdminSession,
  isBrainAdminAuthenticated,
  isSuperAdminAuthenticated,
  isValidBrainAdminPassword,
  localDevBrainAdminKeyHint,
  setBrainAdminSession,
} from "../auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    authenticated: await isBrainAdminAuthenticated(),
    isSuperAdmin: await isSuperAdminAuthenticated(),
    localDevKeyHint: localDevBrainAdminKeyHint(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const isSuper = password === (process.env.SUPER_ADMIN_KEY || "SuperAdmin2026!");
  const isNormal = isValidBrainAdminPassword(password);

  if (!isSuper && !isNormal) {
    return NextResponse.json(
      { authenticated: false, error: "Invalid admin password." },
      { status: 401 }
    );
  }

  await setBrainAdminSession(isSuper);

  return NextResponse.json({ authenticated: true, isSuperAdmin: isSuper });
}

export async function DELETE() {
  await clearBrainAdminSession();
  return NextResponse.json({ authenticated: false, isSuperAdmin: false });
}
