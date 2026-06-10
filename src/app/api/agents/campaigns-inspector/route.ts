/* ══════════════════════════════════════════════════════
   GET /api/agents/campaigns-inspector
   ══════════════════════════════════════════════════════
   Devuelve el reporte de inspección del módulo Campaigns
   generado por CampaignsInspectorAgent.

   Uso: fetch("/api/agents/campaigns-inspector")
   ══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createCampaignsInspectionReport } from "@/agents/campaigns/CampaignsInspectorAgent";

export async function GET() {
  try {
    const report = createCampaignsInspectionReport();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[CampaignsInspectorAgent] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate campaigns inspection report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
