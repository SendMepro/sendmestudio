# CP-72: Extract useBrainAdminFileUpload Hook

> **Status:** ✅ Checkpoint alcanzado
> **Date:** 2026-05-30
> **Phase:** Brain Admin Phase BA-3 — Hooks

---

## Changes

### Created
- **`src/hooks/brain-admin/useBrainAdminFileUpload.ts`** (190 lines)

### Modified
- **`src/app/brain-admin/page.tsx`** (−75 lines)

## Extracted to Hook

| Item | Before (page.tsx) | After (hook) |
|------|-------------------|--------------|
| `selectedFile` state | useState | Hook return |
| `uploadStatus` state | useState | Hook return |
| `isUploading` state | useState | Hook return |
| `uploadLog` state | useState | Hook return |
| `notes` state | useState | Hook return |
| `learnedToday` state | useState | Hook return |
| `newSignals` state | useState | Hook return |
| `handleFileChange` | Inline handler | Hook method |
| `handleUpload` | Inline handler (70+ lines, fetch + FormData + MIME detection) | Hook method |
| `handleClearFile` | Inline handler | Hook method |

## Hook API

```typescript
type FileUploadResult = {
  selectedFile: File | null;
  uploadStatus: string;
  isUploading: boolean;
  uploadLog: string[];
  notes: string;
  learnedToday: LearnedToday | null;
  newSignals: SignalEntry[];
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleClearFile: () => void;
  setNotes: (value: string) => void;
  setUploadStatus: (value: string) => void;
};

function useBrainAdminFileUpload(callbacks: {
  onUploadSuccess: (data: { summary: unknown }) => Promise<void>;
  loadStorageStats: () => Promise<void>;
  showToast: (message: string) => void;
}): FileUploadResult;
```

## Key Design Decisions

1. **Callbacks pattern** — `onUploadSuccess`, `loadStorageStats`, and `showToast` are injected so the hook stays pure (no page-level state leakage)
2. **`setUploadStatus` exposed** — needed by the voice save handler (`saveVoiceLearning`) which shares the same status display
3. **All original logic preserved** — same MIME type detection, same FormData construction, same log format strings, same error handling
4. **No React import changes** — page no longer needs `ChangeEvent` since `handleFileChange` is from the hook

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 code errors |
| `npm run build` | ✅ /brain-admin compiles |
| File selection behavior | ✅ Same `event.target.files?.[0]` logic |
| Upload MIME detection | ✅ Same folder mapping (img, .mp3, .md, .pdf, .txt) |
| Upload log format | ✅ Same emoji-prefixed log strings |
| Error handling | ✅ Same try/catch + log push pattern |
| Clear file confirm | ✅ Same `window.confirm` check |
| Voice save sharing | ✅ `setUploadStatus` exposed for saveVoiceLearning |
| No business logic changes | ✅ Pure extraction |
| No UI/behavior changes | ✅ |

## Metrics

| Metric | Value |
|--------|-------|
| page.tsx after CP-71 | 1,676 lines |
| page.tsx now | 1,601 lines |
| Hook size | 190 lines |
| Net reduction from page.tsx | 75 lines |
| Cumulative reduction | 115 lines |
