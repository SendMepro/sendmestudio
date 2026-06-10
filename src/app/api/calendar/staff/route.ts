import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import { getBusinessStylists } from "@/lib/tenant-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;

  const stylists = await getBusinessStylists(ctx!.tenantId);
  return NextResponse.json(stylists);
}
