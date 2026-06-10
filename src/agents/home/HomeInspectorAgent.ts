// HomeInspectorAgent
// Purpose: Inspect Home widgets and detect problems — mock data, missing sources, broken flows
// Phase 2.2 — Foundation skeleton
// Architecture: Agents → Repositories → Storage Adapters

import { DataSourceInfo } from './HomeDataSourceAgent';

export interface InspectionIssue {
  widgetId: string;
  widgetName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'mock_data' | 'missing_source' | 'broken_flow' | 'no_intelligence' | 'local_storage';
  description: string;
  recommendation: string;
}

export interface InspectionSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: InspectionIssue[];
  healthy: boolean;
  timestamp: string;
}

export class HomeInspectorAgent {
  /**
   * Inspect all Home widgets and detect known problems.
   * Based on HOME_CRITICAL_FINDINGS.md and HOME_WIDGET_MAP.md.
   */
  async inspectWidgets(dataSources?: DataSourceInfo[]): Promise<InspectionSummary> {
    const issues = this.generateKnownIssues();
    return {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      mediumIssues: issues.filter(i => i.severity === 'medium').length,
      lowIssues: issues.filter(i => i.severity === 'low').length,
      issues,
      healthy: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect widgets that use mock data.
   */
  async detectMockData(dataSources?: DataSourceInfo[]): Promise<InspectionIssue[]> {
    const allIssues = this.generateKnownIssues();
    return allIssues.filter(i => i.category === 'mock_data');
  }

  /**
   * Detect missing data sources.
   */
  async detectMissingSources(dataSources?: DataSourceInfo[]): Promise<InspectionIssue[]> {
    const allIssues = this.generateKnownIssues();
    return allIssues.filter(i => i.category === 'missing_source');
  }

  /**
   * Detect critical-risk widgets only.
   */
  async detectCriticalWidgets(dataSources?: DataSourceInfo[]): Promise<InspectionIssue[]> {
    const allIssues = this.generateKnownIssues();
    return allIssues.filter(i => i.severity === 'critical');
  }

  /**
   * Generate a complete inspection summary as a string.
   */
  async generateInspectionSummary(dataSources?: DataSourceInfo[]): Promise<string> {
    const summary = await this.inspectWidgets(dataSources);
    const lines: string[] = [];
    lines.push(`=== Home Inspection Report ===`);
    lines.push(`Timestamp: ${summary.timestamp}`);
    lines.push(`Total issues: ${summary.totalIssues}`);
    lines.push(`  Critical: ${summary.criticalIssues}`);
    lines.push(`  High:     ${summary.highIssues}`);
    lines.push(`  Medium:   ${summary.mediumIssues}`);
    lines.push(`  Low:      ${summary.lowIssues}`);
    lines.push(`Healthy: ${summary.healthy ? 'YES' : 'NO'}`);
    lines.push('');
    lines.push('Issues:');
    for (const issue of summary.issues) {
      lines.push(`  [${issue.severity.toUpperCase()}] [${issue.category}] ${issue.widgetName} (${issue.widgetId}): ${issue.description}`);
      lines.push(`    → ${issue.recommendation}`);
    }
    return lines.join('\n');
  }

  // --- Private helpers ---

  private generateKnownIssues(): InspectionIssue[] {
    return [
      // Critical — mock data (Finding 5 from HOME_CRITICAL_FINDINGS.md)
      {
        widgetId: 'W8', widgetName: 'Emotional Profile',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — broken for real appointments. Real clients get generic default profile.',
        recommendation: 'Connect to ClientRepository with real client data. Show "en construcción" state until ready.',
      },
      {
        widgetId: 'W9', widgetName: 'Material Intelligence',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — broken for real appointments. No real material data for actual clients.',
        recommendation: 'Connect to ClientRepository. Aggregate from service history and customer records.',
      },
      {
        widgetId: 'W10', widgetName: 'Customer LTV',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — shows "Nuevo / New" and "0% repurchase" for real returning clients.',
        recommendation: 'Calculate from AppointmentRepository.getByClientId() + service pricing data.',
      },
      {
        widgetId: 'W12', widgetName: 'AI Alerts',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — 3 hardcoded alerts per mock client. Gives false sense of AI capability.',
        recommendation: 'Replace with real alerts from IntelligenceRepository or rule-based detection.',
      },
      {
        widgetId: 'W13', widgetName: 'AI Recommendation',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — 3 hardcoded recommendations per mock client. Most visible AI feature shows fake data.',
        recommendation: 'Replace with real recommendations from HomeAIInsightAgent + IntelligenceRepository.',
      },
      {
        widgetId: 'W14', widgetName: 'Technical History',
        severity: 'critical', category: 'mock_data',
        description: '100% mock — broken for real appointments. Stylists rely on this for service decisions.',
        recommendation: 'Connect to ClientRepository. Build from real service records and stylist observations.',
      },
      // High — missing sources / no pipeline
      {
        widgetId: 'W7', widgetName: 'KPI Metrics Cards',
        severity: 'high', category: 'missing_source',
        description: '3 hardcoded numbers that never change ($2.84M, $3.42M, 81%). No calculation API exists.',
        recommendation: 'Build HomeMetricsAgent that uses AppointmentRepository for real aggregations.',
      },
      {
        widgetId: 'W6', widgetName: 'Platform Health Card',
        severity: 'high', category: 'local_storage',
        description: 'Uses localStorage only. Inconsistent across devices. Falls back to hardcoded 92/Healthy.',
        recommendation: 'Migrate to PlatformHealthRepository with LocalStorageAdapter. Plan server-side storage.',
      },
      {
        widgetId: 'W4', widgetName: 'Appointment Flow List',
        severity: 'high', category: 'broken_flow',
        description: 'Mock data masks empty real data. Silent catch on API failure. No loading states. No isMock flag.',
        recommendation: 'Add isMock flag, loading skeleton, and visual distinction between mock and real appointments.',
      },
      {
        widgetId: 'W5', widgetName: 'Client Focus Card',
        severity: 'high', category: 'broken_flow',
        description: 'Shows "Nuevo"/"0%" for real returning clients. Derived from broken dossier data.',
        recommendation: 'Add graceful degradation state. Show "perfil en construcción" for real clients without intelligence.',
      },
      // Medium — no intelligence pipeline
      {
        widgetId: 'W4', widgetName: 'Appointment Flow List',
        severity: 'medium', category: 'no_intelligence',
        description: 'Appointment data (services, stylists, statuses) does NOT feed Intelligence.',
        recommendation: 'Wire to HomeLearningAgent → IntelligenceRepository.pushEvent().',
      },
      {
        widgetId: 'W8', widgetName: 'Emotional Profile',
        severity: 'medium', category: 'no_intelligence',
        description: 'Emotional profile selections never feed Intelligence for pattern learning.',
        recommendation: 'Capture as LearningEvent type "client_preference_detected".',
      },
      {
        widgetId: 'W11', widgetName: 'Arrival Behavior',
        severity: 'low', category: 'no_intelligence',
        description: 'Arrival records stored in localStorage but never forwarded to Intelligence.',
        recommendation: 'Add LearningEvent type "client_arrived" via HomeLearningAgent.',
      },
      {
        widgetId: 'W2', widgetName: 'Header Feed',
        severity: 'low', category: 'no_intelligence',
        description: 'Static tips — could be dynamically generated by Intelligence from operational data.',
        recommendation: 'Future: generate tips from SalonTrendsAgent or real-time operational data.',
      },
    ];
  }
}
