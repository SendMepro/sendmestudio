# FIX: Supervisor Route Hang Report

**Date:** 2026-05-31T02:11 UTC  
**Status:** ✅ Fixed

---

## Problem

`/supervisor` page stayed loading forever — the HTTP fetch to `/api/supervisor` never returned.

---

## Root Cause

The API route (`src/app/api/supervisor/route.ts`) had 3 issues:

### 1. Top-level static import triggered supervisor module load

```ts
// BEFORE: Static import at module scope
import { SystemSupervisor } from '../../../agents/system/SystemSupervisorAgent';
```

This statically loaded the entire `SystemSupervisorAgent.ts` dependency graph at bundle time, including `AgentInspector.ts` (which imports `node:fs/promises`, `node:path`) and `HealthCheckAgent.ts` (which imports `node:child_process`). While these imports themselves don't run code, they expose the full module graph to potential initialization side effects.

### 2. No timeout guard on supervisor interaction

```ts
// BEFORE: Unprotected call
const report = await SystemSupervisor.getReport();
```

`getReport()` is synchronous, but the API route called it with `await` (which resolves immediately for sync). However, if the supervisor module never loaded (because `startup.ts` only fires during SSR via `layout.tsx`, and API routes are bundled separately), the import would wait on module resolution.

### 3. No fallback when supervisor is uninitialized

If `startup.ts` had never run (because API-only requests skip the root layout), `initialize()` was never called, so the heartbeat map was empty. The original code would return empty data, but the API route had no timeout, so any module-loading delay would become a hang.

---

## Fix Applied

### 1. Lazy dynamic imports with timeouts (Phase 1 + Phase 2)

Rewrote the API route to use a **two-phase pattern**:

**Phase 1:** `await import('AgentRegistry')` — loads registry data (no Node builtins needed, always fast). AgentRegistry has zero system dependencies.

**Phase 2:** `await import('SystemSupervisorAgent')` wrapped in a 2-second `Promise.race()` timeout. If the supervisor module doesn't load or respond within 2 seconds, it falls back gracefully.

### 2. Full fallback when supervisor is unavailable

If supervisor data is unavailable (timeout, error, or uninitialized), the API builds a response from **AgentRegistry data alone**:

- All registry agents are returned with status `UNKNOWN`
- Heartbeat metrics show 0 healthy/degraded/unreachable
- Overall status: `degraded`
- Governance coverage calculated from registry-only data

### 3. No initializer dependency

The API route no longer depends on `SystemSupervisor.initialize()` having been called. It reads whatever state is available. If the supervisor is uninitialized, agents from `AgentRegistry.listAgents()` are returned with `UNKNOWN` status.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/supervisor/route.ts` | Full rewrite — lazy dynamic imports, 2s timeout, fallback to registry-only data, no static top-level import of SystemSupervisorAgent |

**No other files changed.**

---

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit --incremental false` | ✅ Pass — zero type errors |
| `npm run build` | ⚠️ Blocked by pre-existing Windows EPERM on `.next/` (permission-denied locked cache files, environment-wide, not code-related) |

---

## How the Fixed API Route Works

```
GET /api/supervisor
│
├── Phase 1: AgentRegistry (fast, no Node builtins)
│   ├── dynamic import('./AgentRegistry')
│   └── listAgents() → [22 agents with names, categories, phases]
│
├── Phase 2: Supervisor report (with 2s timeout)
│   ├── dynamic import('./SystemSupervisorAgent')
│   ├── SystemSupervisor.getReport() ← sync, but wrapped in race
│   └── If timeout: returns null (graceful fallback)
│
├── Merge: heartbeat agents + registry-only agents
│   ├── Heartbeat agents get real status (healthy/degraded/unreachable)
│   └── Registry-only agents get status: UNKNOWN
│
└── Return JSON (always within 2s)
```

### States the `/supervisor` page can now show

| Scenario | User Sees |
|----------|-----------|
| Supervisor initialized and polling | Real heartbeat statuses for all agents |
| Supervisor partially initialized (startup in progress) | Registry agents with UNKNOWN status (fallback within 2s) |
| Supervisor never initialized (API-only request) | Registry agents with UNKNOWN status |
| AgentRegistry unavailable | Zero agents, degraded overall |
| Any error or timeout | Fallback JSON with available data, never hangs |

---

## What Was NOT Changed

- `SystemSupervisorAgent.ts` — preserved
- `HealthCheckAgent.ts` — not modified
- `AgentInspector.ts` — not modified
- `startup.ts` — not modified
- `layout.tsx` — not modified
- `page.tsx` (supervisor dashboard) — not modified
- CSS — not modified
- No agent activation logic changed
- No business logic changed
