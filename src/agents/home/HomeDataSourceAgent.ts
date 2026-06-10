// HomeDataSourceAgent
// Purpose: Map Home widgets to real or future data sources — metadata only, no direct fetch
// Phase 2.2 — Foundation skeleton
// Architecture: Agents → Repositories → Storage Adapters

export type DataSourceType =
  | 'mock'
  | 'localStorage'
  | 'api'
  | 'json_file'
  | 'in_memory'
  | 'future_repository'
  | 'static_asset';

export interface DataSourceInfo {
  widgetId: string;
  widgetName: string;
  source: DataSourceType;
  isMock: boolean;
  quality: 'real' | 'mock' | 'partial' | 'static';
  recommendedRepository: string;
  feedsIntelligence: boolean;
  details: string;
}

export class HomeDataSourceAgent {
  /**
   * Map all Home widgets to their current and recommended data sources.
   * Based on HOME_DISCOVERY_REPORT.md and HOME_WIDGET_MAP.md.
   */
  async mapDataSources(): Promise<DataSourceInfo[]> {
    return this.getKnownDataSources();
  }

  /**
   * Get data source info for a specific widget by ID.
   */
  async getSourceForWidget(widgetId: string): Promise<DataSourceInfo | null> {
    const sources = await this.mapDataSources();
    return sources.find(s => s.widgetId === widgetId) ?? null;
  }

  /**
   * Classify a data source by type.
   */
  classifySource(source: DataSourceType): string {
    const classifications: Record<DataSourceType, string> = {
      mock: 'Hardcoded test data — not connected to any real source',
      localStorage: 'Browser storage — device-specific, not persistent across devices',
      api: 'API endpoint — reads from local JSON files or external service',
      json_file: 'Local JSON file in /data/ directory',
      in_memory: 'In-memory state — volatile, lost on page reload',
      future_repository: 'Not implemented yet — designed for future repository integration',
      static_asset: 'Static file (image, SVG) — no data dependency',
    };
    return classifications[source] ?? 'Unknown source type';
  }

  /**
   * Detect sources that are disconnected or not yet implemented.
   * Future: will check actual availability via repositories.
   */
  async detectDisconnectedSources(): Promise<DataSourceInfo[]> {
    const sources = await this.mapDataSources();
    return sources.filter(s =>
      s.source === 'mock' ||
      s.source === 'future_repository'
    );
  }

  /**
   * Recommend which repository should back each widget in the future.
   */
  async recommendRepositoryForWidget(widgetId: string): Promise<string | null> {
    const repoMap: Record<string, string> = {
      W1: 'StaticAssetRepository',
      W2: 'IntelligenceRepository',
      W3: 'WeatherRepository',
      W4: 'AppointmentRepository',
      W5: 'AppointmentRepository',
      W6: 'PlatformHealthRepository',
      W7: 'AppointmentRepository',
      W8: 'ClientRepository',
      W9: 'ClientRepository',
      W10: 'ClientRepository',
      W11: 'ClientRepository',
      W12: 'IntelligenceRepository',
      W13: 'IntelligenceRepository',
      W14: 'ClientRepository',
      W15: '(debug — no repository needed)',
    };
    return repoMap[widgetId] ?? null;
  }

  // --- Private helpers ---

  private getKnownDataSources(): DataSourceInfo[] {
    return [
      { widgetId: 'W1', widgetName: 'Salon Hero', source: 'static_asset', isMock: true, quality: 'static', recommendedRepository: 'None', feedsIntelligence: false, details: 'Static logo image + hardcoded text' },
      { widgetId: 'W2', widgetName: 'Header Feed', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'IntelligenceRepository', feedsIntelligence: false, details: '6 hardcoded tips rotating every 30s' },
      { widgetId: 'W3', widgetName: 'Weather/Date/Time', source: 'mock', isMock: true, quality: 'partial', recommendedRepository: 'WeatherRepository', feedsIntelligence: false, details: 'Date/time real (Date()), weather hardcoded "Santiago, 18°C"' },
      { widgetId: 'W4', widgetName: 'Appointment Flow List', source: 'api', isMock: false, quality: 'partial', recommendedRepository: 'AppointmentRepository', feedsIntelligence: false, details: 'Merged mock(5) + API(/api/appointments) — no isMock flag, no loading states' },
      { widgetId: 'W5', widgetName: 'Client Focus Card', source: 'in_memory', isMock: false, quality: 'partial', recommendedRepository: 'AppointmentRepository', feedsIntelligence: false, details: 'Derived from selected appointment — shows "Nuevo"/"0%" for real clients' },
      { widgetId: 'W6', widgetName: 'Platform Health Card', source: 'localStorage', isMock: false, quality: 'partial', recommendedRepository: 'PlatformHealthRepository', feedsIntelligence: false, details: 'localStorage("campaigns:meta-templates") + ("campaigns:template-health-history")' },
      { widgetId: 'W7', widgetName: 'KPI Metrics Cards', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'AppointmentRepository', feedsIntelligence: false, details: '3 hardcoded numbers: Ventas $2.84M, Potencial $3.42M, Ocupación 81%' },
      { widgetId: 'W8', widgetName: 'Dossier: Emotional Profile', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'ClientRepository', feedsIntelligence: false, details: '100% mock — broken for real appointments' },
      { widgetId: 'W9', widgetName: 'Dossier: Material Intelligence', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'ClientRepository', feedsIntelligence: false, details: '100% mock — broken for real appointments' },
      { widgetId: 'W10', widgetName: 'Dossier: Customer LTV', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'ClientRepository', feedsIntelligence: false, details: '100% mock — broken for real appointments' },
      { widgetId: 'W11', widgetName: 'Dossier: Arrival Behavior', source: 'localStorage', isMock: false, quality: 'real', recommendedRepository: 'ClientRepository', feedsIntelligence: false, details: 'localStorage("dashboard:arrival-records") — manual button press' },
      { widgetId: 'W12', widgetName: 'Dossier: AI Alerts', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'IntelligenceRepository', feedsIntelligence: false, details: '100% mock — 3 alerts per client, hardcoded' },
      { widgetId: 'W13', widgetName: 'Dossier: AI Recommendation', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'IntelligenceRepository', feedsIntelligence: false, details: '100% mock — 3 recommendations per client, hardcoded' },
      { widgetId: 'W14', widgetName: 'Dossier: Technical History', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'ClientRepository', feedsIntelligence: false, details: '100% mock — broken for real appointments' },
      { widgetId: 'W15', widgetName: 'Dossier: Technical Parameters', source: 'mock', isMock: true, quality: 'mock', recommendedRepository: 'None (debug)', feedsIntelligence: false, details: '100% mock — hidden by default, developer debug tool' },
    ];
  }
}
