import { learningEventRepository } from '../../repositories/LearningEventRepository';
import { eventBus } from './EventBus';

// HomeLearningAgent
// Purpose: Prepare Home data for Emotional Salon Intelligence — define learning events, extract insights
// Phase 2.2 — Foundation skeleton
// Phase F-1 — Event Store: enqueueEvent now persists to LearningEventRepository
// Phase F-2 — Event Bus: enqueueEvent now emits through EventBus
// Architecture: Agents → EventBus → Repositories
// Bridge between Home dashboard and Intelligence pipeline

export type LearningEventType =
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_selected'
  | 'client_arrived'
  | 'client_preference_detected'
  | 'service_selected'
  | 'ai_recommendation_shown'
  | 'ai_recommendation_accepted'
  | 'upsell_opportunity_detected'
  | 'retention_risk_detected'
  | 'platform_health_changed'
  | 'campaign_template_rejected';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  section: 'home' | 'messages' | 'campaigns' | 'intelligence';
  source: string;
  clientId?: string;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: {
    isMock?: boolean;
    confidence?: number;
    sourceWidget?: string;
    sessionId?: string;
  };
}

export type InsightType = 'preference' | 'behavior' | 'opportunity' | 'trend' | 'risk';

export interface ClassifiedInsight {
  type: InsightType;
  event: LearningEvent;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface LearningSummary {
  totalSignals: number;
  byType: Record<LearningEventType, number>;
  byInsightType: Record<InsightType, number>;
  readyForIntelligence: boolean;
  timestamp: string;
}

export class HomeLearningAgent {
  private eventQueue: LearningEvent[] = [];
  private idCounter = 0;

  /**
   * Extract learning signals from current Home widget data.
   * Future: will accept widget data from HomeOrchestratorAgent.
   */
  async extractLearningSignals(): Promise<LearningEvent[]> {
    // Future: iterate over active widgets, extract signals
    // Placeholder: return empty — no real data to extract yet
    return [];
  }

  /**
   * Build a single LearningEvent from raw Home data.
   */
  buildLearningEvent(
    type: LearningEventType,
    sourceWidget: string,
    data: Record<string, unknown>,
    clientId?: string
  ): LearningEvent {
    this.idCounter++;
    return {
      id: `learning-event-${this.idCounter}-${Date.now()}`,
      type,
      section: 'home',
      source: `HomeLearningAgent:${sourceWidget}`,
      clientId,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sourceWidget,
        sessionId: `session-${Date.now()}`,
      },
    };
  }

  /**
   * Classify an insight by type.
   */
  classifyInsightType(event: LearningEvent): ClassifiedInsight {
    const typeMap: Partial<Record<LearningEventType, InsightType>> = {
      client_preference_detected: 'preference',
      service_selected: 'preference',
      client_arrived: 'behavior',
      appointment_completed: 'behavior',
      appointment_created: 'trend',
      appointment_cancelled: 'risk',
      retention_risk_detected: 'risk',
      upsell_opportunity_detected: 'opportunity',
      platform_health_changed: 'trend',
      campaign_template_rejected: 'risk',
    };

    const insightType = typeMap[event.type] ?? 'trend';

    const priorityMap: Partial<Record<LearningEventType, ClassifiedInsight['priority']>> = {
      retention_risk_detected: 'critical',
      upsell_opportunity_detected: 'high',
      appointment_cancelled: 'high',
      campaign_template_rejected: 'high',
      client_preference_detected: 'medium',
      service_selected: 'medium',
      platform_health_changed: 'medium',
      appointment_completed: 'low',
      client_arrived: 'low',
      appointment_created: 'low',
    };

    return {
      type: insightType,
      event,
      description: `Insight from ${event.source}: ${event.type}`,
      priority: priorityMap[event.type] ?? 'medium',
    };
  }

  /**
   * Prepare learning events for the future Intelligence pipeline.
   * Future: will push to IntelligenceRepository.pushEvent().
   */
  async prepareForIntelligence(): Promise<{
    events: LearningEvent[];
    insights: ClassifiedInsight[];
    summary: LearningSummary;
  }> {
    const events = await this.extractLearningSignals();
    const insights = events.map(e => this.classifyInsightType(e));
    const summary = this.getLearningSummary(events, insights);

    // Future: push to IntelligenceRepository
    // await intelligenceRepository.pushEvent(event);

    return { events, insights, summary };
  }

  /**
   * Enqueue a learning event for later batch processing, persist to event store,
   * and emit through the EventBus.
   * Phase F-1: Events persisted via LearningEventRepository.
   * Phase F-2: Events emitted via EventBus for decoupled consumers.
   */
  async enqueueEvent(event: LearningEvent): Promise<void> {
    this.eventQueue.push(event);

    // Persist to localStorage-backed event store (Phase F-1)
    try {
      learningEventRepository.addEvent(event);
    } catch {
      // Failsafe: never throw — event queue still works in-memory
    }

    // Emit through EventBus for decoupled consumers (Phase F-2)
    try {
      await eventBus.emit(event.type, event);
    } catch {
      // Failsafe: never throw — event still persisted and queued
    }
  }

  /**
   * Get a summary of learning signals collected.
   */
  getLearningSummary(events?: LearningEvent[], insights?: ClassifiedInsight[]): LearningSummary {
    const targetEvents = events ?? this.eventQueue;
    const targetInsights = insights ?? targetEvents.map(e => this.classifyInsightType(e));

    const byType = {} as Record<LearningEventType, number>;
    const byInsightType = {} as Record<InsightType, number>;

    for (const event of targetEvents) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }
    for (const insight of targetInsights) {
      byInsightType[insight.type] = (byInsightType[insight.type] ?? 0) + 1;
    }

    return {
      totalSignals: targetEvents.length,
      byType,
      byInsightType,
      readyForIntelligence: targetEvents.length > 0,
      timestamp: new Date().toISOString(),
    };
  }
}
