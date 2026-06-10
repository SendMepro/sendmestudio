// ================================================================
// Customer Memory Store — persistence for customer memory profiles
// Phase: FASE 2 — Customer Memory Agent MVP
// Status: created
// ================================================================

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  CustomerMemoryProfile,
  CustomerSignal,
} from "../agents/customer-memory-agent";

const STORE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "customer-memory-store.json",
);

// ── Types ────────────────────────────────────────────────────────────

interface StoreData {
  profiles: CustomerMemoryProfile[];
  _metadata: {
    version: number;
    createdAt: string;
    description: string;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function defaultStore(): StoreData {
  return {
    profiles: [],
    _metadata: {
      version: 1,
      createdAt: new Date().toISOString(),
      description: "Customer memory profiles for SendMe Studio",
    },
  };
}

// ── Read / Write ────────────────────────────────────────────────────

async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      ...defaultStore(),
      ...parsed,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(data: StoreData): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get all customer memory profiles.
 * Optionally filter by phone number.
 */
export async function getProfiles(
  phone?: string,
): Promise<CustomerMemoryProfile[]> {
  const store = await readStore();
  if (phone) {
    return store.profiles.filter((p) => p.customerPhone === phone);
  }
  return store.profiles;
}

/**
 * Get a single profile by phone number.
 */
export async function getProfileByPhone(
  phone: string,
): Promise<CustomerMemoryProfile | null> {
  const store = await readStore();
  return store.profiles.find((p) => p.customerPhone === phone) ?? null;
}

/**
 * Upsert a customer memory profile.
 * - Deduplicates by customerPhone.
 * - Merges signals, preferences, and fields.
 */
export async function upsertProfile(
  profile: CustomerMemoryProfile,
): Promise<CustomerMemoryProfile> {
  const store = await readStore();
  const idx = store.profiles.findIndex(
    (p) => p.customerPhone === profile.customerPhone,
  );

  if (idx >= 0) {
    const existing = store.profiles[idx];

    // Merge signals — deduplicate by id, keep existing + new
    const existingIds = new Set(existing.signals.map((s) => s.id));
    const newSignals = profile.signals.filter((s) => !existingIds.has(s.id));

    store.profiles[idx] = {
      ...existing,
      ...profile,
      // Merge signals: keep existing, append new ones
      signals: [...existing.signals, ...newSignals],
      // Merge preferences: new values overwrite existing
      preferences: {
        ...existing.preferences,
        ...profile.preferences,
      },
      // Recalculate confidence score from all signals
      confidenceScore: calculateConfidenceScore([
        ...existing.signals,
        ...newSignals,
      ]),
      updatedAt: new Date().toISOString(),
    };
  } else {
    store.profiles.push({
      ...profile,
      confidenceScore: calculateConfidenceScore(profile.signals),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await writeStore(store);
  return store.profiles.find(
    (p) => p.customerPhone === profile.customerPhone,
  )!;
}

/**
 * Calculate average confidence score from signals.
 */
function calculateConfidenceScore(signals: CustomerSignal[]): number {
  if (signals.length === 0) return 0;
  const sum = signals.reduce((acc, s) => acc + s.confidence, 0);
  return Math.round((sum / signals.length) * 100) / 100;
}

/**
 * Delete a profile by phone number.
 * Returns true if a profile was deleted.
 */
export async function deleteProfile(phone: string): Promise<boolean> {
  const store = await readStore();
  const initialLength = store.profiles.length;
  store.profiles = store.profiles.filter((p) => p.customerPhone !== phone);

  if (store.profiles.length < initialLength) {
    await writeStore(store);
    return true;
  }
  return false;
}

/**
 * Get total profile count.
 */
export async function getProfileCount(): Promise<number> {
  const store = await readStore();
  return store.profiles.length;
}

/**
 * Get all customer memory profiles (alias for getProfiles).
 * Returns the full list with no filtering.
 */
export async function getAllCustomerMemoryProfiles(): Promise<
  CustomerMemoryProfile[]
> {
  return getProfiles();
}

/**
 * Get a single customer memory profile by phone (alias for getProfileByPhone).
 * Returns null if not found.
 */
export async function getCustomerMemoryProfileByPhone(
  phone: string,
): Promise<CustomerMemoryProfile | null> {
  return getProfileByPhone(phone);
}

/**
 * Compute aggregate stats over all customer memory profiles.
 */
export async function getCustomerMemoryStats(): Promise<{
  totalSignals: number;
  profilesWithParkingInterest: number;
  profilesWithPriceSensitivity: number;
  profilesWithAllergies: number;
  topFavoriteServices: string[];
}> {
  const profiles = await getProfiles();

  let totalSignals = 0;
  let profilesWithParkingInterest = 0;
  let profilesWithPriceSensitivity = 0;
  let profilesWithAllergies = 0;
  const serviceCount = new Map<string, number>();

  for (const p of profiles) {
    totalSignals += p.signals.length;

    if (p.parkingInterest) profilesWithParkingInterest++;
    if (p.priceSensitive) profilesWithPriceSensitivity++;
    if (p.allergies.length > 0) profilesWithAllergies++;

    for (const svc of p.favoriteServices) {
      serviceCount.set(svc, (serviceCount.get(svc) ?? 0) + 1);
    }
  }

  // Sort services by frequency descending, return top 10
  const topFavoriteServices = [...serviceCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([svc]) => svc);

  return {
    totalSignals,
    profilesWithParkingInterest,
    profilesWithPriceSensitivity,
    profilesWithAllergies,
    topFavoriteServices,
  };
}
