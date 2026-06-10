// src/agents/home/consumers/AppointmentSelectionConsumer.ts
// Purpose: Track appointment_selection events from the EventBus.
// In-memory counters for selections by client, stylist, and service.
// Phase F-3 — Intelligence Consumers Foundation

import { eventBus } from '../EventBus';
import type { LearningEvent } from '../HomeLearningAgent';

export interface AppointmentSelectionSnapshot {
  totalSelections: number;
  selectionsByClient: Record<string, number>;
  selectionsByStylist: Record<string, number>;
  selectionsByService: Record<string, number>;
}

/**
 * Consumer that listens to `appointment_selected` events and tracks
 * aggregate counters in memory. No database, no persistence.
 */
export class AppointmentSelectionConsumer {
  private totalSelections = 0;
  private selectionsByClient: Record<string, number> = {};
  private selectionsByStylist: Record<string, number> = {};
  private selectionsByService: Record<string, number> = {};
  private initialized = false;

  /**
   * Subscribe to the EventBus. Safe to call multiple times.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    eventBus.subscribe('appointment_selected', (event: LearningEvent) => {
      this.totalSelections++;

      const clientName = event.data?.clientName as string | undefined;
      if (clientName) {
        this.selectionsByClient[clientName] = (this.selectionsByClient[clientName] ?? 0) + 1;
      }

      const stylist = event.data?.stylist as string | undefined;
      if (stylist) {
        this.selectionsByStylist[stylist] = (this.selectionsByStylist[stylist] ?? 0) + 1;
      }

      const service = event.data?.service as string | undefined;
      if (service) {
        this.selectionsByService[service] = (this.selectionsByService[service] ?? 0) + 1;
      }
    });
  }

  /**
   * Get a snapshot of current counters.
   */
  getSnapshot(): AppointmentSelectionSnapshot {
    return {
      totalSelections: this.totalSelections,
      selectionsByClient: { ...this.selectionsByClient },
      selectionsByStylist: { ...this.selectionsByStylist },
      selectionsByService: { ...this.selectionsByService },
    };
  }

  /**
   * Reset all counters to zero.
   */
  reset(): void {
    this.totalSelections = 0;
    this.selectionsByClient = {};
    this.selectionsByStylist = {};
    this.selectionsByService = {};
  }
}

// Singleton for app-wide use — auto-initializes EventBus subscription
export const appointmentSelectionConsumer = new AppointmentSelectionConsumer();
appointmentSelectionConsumer.init();
