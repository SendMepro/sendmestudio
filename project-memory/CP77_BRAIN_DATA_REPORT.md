# CP-77 Report — Extract useBrainAdminData Hook

## Result
**page.tsx:** 1,328 → 1,292 lines (−36 net, −2.7%)

**New file:** `src/hooks/brain-admin/useBrainAdminData.ts` (86 lines)

## What was extracted

| From page.tsx | To hook |
|---|---|
| `summary`, `storageStats`, `nightQueue`, `toastMessage`, `toastVisible` (5 useStates) | Managed internally by hook |
| `fetchOnSearch` from `useFetchOnSearch` | Internalized in hook |
| `loadSummary` (GET `/api/brain-admin/upload`) | `loadSummary` returned from hook |
| `loadStorageStats` (GET `/api/brain-admin/storage`) | `loadStorageStats` returned from hook |
| `loadNightQueue` (GET `/api/brain-admin/queue`) | `loadNightQueue` returned from hook |
| `showToast` (setTimeout-based toast) | `showToast` returned from hook |
| `emptySummary` constant | Passed as generic parameter to the hook |

## Hook design

The hook is **generic** (`useBrainAdminData<TSummary>`) to avoid duplicating the full `BrainSummary` type definition (which remains in page.tsx with its detailed field shapes). The page passes its `emptySummary` as the generic seed:

```tsx
const {
  summary, setSummary, storageStats, nightQueue,
  toastMessage, toastVisible,
  loadSummary, loadStorageStats, loadNightQueue, showToast,
} = useBrainAdminData(emptySummary);
```

This means:
- The page retains full type safety on `summary.metrics`, `summary.workEntries`, etc.
- The hook manages all fetch/state logic without knowing the internal shape.
- Callers (realtime, upload, voice callbacks) still use `setSummary` with the correct type.

## Dependencies removed from page.tsx
- Removed `useFetchOnSearch` import (internalized in the hook)
- `loadSummary` / `loadStorageStats` / `loadNightQueue` / `showToast` — all removed from page body

## Validation
| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ Clean compile, all pages generated |

## Cumulative progress
| Hook | Original lines in page | Lines removed |
|---|---|---|
| useBrainAdminRealtime (CP-70) | 1,716 → 1,682 | −34 |
| useFetchOnSearch (CP-71) | 1,682 → 1,676 | −6 |
| useBrainAdminFileUpload (CP-72) | 1,676 → 1,601 | −75 |
| useBrainAdminVoice (CP-73) | 1,601 → 1,448 | −153 |
| useBrainAdminNotes (CP-74) | 1,448 → 1,388 | −60 |
| useBrainAdminQR (CP-75) | 1,388 → 1,364 | −24 |
| useBrainAdminAuth (CP-76) | 1,364 → 1,328 | −36 |
| useBrainAdminData (CP-77) | 1,328 → 1,292 | −36 |
| **Total** | **1,716 → 1,292** | **−424 (24.7%)** |

## Next checkpoint
**CP-78 (BA-9)**: Begin component extraction — LoginScreen component
