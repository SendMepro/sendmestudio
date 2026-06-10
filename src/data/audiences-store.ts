import { promises as fs } from "fs";
import path from "path";

export type AudienceContact = {
  name: string;
  phone: string;
  normalizedPhone: string;
  validWhatsapp: boolean;
};

export type Audience = {
  id: string;
  name: string;
  source: "csv" | "xlsx" | "manual";
  contacts: AudienceContact[];
  totalContacts: number;
  validWhatsapp: number;
  invalidWhatsapp: number;
  createdAt: string;
};

export type AudiencesStore = {
  audiences: Audience[];
};

const dataFile = path.join(process.cwd(), "src", "data", "audiences-store.json");

export async function readStore(): Promise<AudiencesStore> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    return JSON.parse(content) as AudiencesStore;
  } catch {
    const empty: AudiencesStore = { audiences: [] };
    await writeStore(empty);
    return empty;
  }
}

export async function writeStore(store: AudiencesStore): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf-8");
}

export async function listAudiences(): Promise<Audience[]> {
  const store = await readStore();
  return store.audiences;
}

export async function getAudience(id: string): Promise<Audience | null> {
  const store = await readStore();
  return store.audiences.find((a) => a.id === id) ?? null;
}

export async function saveAudience(audience: Audience): Promise<Audience> {
  const store = await readStore();
  store.audiences.push(audience);
  await writeStore(store);
  return audience;
}

export async function deleteAudience(id: string): Promise<boolean> {
  const store = await readStore();
  const idx = store.audiences.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.audiences.splice(idx, 1);
  await writeStore(store);
  return true;
}
