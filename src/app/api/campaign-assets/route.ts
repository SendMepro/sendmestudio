import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const assetsDir = path.join(process.cwd(), "data", "campaign-assets");
const assetsIndexFile = path.join(assetsDir, "assets-index.json");

type CampaignAsset = {
  id: string;
  campaignId: string;
  name: string;
  type: string;
  role: string;
  localPath: string;
  publicUrl: string;
  createdAt: string;
};

async function readAssets() {
  try {
    const content = await fs.readFile(assetsIndexFile, "utf8");
    return JSON.parse(content) as CampaignAsset[];
  } catch {
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.writeFile(assetsIndexFile, JSON.stringify([], null, 2));
    return [];
  }
}

async function writeAssets(assets: CampaignAsset[]) {
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(assetsIndexFile, JSON.stringify(assets, null, 2));
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function GET() {
  return NextResponse.json({ assets: await readAssets() });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }

  const campaignId = String(formData.get("campaignId") || "campaign");
  const role = String(formData.get("role") || "WhatsApp media");
  const timestamp = new Date().toISOString();
  const fileName = `${timestamp.replace(/[:.]/g, "-")}-${safeFileName(file.name)}`;
  const campaignDir = path.join(assetsDir, safeFileName(campaignId));
  const localPath = path.join(campaignDir, fileName);
  const publicDir = path.join(process.cwd(), "public", "campaign-assets", safeFileName(campaignId));
  const publicPath = path.join(publicDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(campaignDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(localPath, bytes);
  await fs.writeFile(publicPath, bytes);

  const asset: CampaignAsset = {
    id: `asset-${Date.now()}`,
    campaignId,
    name: file.name,
    type: file.type || "application/octet-stream",
    role,
    localPath,
    publicUrl: `/campaign-assets/${safeFileName(campaignId)}/${fileName}`,
    createdAt: timestamp,
  };
  const assets = await readAssets();
  await writeAssets([asset, ...assets]);

  return NextResponse.json({ ok: true, asset }, { status: 201 });
}
