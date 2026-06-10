# CP-95 — System Governance Implementation Plan

**Generated:** 2026-05-31T00:43 UTC  
**Based on:** `project-memory/SYSTEM_SUPERVISOR_ARCHITECTURE.md`  
**Strategy:** Build bottom-up — contracts first, then individual agents, then supervisor. Each phase is independently verifiable with `tsc --noEmit`.

---

## Phase 1: Agent Contracts + Status Enum + HealthCheckAgent (real shell)

**Goal:** Define the `ManagedAgent` contract, the status enum, and make HealthCheckAgent actually run real checks.

### Files Created

| File | Est. Lines | Contents |
|------|-----------|----------|
| `src/agents/system/contracts.ts` | ~60 | `ManagedAgent` interface, `PingResult` type, `ManagedAgentHealth` type |
| `src/agents/system/types.ts` | ~40 | `AgentLifecycleStatus` enum (9 values: planned, created, active, running, degraded, inactive, deprecated, archived, failed), `AgentCategory` type |
| `src/system/config.ts` | ~30 | `SupervisorConfig` interface with default values, `SystemPaths` constants |

### Files Modified

| File | Change | Est. Delta |
|------|--------|-----------|
| `src/agents/system/HealthCheckAgent.ts` | Replace all 3 `skipped` stubs with real shell exec for `tsc --noEmit`, `npm run build`, `npx jest`. Add `agentRegistryCheck` and `featureFlagConsistency` sections to report. | ~+150 lines |
| `src/agents/system/AgentRegistry.ts` | Import `AgentCategory` type, add `category` field to `AgentDefinition` and `AgentRecord`. Update `listAgents` with optional `category` filter. | ~+20 lines |
| `src/config/featureFlags.ts` | No change needed (read from existing flag definitions). | 0 |

### Dependencies Introduced

| Dependency | Why |
|-----------|-----|
| `child_process.execSync` | Shell out to `tsc`, `next build`, `jest` |
| `node:path` / `node:fs` | Locate project root, read feature flag file |

### Estimated Total Lines

| Metric | Value |
|--------|-------|
| Created | ~130 lines across 3 files |
| Modified | ~+170 lines across 2 files |
| **Net change** | **~+300 lines** |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `execSync` throws on Windows sandbox | Medium | Medium | Wrap all exec in try/catch; return `skipped` status on error (graceful degradation) |
| Build command path issues (spaces in dir name) | High | Low | Use `path.resolve` + quoted paths; already handled in architecture design |
| Existing agents need `ping()` but it's not defined yet | High | None | Phase 1 only defines the contract — agents get `ping()` in Phase 3 |

### Rollback

```
git revert CP-95-P1 (no git) → manual: delete 3 new files, restore 2 modified files from backup
Verification: tsc --noEmit passes, HealthCheckAgent returns 'skipped' again (old behavior)
```

---

## Phase 2: AgentInspector (enhanced with registry cross-reference)

**Goal:** Extend AgentInspector to inspect the agent registry, not just the filesystem.

### Files Created

| File | Est. Lines | Contents |
|------|-----------|----------|
| None | 0 | Pure enhancement of existing file |

### Files Modified

| File | Change | Est. Delta |
|------|--------|-----------|
| `src/agents/system/AgentInspector.ts` | Add `inspectAgents()` method that reads AgentRegistry + filesystem → cross-references registrations vs. code files. Add `registryHealth` and `sectionCompletion` fields to `InspectionReport`. Add `inspectSectionAgents(sectionName)` method. | ~+120 lines |
| `src/agents/system/AgentInspector.md` | Document new methods and report fields. | ~+30 lines |

### Dependencies Introduced

| Dependency | Why |
|-----------|-----|
| `AgentRegistry` (already imported indirectly) | Read registered agents list |
| `agent-registry.json` (via fs) | Persisted registry state for cross-reference |

### Estimated Total Lines

| Metric | Value |
|--------|-------|
| Created | 0 |
| Modified | ~+150 lines across 2 files |
| **Net change** | **~+150 lines** |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `agent-registry.json` out of sync with in-memory AgentRegistry | Medium | Low | Inspector reports discrepancy as a warning, not an error |
| Filesystem walk is slow on large directories | Low | Low | Acceptable for inspection (not on hot path) — consider caching if needed |

### Rollback

```
Manual: restore src/agents/system/AgentInspector.ts from backup → tsc --noEmit passes → old behavior (filesystem only)
```

---

## Phase 3: SystemSupervisorAgent

**Goal:** Create the core supervisor — heartbeat tracking, polling loop, ping orchestration, failure detection, section routing stub.

### Files Created

| File | Est. Lines | Contents |
|------|-----------|----------|
| `src/agents/system/SystemSupervisorAgent.ts` | ~250 | Main class with `initialize()`, `pingAll()`, `startPolling()`, `stopPolling()`, `registerManagedAgent()`, `unregisterManagedAgent()`, `getHeartbeat()`, `getReport()`, `routeToSection()`, `runInspection()`, `runHealthCheck()`, `createCheckpoint()` |
| `src/agents/system/SystemSupervisorAgent.md` | ~40 | Documentation |

### Files Modified

| File | Change | Est. Delta |
|------|--------|-----------|
| `src/agents/system/AgentRegistry.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+15 lines |
| `src/agents/system/AgentInspector.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/system/CuratorAgent.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/system/RecoveryAgent.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/system/HealthCheckAgent.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/system/AgentLifecycleAgent.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/home/EventBus.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/home/home/*.ts` (7 agents) | Add `ping()` method to each (HomeOrchestratorAgent, HomeDataSourceAgent, HomeInspectorAgent, HomeHealthCheckAgent, HomeLearningAgent, HomeMetricsAgent, HomeAIInsightAgent) | ~+8 lines each |
| `src/agents/home/intelligence/IntelligenceLayer.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/home/recommendations/RecommendationEngine.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |
| `src/agents/home/consumers/*.ts` (2 files) | Add `ping()` method to each | ~+8 lines each |
| `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` | Add `ping()`, refactor `routeSection()` to actually call section orchestrators instead of returning strings | ~+40 lines |
| `src/bridges/HomeBridge.ts` | Add `ping()` method implementing `ManagedAgent` contract | ~+8 lines |

### Dependencies Introduced

| Dependency | Why |
|-----------|-----|
| `setInterval` / `clearInterval` | Polling loop |
| `ManagedAgent` contract (from Phase 1) | All ping() implementations |
| `AgentRegistry`, `AgentInspector`, `CuratorAgent`, `RecoveryAgent`, `HealthCheckAgent`, `AgentLifecycleAgent` | Supervisor delegates to these |
| `EmotionalSalonOrchestrator` | Supervisor routes section requests through it |

### Estimated Total Lines

| Metric | Value |
|--------|-------|
| Created | ~290 lines across 2 files |
| Modified | ~+200 lines across ~20 files |
| **Net change** | **~+490 lines** |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Polling loop blocks main thread if agents are slow | Medium | High | Make `ping()` always fast (sync or timeout-gated). Use `setInterval` + `Promise.race` with 1s timeout |
| Circular dependency: Supervisor imports LifecycleAgent, LifecycleAgent imports Supervisor | Low | High | LifecycleAgent does NOT import Supervisor — Supervisor is the sole orchestrator, not a peer |
| 20 files modified in one phase — high touch surface | Medium | Medium | Each `ping()` is ~8 lines, identical pattern. Review per file. Verification: `tsc --noEmit` |
| `EmotionalSalonOrchestrator.routeSection()` breaking change | Medium | Medium | Current callers (0 — it's unused) won't break. New behavior returns actual agent responses instead of string messages. |

### Rollback

```
Manual: delete SystemSupervisorAgent.ts + .md, revert ping() additions in all 20 agent files
Verification: tsc --noEmit passes, old orchestrator behavior restored (strings)
```

---

## Phase 4: RecoveryAgent (enhanced with real restore)

**Goal:** Make RecoveryAgent actually restore files from checkpoints (via git if available, via file copies if not).

### Files Created

| File | Est. Lines | Contents |
|------|-----------|----------|
| None | 0 | Pure enhancement |

### Files Modified

| File | Change | Est. Delta |
|------|--------|-----------|
| `src/agents/system/RecoveryAgent.ts` | Replace placeholder `restored.push(file)` loop with real file restore: git `checkout` or file copy from `docs/checkpoints/`. Add step-by-step recovery report. Add `restartAgent()`, `deactivateAgent()`, `rollbackSection()` methods. Add git integration (optional fallback to file copy). | ~+180 lines |
| `src/agents/system/RecoveryAgent.md` | Document new methods and recovery strategies. | ~+30 lines |

### Dependencies Introduced

| Dependency | Why |
|-----------|-----|
| `child_process.execSync` | Git operations (`git stash`, `git checkout`) |
| `node:fs` / `node:fs/promises` | File copy when git is unavailable |

### Estimated Total Lines

| Metric | Value |
|--------|-------|
| Created | 0 |
| Modified | ~+210 lines across 2 files |
| **Net change** | **~+210 lines** |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Git not available in environment | Medium | Medium | Fallback to file-copy strategy. If neither works, return failure report. |
| File copy restore overwrites unsaved work | Medium | High | Always checkpoint BEFORE recovery. Supervisor creates a checkpoint before triggering RecoveryAgent. |
| `execSync` timeout on large repos | Low | Low | Add timeout, add progress reporting via console |

### Rollback

```
Manual: restore src/agents/system/RecoveryAgent.ts from backup
→ tsc --noEmit passes
→ old behavior (placeholder, no actual file writes)
```

---

## Phase 5: AgentLifecycleAgent (enhanced with 9 statuses + supervisor hooks)

**Goal:** Expand lifecycle to 9 statuses, add supervisor-triggered transitions, add sync with `agent-registry.json`.

### Files Created

| File | Est. Lines | Contents |
|------|-----------|----------|
| None | 0 | Pure enhancement |

### Files Modified

| File | Change | Est. Delta |
|------|--------|-----------|
| `src/agents/system/AgentLifecycleAgent.ts` | Add 3 new statuses: `running`, `degraded`, `failed`. Update transition map. Add `transitionStatus()` now accepts optional `supervisorAction` field. Add `promoteToRunning()`, `demoteToDegraded()`, `escalateToFailed()`. Implement `syncRegistry()` with real file I/O to `project-memory/agent-registry.json`. Add `listByStatus()` filter. | ~+120 lines |
| `src/agents/system/AgentLifecycleAgent.md` | Document new statuses, transitions, and sync behavior. | ~+20 lines |

### Dependencies Introduced

| Dependency | Why |
|-----------|-----|
| `node:fs` / `node:fs/promises` | Write `agent-registry.json` on sync |
| `project-memory/agent-registry.json` | Persist lifecycle state to disk |

### Estimated Total Lines

| Metric | Value |
|--------|-------|
| Created | 0 |
| Modified | ~+140 lines across 2 files |
| **Net change** | **~+140 lines** |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `agent-registry.json` write race with supervisor polling | Low | Low | Single-threaded Node — no race. All transitions are sequential. |
| Orphan detection marks new `running`/`degraded` statuses incorrectly | Low | Low | Update detection logic to filter by the new 9-status enum. |

### Rollback

```
Manual: restore src/agents/system/AgentLifecycleAgent.ts from backup
→ tsc --noEmit passes
→ old behavior (6 statuses, no file I/O)
```

---

## Summary

| Phase | Focus | Created | Modified | Net Lines | Risk | Build Safe |
|-------|-------|---------|----------|-----------|------|------------|
| **1** | Contracts + Status + HealthCheckAgent | 3 files (~130) | 2 files (+170) | **~+300** | Medium — `execSync` issues | ✅ After each file |
| **2** | AgentInspector enhancement | 0 | 2 files (+150) | **~+150** | Low | ✅ After file |
| **3** | SystemSupervisorAgent + ping() on all 20 agents | 2 files (~290) | ~20 files (+200) | **~+490** | Medium-High — 20 file touch | ✅ After each agent |
| **4** | RecoveryAgent real restore | 0 | 2 files (+210) | **~+210** | Medium — git vs file copy | ✅ After file |
| **5** | AgentLifecycleAgent 9 statuses + sync | 0 | 2 files (+140) | **~+140** | Low | ✅ After file |
| **Total** | — | **5 files (~420)** | **~28 files (+870)** | **~+1,290** | — | — |

### Execution Order

```
Phase 1 → tsc --noEmit → Phase 2 → tsc --noEmit → Phase 3 → tsc --noEmit → Phase 4 → tsc --noEmit → Phase 5 → tsc --noEmit → Done
```

Each phase is independently verifiable. Phases 1-2 can ship without Phases 3-5 (they add value independently). Phase 3 is the largest touch surface but follows a mechanical pattern.

### Key Decisions

1. **Phase 3 touches 20 files for ping()** — This is intentional. Each `ping()` is ~8 lines following the same pattern. Doing them all at once avoids partial supervision and keeps build passing.

2. **`src/system/` is created for config/types** — Separates governance concerns from agent logic. The supervisor config (`SupervisorConfig`, `SystemPaths`) lives here, not in `src/agents/system/`.

3. **No `git` dependency** — All recovery has a file-copy fallback. The git integration is additive (Phase 4 will try git first, fall back to copy).

4. **No new dependencies beyond Node builtins** — `child_process`, `fs`, `path` are all available in Next.js server-side and test environments.
