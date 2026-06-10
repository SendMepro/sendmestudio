# FIX: Supervisor Dashboard Realtime Polling — Report

## Problem

The Supervisor dashboard rendered once on page load and never updated. Business activity metrics (Events Today, Messages Received, Bookings Created, Last Event, event timeline) and agent statuses only refreshed when the user clicked the manual "Refresh" button. Real-time business visibility was lost.

## Fix

**File modified:** `src/app/supervisor/page.tsx` — 2 lines changed

### 1. Added `setInterval` polling (line 172)

```ts
useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
}, [fetchData]);
```

- Fetches on mount
- **Polls every 3000ms** using `fetchData(true)` (silent mode)
- **Cleanup via `clearInterval`** — prevents memory leaks on unmount
- **No duplicate intervals** — `useEffect` deps (`[fetchData]`) ensure a single interval per mount

### 2. Added `cache: 'no-store'` to fetch (line 156)

```ts
const res = await fetch('/api/supervisor', { cache: 'no-store' });
```

Prevents Next.js/Navite from serving a stale cached response during polling.

### Design Decisions

| Requirement | Implementation |
|-------------|---------------|
| Auto-refresh every 3s | `setInterval(() => fetchData(true), 3000)` |
| Silent polling (no loading spinner) | `fetchData(true)` sets `refreshing`, not `loading` |
| Manual Refresh button preserved | Unchanged, uses `fetchData()` (no arg = full loading) |
| Prevent memory leaks | `useEffect` returns `clearInterval(interval)` |
| Avoid duplicate intervals | Single interval in stable `useEffect` |
| No mock data | Fetches real `/api/supervisor` data |
| Cache-busting | `cache: 'no-store'` on every fetch |

### Updated Data Points

The following update automatically every 3 seconds:
- **Business Activity**: Events Today, Messages Received, Bookings Created, Last Event, event timeline
- **Agent Statuses**: Total Agents, Healthy, Degraded, Failed counts
- **Last Heartbeat**: Timestamp refreshes every poll cycle
- **Governance Coverage**: Percentage recalculates on each fetch

## Validation

- `npx tsc --noEmit` — ✅ passes
- `npm run build` — ✅ passes (25 pages, all routes)
- No changes to BusinessEventBus, webhook, agents, or dashboard layout
