// src/agents/home/intelligence/IntelligenceLayer.ts
// Purpose: Aggregates Recommendation[] into business Insight[].
// Phase F-5 — Intelligence Layer
// No AI, no LLM, no prompts — pure clustering by category + priority.

import { recommendationEngine } from '../recommendations/RecommendationEngine';
import type { Recommendation } from '../recommendations/types';
import type { Insight, InsightCategory, AggregationKey } from './types';

/**
 * Maps recommendation types to business insight categories.
 */
const TYPE_TO_CATEGORY: Record<string, InsightCategory> = {
  vip: 'client_loyalty',
  retention: 'client_retention',
  rebooking: 'client_engagement',
  attention: 'client_risk',
  upsell: 'service_opportunity',
};

/**
 * Human-readable titles for each insight category.
 */
const CATEGORY_TITLES: Record<InsightCategory, string> = {
  client_loyalty: 'High Value Customer Group',
  client_retention: 'Retention Risk Cluster',
  client_engagement: 'Client Rebooking Opportunities',
  client_risk: 'Client Attention Needed',
  service_opportunity: 'Upsell Opportunity Group',
};

/**
 * Thresholds for insight tier (how many recommendations trigger which priority).
 */
const INSIGHT_TIERS = {
  /** 3+ recommendations in same category → high priority insight. */
  highThreshold: 3,
  /** 2 recommendations → medium. */
  mediumThreshold: 2,
} as const;

export class IntelligenceLayer {
  private idCounter = 0;

  /**
   * Generate business insights from current recommendations.
   * Aggregates Recommendation[] by category, merges clients,
   * and assigns priority based on volume.
   */
  serve(): Insight[] {
    const recommendations = recommendationEngine.generate();
    if (recommendations.length === 0) return [];

    // Step 1: Group recommendations by (category, priority)
    const groups = new Map<string, Recommendation[]>();

    for (const rec of recommendations) {
      const category = TYPE_TO_CATEGORY[rec.type] ?? 'client_attention';
      const key = `${category}::${rec.priority}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(rec);
    }

    // Step 2: Build an Insight per group
    const insights: Insight[] = [];

    for (const [key, recs] of groups.entries()) {
      const [categoryStr] = key.split('::');
      const category = categoryStr as InsightCategory;

      // Collect unique client names from recommendation titles
      const clientSet = new Set<string>();
      const recIds: string[] = [];

      for (const rec of recs) {
        recIds.push(rec.id);

        // Extract client name from title (after the emoji + colon space)
        const titleParts = rec.title.split(': ');
        if (titleParts.length > 1) {
          const name = titleParts.slice(1).join(': ').trim();
          if (name && name !== 'general') {
            clientSet.add(name);
          }
        }
      }

      // Derive insight priority from volume
      const priority = recs.length >= INSIGHT_TIERS.highThreshold
        ? 'high'
        : recs.length >= INSIGHT_TIERS.mediumThreshold
          ? 'medium'
          : 'low';

      insights.push(this.buildInsight(category, priority, recs, recIds, [...clientSet]));
    }

    return insights;
  }

  /**
   * Build a single Insight with a descriptive summary.
   */
  private buildInsight(
    category: InsightCategory,
    priority: 'low' | 'medium' | 'high',
    recs: Recommendation[],
    recIds: string[],
    sourceClients: string[],
  ): Insight {
    this.idCounter++;
    const now = new Date().toISOString();

    const typesInGroup = [...new Set(recs.map((r) => r.type))].join(', ');

    return {
      id: `insight-${this.idCounter}-${Date.now()}`,
      category,
      priority,
      title: CATEGORY_TITLES[category],
      summary: `${recs.length} recomendación(es) de tipo ${typesInGroup}${sourceClients.length > 0 ? ` para ${sourceClients.length} cliente(s)` : ''}`,
      recommendationIds: recIds,
      sourceClients,
      createdAt: now,
    };
  }
}

// Singleton for app-wide use
export const intelligenceLayer = new IntelligenceLayer();
