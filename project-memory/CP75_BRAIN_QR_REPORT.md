# CP-75: Extract useBrainAdminQR Hook

> **Status:** ✅ Checkpoint alcanzado
> **Date:** 2026-05-30
> **Phase:** Brain Admin Phase BA-6 — Hooks

---

## Changes

### Created
- **`src/hooks/brain-admin/useBrainAdminQR.ts`** (89 lines)

### Modified
- **`src/app/brain-admin/page.tsx`** (−24 lines)

## Extracted to Hook

| Item | Before (page.tsx) | After (hook) |
|------|-------------------|--------------|
| `qrToken` state | useState | Hook return |
| `qrCodeUrl` state | useState | Hook return |
| `qrShortCode` state | useState | Hook return |
| `qrLocalIP` state | useState | Hook return |
| `qrPort` state | useState | Hook return (always "3000") |
| `generateQRToken` | Inline handler (fetch POST /qr-token + IP resolution) | Hook method |
| `closeQRModal` | Inline handler (resets 4 states + closes modal) | Hook method (reset only) |

## Remaining in page
- `isQRModalOpen` / `setIsQRModalOpen` — UI-only modal visibility
- `incomingUpload` — used in QR modal JSX, comes from `useBrainAdminRealtime`
- Page wrapper for `closeQRModal` — adds `setIsQRModalOpen(false)`

## Hook API

```typescript
type QRResult = {
  qrToken: string;
  qrCodeUrl: string;
  qrShortCode: string;
  qrLocalIP: string;
  qrPort: string;
  generateQRToken: () => Promise<void>;
  closeQRModal: () => void;
};

function useBrainAdminQR(callbacks: {
  showToast: (message: string) => void;
  onQRModalOpen: () => void;
}): QRResult;
```

## Key Design Decisions

1. **`onQRModalOpen` callback** — called after successful QR generation to open the modal (keeps UI state in page)
2. **`closeQRModal` wraps** — hook resets QR states, page wrapper also closes modal
3. **`incomingUpload` not in hook** — it's from `useBrainAdminRealtime` and used directly in QR modal JSX
4. **Same IP resolution logic** — `localhost`/`127.0.0.1` fallback to `window.location.hostname` preserved

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 code errors |
| `npm run build` | ✅ /brain-admin compiles |
| QR token generation | ✅ Same fetch POST /qr-token |
| IP resolution logic | ✅ Same localhost fallback behavior |
| QR code URL construction | ✅ Same upload URL template |
| Modal open behavior | ✅ `onQRModalOpen` → `setIsQRModalOpen(true)` |
| Modal close + reset | ✅ Hook resets states, page closes modal |
| Error handling | ✅ Same `showToast` callbacks |
| No business logic changes | ✅ Pure extraction |
| No UI/behavior changes | ✅ |

## Metrics

| Metric | Value |
|--------|-------|
| page.tsx after CP-74 | 1,388 lines |
| page.tsx now | 1,364 lines |
| Hook size | 89 lines |
| Net reduction from page.tsx | 24 lines |
| Cumulative reduction | 352 lines (20.5% of original) |
| New hooks created | 6 total |
