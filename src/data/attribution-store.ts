import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────────────

export type AttributionType = "ai_full" | "ai_assisted" | "human" | "ai_cancelled";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type ReservationAttribution = {
  id: string;
  sourceId: string;
  conversationId: string;
  customerName: string;
  phone: string;
  serviceName: string;
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
  attributionType: AttributionType;
  mode: "automatic" | "scheduled" | "manual";
  bookingStatus: BookingStatus;
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function isAiReservation(attribution: ReservationAttribution): boolean {
  return attribution.attributionType === "ai_full" || attribution.attributionType === "ai_assisted";
}

// ── File path ──────────────────────────────────────────────────────────────

const ATTRIBUTION_FILE = path.join(process.cwd(), "data", "conversations", "attribution.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(path.dirname(ATTRIBUTION_FILE), { recursive: true });
  try {
    await fs.access(ATTRIBUTION_FILE);
  } catch {
    await fs.writeFile(ATTRIBUTION_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readAttributions(): Promise<ReservationAttribution[]> {
  await ensureFile();
  const content = await fs.readFile(ATTRIBUTION_FILE, "utf-8");
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAttributions(attributions: ReservationAttribution[]): Promise<void> {
  await fs.mkdir(path.dirname(ATTRIBUTION_FILE), { recursive: true });
  await fs.writeFile(ATTRIBUTION_FILE, JSON.stringify(attributions, null, 2), "utf-8");
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function createAttribution(input: {
  sourceId: string;
  conversationId: string;
  customerName: string;
  phone: string;
  serviceName: string;
  estimatedValue?: number;
  attributionType: AttributionType;
  mode: "automatic" | "scheduled" | "manual";
  bookingStatus?: BookingStatus;
}): Promise<ReservationAttribution> {
  const attributions = await readAttributions();
  const now = new Date().toISOString();

  // ── Idempotency: check if sourceId already exists ───
  const existingIndex = attributions.findIndex((a) => a.sourceId === input.sourceId);
  if (existingIndex !== -1) {
    // Update only bookingStatus if changed, keep original attributionType
    attributions[existingIndex].bookingStatus = input.bookingStatus ?? attributions[existingIndex].bookingStatus;
    attributions[existingIndex].updatedAt = now;
    await writeAttributions(attributions);
    return attributions[existingIndex];
  }

  const attribution: ReservationAttribution = {
    id: randomUUID(),
    sourceId: input.sourceId,
    conversationId: input.conversationId,
    customerName: input.customerName,
    phone: input.phone,
    serviceName: input.serviceName,
    estimatedValue: input.estimatedValue ?? 0,
    createdAt: now,
    updatedAt: now,
    attributionType: input.attributionType,
    mode: input.mode,
    bookingStatus: input.bookingStatus ?? "pending",
  };

  attributions.push(attribution);
  await writeAttributions(attributions);

  return attribution;
}

export async function updateAttributionStatus(
  id: string,
  bookingStatus: BookingStatus
): Promise<ReservationAttribution | null> {
  const attributions = await readAttributions();
  const index = attributions.findIndex((a) => a.id === id);
  if (index === -1) return null;

  attributions[index].bookingStatus = bookingStatus;
  await writeAttributions(attributions);
  return attributions[index];
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function getAttributionsToday(): Promise<ReservationAttribution[]> {
  const all = await readAttributions();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return all.filter((a) => a.createdAt.startsWith(todayKey));
}

export async function getAttributionsByDate(date: string): Promise<ReservationAttribution[]> {
  const all = await readAttributions();
  return all.filter((a) => a.createdAt.startsWith(date));
}
