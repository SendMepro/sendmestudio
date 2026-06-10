# CP-96 — Validation Audit

**Generated:** 2026-05-31T00:52 UTC  
**Scope:** Phase 1 (Agent Contracts + Status Enum + HealthCheckAgent)  
**Method:** Static analysis of 5 files + full-codebase cross-references  
**Constraint:** No code modified during audit

---

## Audit Checklist

### 1. No duplicate status enums

**Result:** ⚠️ **DUPLICATE EXISTS**

Two `AgentLifecycleStatus` types exist:

| Location | Values | Status |
|----------|--------|--------|
| `src/agents/system/types.ts:16` | 9 values: `planned`, `created`, `active`, `running`, `degraded`, `inactive`, `deprecated`, `archived`, `failed` | **New** (CP-96) |
| `src/agents/system/AgentLifecycleAgent.ts:7` | 6 values: `planned`, `created`, `active`, `inactive`, `deprecated`, `archived` | **Pre-existing** (original) |

**Impact:** The pre-existing `AgentLifecycleAgent.ts` defines its own local `AgentLifecycleStatus` and does NOT import from `types.ts`. The new `types.ts` file is only imported by `AgentRegistry.ts`. Both are valid TypeScript — they are different types even though they share the same name. This is not a runtime bug, but it's a **design concern**: any code migrating from the old 6-value to the new 9-value enum needs to update its import path. The `AgentLifecycleAgent` is a Phase 5 enhancement target and still uses its local 6-value definition, which is acceptable for now.

**Recommendation:** When Phase 5 (AgentLifecycleAgent enhancement) is implemented, the local type in `AgentLifecycleAgent.ts` should be replaced with an import from `./types` and the transition map should be updated to include the 3 new statuses.

---

### 2. No duplicate contracts

**Result:** ✅ **CLEAN**

| Export | Location | Duplicates? |
|--------|----------|-------------|
| `ManagedAgent` | `contracts.ts:31` | None found in codebase |
| `PingResult` | `contracts.ts:8` | None found |
| `ManagedAgentHealth` | `contracts.ts:18` | None found |
| `AgentCategory` | `types.ts:30` | None found |

`ManagedAgent`, `PingResult`, and `ManagedAgentHealth` are uniquely defined in `contracts.ts`. `AgentCategory` is uniquely defined in `types.ts`. No other files define these types.

---

### 3. AgentRegistry uses the new lifecycle status

**Result:** ✅ **IMPORTED, NOT YET USED IN LOGIC**

`AgentRegistry.ts:5`:
```typescript
import type { AgentCategory, AgentLifecycleStatus } from './types';
```

- `AgentCategory` is **used** in the `AgentDefinition.category` field (line 11) and `listAgents(category)` parameter (line 38).
- `AgentLifecycleStatus` is **imported** and used as `lifecycleStatus?: AgentLifecycleStatus` optional field (line 12), but:
  - `registerAgent()` does NOT set `lifecycleStatus` automatically.
  - `updateAgentStatus()` still updates the old `AgentDefinition['status']` field (`'active' | 'inactive' | 'pending'`), not `lifecycleStatus`.
  - No code in AgentRegistry sets or reads `lifecycleStatus` beyond its declaration.

**Impact:** The `lifecycleStatus` field exists in the type system but is not populated or consumed by any logic. This is acceptable for Phase 1 — Phase 5 will integrate the lifecycle system fully. The old `status` field (`'active' | 'inactive' | 'pending'`) remains the active status mechanism.

---

### 4. EmotionalSalonOrchestrator compiles against new contracts

**Result:** ✅ **COMPILES CLEANLY**

| Import | File | Verified |
|--------|------|----------|
| `AgentDefinition` (with `category` required) | `AgentRegistry.ts` | All 5 agent registrations pass `category: 'system'` ✅ |
| `AgentHealthReport as HealthReport` | `HealthCheckAgent.ts` | Alias resolves correctly ✅ |
| `HealthCheckAgent.runChecks()` | `HealthCheckAgent.ts` | 0-argument call matches new signature ✅ |
| `runHealthCheck()` return type | `HealthCheckAgent.ts` | Returns `Promise<AgentHealthReport>`, aliased as `HealthReport` ✅ |

`npx tsc --noEmit` confirms: **0 errors**.

---

### 5. HealthCheckAgent is actually referenced by runtime code

**Result:** ⚠️ **REGISTERED BUT NOT INVOKED AT RUNTIME**

Reference chain discovered:

```
HomeBridge.ts:93  → orchestrator.initialize()  ← called at init
                       └── AgentRegistry.registerAgent(HealthCheckAgent)  ✅ registered
                       
HomeBridge.ts:155 → runHealthCheck() → this.healthCheck.runHealthCheck()
                       └── HomeHealthCheckAgent.runHealthCheck()  ← NOT system HealthCheckAgent
```

- `HealthCheckAgent` (system-level) is **registered** in AgentRegistry via `EmotionalSalonOrchestrator.initialize()`.
- `HealthCheckAgent.runChecks()` is **exposed** via `orchestrator.runHealthCheck()`.
- But `orchestrator.runHealthCheck()` is **never called** by any runtime code.

The only `runHealthCheck()` call at runtime is `HomeHealthCheckAgent.runHealthCheck()` (a separate agent in `src/agents/home/`), which is unrelated to the system `HealthCheckAgent`.

**Design intent:** The system `HealthCheckAgent` is meant to be invoked by the `SystemSupervisorAgent` (Phase 3), not by the current orchestrator path. It's pre-built and ready but dormant until Phase 3 connects it.

---

### 6. Nothing created in CP-96 is dead code

**Result:** ⚠️ **PARTIALLY DEAD — INTENTIONAL FORWARD REFERENCE**

| File | Status | Consumer | Dead? |
|------|--------|----------|-------|
| `contracts.ts` | 🟡 **Orphaned** | No file imports `ManagedAgent`, `PingResult`, or `ManagedAgentHealth` | Dead until Phase 3 |
| `types.ts` | ✅ **Live** | Imported by `AgentRegistry.ts` (`AgentCategory`, `AgentLifecycleStatus`) | Live |
| `src/system/config.ts` | 🟡 **Partially dead** | `SystemPaths` is imported by `HealthCheckAgent.ts` (**live**). `SupervisorConfig` and `DEFAULT_SUPERVISOR_CONFIG` are defined but never imported (**dead** until Phase 3). | Partially dead |
| `AgentRegistry.ts` modifications | ✅ **Live** | `category` field used in all registrations via `EmotionalSalonOrchestrator` | Live |
| `HealthCheckAgent.ts` rewrite | 🟡 **Registered only** | Registered in AgentRegistry, exposed via `orchestrator.runHealthCheck()`, but `runChecks()` never called at runtime | Dormant until Phase 3 |
| `EmotionalSalonOrchestrator.ts` changes | ✅ **Live** | `orchestrator.initialize()` called by `HomeBridge.ts:93` | Live |

**Summary of dead/dormant code:**

| Export | Defined in | Used? | Since |
|--------|-----------|-------|-------|
| `ManagedAgent` | `contracts.ts` | ❌ No | CP-96 |
| `PingResult` | `contracts.ts` | ❌ No | CP-96 |
| `ManagedAgentHealth` | `contracts.ts` | ❌ No | CP-96 |
| `SupervisorConfig` | `system/config.ts` | ❌ No | CP-96 |
| `DEFAULT_SUPERVISOR_CONFIG` | `system/config.ts` | ❌ No | CP-96 |
| `HealthCheckAgent.runChecks()` | `HealthCheckAgent.ts` | ❌ No runtime caller | CP-96 |
| `AgentLifecycleStatus` (new 9-value) | `types.ts` | ✅ Imported by AgentRegistry | CP-96 |
| `AgentCategory` | `types.ts` | ✅ Used by AgentRegistry | CP-96 |
| `SystemPaths` | `system/config.ts` | ✅ Used by HealthCheckAgent | CP-96 |

**Rationale:** All dead/dormant exports are forward references for Phases 3 (SystemSupervisorAgent) and 5 (AgentLifecycleAgent enhancement). This is by design — Phase 1 lays the contract foundation before the supervisor that consumes them.

---

## Summary

| # | Check | Verdict | Notes |
|---|-------|---------|-------|
| 1 | No duplicate status enums | ⚠️ **Duplicate** | `types.ts` (9) vs `AgentLifecycleAgent.ts` (6) — same name, different types |
| 2 | No duplicate contracts | ✅ **Clean** | `ManagedAgent`, `PingResult`, `ManagedAgentHealth`, `AgentCategory` all unique |
| 3 | AgentRegistry uses new lifecycle status | ⚠️ **Partial** | Imported, field declared, but not populated by any logic |
| 4 | Orchestrator compiles against contracts | ✅ **Clean** | 0 TS errors, `category` filled, `runChecks()` signature matches |
| 5 | HealthCheckAgent referenced by runtime | ⚠️ **Registered only** | Registered in AgentRegistry but `runChecks()` never called |
| 6 | No dead code | ⚠️ **Forward refs** | 5 exports are intentionally dead until Phase 3 |

### Actionable Findings

1. **Duplicate `AgentLifecycleStatus`** — Consider whether Phase 5 should replace the local 6-value type in `AgentLifecycleAgent.ts` with an import from `types.ts` (9 values). The transition map in `AgentLifecycleAgent.ts` line 309 only handles 6 values and would need `running`, `degraded`, `failed` added.

2. **`contracts.ts` is 100% dormant** — If Phase 3 is delayed, consider whether to keep it or defer creation until Phase 3. Current choice (forward reference) is acceptable for a defined plan.

3. **`HealthCheckAgent.runChecks()` has zero runtime callers** — Consider whether the `EmotionalSalonOrchestrator.runHealthCheck()` method should be called by any existing code, or if it's fine dormant until Phase 3. Current design: dormant is correct.
