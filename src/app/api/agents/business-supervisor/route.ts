/* ══════════════════════════════════════════════════════
   GET /api/agents/business-supervisor
   ══════════════════════════════════════════════════════
   Devuelve el reporte de priorización de negocio generado
   por BusinessSupervisorAgent.

   Uso: fetch("/api/agents/business-supervisor")
   ══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createBusinessPriorityReport } from "@/agents/BusinessSupervisorAgent";

export async function GET() {
  try {
    const report = await createBusinessPriorityReport();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[BusinessSupervisorAgent] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate business priority report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
