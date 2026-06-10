// BusinessEventBus — Lightweight singleton event store for real business activity.
// G-9: Connects WhatsApp concierge events to Supervisor without architecture rewrite.
// No side effects. No async init. No Node builtins. Just emits + stores.
// Keeps last 100 events in memory for the supervisor dashboard.

export type BusinessEventType =
  | 'message_received'
  | 'intent_detected'
  | 'service_detected'
  | 'date_detected'
  | 'time_detected'
  | 'booking_confirmed'
  | 'appointment_created'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'reply_sent';

export interface BusinessEvent {
  type: BusinessEventType;
  timestamp: string;
  conversationId?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessMetrics {
  /** Total events since process start */
  eventsToday: number;
  /** Count of message_received events */
  messagesReceived: number;
  /** Count of booking_confirmed events */
  bookingsCreated: number;
  /** Most recent event (or null) */
  lastEvent: BusinessEvent | null;
  /** Last 20 events for timeline display */
  recentEvents: BusinessEvent[];
  /** Per-type counters */
  byType: Record<string, number>;
}

class BusinessEventBusInternal {
  private events: BusinessEvent[] = [];
  private maxEvents = 100;

  /** Emit a business event — appends to the ring buffer. Thread-safe for single-process Node. */
  emit(event: BusinessEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /** Get current metrics snapshot. Synchronous — always fast. */
  getMetrics(): BusinessMetrics {
    const byType: Record<string, number> = {};
    for (const evt of this.events) {
      byType[evt.type] = (byType[evt.type] || 0) + 1;
    }

    return {
      eventsToday: this.events.length,
      messagesReceived: byType['message_received'] ?? 0,
      bookingsCreated: byType['booking_confirmed'] ?? 0,
      lastEvent: this.events.length > 0 ? this.events[this.events.length - 1] : null,
      recentEvents: this.events.slice(-20),
      byType,
    };
  }

  /** Reset all events (for testing) */
  _reset(): void {
    this.events = [];
  }
}

export const BusinessEventBus = new BusinessEventBusInternal();
