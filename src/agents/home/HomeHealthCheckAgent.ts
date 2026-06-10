// HomeHealthCheckAgent
// Purpose: Check if Home section is stable and ready for repository/Intelligence connection
// Phase 2.2 — Foundation skeleton
// Architecture: Agents → Repositories → Storage Adapters

export interface WidgetReadiness {
  widgetId: string;
  widgetName: string;
  hasLoadingState: boolean;
  hasErrorState: boolean;
  hasEmptyState: boolean;
  dataSourceConfigured: boolean;
  intelligenceConnected: boolean;
  ready: boolean;
}

export interface HealthSummary {
  overall: 'healthy' | 'warning' | 'critical';
  totalWidgets: number;
  readyWidgets: number;
  dataReadiness: 'ready' | 'partial' | 'not_ready';
  intelligenceReadiness: 'ready' | 'partial' | 'not_ready';
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export class HomeHealthCheckAgent {
  /**
   * Run a complete health check on the Home section.
   */
  async runHealthCheck(): Promise<HealthSummary> {
    const widgetReadiness = await this.checkWidgetReadiness();
    const dataReadiness = await this.checkDataReadiness();
    const intelligenceReadiness = await this.checkIntelligenceReadiness();

    const readyWidgets = widgetReadiness.filter(w => w.ready).length;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for critical issues
    const criticalWidgets = widgetReadiness.filter(w =>
      ['W8', 'W9', 'W10', 'W12', 'W13', 'W14'].includes(w.widgetId) && !w.ready
    );
    if (criticalWidgets.length > 0) {
      errors.push(`Critical dossier widgets not ready: ${criticalWidgets.map(w => w.widgetName).join(', ')}`);
    }

    // Check data readiness
    if (dataReadiness === 'not_ready') {
      errors.push('Data sources are not configured. See HomeDataSourceAgent.');
    } else if (dataReadiness === 'partial') {
      warnings.push('Some data sources are mock or localStorage-based. Not all data is real.');
    }

    // Check intelligence readiness
    if (intelligenceReadiness === 'not_ready') {
      warnings.push('Intelligence pipeline not connected. HomeLearningAgent has no repository to push events to.');
    }

    const overall: 'healthy' | 'warning' | 'critical' =
      errors.length > 0 ? 'critical' :
      warnings.length > 0 ? 'warning' :
      'healthy';

    return {
      overall,
      totalWidgets: widgetReadiness.length,
      readyWidgets,
      dataReadiness,
      intelligenceReadiness,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check readiness of all 15 widgets.
   * Future: will check actual widget configuration from repositories.
   */
  async checkWidgetReadiness(): Promise<WidgetReadiness[]> {
    return this.getWidgetReadiness();
  }

  /**
   * Check data readiness.
   * Future: will verify AppointmentRepository, ClientRepository, PlatformHealthRepository are configured.
   */
  async checkDataReadiness(): Promise<'ready' | 'partial' | 'not_ready'> {
    // Future: check actual repository availability
    return 'partial'; // repositories exist in architecture but are not implemented
  }

  /**
   * Check Intelligence pipeline readiness.
   * Future: will verify IntelligenceRepository and HomeLearningAgent are connected.
   */
  async checkIntelligenceReadiness(): Promise<'ready' | 'partial' | 'not_ready'> {
    // Future: check event queue, LearningEvent schema, and repository connection
    return 'not_ready'; // Intelligence pipeline is future work
  }

  /**
   * Get a human-readable health summary string.
   */
  async getHealthSummary(): Promise<string> {
    const health = await this.runHealthCheck();
    const lines: string[] = [];
    lines.push(`=== Home Health Report ===`);
    lines.push(`Timestamp: ${health.timestamp}`);
    lines.push(`Overall: ${health.overall.toUpperCase()}`);
    lines.push(`Widgets: ${health.readyWidgets}/${health.totalWidgets} ready`);
    lines.push(`Data readiness: ${health.dataReadiness}`);
    lines.push(`Intelligence readiness: ${health.intelligenceReadiness}`);
    if (health.errors.length > 0) {
      lines.push('');
      lines.push('Errors:');
      health.errors.forEach(e => lines.push(`  ❌ ${e}`));
    }
    if (health.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      health.warnings.forEach(w => lines.push(`  ⚠️ ${w}`));
    }
    return lines.join('\n');
  }

  // --- Private helpers ---

  private getWidgetReadiness(): WidgetReadiness[] {
    return [
      { widgetId: 'W1', widgetName: 'Salon Hero', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: true, intelligenceConnected: false, ready: true },
      { widgetId: 'W2', widgetName: 'Header Feed', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W3', widgetName: 'Weather/Date/Time', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W4', widgetName: 'Appointment Flow List', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: true, intelligenceConnected: false, ready: false },
      { widgetId: 'W5', widgetName: 'Client Focus Card', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: true, intelligenceConnected: false, ready: false },
      { widgetId: 'W6', widgetName: 'Platform Health Card', hasLoadingState: false, hasErrorState: true, hasEmptyState: false, dataSourceConfigured: true, intelligenceConnected: false, ready: false },
      { widgetId: 'W7', widgetName: 'KPI Metrics Cards', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W8', widgetName: 'Emotional Profile', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W9', widgetName: 'Material Intelligence', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W10', widgetName: 'Customer LTV', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W11', widgetName: 'Arrival Behavior', hasLoadingState: false, hasErrorState: true, hasEmptyState: true, dataSourceConfigured: true, intelligenceConnected: false, ready: true },
      { widgetId: 'W12', widgetName: 'AI Alerts', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W13', widgetName: 'AI Recommendation', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W14', widgetName: 'Technical History', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: false },
      { widgetId: 'W15', widgetName: 'Technical Parameters', hasLoadingState: false, hasErrorState: false, hasEmptyState: false, dataSourceConfigured: false, intelligenceConnected: false, ready: true },
    ];
  }
}
