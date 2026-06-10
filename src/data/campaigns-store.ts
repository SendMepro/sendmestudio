import { promises as fs } from "fs";
import path from "path";

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed";

export type CampaignType =
  | "reactivacion"
  | "cumpleanos"
  | "promocion"
  | "recordatorio"
  | "personalizada";

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  targetCount: number;
  estimatedMessages: number;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignsStore = {
  campaigns: Campaign[];
};

const dataFile = path.join(process.cwd(), "src", "data", "campaigns-store.json");

export async function readStore(): Promise<CampaignsStore> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    return JSON.parse(content) as CampaignsStore;
  } catch {
    const empty: CampaignsStore = { campaigns: [] };
    await writeStore(empty);
    return empty;
  }
}

export async function writeStore(store: CampaignsStore): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf-8");
}
