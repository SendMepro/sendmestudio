// src/repositories/PlatformHealthRepository.ts
// Purpose: Read platform health data from localStorage via adapter.
// Repository pattern: UI never touches localStorage directly.
// Phase 2.7 — W6 Platform Health Repository Migration

import { localStorageAdapter } from '../adapters/LocalStorageAdapter';

export interface PlatformHealthData {
  score: number;
  status: 'Excellent' | 'Healthy' | 'Warning' | 'Critical';
  detail: string;
}

interface MetaTemplate {
  metaStatus?: string;
}

interface TemplateHealthRecord {
  riskLevel?: string;
}

export class PlatformHealthRepository {
  private readonly templatesKey = 'campaigns:meta-templates';
  private readonly historyKey = 'campaigns:template-health-history';

  /**
   * Get current platform health, calculated from campaign template data.
   * Falls back to default health if no data exists.
   */
  getHealth(): PlatformHealthData {
    return this.calculateFromTemplateData();
  }

  /**
   * Calculate health score from template rejection and risk data.
   * Core algorithm extracted from inline calculatePlatformHealth() in page.tsx.
   */
  calculateFromTemplateData(): PlatformHealthData {
    const templates = localStorageAdapter.getJSON<MetaTemplate[]>(this.templatesKey, []);
    const history = localStorageAdapter.getJSON<TemplateHealthRecord[]>(this.historyKey, []);

    const rejected = templates.filter((t) => t.metaStatus === 'rejected').length;
    const highRisk = history.filter((r) => r.riskLevel === 'High Risk').length;
    const mediumRisk = history.filter((r) => r.riskLevel === 'Medium Risk').length;

    const score = Math.max(38, Math.min(98, 96 - rejected * 9 - highRisk * 10 - mediumRisk * 4));
    const status = score >= 94 ? 'Excellent' : score >= 82 ? 'Healthy' : score >= 64 ? 'Warning' : 'Critical';

    return {
      score,
      status,
      detail:
        status === 'Excellent'
          ? 'Templates, read quality and engagement look strong'
          : status === 'Healthy'
            ? 'Delivery quality stable'
            : status === 'Warning'
              ? 'Review rejection and spam-risk signals'
              : 'Pause and review campaign compliance',
    };
  }

  /**
   * Get raw template health history records.
   */
  getHistory(): TemplateHealthRecord[] {
    return localStorageAdapter.getJSON<TemplateHealthRecord[]>(this.historyKey, []);
  }

  /**
   * Check if template data exists in localStorage.
   */
  hasData(): boolean {
    return localStorageAdapter.has(this.templatesKey) || localStorageAdapter.has(this.historyKey);
  }
}

// Singleton for app-wide use
export const platformHealthRepository = new PlatformHealthRepository();
