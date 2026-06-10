// src/agents/home/consumers/ClientArrivalConsumer.ts
// Purpose: Track client_arrived events from the EventBus.
// In-memory counters for arrivals by client and time slot.
// Phase F-3 — Intelligence Consumers Foundation

import { eventBus } from '../EventBus';
import type { LearningEvent } from '../HomeLearningAgent';

export interface ClientArrivalSnapshot {
  totalArrivals: number;
  arrivalsByClient: Record<string, number>;
  arrivalsByTimeSlot: Record<string, number>;
}

/**
 * Consumer that listens to `client_arrived` events and tracks
 * aggregate counters in memory. No database, no persistence.
 */
export class ClientArrivalConsumer {
  private totalArrivals = 0;
  private arrivalsByClient: Record<string, number> = {};
  private arrivalsByTimeSlot: Record<string, number> = {};
  private initialized = false;

  /**
   * Subscribe to the EventBus. Safe to call multiple times.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    eventBus.subscribe('client_arrived', (event: LearningEvent) => {
      this.totalArrivals++;

      const clientId = event.clientId;
      if (clientId) {
        this.arrivalsByClient[clientId] = (this.arrivalsByClient[clientId] ?? 0) + 1;
      }

      // Derive time slot from the event timestamp (hour bucket)
      if (event.timestamp) {
        const hour = new Date(event.timestamp).getHours();
        const slot = `${hour.toString().padStart(2, '0')}:00`;
        this.arrivalsByTimeSlot[slot] = (this.arrivalsByTimeSlot[slot] ?? 0) + 1;
      }
    });
  }

  /**
   * Get a snapshot of current counters.
   */
  getSnapshot(): ClientArrivalSnapshot {
    return {
      totalArrivals: this.totalArrivals,
      arrivalsByClient: { ...this.arrivalsByClient },
      arrivalsByTimeSlot: { ...this.arrivalsByTimeSlot },
    };
  }

  /**
   * Reset all counters to zero.
   */
  reset(): void {
    this.totalArrivals = 0;
    this.arrivalsByClient = {};
    this.arrivalsByTimeSlot = {};
  }
}

// Singleton for app-wide use — auto-initializes EventBus subscription
export const clientArrivalConsumer = new ClientArrivalConsumer();
clientArrivalConsumer.init();
