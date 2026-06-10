# G6_AGENT_BOOTSTRAP_REPORT

## Problem
After the performance fix (G-5), the `/supervisor` dashboard loaded correctly but showed **"No agents registered"** — `AgentRegistry.listAgents()` returned 0 agents at runtime.

## Root Cause
**Next.js App Router isolates module contexts between SSR renders and API route handlers.**

When Turbopack compiles each route as a separate entry point, the module instances for dynamic imports (`await import(...)`) in API route handlers may be **different instances** than those loaded statically (`import ...`) in SSR page layouts.

The original flow was:
1. `layout.tsx` → static import of `src/agents/system/startup`
2. `startup.ts` → dynamic import of `SystemSupervisorAgent` → which imports `AgentRegistry`
3. `SystemSupervisor.initialize()` → `ensureSystemAgentsRegistered()` → `AgentRegistry.registerAgent(...)` for 22 agents
4. This only ran in the **layout's SSR module context**

When `/api/supervisor` was called:
5. Its dynamic `import('../../../agents/system/AgentRegistry')` resolved to a **separate module instance** where `AgentRegistry` was still empty
6. `AgentRegistry.listAgents()` returned 0 → dashboard showed "No agents registered"

**Secondary issue:** Even if the module context was shared, `startup.ts` defers initialization to a microtask, and `SystemSupervisor.initialize()` calls `HealthCheckAgent.runChecks()` which runs synchronous shell commands (`execSync`) — this could hang during the SSR render phase, preventing `initialized = true` from ever being set.

## Fix Applied

### 1. `src/agents/system/AgentRegistry.ts` — Self-populating registry

**What:**
- Extracted all 22 agent definitions into a **static exported constant** `AGENT_DEFINITIONS`
- `AgentRegistryInternal` constructor now **auto-registers all definitions** at construction time
- `AGENT_DEFINITIONS` is exportable so other modules can reference the same list

**Why:**
- No async initialization needed — agents are registered when the module is first loaded
- Every module context gets a populated registry from the start
- Even if `SystemSupervisor.initialize()` never completes, the registry has 22 agents

### 2. `src/agents/system/SystemSupervisorAgent.ts` — Uses shared definitions

**What:**
- Imports `AGENT_DEFINITIONS` instead of maintaining a duplicate inline array
- `ensureSystemAgentsRegistered()` now iterates over `AGENT_DEFINITIONS`
- Removed unused `import type { AgentCategory }` import

**Why:**
- Single source of truth for agent definitions
- Both the registry's auto-population and the supervisor's registration use the same data
- Eliminates 220+ lines of duplicated static data

## Files Modified

| File | Change |
|------|--------|
| `src/agents/system/AgentRegistry.ts` | Extracted 22 definitions into `AGENT_DEFINITIONS`; constructor auto-registers them |
| `src/agents/system/SystemSupervisorAgent.ts` | Uses `AGENT_DEFINITIONS` from AgentRegistry; removed duplicate inline array and unused `AgentCategory` import |

No changes needed to `startup.ts`, `layout.tsx`, `page.tsx`, or the supervisor API route.

## Validation

### TypeScript
- `npx tsc --noEmit` — ✅ Clean pass

### Build
- `npm run build` — ✅ **Full successful build**
  - Compiled successfully in 4.3s
  - TypeScript finished in 9.1s
  - All 25 pages/f routes generated
  - `/supervisor` route: `ƒ (Dynamic)`

### Runtime API Test
```
GET http://localhost:3000/api/supervisor
Response:
  "managedCount": 22
  "registeredCount": 22
  "heartbeatedCount": 0  (supervisor not yet initialized — correct)
  All 22 agents present with "registered": true
```

The dashboard now shows all 22 agents instead of "No agents registered".

| Metric | Value |
|--------|-------|
| Registered agents in AgentRegistry | **22** (6 system + 1 self + 8 runtime + 2 knowledge + 5 brain) |
| Dashboard State | 22 agents listed with UNKNOWN status (supervisor heartbeat not running yet) |
| API response time | ~3ms (from getCachedReport) |
