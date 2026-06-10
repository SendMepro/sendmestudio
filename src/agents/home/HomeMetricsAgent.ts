// HomeMetricsAgent
// Purpose: Calculate real metrics from AppointmentRepository data.
// Produces a MetricsSnapshot with totals, averages, and derived KPIs.
// Phase C-1 — HomeMetricsAgent Foundation
// Architecture: Agents → Repositories → Storage Adapters

import { AppointmentRepository, Appointment } from '../../repositories/AppointmentRepository';

/**
 * A single derived metric with a numeric value and optional human-readable label.
 */
export interface MetricEntry {
  value: number;
  label: string;
  detail?: string;
}

/**
 * All metrics calculated by HomeMetricsAgent.
 * Snapshot is point-in-time — recalculate on each call.
 */
export interface MetricsSnapshot {
  /** Total appointment count across all statuses */
  totalAppointments: number;
  /** Completed/finished appointments */
  completedAppointments: number;
  /** Cancelled appointments */
  cancelledAppointments: number;
  /** Unique clients with completed appointments */
  activeClients: number;
  /** Average ticket estimated from completed appointments */
  averageTicket: MetricEntry;
  /** Retention rate: clients with 2+ appointments / total clients */
  retentionRate: MetricEntry;
  /** Repurchase rate: returning unique clients / total unique clients */
  repurchaseRate: MetricEntry;
  /** Raw data used for calculations (for debugging/validation) */
  _raw: {
    totalAppointmentsList: number;
    completedList: number;
    cancelledList: number;
    uniqueClientIds: string[];
    clientsWithMultipleAppointments: number;
    returningClients: number;
  };
  /** Timestamp when the snapshot was calculated */
  calculatedAt: string;
}

/**
 * HomeMetricsAgent — calculate real dashboard metrics from appointment data.
 *
 * ## Current state
 * Read-only calculation agent. Does NOT replace W7 KPI cards.
 * Produces a MetricsSnapshot with 7 metrics from AppointmentRepository data.
 *
 * ## Future state
 * - HomeBridge will route W7 requests through this agent
 * - KpiMetricsRepository will be refactored to consume from this agent
 * - HomeLearningAgent will receive metric change events
 *
 * @see HOME_MIGRATION_ORDER.md — Phase C, W7
 * @see HOME_AGENT_WIDGET_OWNERSHIP.md — HomeMetricsAgent
 */
export class HomeMetricsAgent {
  private appointmentRepo: AppointmentRepository;

  constructor(appointmentRepo: AppointmentRepository) {
    this.appointmentRepo = appointmentRepo;
  }

  /**
   * Calculate all metrics from the appointment data source.
   * Always returns a complete MetricsSnapshot — never throws.
   * On error, returns a zeroed snapshot with timestamps.
   */
  async calculateMetrics(): Promise<MetricsSnapshot> {
    try {
      const allAppointments = await this.appointmentRepo.getAppointments();
      const completed = await this.appointmentRepo.getCompletedAppointments();
      return this.computeFrom(allAppointments, completed);
    } catch (err) {
      console.warn('[HomeMetricsAgent] Error calculating metrics:', err);
      return this.zeroSnapshot();
    }
  }

  /**
   * Compute all metrics from raw appointment lists.
   * Separated from calculateMetrics() for testability.
   */
  computeFrom(allAppointments: Appointment[], completedAppointments: Appointment[]): MetricsSnapshot {
    const now = new Date().toISOString();

    // Canceled: status contains "cancel" or "cancelled"
    const cancelled = allAppointments.filter(
      (a) => a.status.toLowerCase().includes('cancel') || a.status.toLowerCase() === 'cancelled'
    );

    // Unique client IDs from completed appointments
    const completedClientIds = this.uniqueClientIds(completedAppointments);
    // Unique client IDs from ALL appointments
    const allClientIds = this.uniqueClientIds(allAppointments);

    // Clients with 2+ appointments in the full list
    const clientAppointmentCounts = this.clientCounts(allAppointments);
    const clientsWithMultipleAppointments = Array.from(clientAppointmentCounts.values()).filter((c) => c >= 2).length;

    // Returning clients: clients in completed list that have other appointments too
    const returningClients = completedClientIds.filter((id) => {
      const count = clientAppointmentCounts.get(id) ?? 0;
      return count > 1;
    }).length;

    // Average ticket: estimate from completed appointment services
    // Uses a keyword-based price estimation (future: real service pricing data)
    const averageTicket = this.estimateAverageTicket(completedAppointments);

    // Retention rate: clients with 2+ / total unique clients
    const retentionRateValue = allClientIds.length > 0
      ? Math.round((clientsWithMultipleAppointments / allClientIds.length) * 100)
      : 0;

    // Repurchase rate: returning clients / unique completed clients
    const repurchaseRateValue = completedClientIds.length > 0
      ? Math.round((returningClients / completedClientIds.length) * 100)
      : 0;

    return {
      totalAppointments: allAppointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelled.length,
      activeClients: completedClientIds.length,
      averageTicket: {
        value: averageTicket,
        label: '$0 CLP',
        detail: this.formatCurrency(averageTicket),
      },
      retentionRate: {
        value: retentionRateValue,
        label: `${retentionRateValue}%`,
        detail: `${clientsWithMultipleAppointments} clientes con 2+ visitas`,
      },
      repurchaseRate: {
        value: repurchaseRateValue,
        label: `${repurchaseRateValue}%`,
        detail: `${returningClients} de ${completedClientIds.length} clientes recurrentes`,
      },
      _raw: {
        totalAppointmentsList: allAppointments.length,
        completedList: completedAppointments.length,
        cancelledList: cancelled.length,
        uniqueClientIds: allClientIds,
        clientsWithMultipleAppointments,
        returningClients,
      },
      calculatedAt: now,
    };
  }

  /**
   * Extract unique client identifiers from an appointment list.
   * Uses appointment id as client identifier (future: real clientId).
   */
  private uniqueClientIds(appointments: Appointment[]): string[] {
    const seen = new Set<string>();
    for (const a of appointments) {
      if (a.id) seen.add(a.id);
    }
    return Array.from(seen);
  }

  /**
   * Count appointments per client ID.
   */
  private clientCounts(appointments: Appointment[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const a of appointments) {
      if (a.id) {
        counts.set(a.id, (counts.get(a.id) ?? 0) + 1);
      }
    }
    return counts;
  }

  /**
   * Estimate average ticket from completed appointment services.
   * Uses keyword-based pricing estimates.
   * Future: read real service prices from ServiceRepository.
   */
  private estimateAverageTicket(completed: Appointment[]): number {
    if (completed.length === 0) return 0;

    const priceMap: Record<string, number> = {
      'balayage': 160000,
      'olaplex': 96000,
      'color': 80000,
      'tinte': 60000,
      'corte': 35000,
      'peinado': 25000,
      'tratamiento': 45000,
      'keratina': 120000,
      'alisado': 140000,
      'ritual': 55000,
      'manicure': 25000,
      'pedicure': 30000,
    };

    const total = completed.reduce((sum, a) => {
      const serviceLower = a.service.toLowerCase();
      for (const [keyword, price] of Object.entries(priceMap)) {
        if (serviceLower.includes(keyword)) {
          return sum + price;
        }
      }
      return sum + 50000; // default price for unknown services
    }, 0);

    return Math.round(total / completed.length);
  }

  /**
   * Format a number as CLP currency string.
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Return a zeroed snapshot for error states.
   */
  private zeroSnapshot(): MetricsSnapshot {
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      activeClients: 0,
      averageTicket: { value: 0, label: '$0', detail: '$0' },
      retentionRate: { value: 0, label: '0%', detail: '0 clientes recurrentes' },
      repurchaseRate: { value: 0, label: '0%', detail: '0 de 0 clientes recurrentes' },
      _raw: {
        totalAppointmentsList: 0,
        completedList: 0,
        cancelledList: 0,
        uniqueClientIds: [],
        clientsWithMultipleAppointments: 0,
        returningClients: 0,
      },
      calculatedAt: new Date().toISOString(),
    };
  }
}
