/* ══════════════════════════════════════════════════════
   GET /api/agents/whatsapp-inspector
   ══════════════════════════════════════════════════════
   Devuelve el reporte de estado operacional de WhatsApp
   generado por WhatsAppOperationalInspectorAgent.

   Uso: fetch("/api/agents/whatsapp-inspector")
   ══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createWhatsAppOperationalReport } from "@/agents/whatsapp/WhatsAppOperationalInspectorAgent";

export async function GET() {
  try {
    const report = createWhatsAppOperationalReport();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[WhatsAppOperationalInspectorAgent] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate WhatsApp operational report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
