import { NextResponse } from "next/server";
import { isBrainAdminAuthenticated } from "../auth";
import { getBrainSummary, saveVoiceBrainLearning, updateBrainSuggestionStatus } from "../store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  const transcript = String(formData.get("transcript") ?? "").trim();

  if (!transcript) {
    return NextResponse.json({ ok: false, error: "Missing transcript." }, { status: 400 });
  }

  const result = await saveVoiceBrainLearning(audio instanceof File ? audio : null, transcript);

  return NextResponse.json({
    ok: true,
    ...result,
    summary: await getBrainSummary(),
  });
}

export async function PATCH(request: Request) {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id || !["pending", "applied", "dismissed"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid suggestion update." }, { status: 400 });
  }

  await updateBrainSuggestionStatus(id, status as "pending" | "applied" | "dismissed");

  return NextResponse.json({
    ok: true,
    summary: await getBrainSummary(),
  });
}
