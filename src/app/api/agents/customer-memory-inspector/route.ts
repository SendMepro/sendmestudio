/* ══════════════════════════════════════════════════════
   GET /api/agents/customer-memory-inspector
   ══════════════════════════════════════════════════════
   Devuelve el reporte de inspección de Customer Memory
   generado por CustomerMemoryInspectorAgent.

   Uso: fetch("/api/agents/customer-memory-inspector")
   ══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createCustomerMemoryInspectionReport } from "@/agents/customer-memory/CustomerMemoryInspectorAgent";

export async function GET() {
  try {
    const report = createCustomerMemoryInspectionReport();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[CustomerMemoryInspectorAgent] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate customer memory inspection report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
