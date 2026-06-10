// src/agents/home/recommendations/types.ts
// Purpose: Shared types for the Recommendation Engine.
// Phase F-4 — Recommendation Engine Foundation

export type RecommendationType = "retention" | "upsell" | "rebooking" | "vip" | "attention";

export type RecommendationPriority = "low" | "medium" | "high";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  reason: string;
  createdAt: string;
}

/**
 * Describes a candidate that triggered a recommendation rule.
 * Used for debugging and auditing recommendation decisions.
 */
export interface RecommendationCandidate {
  name: string;
  type: RecommendationType;
  value: number;
  threshold: number;
}
