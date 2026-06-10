// src/bridges/HomeBridge.ts
// Purpose: Safe bridge between the Home dashboard and Home agents.
// Routes requests to agents only when feature flags are enabled.
// Provides fallback to legacy behavior when agents are disabled or fail.
// Phase 2.4 — Home Agent Bridge Foundation

import { isFeatureEnabled, getFeatureFlags } from '../config/featureFlags';
import { HomeOrchestratorAgent, DashboardOverview, RecommendedAction, WidgetInfo } from '../agents/home/HomeOrchestratorAgent';
import { HomeDataSourceAgent, DataSourceInfo } from '../agents/home/HomeDataSourceAgent';
import { HomeInspectorAgent, InspectionSummary } from '../agents/home/HomeInspectorAgent';
import { HomeHealthCheckAgent, HealthSummary } from '../agents/home/HomeHealthCheckAgent';
import { HomeLearningAgent, LearningEvent, LearningSummary } from '../agents/home/HomeLearningAgent';
import { HomeMetricsAgent, MetricsSnapshot } from '../agents/home/HomeMetricsAgent';
import { HomeAIInsightAgent, EmotionalProfile, MaterialIntelligence, LifetimeValue, TechnicalHistory } from '../agents/home/HomeAIInsightAgent';
import { intelligenceLayer } from '../agents/home/intelligence/IntelligenceLayer';
import type { Insight } from '../agents/home/intelligence/types';
import { PlatformHealthRepository, PlatformHealthData } from '../repositories/PlatformHealthRepository';
import { KpiMetricsRepository, KpiMetricsData } from '../repositories/KpiMetricsRepository';
import { WeatherRepository, WeatherData } from '../repositories/WeatherRepository';
import { AppointmentRepository, Appointment } from '../repositories/AppointmentRepository';
import { ClientRepository } from '../repositories/ClientRepository';

/**
 * Result wrapper for bridge operations.
 * Ensures callers always get a safe response, even on agent failure.
 */
export interface BridgeResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  fromAgent: boolean;
  featureFlag: string;
}

/**
 * HomeBridge — future integration layer between Home UI and Home agents.
 *
 * ## Migration Strategy
 * 1. All feature flags start as FALSE — bridge returns null/empty, calling code uses legacy paths.
 * 2. When a flag is enabled for a specific widget/agent, the bridge routes to the agent.
 * 3. If the agent throws, fallbackToLegacy() is called automatically.
 * 4. Widgets are migrated one at a time, each behind its own guard.
 *
 * ## Rollback Strategy
 * - Disable the feature flag → bridge stops routing to agent → legacy code resumes.
 * - No data loss: agents are read-only during inspection/diagnosis phases.
 * - Full revert: reset all flags to FALSE (resetFeatureFlags()).
 *
 * ## Failure Handling
 * Every agent call is wrapped in try/catch. On failure:
 * 1. Error is logged (via console.error — future: formal logger).
 * 2. fallbackToLegacy() is called for the failed operation.
 * 3. BridgeResult.success = false with error message.
 * 4. The caller (Home dashboard) continues using existing inline data.
 */
export class HomeBridge {
  private orchestrator: HomeOrchestratorAgent;
  private dataSource: HomeDataSourceAgent;
  private inspector: HomeInspectorAgent;
  private healthCheck: HomeHealthCheckAgent;
  private learning: HomeLearningAgent;
  private homeMetricsAgent: HomeMetricsAgent;
  private homeAIInsightAgent: HomeAIInsightAgent;
  private platformHealthRepo: PlatformHealthRepository;
  private kpiMetricsRepo: KpiMetricsRepository;
  private weatherRepo: WeatherRepository;
  private appointmentRepo: AppointmentRepository;
  private clientRepo: ClientRepository;
  private initialized = false;

  constructor() {
    this.orchestrator = new HomeOrchestratorAgent();
    this.dataSource = new HomeDataSourceAgent();
    this.inspector = new HomeInspectorAgent();
    this.healthCheck = new HomeHealthCheckAgent();
    this.learning = new HomeLearningAgent();
    this.appointmentRepo = new AppointmentRepository();
    this.clientRepo = new ClientRepository(this.appointmentRepo);
    this.homeMetricsAgent = new HomeMetricsAgent(this.appointmentRepo);
    this.homeAIInsightAgent = new HomeAIInsightAgent(this.clientRepo, this.appointmentRepo);
    this.platformHealthRepo = new PlatformHealthRepository();
    this.kpiMetricsRepo = new KpiMetricsRepository();
    this.weatherRepo = new WeatherRepository();
  }

  /**
   * Initialize the bridge and all agents.
   * Safe to call even if agents are disabled — initializes agents in background.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.orchestrator.initialize();
      this.initialized = true;
      return true;
    } catch (err) {
      console.error('[HomeBridge] Initialize failed:', err);
      return false;
    }
  }

  /**
   * Check if a specific agent feature is enabled via feature flags.
   */
  isAgentEnabled(agentName: string): boolean {
    const flagMap: Record<string, string> = {
      'HomeOrchestratorAgent': 'HOME_ORCHESTRATOR_ENABLED',
      'HomeDataSourceAgent': 'HOME_DATASOURCE_ENABLED',
      'HomeInspectorAgent': 'HOME_INSPECTOR_ENABLED',
      'HomeHealthCheckAgent': 'HOME_HEALTHCHECK_ENABLED',
      'HomeLearningAgent': 'HOME_LEARNING_ENABLED',
      'HomeMetricsAgent': 'HOME_METRICS_ENABLED',
      'HomeAIInsightAgent': 'HOME_AI_INSIGHT_ENABLED',
      'IntelligenceLayer': 'HOME_INTELLIGENCE_ENABLED',
    };

    const flagName = flagMap[agentName];
    if (!flagName) return false;

    // Master switch overrides individual flags
    const ff = getFeatureFlags();
    if (ff.HOME_AGENTS_ENABLED) return true;

    return isFeatureEnabled(flagName as keyof typeof ff);
  }

  /**
   * Get data source information for Home widgets.
   * When disabled, returns null — caller uses legacy source tracking.
   */
  async getDataSource(): Promise<BridgeResult<DataSourceInfo[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.dataSource.mapDataSources(),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Run widget inspection.
   * When disabled, returns null — no inspection performed.
   */
  async runInspection(): Promise<BridgeResult<InspectionSummary>> {
    return this.safeCall(
      'HomeInspectorAgent',
      () => this.inspector.inspectWidgets(),
      'HOME_INSPECTOR_ENABLED'
    );
  }

  /**
   * Run health check on the Home section.
   * When disabled, returns null — no health check performed.
   */
  async runHealthCheck(): Promise<BridgeResult<HealthSummary>> {
    return this.safeCall(
      'HomeHealthCheckAgent',
      () => this.healthCheck.runHealthCheck(),
      'HOME_HEALTHCHECK_ENABLED'
    );
  }

  /**
   * Collect learning signals for the Intelligence pipeline.
   * When disabled, returns null — no signals collected.
   */
  async collectLearningSignals(): Promise<BridgeResult<LearningEvent[]>> {
    return this.safeCall(
      'HomeLearningAgent',
      () => this.learning.extractLearningSignals(),
      'HOME_LEARNING_ENABLED'
    );
  }

  /**
   * Get dashboard overview via the orchestrator.
   * When disabled, returns null — caller uses legacy data aggregation.
   */
  async getDashboardOverview(): Promise<BridgeResult<DashboardOverview>> {
    return this.safeCall(
      'HomeOrchestratorAgent',
      () => this.orchestrator.getDashboardOverview(),
      'HOME_ORCHESTRATOR_ENABLED'
    );
  }

  /**
   * Get recommended next actions via the orchestrator.
   * When disabled, returns null — no recommendations available.
   */
  async getRecommendedActions(): Promise<BridgeResult<RecommendedAction[]>> {
    return this.safeCall(
      'HomeOrchestratorAgent',
      () => this.orchestrator.getRecommendedNextActions(),
      'HOME_ORCHESTRATOR_ENABLED'
    );
  }

  /**
   * Get learning summary via the learning agent.
   * When disabled, returns null — no summary available.
   */
  async getLearningSummary(): Promise<BridgeResult<LearningSummary>> {
    return this.safeCall(
      'HomeLearningAgent',
      () => Promise.resolve(this.learning.getLearningSummary()),
      'HOME_LEARNING_ENABLED'
    );
  }

  /**
   * Build and enqueue a client_arrived learning event from W11 arrival data.
   * Safe to call even when flag is disabled — returns silently.
   * Error-safe: always returns, never throws.
   */
  async enqueueArrivalEvent(params: {
    appointmentId: string;
    clientName: string;
    minutesOffset: number;
    timestamp: string;
    status: 'early' | 'late' | 'on-time';
  }): Promise<void> {
    if (!this.isAgentEnabled('HomeLearningAgent')) {
      return; // silently no-op when disabled
    }

    try {
      const event = this.learning.buildLearningEvent(
        'client_arrived',
        'W11',
        {
          appointmentId: params.appointmentId,
          clientName: params.clientName,
          minutesOffset: params.minutesOffset,
          status: params.status,
          widget: 'Arrival Behavior',
        },
        params.appointmentId // use appointmentId as clientId reference
      );

      // Override timestamp with actual arrival time
      event.timestamp = params.timestamp;

      await this.learning.enqueueEvent(event);
    } catch (err) {
      // Failsafe: never throw — arrival still works via localStorage
      console.warn('[HomeBridge] Failed to enqueue arrival event:', err);
    }
  }

  /**
   * Get platform health data via PlatformHealthRepository.
   * Uses HOME_HEALTHCHECK_ENABLED flag.
   * When disabled, returns null — caller uses legacy inline calculation.
   */
  async getPlatformHealth(): Promise<BridgeResult<PlatformHealthData>> {
    return this.safeCall(
      'HomeHealthCheckAgent',
      () => Promise.resolve(this.platformHealthRepo.getHealth()),
      'HOME_HEALTHCHECK_ENABLED'
    );
  }

  /**
   * Get KPI metrics via KpiMetricsRepository.
   * Uses HOME_DATASOURCE_ENABLED flag (metrics are a data source).
   * When disabled, returns null — caller uses legacy inline metrics array.
   */
  async getKpiMetrics(): Promise<BridgeResult<KpiMetricsData>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => Promise.resolve(this.kpiMetricsRepo.getMetrics()),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get real metrics snapshot via HomeMetricsAgent.
   * Uses HOME_METRICS_ENABLED flag.
   * Calculates 7 metrics from AppointmentRepository data.
   * When disabled or fails, returns null — caller falls back to legacy KPI array.
   *
   * Phase C-1B — W7 KPI Metrics Migration
   */
  async getMetricsSnapshot(): Promise<BridgeResult<MetricsSnapshot>> {
    return this.safeCall(
      'HomeMetricsAgent',
      () => this.homeMetricsAgent.calculateMetrics(),
      'HOME_METRICS_ENABLED'
    );
  }

  /**
   * Get weather data via WeatherRepository.
   * Uses HOME_DATASOURCE_ENABLED flag (weather is a data source).
   * When disabled, returns null — caller uses legacy hardcoded weather.
   */
  async getWeather(): Promise<BridgeResult<WeatherData>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.weatherRepo.getWeather(),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get emotional profile via HomeAIInsightAgent for W8.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Generates real EmotionalProfile from ClientRepository + AppointmentRepository.
   * When disabled or fails, returns null — caller falls back to inline clientIntelligence.emotionalProfile.
   *
   * Phase D-1 — W8 Emotional Profile Migration
   */
  async getEmotionalProfile(appointmentId: string): Promise<BridgeResult<EmotionalProfile>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.emotionalProfile;
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get material intelligence via HomeAIInsightAgent for W9.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Generates real MaterialIntelligence from ClientRepository + AppointmentRepository.
   * When disabled or fails, returns null — caller falls back to inline clientIntelligence.materialIntelligence.
   *
   * Phase D-2 — W9 Material Intelligence Migration
   */
  async getMaterialIntelligence(appointmentId: string): Promise<BridgeResult<MaterialIntelligence>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.materialIntelligence;
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get lifetime value via HomeAIInsightAgent for W10.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Generates real LifetimeValue from ClientRepository + AppointmentRepository.
   * When disabled or fails, returns null — caller falls back to inline clientIntelligence.lifetimeValue.
   *
   * Phase D-3 — W10 Customer LTV Migration
   */
  async getLifetimeValue(appointmentId: string): Promise<BridgeResult<LifetimeValue>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.lifetimeValue;
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get AI alerts via HomeAIInsightAgent for W12.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Returns flat string[] (message from each AIAlert) for seamless compatibility
   * with the existing W12 rendering that expects string[].
   * When disabled or fails, returns null — caller falls back to inline intel.aiAlerts.
   *
   * Phase D-4 — W12 AI Alerts Migration
   */
  async getAIAlerts(appointmentId: string): Promise<BridgeResult<string[]>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.aiAlerts.map((a) => a.message);
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get AI recommendations via HomeAIInsightAgent for W13.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Returns flat string[] (action from each AIRecommendation) for seamless compatibility
   * with the existing W13 rendering that expects string[].
   * When disabled or fails, returns null — caller falls back to inline intel.aiRecommendations.
   *
   * Phase D-5 — W13 AI Recommendation Migration
   */
  async getAIRecommendations(appointmentId: string): Promise<BridgeResult<string[]>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.aiRecommendations.map((r) => r.action);
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get technical history via HomeAIInsightAgent for W14.
   * Uses HOME_AI_INSIGHT_ENABLED flag.
   * Returns TechnicalHistory object matching the existing W14 rendering fields
   * (tonesUsed, recentServices, observations, preferences).
   * When disabled or fails, returns null — caller falls back to inline intel.technicalHistory.
   *
   * Phase D-6 — W14 Technical History Migration
   */
  async getTechnicalHistory(appointmentId: string): Promise<BridgeResult<TechnicalHistory>> {
    return this.safeCall(
      'HomeAIInsightAgent',
      async () => {
        const insights = await this.homeAIInsightAgent.generateClientInsights(appointmentId);
        return insights.technicalHistory;
      },
      'HOME_AI_INSIGHT_ENABLED'
    );
  }

  /**
   * Get intelligence insights from the IntelligenceLayer.
   * Uses HOME_INTELLIGENCE_ENABLED flag.
   * Aggregates deterministic recommendations into business-categorized insights:
   * client_loyalty, client_retention, client_engagement, client_risk, service_opportunity.
   * When disabled, returns null — no insights available.
   *
   * Phase F-6 — Intelligence Surface
   */
  async getIntelligenceInsights(): Promise<BridgeResult<Insight[]>> {
    return this.safeCall(
      'IntelligenceLayer',
      () => Promise.resolve(intelligenceLayer.serve()),
      'HOME_INTELLIGENCE_ENABLED'
    );
  }

  /**
   * Enqueue an appointment_selected learning event from W4.
   * Safe to call even when flag is disabled — returns silently.
   * Error-safe: always returns, never throws.
   */
  async enqueueAppointmentEvent(params: {
    appointmentId: string;
    clientName: string;
    service: string;
    serviceCategory: string;
    stylist: string;
    priceTier: string;
    priorityLabel: string;
    timeSlot: string;
    status: string;
    isMock: boolean;
  }): Promise<void> {
    if (!this.isAgentEnabled('HomeLearningAgent')) {
      return; // silently no-op when disabled
    }

    try {
      const event = this.learning.buildLearningEvent(
        'appointment_selected',
        'W4-AppointmentFlow',
        {
          appointmentId: params.appointmentId,
          clientName: params.clientName,
          service: params.service,
          serviceCategory: params.serviceCategory,
          stylist: params.stylist,
          priceTier: params.priceTier,
          priorityLabel: params.priorityLabel,
          timeSlot: params.timeSlot,
          status: params.status,
          isMock: params.isMock,
        },
        params.appointmentId
      );

      event.metadata = {
        ...event.metadata,
        isMock: params.isMock,
        sourceWidget: 'Appointment Flow',
      };

      await this.learning.enqueueEvent(event);
    } catch (err) {
      // Failsafe: never throw — selection still works via setSelectedAppointmentId
      console.warn('[HomeBridge] Failed to enqueue appointment event:', err);
    }
  }

  // Phase C-0: AppointmentRepository bridge methods
  /**
   * Get all appointments via AppointmentRepository.
   * Returns the full merged list (mock + real).
   * Uses HOME_DATASOURCE_ENABLED flag.
   * When disabled, returns null — caller uses legacy liveAppointments.
   */
  async getAppointments(): Promise<BridgeResult<Appointment[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getAppointments(),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get a single appointment by ID via AppointmentRepository.
   * Uses HOME_DATASOURCE_ENABLED flag.
   * When disabled, returns null — caller uses legacy find on liveAppointments.
   */
  async getAppointmentById(id: string): Promise<BridgeResult<Appointment | null>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getAppointmentById(id),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get completed appointments via AppointmentRepository.
   * Uses HOME_DATASOURCE_ENABLED flag.
   */
  async getCompletedAppointments(): Promise<BridgeResult<Appointment[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getCompletedAppointments(),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get appointments by client via AppointmentRepository.
   * Uses HOME_DATASOURCE_ENABLED flag.
   */
  async getAppointmentsByClient(clientNameOrId: string): Promise<BridgeResult<Appointment[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getAppointmentsByClient(clientNameOrId),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get appointments by stylist via AppointmentRepository.
   * Uses HOME_DATASOURCE_ENABLED flag.
   */
  async getAppointmentsByStylist(stylistName: string): Promise<BridgeResult<Appointment[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getAppointmentsByStylist(stylistName),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  /**
   * Get upcoming appointments via AppointmentRepository.
   * Uses HOME_DATASOURCE_ENABLED flag.
   */
  async getUpcomingAppointments(): Promise<BridgeResult<Appointment[]>> {
    return this.safeCall(
      'HomeDataSourceAgent',
      () => this.appointmentRepo.getUpcomingAppointments(),
      'HOME_DATASOURCE_ENABLED'
    );
  }

  // --- Private helpers ---

  /**
   * Execute an agent call safely with feature flag guard and error handling.
   * This is the core failsafe pattern: try → agent, catch → fallback.
   */
  private async safeCall<T>(
    agentName: string,
    agentFn: () => Promise<T>,
    flagName: string
  ): Promise<BridgeResult<T>> {
    const enabled = this.isAgentEnabled(agentName);

    if (!enabled) {
      return {
        success: true,
        data: null,
        error: null,
        fromAgent: false,
        featureFlag: flagName,
      };
    }

    try {
      const result = await agentFn();
      return {
        success: true,
        data: result,
        error: null,
        fromAgent: true,
        featureFlag: flagName,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[HomeBridge] ${agentName} failed:`, errorMessage);

      // Failsafe: fall back to legacy behavior
      this.fallbackToLegacy(agentName, errorMessage);

      return {
        success: false,
        data: null,
        error: errorMessage,
        fromAgent: true,
        featureFlag: flagName,
      };
    }
  }

  /**
   * Fallback handler when an agent call fails.
   * Logs the failure and ensures the calling code can continue with legacy data.
   * Future: could emit telemetry, alert admin, or trigger recovery agent.
   */
  private fallbackToLegacy(agentName: string, error: string): void {
    // Log the failure for monitoring
    console.warn(`[HomeBridge] Fallback triggered for ${agentName}: ${error}`);

    // Future: emit to monitoring system
    // Future: trigger RecoveryAgent if repeated failures
    // Future: log to IntelligenceRepository as a platform_health_changed event

    // The caller (Home dashboard) already has inline legacy data —
    // BridgeResult.data = null tells the caller to use legacy paths.
  }
}
