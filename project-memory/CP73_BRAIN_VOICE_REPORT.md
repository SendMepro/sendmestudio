# CP-73: Extract useBrainAdminVoice Hook

> **Status:** ✅ Checkpoint alcanzado
> **Date:** 2026-05-30
> **Phase:** Brain Admin Phase BA-4 — Hooks

---

## Changes

### Created
- **`src/hooks/brain-admin/useBrainAdminVoice.ts`** (269 lines)

### Modified
- **`src/app/brain-admin/page.tsx`** (−153 lines)

## Extracted to Hook

| Item | Before (page.tsx) | After (hook) |
|------|-------------------|--------------|
| `isRecording` state | useState | Hook return |
| `recordingSeconds` state | useState | Hook internal |
| `voiceTranscript` state | useState | Hook return |
| `voiceStatus` state | useState | Hook return |
| `voiceAudioBlob` state | useState | Hook internal |
| `isSavingVoice` state | useState | Hook return |
| `formattedRecordingTime` | useMemo | Hook return |
| Recording timer | useEffect | Hook internal |
| `recorderRef` | useRef | Hook internal |
| `mediaStreamRef` | useRef | Hook internal |
| `audioChunksRef` | useRef | Hook internal |
| `recognitionRef` | useRef | Hook internal |
| `startVoiceRecording` | Inline handler (MediaRecorder + SpeechRecognition) | Hook method |
| `stopVoiceRecording` | Inline handler | Hook method |
| `saveVoiceLearning` | Inline handler (fetch POST /voice) | Hook method |
| `updateSuggestion` | Inline handler (fetch PATCH /voice) | Hook method |
| SpeechRecognition types | 3 type declarations | Hook internal |

## Remaining in page
- `isVoiceModalOpen` / `setIsVoiceModalOpen` — UI state for modal visibility
- `closeVoiceModal` — wraps hook's stop + closes modal
- `saveVoiceLearning` — wraps hook's save + closes modal

## Hook API

```typescript
type VoiceRecordingResult = {
  isRecording: boolean;
  recordingSeconds: number;
  voiceTranscript: string;
  voiceStatus: string;
  voiceAudioBlob: Blob | null;
  isSavingVoice: boolean;
  formattedRecordingTime: string;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => void;
  closeVoiceModal: () => void;
  saveVoiceLearning: () => Promise<void>;
  updateSuggestion: (id: string, status: "applied" | "dismissed") => Promise<void>;
  setVoiceTranscript: (value: string) => void;
};

function useBrainAdminVoice(callbacks: {
  onSaveSuccess: (summary: unknown) => void;
  setUploadStatus: (value: string) => void;
}): VoiceRecordingResult;
```

## Key Design Decisions

1. **Modal visibility stays in page** — `isVoiceModalOpen`/`setIsVoiceModalOpen` are UI-only; the hook manages recording logic
2. **Page wraps `saveVoiceLearning` and `closeVoiceModal`** — to also close the modal (the hook doesn't know about UI state)
3. **SpeechRecognition types moved to hook** — 3 type definitions no longer pollute page.tsx
4. **Callbacks pattern** — `onSaveSuccess` for `setSummary`, `setUploadStatus` for status sharing with file upload

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 code errors |
| `npm run build` | ✅ /brain-admin compiles |
| MediaRecorder behavior | ✅ Same getUserMedia + mimeType detection |
| SpeechRecognition behavior | ✅ Same recognitionConstructor logic, es-CL language |
| Audio blob assembly | ✅ Same ondataavailable → Blob pattern |
| Voice save | ✅ Same FormData construction + fetch POST /voice |
| Suggestion update | ✅ Same fetch PATCH /voice |
| Recording timer | ✅ Same 1s interval, same formatted time |
| Modal close behavior | ✅ Page wrapper stops recording then closes modal |
| No business logic changes | ✅ Pure extraction |
| No UI/behavior changes | ✅ |

## Metrics

| Metric | Value |
|--------|-------|
| page.tsx after CP-72 | 1,601 lines |
| page.tsx now | 1,448 lines |
| Hook size | 269 lines |
| Net reduction from page.tsx | 153 lines |
| Cumulative reduction | 268 lines (15.6% of original) |
| React imports removed from page | `useRef` |
| Type declarations removed | 3 (SpeechRecognition types) |
