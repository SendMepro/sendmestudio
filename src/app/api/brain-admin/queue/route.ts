import { NextResponse } from "next/server";
import { isBrainAdminAuthenticated } from "../auth";
import {
  readPendingJobs,
  readCompletedJobs,
  readFailedJobs,
  addToNightQueue,
  processNightlyQueue,
  getNightlySummary,
  NightQueueJobType,
} from "../store";

export const dynamic = "force-dynamic";

/**
 * GET /api/brain-admin/queue
 * Returns current queue status: pending jobs, completed jobs, failed jobs, nightly summary
 */
export async function GET() {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [pending, completed, failed, summary] = await Promise.all([
      readPendingJobs(),
      readCompletedJobs(),
      readFailedJobs(),
      getNightlySummary(),
    ]);

    return NextResponse.json({
      ok: true,
      pending: pending.length,
      completed: completed.length,
      failed: failed.length,
      pendingJobs: pending.slice(0, 20),
      completedJobs: completed.slice(0, 20),
      failedJobs: failed.slice(0, 10),
      summary,
    });
  } catch (error) {
    console.error("[queue:GET] Error:", error);
    return NextResponse.json({ ok: false, error: "Error al leer la cola nocturna" }, { status: 500 });
  }
}

/**
 * POST /api/brain-admin/queue
 * Actions:
 *   - { action: "process" } → trigger nightly queue processing
 *   - { action: "add", jobType, payload, priority } → add a job to the queue
 */
export async function POST(request: Request) {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "process") {
      const result = await processNightlyQueue();
      return NextResponse.json({
        ok: true,
        ...result,
      });
    }

    if (action === "add") {
      const { jobType, payload, priority } = body;

      if (!jobType || !payload) {
        return NextResponse.json(
          { ok: false, error: "Se requiere jobType y payload" },
          { status: 400 }
        );
      }

      const validTypes: NightQueueJobType[] = [
        "transcribe_audio",
        "analyze_video",
        "extract_pdf",
        "batch_ocr",
        "emotional_clustering",
        "campaign_generation",
        "talent_analysis",
        "social_satisfaction_analysis",
      ];

      if (!validTypes.includes(jobType)) {
        return NextResponse.json(
          { ok: false, error: `Tipo de trabajo no válido: ${jobType}` },
          { status: 400 }
        );
      }

      const job = await addToNightQueue(jobType, payload, priority ?? 5);
      return NextResponse.json({ ok: true, job });
    }

    return NextResponse.json(
      { ok: false, error: "Acción no válida. Usa 'process' o 'add'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[queue:POST] Error:", error);
    return NextResponse.json({ ok: false, error: "Error al procesar la cola nocturna" }, { status: 500 });
  }
}
