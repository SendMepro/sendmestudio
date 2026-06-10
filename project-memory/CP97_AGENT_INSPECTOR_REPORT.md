# CP-97 — AgentInspector Implementation Report

**Generated:** 2026-05-31T00:56 UTC  
**Phase:** System Governance Phase 2 (AgentInspector Enhancement)  
**Status:** ✅ Complete — all validations pass

---

## Scope

Implement Phase 2 of the System Governance plan as defined in `CP95_SYSTEM_GOVERNANCE_PLAN.md`:

1. **Enhance AgentInspector** to inspect registered agents via AgentRegistry (not just filesystem)
2. **Detect missing contracts** (`ping()` / `health()` method presence)
3. **Detect unhealthy agents** (no code file, broken dependencies, missing contracts)
4. **Produce unified inspection results** (legacy filesystem + new agent-level data)
5. **Integrate with HealthCheckAgent** types (`AgentHealthReport`)

---

## Files Modified

| File | Change | Delta |
|------|--------|-------|
| `src/agents/system/AgentInspector.ts` | **Complete rewrite** — added 6 new report interfaces, 4 new public/private methods, registry cross-reference, contract detection via regex, dependency validation, per-agent health scoring. Preserved backward-compatible `inspect(path)` method signature. | ~+560 lines (68 → 637) |
| `src/agents/system/AgentInspector.md` | Updated documentation with new responsibilities, methods, report structure, and health state table. | ~+45 lines |

## New Report Interfaces

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `RegistryHealth` | `registered`, `agentsWithCode`, `agentsWithoutCode`, `codeFilesWithoutRegistration` | Cross-reference registry vs filesystem |
| `SectionCompletion` | `planned`, `created`, `active`, `missing` | Tracks section agent status counts |
| `DependencyIssue` | `agent`, `missingDependency` | Broken dependency between agents |
| `ContractCompliance` | `total`, `withPing`, `withoutPing`, `withHealth`, `withoutHealth` | Which agents implement the `ManagedAgent` contract |
| `AgentInspectionDetail` | `name`, `category`, `status`, `hasCodeFile`, `hasPingMethod`, `hasHealthMethod`, `dependencyIssues`, `health` | Per-agent detailed health |

## New Methods

| Method | Visibility | Purpose | Sync/Async |
|--------|-----------|---------|------------|
| `inspectSectionAgents(sectionName)` | **Public** | Inspect agents matching a section name | ✅ Async |
| `inspectAllAgents(sectionFilter?)` | Private | Full registry cross-reference scan | Sync (static data) |
| `inspectSingleAgent(agentName)` | Private | Per-agent detail (async file reading) | ✅ Async |
| `inspectSingleAgentSync(agentName)` | Private | Per-agent detail (sync for bulk) | Sync |

## Detection Capabilities

### Missing Contracts
AgentInspector reads each agent's `.ts` file and regex-searches for:
- `async ping(` or `ping()` — marks `hasPingMethod: true`
- `async health(` or `health()` — marks `hasHealthMethod: true`

If an agent is `status: 'active'` but lacks `ping()`, it gets **`health: 'warning'`**.

### Unhealthy Agents
Three levels of health per agent:

| Condition | Health | Rationale |
|-----------|--------|-----------|
| No `.ts` file on disk | `critical` | Agent is registered but doesn't exist |
| Broken dependencies | `critical` | Agent depends on something unregistered |
| Active but no `ping()` or `health()` | `warning` | Will fail supervisor contract check |
| All good | `healthy` | Code exists, deps intact, contracts present |

### Registry Cross-Reference
AgentInspector scans known agent directories (`src/agents/system/`, `src/agents/home/`, `src/skills/emotional-salon/`, `src/bridges/`) and cross-references every `.ts` file against registered agents. It reports:

- **`agentsWithoutCode`** — registered in AgentRegistry but no `.ts` file found
- **`codeFilesWithoutRegistration`** — `.ts` file exists on disk but not registered in AgentRegistry

### Dependency Validation
For each registered agent, the inspector checks its `dependencies` array. Any dependency matching the pattern `Agent*` or `*Agent*` is looked up in AgentRegistry. If not found, it's reported as a `DependencyIssue`.

## Integration with HealthCheckAgent

AgentInspector imports `AgentHealthReport` (type-only) from `HealthCheckAgent.ts` for potential type compatibility. The actual integration (HealthCheckAgent calling Inspector) happens in Phase 3 (SystemSupervisorAgent).

The legacy `inspect(path)` method now returns an **extended `InspectionReport`** that includes both the original fields and the new agent-level fields — so existing callers (like `EmotionalSalonOrchestrator.inspectSection()`) get enriched data without changing their code.

## Validation Results

| Check | Result | Details |
|-------|--------|---------|
| `npx tsc --noEmit` | ✅ **PASS** | 0 errors, 0 warnings |
| `npm run build` | ✅ **PASS** | Compiled successfully, 24 static pages generated |

## Key Design Decisions

1. **Backward-compatible `inspect(path)` signature** — The original `InspectionReport` is extended (not replaced). Existing callers get new fields automatically.

2. **Sync bulk inspection** — `inspectAllAgents()` uses sync file operations (`readFileSync`, `readdirSync`) to avoid creating N async promises for every agent during a full scan. The single-agent `inspectSingleAgent()` is async and can be awaited individually.

3. **Regex-based contract detection** — Instead of importing and introspecting TypeScript AST, the inspector uses regex patterns to detect `ping()` and `health()` methods. This is fast (~0.1ms per file), side-effect-free, and works on any `.ts` file without requiring type resolution. The regexes are:
   - `/(async\s+)?ping\s*\(/` — matches `ping()`, `async ping()`, `ping(args)`
   - `/(async\s+)?health\s*\(/` — matches `health()`, `async health()`, `health(args)`

4. **sectionNameToCategory map** — The `inspectSectionAgents()` method uses a hardcoded map to resolve section names to `AgentCategory` for flexible agent matching.

5. **Dependency heuristic** — The inspector only validates dependencies that contain "Agent" in their name (npm packages like `react` are skipped). This avoids false positives while catching real agent-to-agent dependency issues.

## Rollback Plan

To undo CP-97:

```
1. Restore: src/agents/system/AgentInspector.ts (revert to original 75-line version)
2. Restore: src/agents/system/AgentInspector.md (revert to original documentation)
3. Verify: npx tsc --noEmit && npm run build
```
