# Brain Admin Extraction Plan

> **Status:** 📋 Extraction in progress — CP-84 (Final 5 components) completed
> **Current page.tsx:** 861 lines
> **Generated:** 2026-05-30 (Updated 2026-05-30)

---

## 1. Architecture Audit

### Current Structure

```
src/app/brain-admin/page.tsx  (~1,716 lines)
│
├─ Imports & Constants (lines 1–51)
│   ├─ React (useState, useEffect, useRef, useMemo, useCallback)
│   ├─ Lucide icons (48 icons)
│   └─ AppShell, CSS module
│
├─ Type Definitions (lines 52–194)
│   ├─ BrainSummary (~12 fields × subfields)
│   ├─ SpeechRecognitionEventLike
│   ├─ SpeechRecognitionLike
│   ├─ SpeechRecognitionWindow
│   └─ emptySummary default value
│
├─ Component Body (lines 196–763)
│   ├─ 40 state variables (6 groups)
│   ├─ 4 useEffect hooks
│   ├─ 3 useRef declarations
│   ├─ 2 useMemo derivations
│   ├─ 0 useCallback
│   ├─ 10 API functions (loadSummary, loadStorageStats, loadNightQueue, handleLogin, handleUpload, etc.)
│   ├─ Voice recording handlers (startVoiceRecording, stopVoiceRecording, closeVoiceModal, saveVoiceLearning)
│   ├─ Note/audit handlers (auditNote, saveNote, openNotesModal, closeNotesModal)
│   └─ QR handlers (generateQRToken, closeQRModal)
│
└─ JSX Return (lines 764–1,716, ~954 lines)
    ├─ <AppShell> wrapper
    ├─ Login screen (conditional)
    ├─ Authenticated content
    │   ├─ Hero section (learning mini-cards)
    │   ├─ Tab bar (5 tabs)
    │   ├─ Tab: Aprender (~400 lines)
    │   │   ├─ Smart dropzone + upload
    │   │   ├─ "Qué aprendió hoy" section
    │   │   ├─ New signals card
    │   │   ├─ Night activity card
    │   │   ├─ Suggestions card
    │   │   └─ Memory/storage section
    │   ├─ Tab: Trabajos (~47 lines)
    │   ├─ Tab: Talento (~47 lines)
    │   ├─ Tab: Satisfacción (~44 lines)
    │   └─ Tab: Campañas (~106 lines)
```

### Key Metrics

| Metric | Value |
|--------|-------|
| Total lines | 1,716 |
| State variables | 40 |
| useEffect hooks | 4 |
| useRef | 3 |
| useMemo | 2 |
| useCallback | 0 |
| API endpoints called | 7 (10 distinct calls) |
| JSX return | ~954 lines |
| CSS module | 2,960 lines |

---

## 2. State Groups

### Group A: Auth/Session (6 vars)
| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `isAuthenticated` | `boolean` | `false` | Session check passed |
| `isCheckingAuth` | `boolean` | `true` | Loading state during session check |
| `password` | `string` | `""` | Login password input |
| `loginError` | `string` | `""` | Login error message |
| `localDevKeyHint` | `string` | `""` | Dev mode password hint |
| `isSuperAdmin` | `boolean` | `false` | Super admin privileges flag |

### Group B: Summary/Data (7 vars)
| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `summary` | `BrainSummary` | `emptySummary` | Main brain data from API |
| `storageStats` | `Record<string, unknown> \| null` | `null` | Storage usage statistics |
| `nightQueue` | `object \| null` | `null` | Night processing queue status |
| `learnedToday` | `object \| null` | `null` | Today's learning results |
| `newSignals` | `array` | `[]` | Newly detected signals |
| `uploadLog` | `string[]` | `[]` | Upload processing log lines |
| `incomingUpload` | `object \| null` | `null` | Real-time upload notification |

### Group C: File/Learning Upload (5 vars)
| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `selectedFile` | `File \| null` | `null` | Selected file for upload |
| `uploadStatus` | `string` | `""` | Upload status message |
| `isUploading` | `boolean` | `false` | Upload in progress |
| `notes` | `string` | `""` | Notes text for upload |
| `modoTecnico` | `boolean` | `false` | Technical mode toggle |

### Group D: Voice Recording (7 vars)
| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `isVoiceModalOpen` | `boolean` | `false` | Voice modal visibility |
| `isRecording` | `boolean` | `false` | Recording in progress |
| `recordingSeconds` | `number` | `0` | Recording duration |
| `voiceTranscript` | `string` | `""` | Speech-to-text transcript |
| `voiceStatus` | `string` | `""` | Voice status/error message |
| `voiceAudioBlob` | `Blob \| null` | `null` | Recorded audio blob |
| `isSavingVoice` | `boolean` | `false` | Saving voice learning in progress |

### Group E: UI State (15 vars)
| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `toastMessage` | `string` | `""` | Toast notification text |
| `toastVisible` | `boolean` | `false` | Toast visibility |
| `showTechDetails` | `boolean` | `false` | Toggle technical details |
| `activeTab` | `"aprender" \| "trabajos" \| "talento" \| "satisfaccion" \| "campanas"` | `"aprender"` | Active tab |
| `isNotesModalOpen` | `boolean` | `false` | Notes modal visibility |
| `noteText` | `string` | `""` | Note text input |
| `auditResult` | `{ status, message }` | `{ null, "" }` | Note audit result |
| `isAuditing` | `boolean` | `false` | Audit in progress |
| `isSavingNote` | `boolean` | `false` | Saving note in progress |
| `isQRModalOpen` | `boolean` | `false` | QR modal visibility |
| `qrToken` | `string` | `""` | Generated QR token |
| `qrCodeUrl` | `string` | `""` | QR code URL |
| `qrShortCode` | `string` | `""` | Short code for QR |
| `qrLocalIP` | `string` | `""` | Local IP for QR link |
| `qrPort` | `string` | `"3000"` | Port for QR link |

---

## 3. Effects

| # | Lines | Dependencies | Purpose | Risk |
|---|-------|-------------|---------|------|
| 1 | 261–295 | `[]` | **SSE connection** — EventSource for real-time brain updates (upload_received, brain_updated). Includes auto-reconnect on error with 5s retry. | **High** — Must preserve SSE continuity |
| 2 | 297–305 | `[]` | **Modo técnico** — Reads localStorage flag, listens for custom event | Low |
| 3 | 317–327 | `[isRecording]` | **Recording timer** — Increments `recordingSeconds` every 1s while recording | Low |
| 4 | 372–392 | `[]` | **Session check** — Fetches `/api/brain-admin/session` on mount, then loads summary/storage/queue if authenticated | Medium |

---

## 4. API Integrations

| Endpoint | Method | Function | Purpose |
|----------|--------|----------|---------|
| `/api/brain-admin/session` | GET | `checkSession` | Verify existing session |
| `/api/brain-admin/session` | POST | `handleLogin` | Login with password |
| `/api/brain-admin/upload` | GET | `loadSummary` | Load brain summary data |
| `/api/brain-admin/upload` | POST | `handleUpload` | Upload file (FormData) |
| `/api/brain-admin/storage` | GET | `loadStorageStats` | Load storage statistics |
| `/api/brain-admin/queue` | GET | `loadNightQueue` | Load night processing queue |
| `/api/brain-admin/voice` | POST | `saveVoiceLearning` | Save voice recording (FormData) |
| `/api/brain-admin/voice` | PATCH | `updateSuggestion` | Apply/dismiss suggestion |
| `/api/brain-admin/audit-note` | POST | `auditNote` | Audit note text |
| `/api/brain-admin/audit-note` | POST | `saveNote` | Save note as learning |
| `/api/brain-admin/qr-token` | POST | `generateQRToken` | Generate QR upload token |
| `/api/brain-admin/events` | SSE | useEffect #1 | Real-time event stream |

---

## 5. Candidate Hooks

### H1: `useBrainAdminAuth`
**Extracts:** Auth/session state + login logic
- States: `isAuthenticated`, `isCheckingAuth`, `password`, `loginError`, `localDevKeyHint`, `isSuperAdmin`
- API: `GET /api/brain-admin/session`, `POST /api/brain-admin/session`
- Effect: Session check on mount (effect #4)
- **Est. extraction:** ~80 lines from page.tsx

### H2: `useBrainAdminData`
**Extracts:** Summary + storage + queue data loading
- States: `summary`, `storageStats`, `nightQueue`
- API: `GET /api/brain-admin/upload`, `GET /api/brain-admin/storage`, `GET /api/brain-admin/queue`
- Dependencies: Requires `isAuthenticated` from H1
- **Est. extraction:** ~60 lines from page.tsx

### H3: `useBrainAdminFileUpload`
**Extracts:** File selection + upload + processing log
- States: `selectedFile`, `uploadStatus`, `isUploading`, `notes`, `uploadLog`, `learnedToday`, `newSignals`
- API: `POST /api/brain-admin/upload` (FormData)
- Handlers: `handleFileChange`, `handleUpload`, `handleClearFile`
- **Est. extraction:** ~150 lines from page.tsx

### H4: `useBrainAdminVoice`
**Extracts:** Voice recording + transcription + save
- States: `isRecording`, `recordingSeconds`, `voiceTranscript`, `voiceStatus`, `voiceAudioBlob`, `isSavingVoice`
- API: `POST /api/brain-admin/voice` (FormData), `PATCH /api/brain-admin/voice`
- Refs: `recorderRef`, `mediaStreamRef`, `audioChunksRef`, `recognitionRef`
- Handlers: `startVoiceRecording`, `stopVoiceRecording`, `saveVoiceLearning`, `updateSuggestion`
- Effect: Recording timer (effect #3)
- **Est. extraction:** ~150 lines from page.tsx

### H5: `useBrainAdminNotes`
**Extracts:** Note modal + audit system
- States: `noteText`, `auditResult`, `isAuditing`, `isSavingNote`
- API: `POST /api/brain-admin/audit-note`
- Handlers: `auditNote`, `saveNote`
- **Est. extraction:** ~80 lines from page.tsx

### H6: `useBrainAdminQR`
**Extracts:** QR code generation
- States: `qrToken`, `qrCodeUrl`, `qrShortCode`, `qrLocalIP`, `qrPort`, `incomingUpload`
- API: `POST /api/brain-admin/qr-token`
- Handlers: `generateQRToken`
- SSE effect for incomingUpload is in effect #1 (shared)
- **Est. extraction:** ~70 lines from page.tsx

### H7: `useBrainAdminRealtime`
**Extracts:** SSE event source connection
- States: `incomingUpload` (also used by H6)
- Effect: SSE connection + reconnect (effect #1)
- **Est. extraction:** ~40 lines from page.tsx

---

## 6. Candidate Components

### General UI
| ID | Component | Current Lines | Props Estimate | Purpose |
|----|-----------|--------------|----------------|---------|
| C1 | **LoginScreen** | ~30 | `onLogin, error, devKeyHint` | Auth gate with password input |
| C2 | **HeroMiniCards** | ~30 | `learningMetrics` | 5 mini-cards showing brain metrics |
| C3 | **TabBar** | ~50 | `activeTab, onTabChange` | 5-tab navigation |
| C4 | **Toast** | ~5 | `message, visible` | Floating toast notification |

### Tab: Aprender (largest section)
| ID | Component | Current Lines | Props Estimate | Purpose |
|----|-----------|--------------|----------------|---------|
| C5 | **SmartDropzone** | ~60 | `selectedFile, isUploading, onFileChange, onUpload, onClear` | File upload dropzone |
| C6 | **LearnedTodayCard** | ~50 | `learnedToday` | "What the brain learned today" |
| C7 | **NewSignalsCard** | ~25 | `newSignals` | Newly detected signals |
| C8 | **NightActivityCard** | ~65 | `nightQueue` | Night processing queue |
| C9 | **SuggestionsCard** | ~25 | `suggestions, onUpdateSuggestion` | Pending suggestions |
| C10 | **StorageSection** | ~120 | `storageStats, showTechDetails, onToggleTech` | Storage memory + quota |

### Tab Content (simpler sections)
| ID | Component | Current Lines | Props Estimate | Purpose |
|----|-----------|--------------|----------------|---------|
| C11 | **WorkEntriesSection** | ~47 | `workEntries` | Tab: Trabajos realizados |
| C12 | **TalentSection** | ~47 | `talentEntries` | Tab: Talento del equipo |
| C13 | **SatisfactionSection** | ~44 | `satisfactionSignals` | Tab: Satisfacción social |
| C14 | **CampaignOpportunitiesSection** | ~106 | `campaignOpportunities` | Tab: Oportunidades de campaña |

### Timeline & Overlays
| ID | Component | Current Lines | Props Estimate | Purpose |
|----|-----------|--------------|----------------|---------|
| C15 | **LearningTimeline** | ~50 | `lastUploads` | Activity timeline |
| C16 | **VoiceModal** | ~43 | Multiple voice states + callbacks | Voice recording modal |
| C17 | **NotesModal** | ~51 | Multiple note states + callbacks | Notes collaboration modal |
| C18 | **QRModal** | ~84 | Multiple QR states + callbacks + incomingUpload | QR upload modal |

---

## 7. Estimated Checkpoints

| CP | Step | Deliverable | page.tsx After | Files |
|----|------|-------------|---------------|-------|
| **BA-1** | This plan | `BRAIN_ADMIN_EXTRACTION_PLAN.md` | 1,716 | 1 new |
| **BA-2** | Extract `useBrainAdminAuth` + `useBrainAdminData` | Hooks | ~1,580 | 3 new, 1 mod |
| **BA-3** | Extract `useBrainAdminFileUpload` | Hook | ~1,430 | 2 new, 1 mod |
| **BA-4** | Extract `useBrainAdminVoice` + `useBrainAdminRealtime` | Hooks | ~1,240 | 4 new, 1 mod |
| **BA-5** | Extract `useBrainAdminNotes` + `useBrainAdminQR` | Hooks | ~1,090 | 3 new, 1 mod |
| **BA-6** | Extract leaf components (Login, HeroMiniCards, TabBar, Toast) | Components | ~980 | 5 new, 1 mod |
| **BA-7** | Extract Tab content components (C5-C14) | Components | ~580 | 10 new, 1 mod |
| **BA-8** | Extract overlay components + Timeline (C15-C18) | Components | ~450 | 5 new, 1 mod |
| **BA-9** | Composition + page.tsx cleanup | Integration | ~350 | 1 mod |

**Total: 9 checkpoints** (BA-1 to BA-9)

---

## 8. Risk Assessment

| # | Risk | Likelihood | Impact | Phase | Mitigation |
|---|------|-----------|--------|-------|------------|
| R1 | **SSE event stream breaks** during extraction | Medium | **High** | BA-4 | Extract `useBrainAdminRealtime` as first hook; verify events still arrive after each step |
| R2 | **Voice recording MediaRecorder/SpeechRecognition fails** | Medium | High | BA-4 | Keep browser API calls (`getUserMedia`, `MediaRecorder`, `SpeechRecognition`) in hook; test manually |
| R3 | **FormData upload breaks** | Low | High | BA-3 | Extract `handleUpload` with exact same fetch + FormData construction |
| R4 | **Auth session state mismatch** | Low | High | BA-2 | Keep `loadSummary`/`loadStorageStats`/`loadNightQueue` calls after auth (effect #4) |
| R5 | **CSS class name conflicts** | Low | Medium | BA-6 | All components share existing `brain-admin.module.css` |
| R6 | **Note audit result depends on noteText timing** | Low | Low | BA-5 | `auditNote` and `saveNote` both read `noteText` — extract together |
| R7 | **QR modal incomingUpload depends on SSE** | Low | Medium | BA-4 | `incomingUpload` is set by both SSE and QR — resolve by keeping in shared hook or passing as prop |

---

## 9. Extraction Order

```
Phase BA-1: Hooks (5 checkpoints)
  1. useBrainAdminRealtime     (SSE foundation — highest risk)
  2. useBrainAdminAuth         (auth state — no deps)
  3. useBrainAdminData         (data loading — depends on auth)
  4. useBrainAdminFileUpload   (file upload — no hook deps)
  5. useBrainAdminVoice        (voice recording — no hook deps)
  6. useBrainAdminNotes        (notes + audit — no hook deps)
  7. useBrainAdminQR           (QR code — depends on realtime for incomingUpload)

Phase BA-2: Components (2 checkpoints)
  8. Leaf components: LoginScreen, HeroMiniCards, TabBar, Toast
  9. Tab content: SmartDropzone, LearnedTodayCard, NewSignalsCard,
     NightActivityCard, SuggestionsCard, StorageSection
 10. Tab pages: WorkEntriesSection, TalentSection, SatisfactionSection,
     CampaignOpportunitiesSection

Phase BA-3: Overlays + Timeline (1 checkpoint)
 11. VoiceModal, NotesModal, QRModal, LearningTimeline

Phase BA-4: Integration (1 checkpoint)
 12. Compose BrainAdminPage from hooks + components
```

### Safe Extraction Rules

1. **Extract hooks before components** — All state lives in hooks
2. **Extract SSE first** — Most fragile, test after each subsequent step
3. **Do not touch CSS module** — All components share `brain-admin.module.css`
4. **Verify `tsc --noEmit` after each checkpoint**
5. **Verify `npm run build` after each phase**
6. **Keep all fetch/API logic identical** — No business logic changes

---

## Summary

| Metric | Value |
|--------|-------|
| **Current page.tsx** | 1,716 lines |
| **Target page.tsx** | ~350 lines |
| **Lines removed** | ~1,366 (80% reduction) |
| **New files created** | ~24 (7 hooks + 14 components + 3 utilities) |
| **Checkpoints total** | 9 (BA-1 to BA-9) |
| **Phases** | 4 (BA-1 through BA-4) |
| **Highest risk** | SSE event stream + Voice recording browser APIs |
| **Verification gates** | `tsc --noEmit` + `npm run build` after each checkpoint |
