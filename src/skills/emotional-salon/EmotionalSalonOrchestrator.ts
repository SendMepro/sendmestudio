// EmotionalSalonOrchestrator — Master coordination hub for the Emotional Salon platform
// Phase: skill-creation
// Status: foundation (skeleton — not connected to UI or business logic)

import { AgentRegistry, type AgentDefinition } from '../../agents/system/AgentRegistry';
import { AgentInspector, type InspectionReport } from '../../agents/system/AgentInspector';
import { CuratorAgent, type Checkpoint, type ChangeValidation } from '../../agents/system/CuratorAgent';
import { RecoveryAgent, type RecoveryReport } from '../../agents/system/RecoveryAgent';
import { HealthCheckAgent, type AgentHealthReport as HealthReport } from '../../agents/system/HealthCheckAgent';

export interface LearningEvent {
  type: 'client_engagement' | 'preference' | 'opportunity' | 'trend';
  section: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SystemStatus {
  orchestrator: string;
  phase: string;
  agents: { name: string; status: string }[];
  sections: Record<string, string>;
  health: string;
  lastCheckpoint: string | null;
}

export class EmotionalSalonOrchestrator {
  private phase = 'skill-creation';
  private initialized = false;

  /**
   * Initialize the orchestrator: register all system agents.
   * Must be called once before using the orchestrator.
   */
  async initialize(): Promise<{ success: boolean; agents: number }> {
    if (this.initialized) {
      return { success: true, agents: AgentRegistry.size };
    }

    const systemAgents: AgentDefinition[] = [
      {
        name: 'AgentRegistry',
        phase: 'system-agents-creation',
        status: 'active',
        category: 'system',
        dependencies: [],
        inputs: ['registerAgent(agentDef)', 'getAgent(name)', 'listAgents(phase?, category?)'],
        outputs: ['agent record', 'agent list'],
        description: 'Central agent registry',
      },
      {
        name: 'AgentInspector',
        phase: 'system-agents-creation',
        status: 'active',
        category: 'system',
        dependencies: ['AgentRegistry'],
        inputs: ['inspect(path)'],
        outputs: ['InspectionReport'],
        description: 'Inspects project sections',
      },
      {
        name: 'CuratorAgent',
        phase: 'system-agents-creation',
        status: 'active',
        category: 'system',
        dependencies: ['AgentRegistry'],
        inputs: ['createCheckpoint(id, desc, files, phase)', 'validateChange(change)'],
        outputs: ['Checkpoint', 'ChangeValidation'],
        description: 'Creates checkpoints and validates changes',
      },
      {
        name: 'RecoveryAgent',
        phase: 'system-agents-creation',
        status: 'active',
        category: 'system',
        dependencies: ['CuratorAgent', 'AgentRegistry'],
        inputs: ['restore(checkpointId)'],
        outputs: ['RecoveryReport'],
        description: 'Restores project to a stable checkpoint',
      },
      {
        name: 'HealthCheckAgent',
        phase: 'system-agents-creation',
        status: 'active',
        category: 'system',
        dependencies: ['AgentRegistry'],
        inputs: ['runChecks()'],
        outputs: ['AgentHealthReport'],
        description: 'Verifies build, lint, and route health',
      },
    ];

    for (const agentDef of systemAgents) {
      AgentRegistry.registerAgent(agentDef);
    }

    this.initialized = true;
    return { success: true, agents: AgentRegistry.size };
  }

  /**
   * Route a task to the appropriate section orchestrator.
   * Section agents are planned for future phases.
   */
  async routeSection(sectionName: string): Promise<{ status: string; message: string }> {
    if (!this.initialized) {
      return { status: 'error', message: 'Orchestrator not initialized. Call initialize() first.' };
    }

    switch (sectionName) {
      case 'home':
        return {
          status: 'planned',
          message: 'Home section agents are planned (Phase 2). Route to HomeOrchestratorAgent when available.',
        };
      case 'messages':
        return {
          status: 'planned',
          message: 'Messages section agents are planned (Phase 3). Route to ReceptionOrchestratorAgent when available.',
        };
      case 'campaigns':
        return {
          status: 'planned',
          message: 'Campaign section agents are planned (Phase 4). Route to CampaignOrchestratorAgent when available.',
        };
      case 'intelligence':
        return {
          status: 'planned',
          message: 'Intelligence section agents are planned (Phase 5). Route to IntelligenceOrchestratorAgent when available.',
        };
      default:
        return { status: 'error', message: `Unknown section: ${sectionName}` };
    }
  }

  /**
   * Run a health check on the project using HealthCheckAgent.
   */
  async runHealthCheck(): Promise<HealthReport> {
    return HealthCheckAgent.runChecks();
  }

  /**
   * Inspect a project section using AgentInspector.
   */
  async inspectSection(sectionPath: string): Promise<InspectionReport> {
    return AgentInspector.inspect(sectionPath);
  }

  /**
   * Validate a change for Meta/WhatsApp compliance before execution.
   * This is a placeholder — full compliance checks will use MetaReplyGuard and CampaignComplianceAgent.
   */
  async validateMetaCompliance(context: {
    action: string;
    recipient?: string;
    templateUsed?: boolean;
    hasConsent?: boolean;
  }): Promise<{ compliant: boolean; reason: string }> {
    // Placeholder compliance rules
    if (context.action === 'send_message' && !context.hasConsent) {
      return { compliant: false, reason: 'Cannot send message without customer opt-in consent' };
    }
    if (context.action === 'send_campaign' && !context.templateUsed) {
      return { compliant: false, reason: 'Campaign requires a Meta-approved template' };
    }
    return { compliant: true, reason: 'Context is compliant' };
  }

  /**
   * Send a learning event to the Intelligence section.
   * Currently queues the event — Intelligence agents are planned for Phase 5.
   */
  async sendLearningEvent(event: LearningEvent): Promise<{ accepted: boolean; queued: boolean }> {
    // Placeholder: in future phases, this will route to Intelligence agents
    console.log('[EmotionalSalonOrchestrator] Learning event received:', event.type, 'from', event.section);
    return { accepted: true, queued: true };
  }

  /**
   * Get the current system status: agents, sections, health, checkpoint.
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const agents = AgentRegistry.listAgents().map((a) => ({ name: a.name, status: a.status }));
    const lastCheckpoint = CuratorAgent.recentCheckpoints[0]?.id ?? null;

    return {
      orchestrator: 'EmotionalSalonOrchestrator',
      phase: this.phase,
      agents,
      sections: {
        home: 'planned',
        messages: 'planned',
        campaigns: 'planned',
        intelligence: 'planned',
      },
      health: 'stable',
      lastCheckpoint,
    };
  }

  /**
   * Get the next recommended step for the project.
   */
  async getNextStep(): Promise<{ phase: string; step: string; description: string }> {
    return {
      phase: 'skill-creation',
      step: 'Create Home section agents',
      description:
        'Create src/agents/home/ with HomeOrchestratorAgent, HomeInspectorAgent, HomeDataSourceAgent, HomeHealthCheckAgent, and HomeLearningAgent',
    };
  }
}

// Singleton export
export const orchestrator = new EmotionalSalonOrchestrator();
