import { promises as fs } from "fs";
import path from "path";

export type StaffMember = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  role?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  specialty?: string;
  avatarUrl?: string;
};

export type StaffStore = {
  staff: StaffMember[];
};

const dataFile = path.join(process.cwd(), "src", "data", "staff-store.json");

export async function readStaffStore(): Promise<StaffStore> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    return JSON.parse(content) as StaffStore;
  } catch {
    const empty: StaffStore = { staff: [] };
    await writeStaffStore(empty);
    return empty;
  }
}

export async function writeStaffStore(store: StaffStore): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf-8");
}
