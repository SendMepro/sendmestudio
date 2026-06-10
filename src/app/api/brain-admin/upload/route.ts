import { NextResponse } from "next/server";
import { isBrainAdminAuthenticated } from "../auth";
import {
  ensureBrainReadme,
  getBrainSummary,
  saveBrainUpload,
  syncDriveBrainStorage,
  readLearningSignals,
  writeLearningSignals,
} from "../store";
import { emitBrainEvent } from "../events/route";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureBrainReadme();

  // Sincronización automática silenciosa con Drive Maestro en la carga de la página
  try {
    await syncDriveBrainStorage();
  } catch (error) {
    console.error("Auto-sync Google Drive failed on GET:", error);
  }

  return NextResponse.json({
    ok: true,
    summary: await getBrainSummary(),
  });
}

export async function POST(request: Request) {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const sourceType = String(formData.get("sourceType") ?? "exported-chat");
  const notes = String(formData.get("notes") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing upload file." }, { status: 400 });
  }

  await ensureBrainReadme();
  const result = await saveBrainUpload(file, sourceType, notes);

  // Generate a learning signal from this upload
  const newSignal = {
    id: crypto.randomUUID(),
    category: "conversation" as const,
    title: `Nuevo aprendizaje: ${file.name}`,
    impact: Math.min(Math.round(result.record.extracted.serviceDemand.length * 15 + 10), 100),
    status: "new" as const,
    createdAt: new Date().toISOString(),
    source: sourceType,
  };
  const existingSignals = await readLearningSignals();
  await writeLearningSignals([newSignal, ...existingSignals]);

  const summary = await getBrainSummary();

  // Emit realtime event so Brain Admin UI updates instantly
  emitBrainEvent({
    type: "upload_received",
    fileName: file.name,
    fileSize: file.size,
    sourceType,
  });
  emitBrainEvent({ type: "brain_updated", summary });

  return NextResponse.json({
    ok: true,
    record: result.record,
    drive: result.drive,
    memoryLogPath: result.memoryLogPath,
    summary,
    learnedToday: {
      title: `Archivo procesado: ${file.name}`,
      signals: result.record.extracted.serviceDemand,
      emotions: result.record.extracted.emotions,
      insights: result.record.extracted.conversionPatterns,
    },
    newSignals: [newSignal],
  });
}

