// src/config/featureFlags.ts
// Purpose: Central feature flag system for incremental Home agent migration
// All flags default to FALSE — Home behavior is unchanged until explicitly enabled
// Phase 2.4 — Home Agent Bridge Foundation

export interface FeatureFlags {
  /**
   * Master switch for ALL Home agents.
   * When false, no agent is invoked — Home uses legacy inline data.
   */
  HOME_AGENTS_ENABLED: boolean;

  /**
   * Enables HomeDataSourceAgent calls via the bridge.
   * Read-only: maps data sources without modifying data.
   */
  HOME_DATASOURCE_ENABLED: boolean;

  /**
   * Enables HomeInspectorAgent calls via the bridge.
   * Read-only: detects widget problems without modifying data.
   */
  HOME_INSPECTOR_ENABLED: boolean;

  /**
   * Enables HomeHealthCheckAgent calls via the bridge.
   * Read-only: verifies stability without modifying data.
   */
  HOME_HEALTHCHECK_ENABLED: boolean;

  /**
   * Enables HomeLearningAgent calls via the bridge.
   * Collects learning signals for Intelligence pipeline.
   */
  HOME_LEARNING_ENABLED: boolean;

  /**
   * Enables HomeMetricsAgent calls via the bridge.
   * Calculates real KPI metrics from AppointmentRepository.
   * Phase C-1B — W7 KPI Metrics Migration
   */
  HOME_METRICS_ENABLED: boolean;

  /**
   * Enables HomeOrchestratorAgent as the primary data source.
   * When true, the bridge routes widget data requests through the orchestrator.
   * This is the master data flag — enabling it changes how widgets get data.
   */
  HOME_ORCHESTRATOR_ENABLED: boolean;

  /**
   * Enables HomeAIInsightAgent for W8-W14 dossier insight generation.
   * Phase D-1 — W8 Emotional Profile Migration
   * When disabled, the dossier falls back to inline clientIntelligence data.
   */
  HOME_AI_INSIGHT_ENABLED: boolean;

  /**
   * Enables IntelligenceLayer calls via the bridge.
   * Phase F-6 — Intelligence Surface
   * Aggregates recommendations into business insights.
   * When disabled, returns null — no insights available.
   */
  HOME_INTELLIGENCE_ENABLED: boolean;
}

/**
 * Default feature flags: ALL DISABLED.
 * To enable a flag during migration, change it to `true` in this object
 * OR load from an external config source (env, localStorage, etc.).
 */
const defaultFlags: FeatureFlags = {
  HOME_AGENTS_ENABLED: false,
  HOME_DATASOURCE_ENABLED: true,   // Phase 2.6: Read-only observation mode
  HOME_INSPECTOR_ENABLED: true,    // Phase 2.6: Read-only observation mode
  HOME_HEALTHCHECK_ENABLED: true,  // Phase 2.6: Read-only observation mode
  HOME_LEARNING_ENABLED: true,     // Phase 2.5: W11 → HomeLearningAgent enabled
  HOME_METRICS_ENABLED: true,      // Phase C-1B: W7 → HomeMetricsAgent migration active
  HOME_ORCHESTRATOR_ENABLED: false,
  HOME_AI_INSIGHT_ENABLED: true,   // Phase D-1: W8 → HomeAIInsightAgent migration active
  HOME_INTELLIGENCE_ENABLED: true, // Phase F-6: Intelligence Surface active
};

/**
 * In-memory flag store.
 * Future: could be loaded from localStorage, environment variables, or API.
 */
let flags: FeatureFlags = { ...defaultFlags };

/**
 * Get the current state of all feature flags.
 */
export function getFeatureFlags(): FeatureFlags {
  // Future: merge with localStorage override
  // Future: merge with API override
  return { ...flags };
}

/**
 * Get a single feature flag value.
 */
export function isFeatureEnabled<K extends keyof FeatureFlags>(flagName: K): boolean {
  return flags[flagName];
}

/**
 * Enable a single feature flag.
 * Use carefully — only during active migration phases.
 */
export function enableFeature<K extends keyof FeatureFlags>(flagName: K): void {
  flags[flagName] = true;
}

/**
 * Disable a single feature flag.
 */
export function disableFeature<K extends keyof FeatureFlags>(flagName: K): void {
  flags[flagName] = false;
}

/**
 * Reset all feature flags to defaults (all disabled).
 */
export function resetFeatureFlags(): void {
  flags = { ...defaultFlags };
}

/**
 * Override flags from a partial object.
 * Useful for testing, localStorage restore, or API-driven config.
 */
export function setFeatureFlags(overrides: Partial<FeatureFlags>): void {
  flags = { ...flags, ...overrides };
}

/**
 * Check if any Home agent feature is enabled.
 */
export function isAnyHomeAgentEnabled(): boolean {
  return (
    flags.HOME_AGENTS_ENABLED ||
    flags.HOME_DATASOURCE_ENABLED ||
    flags.HOME_INSPECTOR_ENABLED ||
    flags.HOME_HEALTHCHECK_ENABLED ||
    flags.HOME_LEARNING_ENABLED ||
    flags.HOME_METRICS_ENABLED ||
    flags.HOME_ORCHESTRATOR_ENABLED
  );
}
