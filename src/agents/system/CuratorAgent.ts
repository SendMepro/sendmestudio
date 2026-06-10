// CuratorAgent — Creates checkpoints and validates changes during refactor
// Phase: system-agents-creation
// Status: stable

export interface Checkpoint {
  id: string;
  description: string;
  timestamp: string;
  filesTouched: string[];
  phase: string;
  status: 'stable' | 'rollback' | 'in_progress';
}

export interface ChangeValidation {
  allowed: boolean;
  reason: string;
}

class CuratorAgentInternal {
  private checkpoints: Checkpoint[] = [];

  createCheckpoint(id: string, description: string, filesTouched: string[], phase: string): Checkpoint {
    const cp: Checkpoint = {
      id,
      description,
      timestamp: new Date().toISOString(),
      filesTouched,
      phase,
      status: 'stable',
    };
    this.checkpoints.push(cp);
    return cp;
  }

  validateChange(change: { action: string; target: string; content?: string }): ChangeValidation {
    // Never allow modification of data/ or keys/ or business-brain/
    const forbidden = ['/data/', '/keys/', '/business-brain/'];
    for (const prefix of forbidden) {
      if (change.target.includes(prefix)) {
        return { allowed: false, reason: `Cannot modify protected path: ${prefix}` };
      }
    }

    // For destructive actions (delete, overwrite), require explicit confirmation
    if (change.action === 'delete' || change.action === 'overwrite') {
      return {
        allowed: false,
        reason: `Destructive action '${change.action}' requires explicit checkpoint + recovery plan first`,
      };
    }

    return { allowed: true, reason: 'Change is safe' };
  }

  getCheckpoint(id: string): Checkpoint | undefined {
    return this.checkpoints.find((cp) => cp.id === id);
  }

  get recentCheckpoints(): Checkpoint[] {
    return [...this.checkpoints].reverse();
  }

  markRollback(id: string): boolean {
    const cp = this.checkpoints.find((c) => c.id === id);
    if (!cp) return false;
    cp.status = 'rollback';
    return true;
  }
}

export const CuratorAgent = new CuratorAgentInternal();
