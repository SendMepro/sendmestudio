import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readCustomerAssetsIndex } from "../whatsapp/customer-assets";

export const dynamic = "force-dynamic";

const assetsRoot = path.join(process.cwd(), "data", "customer-assets");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get("id");

  if (!assetId) {
    return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
  }

  const assets = await readCustomerAssetsIndex();
  const asset = assets.find((item) => item.id === assetId);

  if (!asset || !asset.localPath) {
    return NextResponse.json({ error: "Asset not available" }, { status: 404 });
  }

  const resolvedPath = path.resolve(asset.localPath);
  const resolvedRoot = path.resolve(assetsRoot);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 403 });
  }

  try {
    const file = await fs.readFile(resolvedPath);
    const disposition = asset.type === "document" ? "attachment" : "inline";

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": asset.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${path.basename(resolvedPath)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset file missing" }, { status: 404 });
  }
}
