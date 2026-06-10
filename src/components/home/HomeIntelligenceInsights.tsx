"use client";

import { Lightbulb, TrendingUp, Users, AlertTriangle, Sparkles, Award } from "lucide-react";
import type { Insight, InsightCategory } from "../../agents/home/intelligence/types";
import AIBadge from "../../app/components/AIBadge";
import styles from "../../app/page.module.css";

export interface HomeIntelligenceInsightsProps {
  insights: Insight[];
}

const CATEGORY_META: Record<InsightCategory, { icon: React.ElementType; label: string }> = {
  client_loyalty: { icon: Award, label: 'Client Loyalty' },
  client_retention: { icon: TrendingUp, label: 'Client Retention' },
  client_engagement: { icon: Users, label: 'Client Engagement' },
  client_risk: { icon: AlertTriangle, label: 'Client Risk' },
  service_opportunity: { icon: Sparkles, label: 'Service Opportunity' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#7c5cff',
  medium: '#d9b66f',
  low: 'rgba(96, 88, 118, 0.45)',
};

/**
 * HomeIntelligenceInsights — Business-level intelligence widget.
 *
 * Phase F — UI Integration
 * Displays aggregated Insight[] from IntelligenceLayer via HomeBridge.
 * Each insight shows category, priority, summary, and client count.
 */
export default function HomeIntelligenceInsights({
  insights,
}: HomeIntelligenceInsightsProps) {
  if (!insights || insights.length === 0) {
    return null; // Empty state: hide widget entirely
  }

  return (
    <section className={styles.aiInsightGrid}>
      <div className={[styles.aiMiniCard, styles.intelligenceCard].join(" ")}>
        <div className={styles.dossierHeaderLine}>
          <Lightbulb size={13} className={styles.dossierIcon} />
          <div className={styles.luxuryTitleWrapper}>
            <span className={styles.luxuryDossierTitle}>Inteligencia de Salon</span>
            <span className={styles.subLabelEn}>SALON INTELLIGENCE</span>
          </div>
          <AIBadge className={styles.dossierAiBadge} />
        </div>

        <div className={styles.insightCardsGrid}>
          {insights.map((insight) => {
            const meta = CATEGORY_META[insight.category];
            const Icon = meta?.icon ?? Lightbulb;
            const color = PRIORITY_COLORS[insight.priority] ?? PRIORITY_COLORS.low;

            return (
              <div
                key={insight.id}
                className={styles.insightCard}
                style={{ borderLeftColor: color }}
              >
                <div className={styles.insightCardHeader}>
                  <Icon size={14} style={{ color }} />
                  <span className={styles.insightCategoryLabel}>
                    {meta?.label ?? insight.category}
                  </span>
                  <span
                    className={styles.insightPriorityBadge}
                    style={{
                      background: `${color}18`,
                      color,
                      borderColor: `${color}30`,
                    }}
                  >
                    {insight.priority}
                  </span>
                  {insight.sourceClients.length > 0 && (
                    <span className={styles.insightClientCount}>
                      {insight.sourceClients.length} cliente(s)
                    </span>
                  )}
                </div>
                <p className={styles.insightSummary}>{insight.summary}</p>
                {insight.sourceClients.length > 0 && (
                  <div className={styles.insightClientList}>
                    {insight.sourceClients.slice(0, 3).map((client) => (
                      <span key={client} className={styles.insightClientChip}>
                        {client}
                      </span>
                    ))}
                    {insight.sourceClients.length > 3 && (
                      <span className={styles.insightClientChip}>
                        +{insight.sourceClients.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
