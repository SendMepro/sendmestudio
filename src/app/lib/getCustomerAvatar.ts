/**
 * getCustomerAvatar — Intelligent avatar resolver for customer profiles.
 *
 * Priority:
 *   1. avatarManualUrl  (set by salon operator)
 *   2. avatarWhatsappUrl (synced from WhatsApp API)
 *   3. Initials          (generated from name)
 *
 * Returns a unified result object so callers can render either an <img> or
 * a styled initials fallback without duplicating logic.
 */

export type AvatarResult =
  | { type: "image"; src: string }
  | { type: "initials"; initials: string; background: string };

/**
 * Deterministic background colour derived from a seed string.
 */
function colourFromSeed(seed: string): string {
  const hue =
    Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 45%, 55%)`;
}

/**
 * Extract initials (up to 2 characters) from a name string.
 */
export function initialsFromName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

type CustomerShape = {
  firstName?: string;
  displayName?: string;
  phone?: string;
  avatarManualUrl?: string | null;
  avatarWhatsappUrl?: string | null;
};

/**
 * Resolve the best available avatar for a customer profile.
 *
 * @param customer - A customer-like object (minimally requires a name or phone).
 * @returns An `AvatarResult` that tells the caller how to render.
 */
export function getCustomerAvatar(customer: CustomerShape): AvatarResult {
  // Priority 1: manual avatar
  if (customer.avatarManualUrl) {
    return { type: "image", src: customer.avatarManualUrl };
  }

  // Priority 2: WhatsApp avatar
  if (customer.avatarWhatsappUrl) {
    return { type: "image", src: customer.avatarWhatsappUrl };
  }

  // Priority 3: initials
  const label =
    customer.firstName ||
    customer.displayName ||
    customer.phone ||
    "CL";
  const initials = initialsFromName(label);
  const seed = label.toLowerCase().trim();
  return { type: "initials", initials, background: colourFromSeed(seed) };
}
