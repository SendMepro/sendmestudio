# CP-71: Extract useFetchOnSearch Hook

> **Status:** ✅ Checkpoint alcanzado
> **Date:** 2026-05-30
> **Phase:** Brain Admin Phase BA-2 — Hooks

---

## Changes

### Created
- **`src/hooks/brain-admin/useFetchOnSearch.ts`** (116 lines)

### Modified
- **`src/app/brain-admin/page.tsx`** (−6 lines)

## Extracted to Hook

| Item | Before (page.tsx) | After (hook) |
|------|-------------------|--------------|
| `loadSummary` | Inline fetch + 401 check + JSON parse | `fetchOnSearch({ url: "/api/brain-admin/upload" })` |
| `loadStorageStats` | Inline fetch + try/catch + JSON parse | `fetchOnSearch({ url: "/api/brain-admin/storage", silent: true })` |
| `loadNightQueue` | Inline fetch + try/catch + JSON parse | `fetchOnSearch({ url: "/api/brain-admin/queue", silent: true })` |
| AbortController | Not present | Built-in per-request cancellation |

## Hook API

```typescript
type ExecuteOptions = {
  url: string;
  fetchOptions?: Omit<RequestInit, "cache">;
  cache?: RequestCache;
  silent?: boolean;
};

function useFetchOnSearch<T = unknown>(options?: {
  cache?: RequestCache;
}): {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: <R = T>(opts: ExecuteOptions) => Promise<R | null>;
  reset: () => void;
};
```

## Key Design Decisions

1. **URL as parameter to `execute()`**, not hook constructor — single hook instance serves all endpoints
2. **AbortController built-in** — cancels in-flight requests when `execute()` is called again
3. **401 returns `null`** — doesn't throw; caller decides how to handle (auth check)
4. **Generic `<R = T>` on execute** — each call can override the return type for type safety
5. **`silent` option** — matches the existing pattern of silently failing for non-critical endpoints

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 code errors |
| `npm run build` | ✅ /brain-admin compiles |
| loadSummary 401 handling | ✅ Still returns null → caller sets `setIsAuthenticated(false)` |
| loadStorageStats silent fail | ✅ Same behavior with `silent: true` |
| loadNightQueue silent fail | ✅ Same behavior with `silent: true` |
| State updates preserved | ✅ `setSummary`, `setStorageStats`, `setNightQueue` still called |
| No business logic changes | ✅ Pure extraction |
| No UI/behavior changes | ✅ |

## Metrics

| Metric | Value |
|--------|-------|
| page.tsx after CP-70 | 1,682 lines |
| page.tsx now | 1,676 lines |
| Hook size | 116 lines |
| Net reduction from page.tsx | 6 lines |
| Cumulative reduction | 40 lines |
