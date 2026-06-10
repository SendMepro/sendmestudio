import { NextResponse } from "next/server";
import { readKnowledgeSection } from "../store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    services: await readKnowledgeSection("services"),
  });
}
