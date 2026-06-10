# CP-99 — RecoveryAgent Enhancement Report

**Generated:** 2026-05-31T01:22 UTC  
**Phase:** System Governance Phase 4 (RecoveryAgent real restore)  
**Status:** ✅ Complete — all validations pass

---

## Scope

Implement Phase 4 of the System Governance plan as defined in `CP95_SYSTEM_GOVERNANCE_PLAN.md`:

1. **Replace placeholder restore loop** with real file restoration via git (with file-copy fallback)
2. **Add auto-stash** before git restore to avoid merge conflicts with working changes
3. **Add per-agent restore** — restore only files matching a specific agent name
4. **Add per-agent restart** — signal an agent to restart (simulated, awaiting LifecycleAgent Phase 5)
5. **Add per-agent deactivation** — mark an agent as inactive in AgentRegistry
6. **Add section rollback** — restore all checkpoints matching a section name
7. **Add strategy detection** — probe for git, fall back to file-copy, or report none
8. **Add post-recovery verification** — re-run HealthCheckAgent + AgentInspector after restore
9. **Add `validateRestoreCapability`** — check if a checkpoint is actually restorable before attempting

---

## Files Modified

| File | Lines | Change | Delta |
|------|-------|--------|-------|
| `src/agents/system/RecoveryAgent.ts` | 477 | Complete rewrite — placeholder loop → real git/file-copy restore with full verification pipeline | ~+420 lines |

## Files Created

None — pure enhancement of existing file, as planned.

---

## New Capabilities

| Capability | Method | Details |
|------------|--------|---------|
| **Git restore** | `restoreViaGit()` | Uses `git restore -- <file>` (modern) with `git checkout -- <file>` fallback. Auto-stashes working changes first. |
| **File-copy fallback** | `restoreViaFileCopy()` | Copies files from `project-memory/checkpoints/<id>/` when git is unavailable. Creates target directories as needed. |
| **Strategy detection** | `detectStrategy()` | Probes `git --version` + `git rev-parse --git-dir` first. Falls back to file-copy if checkpoint backup dir exists. Returns `'none'` otherwise. |
| **Per-agent restore** | `restore(id, agentName?)` | Optional second parameter filters files to those containing the agent name. |
| **Agent restart** | `restartAgent(name)` | Simulated restart — logs intent, returns success. Real lifecycle integration pending Phase 5. |
| **Agent deactivation** | `deactivateAgent(name)` | Updates AgentRegistry status to `'inactive'` via dynamic import (avoids circular dependency). |
| **Section rollback** | `rollbackSection(name)` | Finds all checkpoints matching section name in phase or file paths, restores each sequentially. |
| **Pre-restore validation** | `validateRestoreCapability(id)` | Checks checkpoint existence + strategy availability before attempting restore. |
| **Post-recovery verification** | `restore()` pipeline | After file restore, runs `HealthCheckAgent.runChecks()` + `AgentInspector.inspect()` automatically. Results included in `RecoveryReport`. |
| **Step-by-step report** | `RecoveryReport.steps` | Each recovery phase recorded as `{ step, status, detail }` for audit trails. |

---

## Recovery Pipeline (`restore()`)

```
validate-checkpoint → detect-strategy → restore-files → mark-rollback
  → post-health-check → post-inspection → overall
```

Each step is recorded as a `RecoveryStep` in the report. If a step fails, later steps still run (e.g., inspection runs even if health check partially fails).

---

## RecoveryReport Changes

| Field | Type | Description |
|-------|------|-------------|
| `agentName` | `string \| null` | NEW — which agent was restored, or null for full-system |
| `steps` | `RecoveryStep[]` | NEW — detailed step-by-step audit trail |
| `postHealthCheck` | `AgentHealthReport \| null` | NEW — HealthCheckAgent result after restore |
| `postInspection` | `InspectionReport \| null` | NEW — AgentInspector result after restore |

Original fields (`checkpointId`, `success`, `restored`, `failed`, `errors`, `recoveredAt`) unchanged.

---

## Integration

### SystemSupervisorAgent

The supervisor's `runRecovery(checkpointId)` calls `RecoveryAgent.restore(checkpointId)` — the optional `agentName` parameter defaults to `undefined`, so the existing call works unchanged. The returned `RecoveryReport` now has additional fields that the supervisor passes through in its `SupervisorReport.lastRecovery` field.

### Zero breaking changes

- `RecoveryAgent.restore(checkpointId)` still works — the new `agentName` param is optional
- `RecoveryReport` type is backward-compatible (new fields are additive)
- Method exports unchanged: `restore()`, `restartAgent()`, `deactivateAgent()`, `rollbackSection()`, `validateRestoreCapability()`

---

## Validation Results

| Check | Result | Details |
|-------|--------|---------|
| `npx tsc --noEmit` | ✅ **PASS** | 0 errors, 0 warnings |
| `npm run build` | ✅ **PASS** | Compiled successfully, 24 static pages generated |

---

## Key Design Decisions

1. **Git restore with auto-stash** — The agent stashes working changes before restoring, so uncommitted work is preserved (in the stash) rather than overwritten. This avoids data loss.

2. **File-copy fallback requires explicit backup** — The file-copy strategy only works if checkpoint backups were previously saved to `project-memory/checkpoints/<id>/`. The RecoveryAgent does not create these backups — that's the CuratorAgent's responsibility.

3. **Inline dynamic import for AgentRegistry** — `deactivateAgent()` uses `await import('./AgentRegistry')` to avoid circular dependency issues (RecoveryAgent → AgentRegistry → RecoveryAgent paths through contracts).

4. **Post-recovery verification is mandatory** — HealthCheckAgent and AgentInspector always run after a restore, even if the restore partially failed. This ensures the report always has current verification data.

5. **No changes to SystemSupervisorAgent** — The optional `agentName` parameter on `restore()` is backward-compatible. The supervisor's `runRecovery(checkpointId)` works without modification.

---

## Rollback Plan

To undo CP-99:

```
1. Restore: src/agents/system/RecoveryAgent.ts from backup (previous version)
2. Verify: npx tsc --noEmit && npm run build
```

No other files were modified — rollback is a single file restore.
