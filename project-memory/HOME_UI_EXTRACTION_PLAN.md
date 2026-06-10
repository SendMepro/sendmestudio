# HOME UI EXTRACTION PLAN — Phase E-0

**Fecha:** 2026-05-30T02:31 UTC
**Checkpoint:** 27 (Plan)
**Estado:** ✅ Planificación completa — sin código modificado

---

## 0. Context

`src/app/page.tsx` is **1836 lines** with **245 `styles.*` references**. All business logic (bridge calls, state management, effects) and UI rendering live in a single `Home()` component.

**Goal:** Extract UI sections into standalone components under `src/components/home/`, isolating JSX + inline styles from logic.

### Design principles

1. **Existing CSS module untouched** — All components import `styles` from `../app/page.module.css` (relative path). No duplicate styles.
2. **Props interfaces, no context** — Each component receives explicit data props + optional callback props. No React Context.
3. **Same bilingual pattern** — `renderBilingual` provided as imperative utility or `modoTecnico` + children pattern.
4. **No bridge calls in components** — All data fetching remains in `page.tsx`. Components receive already-resolved data.
5. **Incremental extraction** — Extract one component at a time, verify TS, commit.
6. **No change to business logic** — Zero side effects in the extracted components.

---

## 1. Component Analysis

### 1.1 HomeHeader — Header Section (W2 + W3)

**Current line range:** Lines 1368–1387

**JSX responsibility:**
- Header feed rotation (`headerFeed[feedIndex]` — title + subtitle)
- Weather widget (`weatherData.city`, `weatherData.temperature`)
- Date/time display (`currentFormattedDate`, `currentTimeString`)
- Bilingual technical mode toggle (modoTecnico)

**Props needed:**
```tsx
interface HomeHeaderProps {
  feedIndex: number;
  headerFeed: { title: string; subtitle: string }[];
  weatherData: { city: string; temperature: string };
  currentFormattedDate: string;
  currentTimeString: string;
  modoTecnico: boolean;
}
```

**State dependencies:** `feedIndex`, `weatherData`, `currentTime`, `modoTecnico`

**Functions required:** None (data passed in)

**CSS classes used:**
`styles.pageHeader`, `styles.headerLeft`, `styles.headerFeedItem`, `styles.headerTitle`, `styles.headerSubtitle`, `styles.headerRightInfo`, `styles.weatherWidget`, `styles.headerDateTimeDivider`, `styles.headerDateTime`, `styles.subLabelEn`

**Risk level:** 🟢 Low — isolated, deterministic, no callbacks

**Recommended extraction order:** 2nd

---

### 1.2 HomeSalonHero — Salon Hero (W1)

**Current line range:** Lines 1358–1366

**JSX responsibility:**
- Static hero section with salon logo, eyebrow text, and tagline

**Props needed:** None (pure static)

**State dependencies:** None

**Functions required:** None

**CSS classes used:**
`styles.salonHero`, `styles.salonHeroOverlay`, `styles.salonLogo`, `styles.heroEyebrow`

**Risk level:** 🟢 Low — pure static

**Recommended extraction order:** 1st (safest, zero props)

---

### 1.3 HomeAppointmentFlow — Appointment Flow List (W4)

**Current line range:** Lines 1257–1354

**JSX responsibility:**
- Loading skeleton (3 `flowCardSkeleton` divs)
- Map of `liveAppointments` → flow cards with:
  - ClientAvatar, name, time, stage icon, service, stylist photo, mock/live badges, status
  - `onClick` / `onKeyDown` handlers to select appointment + emit learning event
- Selected appointment highlight (`data-selected`)

**Props needed:**
```tsx
interface HomeAppointmentFlowProps {
  isLoadingAppointments: boolean;
  liveAppointments: FlowAppointment[];
  selectedAppointmentId: string;
  onSelectAppointment: (id: string) => void;
  modoTecnico: boolean;
}
```

**State dependencies:** `isLoadingAppointments`, `liveAppointments`, `selectedAppointmentId`, `selectedAppointment`

**Functions required:** `getStageIcon()`, `ClientAvatar` (reusable), `styles`

**CSS classes used:**
`styles.flowColumn`, `styles.flowScroll`, `styles.flowList`, `styles.flowCard`, `styles.flowCardSkeleton`, `styles.skeletonAvatar`, `styles.skeletonLine`, `styles.flowAvatar`, `styles.flowContent`, `styles.flowName`, `styles.flowMetaLine`, `styles.flowTime`, `styles.flowTimeIcon`, `styles.flowStageIconInline`, `styles.tooltipText`, `styles.flowServiceIcon`, `styles.flowServiceText`, `styles.flowMeta`, `styles.stylistAvatar`, `styles.flowStylistInfo`, `styles.flowStylistLabel`, `styles.flowPills`, `styles.flowBadgeMock`, `styles.flowBadgeLive`, `styles.flowStatus`

**Risk level:** 🟡 Medium — selection logic + learning signal emission; callback must be carefully wired

**Recommended extraction order:** 6th (last — most complex)

---

### 1.4 HomeClientFocusCard — Client Focus Card (W5)

**Current line range:** Lines 1389–1469

**JSX responsibility:**
- Client avatar, LTV/re-purchase pills
- Client name, priority label, service info
- Time and stylist info
- Reservation progress bar
- Placeholder badge for real clients (W5)
- Service graphic image
- AI recommendation box with badge, label, note, impact

**Props needed:**
```tsx
interface HomeClientFocusCardProps {
  selectedAppointment: FlowAppointment;
  isRealClient: boolean;
  reservationProgress: { label: string; progress: number };
  modoTecnico: boolean;
}
```

**State dependencies:** `selectedAppointment`, `isRealClient`, `reservationProgress`, `modoTecnico`

**Functions required:** `ClientAvatar`

**CSS classes used:**
`styles.clientFocusCard`, `styles.clientFocusLeft`, `styles.clientFocusPortrait`, `styles.clientFocusSummary`, `styles.clientFocusValuePills`, `styles.clientFocusValuePill`, `styles.clientFocusValuePillEmpty`, `styles.clientFocusBody`, `styles.clientFocusTitle`, `styles.clientFocusPriorityRow`, `styles.sectionKicker`, `styles.clientFocusRepurchase`, `styles.clientFocusService`, `styles.clientFocusMetaRow`, `styles.clientFocusTime`, `styles.clientFocusStylist`, `styles.stylistAvatar`, `styles.reservationProgress`, `styles.reservationProgressMeta`, `styles.reservationProgressTrack`, `styles.w5PlaceholderBadge`, `styles.w5PlaceholderDot`, `styles.serviceGraphicImage`, `styles.clientFocusNoteBox`, `styles.noteBadge`, `styles.clientFocusNoteLabel`, `styles.clientFocusNote`, `styles.clientFocusImpact`

**Risk level:** 🟡 Medium — lots of props, conditional rendering for isRealClient, inline SVG

**Recommended extraction order:** 4th

---

### 1.5 HomeKpiCards — KPI Metrics + Platform Health (W6 + W7)

**Current line range:** Lines 1471–1504

**JSX responsibility:**
- Platform health card (score, status, detail, health bar)
- 3 KPI metric cards (Ventas hoy, Potencial, Ocupación) — each with icon, value, detail

**Props needed:**
```tsx
interface HomeKpiCardsProps {
  platformHealth: { score: number; status: string; detail: string };
  kpiMetrics: { label: string; value: string; detail: string; icon: React.ElementType }[];
  modoTecnico: boolean;
}
```

**State dependencies:** `platformHealth`, `kpiMetrics`, `modoTecnico`

**Functions required:** None

**CSS classes used:**
`styles.kpiRow`, `styles.kpiMiniCard`, `styles.platformHealthCard`, `styles.kpiIcon`, `styles.kpiMainContent`, `styles.kpiLabel`, `styles.kpiValue`, `styles.kpiMeta`, `styles.healthBar`, `styles.healthInsight`

**Risk level:** 🟢 Low — no callbacks, deterministic rendering

**Recommended extraction order:** 3rd

---

### 1.6 HomeClientDossier — Full Dossier (W8-W15)

**Current line range:** Lines 1508–1828

**This is the largest section.** It contains 8 sub-sections. We will split it into **one parent component + sub-components**:

#### 1.6.1 HomeDossier (parent)

**JSX responsibility:**
- Wraps `clientScroll` container
- Composes all sub-sections

**Props needed:**
```tsx
interface HomeDossierProps {
  selectedAppointment: FlowAppointment;
  ep: EmotionalProfile;
  mi: MaterialIntelligence;
  clv: LifetimeValue;
  alerts: string[];
  recs: string[];
  th: TechnicalHistory;
  selectedArrivalLabel: string;
  selectedArrivalRecord: ArrivalRecord | undefined;
  modoTecnico: boolean;
  registerArrival: () => void;
  isRealClient: boolean;
}
```

**CSS classes used:** `styles.clientScroll`

#### 1.6.2 HomeDossierHeroCard (W8 hero)

**Lines:** 1513–1533

**Props:** `client: string`, `service: string`, `decisionStyle: string`, `modoTecnico`

**CSS:** `styles.dossierHeroCard`, `styles.noiseBg`, `styles.dossierHeroBlurBg`, `styles.dossierHeroContent`, `styles.dossierHeroAvatarWrapper`, `styles.dossierHeroAvatar`, `styles.dossierHeroGlowRing`, `styles.dossierHeroMeta`, `styles.dossierHeroKicker`, `styles.dossierHeroName`, `styles.dossierHeroService`, `styles.dossierHeroBadge`, `styles.dossierHeroBadgeIcon`

#### 1.6.3 HomeEmotionalProfile (W8)

**Lines:** 1537–1599

**Props:** `ep: EmotionalProfile`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.dossierHeaderLine`, `styles.dossierIcon`, `styles.luxuryTitleWrapper`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.emotionalDetailGrid`, `styles.emotionalDetailItem`, `styles.emotionalDetailLabel`, `styles.emotionalDetailValue`, `styles.emotionalBarGrid`, `styles.emotionalBarItem`, `styles.emotionalBarMeta`, `styles.luxuryProgressTrack`, `styles.luxuryProgressBar`

#### 1.6.4 HomeMaterialIntelligence (W9)

**Lines:** 1602–1640

**Props:** `mi: MaterialIntelligence`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.dossierIcon`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.materialMetricsGrid`, `styles.materialMetricCard`, `styles.goldenHighlight`, `styles.materialTextDetail`, `styles.materialDetailRow`, `styles.materialRowLabel`, `styles.brandsChips`, `styles.brandChip`, `styles.materialRowValue`

#### 1.6.5 HomeCustomerLTV (W10)

**Lines:** 1643–1689

**Props:** `clv: LifetimeValue`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.dossierIcon`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.clvMetricsGrid`, `styles.clvMetricCard`, `styles.clvPrimaryValue`, `styles.clvBars`, `styles.clvBarItem`, `styles.clvBarMeta`, `styles.luxuryProgressTrack`, `styles.luxuryProgressBarGold`, `styles.luxuryProgressBarPurple`

#### 1.6.6 HomeArrivalBehavior (W11)

**Lines:** 1692–1714

**Props:** `selectedArrivalLabel: string`, `selectedArrivalRecord: ArrivalRecord | undefined`, `onRegisterArrival: () => void`, `modoTecnico`

**CSS:** `styles.luxuryArrivalSection`, `styles.arrivalCardMain`, `styles.dossierHeaderLine`, `styles.dossierIcon`, `styles.luxuryTitleWrapper`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.arrivalBehaviorStrong`, `styles.arrivalSmallText`, `styles.luxuryArrivalBtn`

#### 1.6.7 HomeAIAlerts (W12)

**Lines:** 1717–1733

**Props:** `alerts: string[]`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.dossierIconAlert`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.aiAlertsList`, `styles.aiAlertItem`, `styles.aiAlertBullet`

#### 1.6.8 HomeAIRecommendation (W13)

**Lines:** 1736–1754

**Props:** `recs: string[]`, `modoTecnico`

**CSS:** `styles.luxuryDossierAiCard`, `styles.noiseBg`, `styles.dossierAiBadge`, `styles.dossierIcon`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.aiRecommendationKicker`, `styles.aiRecommendationsList`, `styles.aiRecommendationItem`, `styles.aiRecArrow`

#### 1.6.9 HomeTechnicalHistory (W14)

**Lines:** 1757–1784

**Props:** `th: TechnicalHistory`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.dossierIcon`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.technicalHistoryGrid`, `styles.technicalHistoryItem`, `styles.techObservationsText`

#### 1.6.10 HomeTechParameters (W15)

**Lines:** 1787–1827 (conditional on `modoTecnico`)

**Props:** `selectedAppointmentId: string`, `modoTecnico`

**CSS:** `styles.luxuryDossierSection`, `styles.techMetricsSection`, `styles.dossierIconTech`, `styles.luxuryDossierTitle`, `styles.subLabelEn`, `styles.techParamsGrid`, `styles.techParamItem`, `styles.techReasoningBox`

**Risk level:** 🟡 Medium — many props, conditional rendering, but no business logic

**Recommended extraction order:** 5th (extract all dossier sub-components + parent in one pass)

---

## 2. Shared Dependencies

### Helper functions to extract as shared utilities

| Function | Location | Used by | Extract to |
|----------|----------|---------|------------|
| `clientInitialsFor(name)` | Lines 519-531 | `ClientAvatar` | `src/components/home/helpers.ts` |
| `ClientAvatar` (component) | Lines 534-546 | Flow, Focus, Dossier | `src/components/home/ClientAvatar.tsx` |
| `getStageIcon(stage)` | Lines 497-515 | Flow cards | `src/components/home/helpers.ts` |
| `renderBilingual(value)` | Lines 731-745 | Every section | Utility hook or pass `modoTecnico` + bilingual prop pattern |

### Component tree after extraction

```
page.tsx (1836 → ~300 lines)
├── AppShell (existing)
├── HomeSalonHero
├── HomeHeader
├── HomeAppointmentFlow
├── HomeClientFocusCard
├── HomeKpiCards
│   ├── PlatformHealthCard
│   └── KpiMetricCard[]
├── HomeDossier
│   ├── HomeDossierHeroCard
│   ├── HomeEmotionalProfile
│   ├── HomeMaterialIntelligence
│   ├── HomeCustomerLTV
│   ├── HomeArrivalBehavior
│   ├── HomeAIAlerts
│   ├── HomeAIRecommendation
│   ├── HomeTechnicalHistory
│   └── HomeTechParameters (conditional)
└── ClientAvatar (reusable)
```

### What remains in page.tsx

After full extraction (~300-400 lines):
- Imports
- Data definitions (`appointments`, `headerFeed`, `metrics`, helper functions)
- Component state (all `useState`, `useRef`)
- Side effects (all `useEffect` for bridge, platform health, weather, dossier agents)
- Computed values (`ep`, `mi`, `clv`, `alerts`, `recs`, `th`, `liveAppointments`, etc.)
- `registerArrival` callback
- `emitAppointmentSelected` callback
- The `return` JSX wrapper with `<AppShell>` composing all extracted components

---

## 3. Extraction Order (Recommended)

| Order | Component | Risk | Rationale |
|:-----:|-----------|:----:|-----------|
| **1** | `HomeSalonHero` | 🟢 | Pure static, zero props — fastest win |
| **2** | `HomeHeader` | 🟢 | Deterministic, no callbacks |
| **3** | `HomeKpiCards` | 🟢 | Deterministic, no callbacks, clear props |
| **4** | `HomeClientFocusCard` | 🟡 | Non-trivial props but no async logic | ✅ (Checkpoint 31)
| **5** | `HomeDossier` (all sub-components) | 🟡 | Many props but pure render; largest gain | ✅ (Checkpoint 32)
| **5a** | `ClientAvatar` (shared) | 🟢 | Prerequisite for Flow + Focus + Dossier | ✅ (Checkpoint 31)
| **6** | `HomeAppointmentFlow` | 🟡 | Complex callback wiring, loading states |

---

## 4. File Structure

```
src/components/home/
├── ClientAvatar.tsx
├── helpers.ts               (clientInitialsFor, getStageIcon)
├── HomeSalonHero.tsx
├── HomeHeader.tsx
├── HomeAppointmentFlow.tsx
├── HomeClientFocusCard.tsx
├── HomeKpiCards.tsx
├── HomeDossier.tsx           (parent — composes sub-components)
├── HomeDossierHeroCard.tsx
├── HomeEmotionalProfile.tsx
├── HomeMaterialIntelligence.tsx
├── HomeCustomerLTV.tsx
├── HomeArrivalBehavior.tsx
├── HomeAIAlerts.tsx
├── HomeAIRecommendation.tsx
├── HomeTechnicalHistory.tsx
└── HomeTechParameters.tsx
```

**Total:** 16 new files + 1 shared helpers file

---

## 5. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS class name conflicts | Low | All components import `styles` from `../app/page.module.css` — same source |
| Props interface mismatches | Medium | TypeScript catches all — verify with `tsc --noEmit` after each extraction |
| Callback wiring errors | Medium | Use explicit `onX` callback props, test click handlers in Flow + Arrival |
| Late extraction breaks dossier layout | Low | `HomeDossier` parent preserves the exact DOM tree (wrapper divs + `clientScroll`) |
| Bilingual rendering duplicates | Low | Extract `renderBilingual` to utility or keep inline with direct `modoTecnico` check |
| Missing CSS import in extracted component | Low | Each component must import `styles` from the shared CSS module |

---

## 6. Success Criteria

1. ✅ All 16 components created in `src/components/home/`
2. ✅ `page.tsx` reduced from 1836 → ~350 lines
3. ✅ Zero new TypeScript errors (only 2 pre-existing)
4. ✅ Exact same visual output — no layout shifts
5. ✅ All business logic (bridge calls, effects) stays in `page.tsx`
6. ✅ Each component committed incrementally with TS verification
