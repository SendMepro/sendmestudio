// src/repositories/LearningEventRepository.ts
// Purpose: Persist HomeLearningAgent events to localStorage using the adapter pattern.
// Enables event durability across sessions for the Intelligence pipeline.
// Phase F-1 — HomeLearningAgent Event Store Foundation
// Phase F-2 — Event Bus: subscribes to EventBus to persist events from any source

import { localStorageAdapter } from '../adapters/LocalStorageAdapter';
import type { LearningEvent } from '../agents/home/HomeLearningAgent';
import { eventBus } from '../agents/home/EventBus';

const STORAGE_KEY = 'home:learning-events';
const MAX_EVENTS = 500; // Safety cap to prevent localStorage bloat

export class LearningEventRepository {
  private initialized = false;

  /**
   * Initialize the repository by subscribing to the EventBus.
   * Safe to call multiple times — only subscribes once.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Subscribe to ALL learning event types via wildcard pattern
    // Each event is persisted to localStorage
    const eventTypes = [
      'appointment_created',
      'appointment_cancelled',
      'appointment_completed',
      'appointment_selected',
      'client_arrived',
      'client_preference_detected',
      'service_selected',
      'ai_recommendation_shown',
      'ai_recommendation_accepted',
      'upsell_opportunity_detected',
      'retention_risk_detected',
      'platform_health_changed',
      'campaign_template_rejected',
    ];

    for (const type of eventTypes) {
      eventBus.subscribe(type, (event: LearningEvent) => {
        this.addEvent(event);
      });
    }
  }

  /**
   * Add a single event to the store.
   * Appends to the existing event list and caps at MAX_EVENTS.
   */
  addEvent(event: LearningEvent): void {
    const events = this.getEvents();
    events.push(event);

    // Cap storage to prevent unbounded growth
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    localStorageAdapter.setJSON(STORAGE_KEY, events);
  }

  /**
   * Get all stored events, newest first.
   * Returns empty array when no events exist or storage is unavailable.
   */
  getEvents(): LearningEvent[] {
    return localStorageAdapter.getJSON<LearningEvent[]>(STORAGE_KEY, []);
  }

  /**
   * Get events filtered by type.
   * Example: getEventsByType('appointment_selected')
   */
  getEventsByType(type: string): LearningEvent[] {
    return this.getEvents().filter((e) => e.type === type);
  }

  /**
   * Get events filtered by client ID.
   */
  getEventsByClient(clientId: string): LearningEvent[] {
    return this.getEvents().filter((e) => e.clientId === clientId);
  }

  /**
   * Get events filtered by source.
   * Source format: "HomeLearningAgent:W4-AppointmentFlow"
   */
  getEventsBySource(source: string): LearningEvent[] {
    return this.getEvents().filter((e) => e.source === source);
  }

  /**
   * Remove all persisted events from storage.
   */
  clearEvents(): void {
    localStorageAdapter.remove(STORAGE_KEY);
  }
}

// Singleton for app-wide use — auto-initializes EventBus subscription
export const learningEventRepository = new LearningEventRepository();
learningEventRepository.init();
