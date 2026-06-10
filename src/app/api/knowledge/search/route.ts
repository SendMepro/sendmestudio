// ================================================================
// api/knowledge/search/route.ts — Buscador global en Knowledge
// GET /api/knowledge/search?q=termino
// Busca en knowledgeItems, business settings, services, stylists
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const section = url.searchParams.get("section") || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const query = q.toLowerCase();

  try {
    // 1. Search knowledge items
    const whereKnowledge: any = { tenantId };
    if (section) whereKnowledge.section = section;

    const allKnowledge = await prisma.knowledgeItem.findMany({
      where: whereKnowledge,
      take: 200,
    });

    const knowledgeResults = allKnowledge
      .filter((item) => {
        const data = item.data as any;
        const searchFields = [
          item.key,
          item.section,
          data?.title,
          data?.content,
          data?.fileName,
          ...(data?.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchFields.includes(query);
      })
      .slice(0, 20)
      .map((item) => ({
        type: "knowledge",
        section: item.section,
        key: item.key,
        data: item.data,
        score: 1,
      }));

    // 2. Search business settings
    const businessSettings = await prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    const bsResults: any[] = [];
    if (businessSettings) {
      const bs = businessSettings as any;

      // Search services
      const services = (bs.services || []) as any[];
      const matchedServices = services.filter((s: any) => {
        const searchText = `${s.name} ${s.description || ""} ${s.category || ""} ${s.price || ""}`.toLowerCase();
        return searchText.includes(query);
      });
      for (const s of matchedServices) {
        bsResults.push({
          type: "service",
          name: s.name,
          description: s.description,
          price: s.price,
          duration: s.duration,
          category: s.category,
          score: 0.9,
        });
      }

      // Search stylists
      const stylists = (bs.stylists || []) as any[];
      const matchedStylists = stylists.filter((st: any) => {
        const searchText = `${st.name} ${st.role || ""} ${st.specialties?.join(" ") || ""} ${st.bio || ""}`.toLowerCase();
        return searchText.includes(query);
      });
      for (const st of matchedStylists) {
        bsResults.push({
          type: "stylist",
          name: st.name,
          role: st.role,
          specialties: st.specialties,
          bio: st.bio,
          score: 0.8,
        });
      }
    }

    // Merge results
    const results = [...knowledgeResults, ...bsResults].sort(
      (a, b) => (b.score || 0) - (a.score || 0),
    );

    return NextResponse.json({
      ok: true,
      query: q,
      results,
      total: results.length,
    });
  } catch (err: any) {
    console.error("[knowledge/search] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
