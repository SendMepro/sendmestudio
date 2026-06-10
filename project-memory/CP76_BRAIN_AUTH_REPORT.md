# CP-76 Report — Extract useBrainAdminAuth Hook

## Result
**page.tsx:** 1,364 → 1,328 lines (−36 net, −2.6%)

**New file:** `src/hooks/brain-admin/useBrainAdminAuth.ts` (94 lines)

## What was extracted

| From page.tsx | To hook |
|---|---|
| `isAuthenticated`, `isCheckingAuth`, `password`, `loginError`, `localDevKeyHint`, `isSuperAdmin` (6 useStates) | `useBrainAdminAuth()` return values |
| `useEffect` with `checkSession` (GET `/api/brain-admin/session` + auth validation) | Internal `useEffect` in hook |
| `handleLogin` (POST `/api/brain-admin/session` + password validation) | `handleLogin` returned from hook |
| `setPassword`, `setLoginError`, `setLocalDevKeyHint`, `setIsCheckingAuth`, `setIsSuperAdmin` | Managed internally by hook |

## How it works
- **`useBrainAdminAuth({ loadSummary, loadStorageStats, loadNightQueue })`** — accepts data-loading callbacks that are invoked after successful session validation or login.
- On mount, the hook calls `GET /api/brain-admin/session`. If authenticated, it calls all three load callbacks.
- `handleLogin` sends `POST /api/brain-admin/session` with the password, sets auth state on success, calls `loadSummary`, and clears password.
- The page receives `isAuthenticated`, `isCheckingAuth`, `password`, `loginError`, `localDevKeyHint`, `isSuperAdmin`, `setPassword`, and `handleLogin`.

## Page integration
```tsx
const {
  isAuthenticated,
  isCheckingAuth,
  password,
  loginError,
  localDevKeyHint,
  isSuperAdmin,
  setPassword,
  handleLogin,
} = useBrainAdminAuth({
  loadSummary,
  loadStorageStats,
  loadNightQueue,
});
```

**Login form JSX remains unchanged** — it references `password`, `setPassword`, `handleLogin`, `loginError`, `isAuthenticated`, `isCheckingAuth` as before.

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
| **Total** | **1,716 → 1,328** | **−388 (22.6%)** |

## Next checkpoint
**CP-77 (BA-8)**: Extract hook `useBrainAdminData` — `loadSummary`, `loadStorageStats`, `loadNightQueue`, `showToast` logic
