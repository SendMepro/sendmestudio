import { promises as fs } from "fs";
import path from "path";

// ── Mode type ────────────────────────────────────────────────────────────

export type ConversationMode = "manual" | "automatic" | "scheduled" | "inherit";

// ── Salon configuration ──────────────────────────────────────────────────

export type SalonConfig = {
  /** Default mode for all conversations */
  defaultMode: ConversationMode;
  /** Schedule start time (HH:mm, 24h). Auto-reply OFF between scheduleStart→scheduleEnd. */
  scheduleStart: string;
  /** Schedule end time (HH:mm, 24h). Auto-reply ON outside schedule window. */
  scheduleEnd: string;
  /** Minutes saved per AI reply, used for time-saved metric */
  averageHumanResponseMinutes: number;
  /** Per-conversation overrides. Key = conversationId */
  conversationOverrides: Record<
    string,
    {
      mode: ConversationMode;
    }
  >;
};

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Given a salon config and an optional conversation override mode,
 * returns the effective autoReplyEnabled boolean at the current time.
 *
 * Rules:
 *  - "manual"     → false
 *  - "automatic"  → true
 *  - "scheduled"  → true only outside schedule window
 *  - "inherit"    → resolved from salon defaultMode
 *  - If conversation has override, use override mode (inherit resolves salon default)
 */
export function getEffectiveMode(
  config: SalonConfig,
  conversationOverrideMode?: ConversationMode
): boolean {
  const resolved =
    conversationOverrideMode === undefined || conversationOverrideMode === "inherit"
      ? config.defaultMode
      : conversationOverrideMode;

  return computeAutoReply(resolved, config.scheduleStart, config.scheduleEnd);
}

function computeAutoReply(
  mode: ConversationMode,
  scheduleStart: string,
  scheduleEnd: string
): boolean {
  if (mode === "manual") return false;
  if (mode === "automatic") return true;
  if (mode === "scheduled") return isOutsideSchedule(scheduleStart, scheduleEnd);
  // fallback — inherit resolved already
  return true;
}

export function isOutsideSchedule(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);

  // If start < end: window is start→end (e.g. 22:00→08:00 means night)
  // If start > end: window crosses midnight
  if (startMinutes < endMinutes) {
    // e.g. 09:00→18:00: auto is ON outside this range
    return currentMinutes < startMinutes || currentMinutes >= endMinutes;
  } else {
    // e.g. 22:00→08:00: window wraps; auto is ON when current >= end AND current < start
    return currentMinutes >= endMinutes && currentMinutes < startMinutes;
  }
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

// ── Default config ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: SalonConfig = {
  defaultMode: "manual",
  scheduleStart: "22:00",
  scheduleEnd: "08:00",
  averageHumanResponseMinutes: 4,
  conversationOverrides: {},
};

// ── File paths ───────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "salon-config.json");

async function ensureConfigFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
  }
}

// ── Read / Write config ──────────────────────────────────────────────────

export async function readSalonConfig(): Promise<SalonConfig> {
  await ensureConfigFile();
  const content = await fs.readFile(CONFIG_FILE, "utf-8");
  return JSON.parse(content) as SalonConfig;
}

export async function writeSalonConfig(config: SalonConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Get the effective autoReplyEnabled for a conversation.
 * Reads the salon config and checks for a per-conversation override.
 */
export async function getEffectiveAutoReply(
  conversationId: string
): Promise<boolean> {
  const config = await readSalonConfig();
  const override = config.conversationOverrides[conversationId];
  return getEffectiveMode(config, override?.mode);
}
