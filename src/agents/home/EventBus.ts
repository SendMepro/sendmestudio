// src/agents/home/EventBus.ts
// Purpose: Central pub/sub event bus for the Emotional Salon intelligence pipeline.
// In-memory only. No database. Enables decoupled event-driven architecture.
// Phase F-2 — Event Bus Foundation

export type EventBusCallback<T = unknown> = (payload: T) => void | Promise<void>;

interface Subscription<T = unknown> {
  eventType: string;
  callback: EventBusCallback<T>;
}

/**
 * Lightweight in-memory event bus.
 * Supports subscribe, unsubscribe, emit, and getSubscribers.
 * Async-safe — callbacks can be sync or async (errors are caught and logged).
 */
export class EventBus {
  private subscribers: Subscription[] = [];
  private idCounter = 0;

  /**
   * Subscribe to an event type.
   * Returns an unsubscribe function for convenience.
   */
  subscribe<T>(eventType: string, callback: EventBusCallback<T>): () => void {
    this.subscribers.push({ eventType, callback: callback as EventBusCallback<unknown> });

    return () => this.unsubscribe(eventType, callback);
  }

  /**
   * Unsubscribe a specific callback from an event type.
   */
  unsubscribe<T>(eventType: string, callback: EventBusCallback<T>): void {
    this.subscribers = this.subscribers.filter(
      (s) => !(s.eventType === eventType && s.callback === callback)
    );
  }

  /**
   * Emit an event to all subscribers of that type.
   * All callbacks are invoked (sync and async).
   * Errors in callbacks are caught and logged to prevent cascade failures.
   */
  async emit<T>(eventType: string, payload: T): Promise<void> {
    const matching = this.subscribers.filter((s) => s.eventType === eventType);

    for (const sub of matching) {
      try {
        await Promise.resolve(sub.callback(payload));
      } catch (err) {
        console.warn(`[EventBus] Error in subscriber for "${eventType}":`, err);
      }
    }
  }

  /**
   * Get all subscribers for a given event type.
   * Returns a copy to prevent external mutation.
   */
  getSubscribers(eventType: string): EventBusCallback[] {
    return this.subscribers
      .filter((s) => s.eventType === eventType)
      .map((s) => s.callback);
  }

  /**
   * Get total subscriber count across all event types.
   */
  get totalSubscribers(): number {
    return this.subscribers.length;
  }
}

// Singleton for app-wide use
export const eventBus = new EventBus();
