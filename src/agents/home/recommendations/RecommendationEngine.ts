// src/agents/home/recommendations/RecommendationEngine.ts
// Purpose: Deterministic rule engine that generates recommendations from consumer data.
// Phase F-4 — Recommendation Engine Foundation
// No AI, no LLM, no prompts — pure rule-based logic.

import { appointmentSelectionConsumer } from '../consumers/AppointmentSelectionConsumer';
import { clientArrivalConsumer } from '../consumers/ClientArrivalConsumer';
import type { Recommendation, RecommendationType, RecommendationPriority } from './types';

/** Thresholds for recommendation triggers. Configurable. */
const THRESHOLDS = {
  /** A client selected this many times is a VIP candidate. */
  vipSelectionCount: 3,
  /** A service selected this many times by the same client is an upsell candidate. */
  upsellSelectionCount: 2,
  /** Minimum total selections before rebooking analysis is meaningful. */
  rebookingMinSelections: 2,
  /** A client with this many arrivals is a loyal customer. */
  loyalArrivalCount: 3,
  /** A client with 0 arrivals but multiple selections needs attention. */
  attentionSelectionThreshold: 3,
} as const;

export class RecommendationEngine {
  private idCounter = 0;

  /**
   * Generate all recommendations from current consumer snapshots.
   * Deterministic — same consumer data always produces same recommendations.
   */
  generate(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const selectionSnapshot = appointmentSelectionConsumer.getSnapshot();
    const arrivalSnapshot = clientArrivalConsumer.getSnapshot();

    // ── Rules from AppointmentSelectionConsumer ──

    // Rule: VIP candidate — client selected > 3 times
    for (const [clientName, count] of Object.entries(selectionSnapshot.selectionsByClient)) {
      if (count >= THRESHOLDS.vipSelectionCount) {
        recommendations.push(
          this.build('vip', 'high', clientName, `Seleccionado ${count} veces — cliente VIP potencial`)
        );
      }
    }

    // Rule: Upsell candidate — same service repeatedly selected
    for (const [serviceName, count] of Object.entries(selectionSnapshot.selectionsByService)) {
      if (count >= THRESHOLDS.upsellSelectionCount) {
        recommendations.push(
          this.build('upsell', 'medium', serviceName, `Servicio "${serviceName}" seleccionado ${count} veces — oportunidad de upselling`)
        );
      }
    }

    // Rule: Rebooking candidate — client has multiple selections but no arrivals
    for (const [clientName, count] of Object.entries(selectionSnapshot.selectionsByClient)) {
      const arrivalCount = Object.entries(arrivalSnapshot.arrivalsByClient)
        .filter(([id]) => id.includes(clientName.toLowerCase().replace(/\s+/g, '-')))
        .reduce((sum, [, c]) => sum + c, 0);

      if (count >= THRESHOLDS.rebookingMinSelections && arrivalCount === 0) {
        recommendations.push(
          this.build('rebooking', 'medium', clientName, `Cliente seleccionado ${count} veces sin registrar llegada — recordatorio de rebooking`)
        );
      }
    }

    // ── Rules from ClientArrivalConsumer ──

    // Rule: Loyal / VIP by arrival frequency
    for (const [clientId, count] of Object.entries(arrivalSnapshot.arrivalsByClient)) {
      if (count >= THRESHOLDS.loyalArrivalCount) {
        recommendations.push(
          this.build('vip', 'high', clientId, `${count} llegadas registradas — cliente fidelizado`)
        );
      }
    }

    // Rule: Retention candidate — arrival count drops relative to selections
    for (const [clientName, count] of Object.entries(selectionSnapshot.selectionsByClient)) {
      const arrivalCount = Object.entries(arrivalSnapshot.arrivalsByClient)
        .filter(([id]) => id.includes(clientName.toLowerCase().replace(/\s+/g, '-')))
        .reduce((sum, [, c]) => sum + c, 0);

      if (count >= THRESHOLDS.attentionSelectionThreshold && arrivalCount === 0) {
        recommendations.push(
          this.build('retention', 'high', clientName, `Cliente seleccionado ${count} veces pero sin llegadas — riesgo de retención`)
        );
      }
    }

    // Rule: Attention — high selection activity without engagement
    if (selectionSnapshot.totalSelections > 0 && arrivalSnapshot.totalArrivals === 0) {
      recommendations.push(
        this.build('attention', 'low', 'general', `${selectionSnapshot.totalSelections} selecciones sin llegadas registradas — revisar flujo de clientes`)
      );
    }

    return recommendations;
  }

  /**
   * Build a single Recommendation with generated id + timestamp.
   */
  private build(
    type: RecommendationType,
    priority: RecommendationPriority,
    subject: string,
    reason: string,
  ): Recommendation {
    this.idCounter++;
    const now = new Date().toISOString();
    return {
      id: `rec-${this.idCounter}-${Date.now()}`,
      type,
      priority,
      title: this.getTitle(type, subject),
      reason,
      createdAt: now,
    };
  }

  /**
   * Generate a human-readable title for a recommendation type.
   */
  private getTitle(type: RecommendationType, subject: string): string {
    const titles: Record<RecommendationType, string> = {
      retention: `🔄 Retención: ${subject}`,
      upsell: `⬆️ Upsell: ${subject}`,
      rebooking: `📅 Rebooking: ${subject}`,
      vip: `⭐ VIP: ${subject}`,
      attention: `⚠️ Atención: ${subject}`,
    };
    return titles[type];
  }
}

// Singleton for app-wide use
export const recommendationEngine = new RecommendationEngine();
