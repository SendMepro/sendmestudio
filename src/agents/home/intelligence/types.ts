// src/agents/home/intelligence/types.ts
// Purpose: Shared types for the Intelligence Layer.
// Phase F-5 — Intelligence Layer

import type { RecommendationPriority } from '../recommendations/types';

export type InsightCategory =
  | "client_loyalty"
  | "client_retention"
  | "client_engagement"
  | "client_risk"
  | "service_opportunity";

export interface Insight {
  id: string;
  category: InsightCategory;
  priority: RecommendationPriority;
  title: string;
  summary: string;
  recommendationIds: string[];
  sourceClients: string[];
  createdAt: string;
}

/**
 * Aggregation key used internally to group recommendations.
 */
export interface AggregationKey {
  category: InsightCategory;
  priority: RecommendationPriority;
}
