// AgentInspector — Inspects project sections and the agent registry for structure, contracts, and health
// Phase: CP-97 / System Governance Phase 2
// Status: enhanced — added agent inspection, contract detection, health detection, registry cross-reference

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { AgentRegistry } from './AgentRegistry';
import type { AgentCategory } from './types';
import type { AgentHealthReport } from './HealthCheckAgent';

// ─────────────────────────────────────────────────────
// Report types
// ─────────────────────────────────────────────────────

export interface RegistryHealth {
  registered: number;
  agentsWithCode: number;
  agentsWithoutCode: string[];
  codeFilesWithoutRegistration: string[];
}

export interface SectionCompletion {
  planned: number;
  created: number;
  active: number;
  missing: string[];
}

export interface DependencyIssue {
  agent: string;
  missingDependency: string;
}

export interface ContractCompliance {
  total: number;
  withPing: number;
  withoutPing: string[];
  withHealth: number;
  withoutHealth: string[];
}

export interface AgentInspectionDetail {
  name: string;
  category: AgentCategory;
  status: string;
  lifecycleStatus: string | null;
  hasCodeFile: boolean;
  hasPingMethod: boolean;
  hasHealthMethod: boolean;
  dependencyIssues: string[];
  health: 'healthy' | 'warning' | 'critical';
}

/**
 * Full inspection report combining filesystem + registry analysis.
 * Extends the original InspectionReport with agent-level fields.
 */
export interface InspectionReport {
  // Legacy fields (filesystem inspection)
  section: string;
  path: string;
  files: string[];
  dependencies: string[];
  issues: string[];
  health: 'healthy' | 'warning' | 'critical';
  inspectedAt: string;

  // NEW: Agent-level inspection fields
  registryHealth: RegistryHealth;
  sectionCompletion: SectionCompletion;
  dependencyIssues: DependencyIssue[];
  contractCompliance: ContractCompliance;
  agentDetails: AgentInspectionDetail[];
}

// ─────────────────────────────────────────────────────
// AgentInspector
// ─────────────────────────────────────────────────────

class AgentInspectorInternal {
  /**
   * Inspect a filesystem path for structure, files, and dependencies.
   * This is the original method — unchanged except the return type is now
   * the extended InspectionReport.
   */
  async inspect(sectionPath: string): Promise<InspectionReport> {
    const files: string[] = [];
    const dependencies = new Set<string>();
    const issues: string[] = [];

    // Recursively collect files
    async function walk(dir: string) {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        issues.push(`Cannot read directory: ${dir}`);
        return;
      }
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('node_modules') && !entry.name.startsWith('.')) {
            await walk(fullPath);
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css')) {
          files.push(fullPath);
          if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            try {
              const content = await readFile(fullPath, 'utf-8');
              const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
              for (const match of importMatches) {
                dependencies.add(match[1]);
              }
            } catch {
              issues.push(`Cannot read file: ${fullPath}`);
            }
          }
        }
      }
    }

    await walk(sectionPath);

    const legacyHealth: InspectionReport['health'] =
      issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'critical';

    const sectionName = sectionPath.split(/[/\\]/).pop() || sectionPath;

    // Build the agent-level inspection
    const agentInspection = this.inspectAllAgents(sectionName);

    return {
      // Legacy
      section: sectionName,
      path: sectionPath,
      files,
      dependencies: Array.from(dependencies).sort(),
      issues,
      health: this.mergeHealth(legacyHealth, agentInspection.overallHealth),
      inspectedAt: new Date().toISOString(),

      // Agent-level
      registryHealth: agentInspection.registryHealth,
      sectionCompletion: agentInspection.sectionCompletion,
      dependencyIssues: agentInspection.dependencyIssues,
      contractCompliance: agentInspection.contractCompliance,
      agentDetails: agentInspection.agentDetails,
    };
  }

  /**
   * Inspect agents registered in AgentRegistry for a specific section.
   * Filters by category or phase to scope the inspection.
   */
  async inspectSectionAgents(sectionName: string): Promise<{
    agents: AgentInspectionDetail[];
    sectionCompletion: SectionCompletion;
    dependencyIssues: DependencyIssue[];
    contractCompliance: ContractCompliance;
    health: 'healthy' | 'warning' | 'critical';
  }> {
    const allAgents = AgentRegistry.listAgents(undefined, undefined);
    const sectionAgents = allAgents.filter((a) => {
      // Match by: section name in phase, or matching category
      const phaseMatch = a.phase.toLowerCase().includes(sectionName.toLowerCase());
      const categoryMatch = a.category === sectionNameToCategory(sectionName);
      const nameMatch = a.name.toLowerCase().includes(sectionName.toLowerCase());
      return phaseMatch || categoryMatch || nameMatch;
    });

    const details = sectionAgents.map((a) => this.inspectSingleAgent(a.name));
    const detailsResolved = await Promise.all(details);

    return this.buildSectionReport(detailsResolved, sectionAgents.length);
  }

  /**
   * Inspect ALL registered agents in AgentRegistry.
   * Cross-references registrations vs filesystem code.
   */
  private inspectAllAgents(sectionFilter?: string): {
    registryHealth: RegistryHealth;
    sectionCompletion: SectionCompletion;
    dependencyIssues: DependencyIssue[];
    contractCompliance: ContractCompliance;
    agentDetails: AgentInspectionDetail[];
    overallHealth: 'healthy' | 'warning' | 'critical';
  } {
    const allAgents = AgentRegistry.listAgents(undefined, undefined);

    // RegistryHealth: cross-reference registrations vs code files
    const registryHealth = this.buildRegistryHealth(allAgents);

    // SectionCompletion: count planned vs created vs active
    const sectionCompletion = this.buildSectionCompletion(allAgents);

    // DependencyIssues: check each agent's dependencies are registered
    const dependencyIssues = this.buildDependencyIssues(allAgents);

    // ContractCompliance: check which agents implement ping()/health()
    const contractCompliance = this.buildContractCompliance(allAgents);

    // AgentDetails: detailed per-agent inspection
    const agentDetails = allAgents.map((a) => this.inspectSingleAgentSync(a.name));

    // Overall health
    const criticalCount = agentDetails.filter((a) => a.health === 'critical').length;
    const warningCount = agentDetails.filter((a) => a.health === 'warning').length;
    const overallHealth: 'healthy' | 'warning' | 'critical' =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

    return {
      registryHealth,
      sectionCompletion,
      dependencyIssues,
      contractCompliance,
      agentDetails,
      overallHealth,
    };
  }

  /**
   * Inspect a single agent by name: code file existence, ping/health methods, dependencies.
   */
  private async inspectSingleAgent(agentName: string): Promise<AgentInspectionDetail> {
    const record = AgentRegistry.getAgent(agentName);
    if (!record) {
      return {
        name: agentName,
        category: 'planned',
        status: 'unknown',
        lifecycleStatus: null,
        hasCodeFile: false,
        hasPingMethod: false,
        hasHealthMethod: false,
        dependencyIssues: ['Agent not found in registry'],
        health: 'critical',
      };
    }

    const hasCodeFile = await this.agentFileExists(record.name);
    const contractCheck = await this.detectContractMethods(record.name, hasCodeFile);
    const depIssues = await this.checkDependencies(record.dependencies);

    const health = this.determineAgentHealth(record, hasCodeFile, contractCheck, depIssues);

    return {
      name: record.name,
      category: record.category,
      status: record.status,
      lifecycleStatus: record.lifecycleStatus ?? null,
      hasCodeFile,
      hasPingMethod: contractCheck.hasPing,
      hasHealthMethod: contractCheck.hasHealth,
      dependencyIssues: depIssues,
      health,
    };
  }

  /** Sync version used when inspecting all agents at once (avoids N promises in constructor). */
  private inspectSingleAgentSync(agentName: string): AgentInspectionDetail {
    const record = AgentRegistry.getAgent(agentName);
    if (!record) {
      return {
        name: agentName,
        category: 'planned',
        status: 'unknown',
        lifecycleStatus: null,
        hasCodeFile: false,
        hasPingMethod: false,
        hasHealthMethod: false,
        dependencyIssues: ['Agent not found in registry'],
        health: 'critical',
      };
    }

    const hasCodeFile = this.agentFileExistsSync(record.name);
    // For sync bulk inspection, we do a quick file scan instead of AST parsing
    const contractCheck = this.detectContractMethodsSync(record.name, hasCodeFile);
    const depIssues = this.checkDependenciesSync(record.dependencies);

    const health = this.determineAgentHealth(record, hasCodeFile, contractCheck, depIssues);

    return {
      name: record.name,
      category: record.category,
      status: record.status,
      lifecycleStatus: record.lifecycleStatus ?? null,
      hasCodeFile,
      hasPingMethod: contractCheck.hasPing,
      hasHealthMethod: contractCheck.hasHealth,
      dependencyIssues: depIssues,
      health,
    };
  }

  // ── Helpers ──

  private async agentFileExists(agentName: string): Promise<boolean> {
    // Agents are typically in src/agents/{category}/{agentName}.ts
    // We check both the category subfolder and the system folder
    const possiblePaths = [
      resolve(process.cwd(), 'src', 'agents', 'system', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'intelligence', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'recommendations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'consumers', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'campaigns', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'salon-operations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'skills', 'emotional-salon', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'bridges', `${agentName}.ts`),
    ];
    for (const p of possiblePaths) {
      if (existsSync(p)) return true;
    }
    return false;
  }

  private agentFileExistsSync(agentName: string): boolean {
    return this.agentFileExistsSyncImpl(agentName);
  }

  // Avoid name collision between sync/async — use a separate private method
  private agentFileExistsSyncImpl(agentName: string): boolean {
    const possiblePaths = [
      resolve(process.cwd(), 'src', 'agents', 'system', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'intelligence', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'recommendations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'consumers', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'campaigns', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'salon-operations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'skills', 'emotional-salon', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'bridges', `${agentName}.ts`),
    ];
    for (const p of possiblePaths) {
      if (existsSync(p)) return true;
    }
    return false;
  }

  private async detectContractMethods(
    agentName: string,
    hasCodeFile: boolean,
  ): Promise<{ hasPing: boolean; hasHealth: boolean }> {
    if (!hasCodeFile) return { hasPing: false, hasHealth: false };

    const possiblePaths = [
      resolve(process.cwd(), 'src', 'agents', 'system', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'intelligence', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'recommendations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'consumers', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'campaigns', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'salon-operations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'skills', 'emotional-salon', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'bridges', `${agentName}.ts`),
    ];

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        try {
          const content = await readFile(p, 'utf-8');
          const hasPing = /async\s+ping\s*\(/.test(content) || /ping\s*\(\s*\)/.test(content);
          const hasHealth = /async\s+health\s*\(/.test(content) || /health\s*\(\s*\)/.test(content);
          return { hasPing, hasHealth };
        } catch {
          return { hasPing: false, hasHealth: false };
        }
      }
    }

    return { hasPing: false, hasHealth: false };
  }

  private detectContractMethodsSync(
    agentName: string,
    hasCodeFile: boolean,
  ): { hasPing: boolean; hasHealth: boolean } {
    if (!hasCodeFile) return { hasPing: false, hasHealth: false };

    const possiblePaths = [
      resolve(process.cwd(), 'src', 'agents', 'system', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'intelligence', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'recommendations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'home', 'consumers', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'campaigns', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', 'salon-operations', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'agents', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'skills', 'emotional-salon', `${agentName}.ts`),
      resolve(process.cwd(), 'src', 'bridges', `${agentName}.ts`),
    ];

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        try {
          const content = readFileSync(p, 'utf-8');
          const hasPing = /async\s+ping\s*\(/.test(content) || /ping\s*\(\s*\)/.test(content);
          const hasHealth = /async\s+health\s*\(/.test(content) || /health\s*\(\s*\)/.test(content);
          return { hasPing, hasHealth };
        } catch {
          return { hasPing: false, hasHealth: false };
        }
      }
    }

    return { hasPing: false, hasHealth: false };
  }

  private async checkDependencies(deps: string[]): Promise<string[]> {
    if (!deps || deps.length === 0) return [];
    const missing: string[] = [];
    for (const dep of deps) {
      // Skip npm packages — only check agent dependencies
      if (dep.startsWith('Agent') || dep.includes('Agent')) {
        const record = AgentRegistry.getAgent(dep);
        if (!record) {
          missing.push(`Dependency '${dep}' is not registered in AgentRegistry`);
        }
      }
    }
    return missing;
  }

  private checkDependenciesSync(deps: string[]): string[] {
    if (!deps || deps.length === 0) return [];
    const missing: string[] = [];
    for (const dep of deps) {
      if (dep.startsWith('Agent') || dep.includes('Agent')) {
        const record = AgentRegistry.getAgent(dep);
        if (!record) {
          missing.push(`Dependency '${dep}' is not registered in AgentRegistry`);
        }
      }
    }
    return missing;
  }

  private buildRegistryHealth(allAgents: AgentRegistryRecord[]): RegistryHealth {
    const codeFilesWithoutRegistration: string[] = [];
    // Check all known agent .ts files against registrations
    const allAgentFiles = this.findAllAgentFiles();
    for (const filePath of allAgentFiles) {
      const fileName = filePath.split(/[/\\]/).pop()?.replace(/\.ts$/, '') ?? '';
      const registered = allAgents.some((a) => a.name === fileName);
      if (!registered) {
        codeFilesWithoutRegistration.push(fileName);
      }
    }

    const agentsWithoutCode: string[] = [];
    for (const agent of allAgents) {
      if (!this.agentFileExistsSyncImpl(agent.name)) {
        agentsWithoutCode.push(agent.name);
      }
    }

    return {
      registered: allAgents.length,
      agentsWithCode: allAgents.length - agentsWithoutCode.length,
      agentsWithoutCode,
      codeFilesWithoutRegistration,
    };
  }

  private findAllAgentFiles(): string[] {
    const results: string[] = [];
    const dirs = [
      resolve(process.cwd(), 'src', 'agents', 'system'),
      resolve(process.cwd(), 'src', 'agents', 'home'),
      resolve(process.cwd(), 'src', 'agents', 'campaigns'),
      resolve(process.cwd(), 'src', 'agents', 'salon-operations'),
      resolve(process.cwd(), 'src', 'skills', 'emotional-salon'),
      resolve(process.cwd(), 'src', 'bridges'),
    ];
    // Root-level agent files in src/agents/*.ts are picked up separately.
    const rootDir = resolve(process.cwd(), 'src', 'agents');
    for (const dir of dirs) {
      if (existsSync(dir)) {
        try {
          const entries = readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
              results.push(resolve(dir, entry.name));
            }
          }
        } catch {
          // skip
        }
      }
    }
    // Also scan root-level agent files
    if (existsSync(rootDir)) {
      try {
        const entries = readdirSync(rootDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(resolve(rootDir, entry.name));
          }
        }
      } catch {
        // skip
      }
    }
    return results;
  }

  private buildSectionCompletion(allAgents: AgentRegistryRecord[]): SectionCompletion {
    const planned = allAgents.filter((a) => a.status === 'pending').length;
    const created = allAgents.filter((a) => a.status === 'inactive').length;
    const active = allAgents.filter((a) => a.status === 'active').length;
    const missing = allAgents
      .filter((a) => a.status === 'pending' && !this.agentFileExistsSyncImpl(a.name))
      .map((a) => a.name);

    return { planned, created, active, missing };
  }

  private buildDependencyIssues(allAgents: AgentRegistryRecord[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    for (const agent of allAgents) {
      for (const dep of agent.dependencies) {
        if (dep.startsWith('Agent') || dep.includes('Agent')) {
          const record = AgentRegistry.getAgent(dep);
          if (!record) {
            issues.push({ agent: agent.name, missingDependency: dep });
          }
        }
      }
    }
    return issues;
  }

  private buildContractCompliance(allAgents: AgentRegistryRecord[]): ContractCompliance {
    // For bulk sync check, use sync method
    let withPing = 0;
    let withHealth = 0;
    const withoutPing: string[] = [];
    const withoutHealth: string[] = [];

    for (const agent of allAgents) {
      const hasCode = this.agentFileExistsSyncImpl(agent.name);
      if (!hasCode) {
        withoutPing.push(agent.name);
        withoutHealth.push(agent.name);
        continue;
      }
      const { hasPing, hasHealth } = this.detectContractMethodsSync(agent.name, hasCode);
      if (hasPing) withPing++;
      else withoutPing.push(agent.name);
      if (hasHealth) withHealth++;
      else withoutHealth.push(agent.name);
    }

    return {
      total: allAgents.length,
      withPing,
      withoutPing,
      withHealth,
      withoutHealth,
    };
  }

  private determineAgentHealth(
    record: AgentRegistryRecord,
    hasCodeFile: boolean,
    contractCheck: { hasPing: boolean; hasHealth: boolean },
    depIssues: string[],
  ): 'healthy' | 'warning' | 'critical' {
    if (!hasCodeFile) return 'critical';
    if (depIssues.length > 0) return 'critical';
    if (!contractCheck.hasPing && record.status === 'active') return 'warning';
    if (!contractCheck.hasHealth && record.status === 'active') return 'warning';
    return 'healthy';
  }

  private buildSectionReport(
    details: AgentInspectionDetail[],
    totalAgents: number,
  ): {
    agents: AgentInspectionDetail[];
    sectionCompletion: SectionCompletion;
    dependencyIssues: DependencyIssue[];
    contractCompliance: ContractCompliance;
    health: 'healthy' | 'warning' | 'critical';
  } {
    const planned = details.filter((a) => a.status === 'pending').length;
    const created = details.filter((a) => a.status === 'inactive').length;
    const active = details.filter((a) => a.status === 'active').length;
    const missing = details.filter((a) => a.status === 'pending' && !a.hasCodeFile).map((a) => a.name);

    const depIssues: DependencyIssue[] = [];
    for (const agent of details) {
      if (agent.dependencyIssues.length > 0) {
        for (const issue of agent.dependencyIssues) {
          depIssues.push({ agent: agent.name, missingDependency: issue });
        }
      }
    }

    const contractCompliance: ContractCompliance = {
      total: details.length,
      withPing: details.filter((a) => a.hasPingMethod).length,
      withoutPing: details.filter((a) => !a.hasPingMethod).map((a) => a.name),
      withHealth: details.filter((a) => a.hasHealthMethod).length,
      withoutHealth: details.filter((a) => !a.hasHealthMethod).map((a) => a.name),
    };

    const criticalCount = details.filter((a) => a.health === 'critical').length;
    const warningCount = details.filter((a) => a.health === 'warning').length;
    const health: 'healthy' | 'warning' | 'critical' =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

    return {
      agents: details,
      sectionCompletion: { planned, created, active, missing },
      dependencyIssues: depIssues,
      contractCompliance,
      health,
    };
  }

  private mergeHealth(
    legacyHealth: 'healthy' | 'warning' | 'critical',
    agentHealth: 'healthy' | 'warning' | 'critical',
  ): 'healthy' | 'warning' | 'critical' {
    if (legacyHealth === 'critical' || agentHealth === 'critical') return 'critical';
    if (legacyHealth === 'warning' || agentHealth === 'warning') return 'warning';
    return 'healthy';
  }
}

/** Helper to resolve category from a section name for AgentRegistry filtering. */
function sectionNameToCategory(name: string): AgentCategory {
  const map: Record<string, AgentCategory> = {
    home: 'section',
    messages: 'section',
    campaigns: 'section',
    intelligence: 'section',
    system: 'system',
    bridge: 'bridge',
  };
  return map[name.toLowerCase()] ?? 'leaf';
}

// Helper type for AgentRecord used internally — matches the AgentRecord interface from AgentRegistry
interface AgentRegistryRecord {
  name: string;
  category: AgentCategory;
  status: string;
  lifecycleStatus?: string | null;
  dependencies: string[];
  phase: string;
  inputs: string[];
  outputs: string[];
  description: string;
  registeredAt: string;
  updatedAt: string;
}

export const AgentInspector = new AgentInspectorInternal();
