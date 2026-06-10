/* ══════════════════════════════════════════════════════
   GET /api/agents/campaigns-development
   ══════════════════════════════════════════════════════
   Devuelve el reporte completo de auditoría del módulo
   Campaigns generado por CampaignsDevelopmentAgent.

   Uso: fetch("/api/agents/campaigns-development")
   ══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createCampaignsDevelopmentReport } from "@/agents/campaigns/CampaignsDevelopmentAgent";

export async function GET() {
  try {
    const report = createCampaignsDevelopmentReport();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[CampaignsDevelopmentAgent] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate campaigns development report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
