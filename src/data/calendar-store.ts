import { promises as fs } from "fs";
import path from "path";

export type CalendarAppointment = {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedValue: number;
  status: "pending" | "confirmed" | "cancelled";
  source: "manual" | "ai" | "campaign";
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarStore = {
  appointments: CalendarAppointment[];
};

const dataFile = path.join(process.cwd(), "src", "data", "calendar-store.json");

export async function readStore(): Promise<CalendarStore> {
  try {
    const content = await fs.readFile(dataFile, "utf-8");
    return JSON.parse(content) as CalendarStore;
  } catch {
    const empty: CalendarStore = { appointments: [] };
    await writeStore(empty);
    return empty;
  }
}

export async function writeStore(store: CalendarStore): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf-8");
}
