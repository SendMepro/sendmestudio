// src/repositories/KpiMetricsRepository.ts
// Purpose: Read KPI metrics data via adapter — currently hardcoded, future: real calculation.
// Repository pattern: UI never has hardcoded metrics inline.
// Phase B-1 — W7 KPI Metrics Repository Migration

import { localStorageAdapter } from '../adapters/LocalStorageAdapter';

/**
 * A single KPI metric card displayed on the dashboard.
 */
export interface KpiMetric {
  label: string;
  value: string;
  detail: string;
}

/**
 * Full set of KPIs shown in the dashboard right column.
 */
export interface KpiMetricsData {
  salesToday: KpiMetric;
  potential: KpiMetric;
  occupancy: KpiMetric;
  all: KpiMetric[];
}

/**
 * Repository for KPI metrics data.
 *
 * ## Current state
 * Metrics are hardcoded — no real calculation. The repository wraps the hardcoded
 * values to decouple the UI from inline data. Future: calculate from appointment data.
 *
 * ## Future state (when AppointmentRepository exists)
 * - getSalesToday(): sum completed appointments × service price
 * - getPotential(): sum pending appointments × avg ticket
 * - getOccupancy(): occupied slots / total slots × 100
 *
 * @see HOME_MIGRATION_ORDER.md — Phase C, W7
 */
export class KpiMetricsRepository {
  private readonly storageKey = 'dashboard:kpi-metrics';

  /**
   * Get current KPI metrics.
   * Currently returns hardcoded defaults. Future: calculate from appointment data.
   * Falls back to hardcoded defaults if stored data is unavailable.
   */
  getMetrics(): KpiMetricsData {
    const stored = localStorageAdapter.getJSON<KpiMetricsData | null>(this.storageKey, null);
    if (stored && stored.all && stored.all.length === 3) {
      return stored;
    }
    return this.calculateMetrics();
  }

  /**
   * Calculate KPI metrics.
   * Currently returns hardcoded values. Future: real calculation from AppointmentRepository.
   */
  calculateMetrics(): KpiMetricsData {
    const salesToday: KpiMetric = {
      label: 'Ventas hoy',
      value: '$2.840.000',
      detail: '+18% vs ayer',
    };
    const potential: KpiMetric = {
      label: 'Potencial',
      value: '$3.420.000',
      detail: '4 reservas sin pago',
    };
    const occupancy: KpiMetric = {
      label: 'Ocupación',
      value: '81%',
      detail: 'Pico 11:00-16:00',
    };

    return {
      salesToday,
      potential,
      occupancy,
      all: [salesToday, potential, occupancy],
    };
  }

  /**
   * Get trend description for the first KPI metric.
   * Future: real trend calculation from historical data.
   */
  getTrend(): string {
    return '+18% vs ayer';
  }

  /**
   * Get a summary string of all KPIs.
   */
  getSummary(): string {
    const metrics = this.getMetrics();
    return `${metrics.salesToday.value} ventas · ${metrics.potential.value} potencial · ${metrics.occupancy.value} ocupación`;
  }

  /**
   * Check if KPI data exists in localStorage.
   */
  hasData(): boolean {
    return localStorageAdapter.has(this.storageKey);
  }
}

// Singleton for app-wide use
export const kpiMetricsRepository = new KpiMetricsRepository();
