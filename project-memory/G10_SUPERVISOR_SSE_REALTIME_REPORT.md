# G-10: Supervisor SSE Realtime — Report

## Goal

Replace 3s client-side HTTP polling with a Server-Sent Events (SSE) connection for real-time supervisor dashboard updates. Business events and agent heartbeats should flow continuously without periodic HTTP requests.

## Architecture

```
Supervisor Dashboard (page.tsx)
  │
  ├── FETCH /api/supervisor  (initial load — full snapshot)
  │
  └── EventSource → /api/supervisor/events  (ongoing updates)
        │
        ├── event: "supervisor_update"
        │     data: { businessMetrics, supervisor }
        │
        └── event: "heartbeat"  (every 25s, keeps connection alive)
```

## What Was Built

### 1. `src/app/api/supervisor/events/route.ts` — NEW

SSE endpoint that:
- Polls `BusinessEventBus.getMetrics()` every **2s** internally
- Polls `SystemSupervisor.getCachedReport()` for agent heartbeats
- **Sends only on change** — caches the last metrics JSON fingerprint and skips send when identical
- Emits `supervisor_update` events with `{ businessMetrics, supervisor }` payload
- Emits `heartbeat` events every 25s to keep the connection alive
- Properly cleans up intervals on stream cancel/close
- Uses `ReadableStream` with same pattern as existing WhatsApp SSE (`events/route.ts`)

### 2. `src/app/supervisor/page.tsx` — MODIFIED

Replaced `setInterval` polling with EventSource:

| Before | After |
|--------|-------|
| `setInterval(() => fetchData(true), 3000)` | `EventSource('/api/supervisor/events')` |
| Full HTTP fetch every 3s | Persistent TCP connection, events on change only |
| Polls regardless of data changes | Skips updates when data is unchanged |

**SSE lifecycle:**
1. Initial `fetch('/api/supervisor')` for full snapshot
2. `new EventSource('/api/supervisor/events')` for ongoing updates
3. On `supervisor_update` event → merges `businessMetrics` and `supervisor` into state
4. On `connected` event → sets `sseConnected = true`
5. On `error` event → **falls back to 10s polling** (`setInterval(() => fetchData(true), 10000)`)
6. On unmount → closes EventSource + clears fallback timer

**Other updates:**
- Added `useRef` import
- Added `sseConnected` state (available for future badge/indicator)
- Added `eventSourceRef` for clean teardown
- Manual Refresh button preserved and unchanged

## Fallback Behavior

If `EventSource` constructor fails or the SSE connection errors:
- Falls back to `setInterval(() => fetchData(true), 10000)` (10s polling)
- The polling uses silent mode (`refreshing` state, not `loading` spinner)
- No data is lost — the app continues working without SSE

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/supervisor/events/route.ts` | **New** — SSE endpoint (130 lines) |
| `src/app/supervisor/page.tsx` | Modified — replaced polling with EventSource + fallback |

## Validation

- `npx tsc --noEmit` — ✅ passes
- `npm run build` — ✅ passes (26 routes, includes `ƒ /api/supervisor/events`)
- No changes to BusinessEventBus, webhook, agents, supervisor API, or dashboard UI
- No new npm dependencies
