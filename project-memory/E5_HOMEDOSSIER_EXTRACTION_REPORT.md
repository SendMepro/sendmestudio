# Phase E-5: HomeDossier Extraction Report

## Resumen
Extracted the full dossier section (lines 1357-1676) from page.tsx into a parent component + 9 sub-components under `src/components/home/dossier/`. Total reduction: 1685 → 1372 lines (-313).

## Componentes creados

### Parent
| Componente | Archivo | Líneas | Props |
|-----------|---------|--------|-------|
| HomeDossier | `src/components/home/HomeDossier.tsx` | 146 | 12 props + renderBilingual + chileTimeLabel |

### Sub-components
| Componente | Archivo | Líneas | Props (principales) | Widget |
|-----------|---------|--------|--------------------|--------|
| HomeDossierHeroCard | `dossier/HomeDossierHeroCard.tsx` | 39 | client, service, decisionStyle | W8 hero |
| HomeEmotionalProfile | `dossier/HomeEmotionalProfile.tsx` | 89 | ep, modoTecnico, renderBilingual | W8 |
| HomeMaterialIntelligence | `dossier/HomeMaterialIntelligence.tsx` | 64 | mi, modoTecnico, renderBilingual | W9 |
| HomeCustomerLTV | `dossier/HomeCustomerLTV.tsx` | 71 | clv, modoTecnico, renderBilingual | W10 |
| HomeArrivalBehavior | `dossier/HomeArrivalBehavior.tsx` | 51 | selectedArrivalLabel, selectedArrivalRecord, onRegisterArrival, chileTimeLabel | W11 |
| HomeAIAlerts | `dossier/HomeAIAlerts.tsx` | 34 | alerts, modoTecnico, renderBilingual | W12 |
| HomeAIRecommendation | `dossier/HomeAIRecommendation.tsx` | 37 | recs, modoTecnico, renderBilingual | W13 |
| HomeTechnicalHistory | `dossier/HomeTechnicalHistory.tsx` | 52 | th, modoTecnico, renderBilingual | W14 |
| HomeTechParameters | `dossier/HomeTechParameters.tsx` | 56 | selectedAppointmentId, modoTecnico | W15 |

### Total sub-component lines
9 sub-components + 1 parent = ~639 lines of extracted code

## Cambios en page.tsx
- +1 import: `HomeDossier`
- Removed unused imports: `AlertTriangle`, `Brain`, `ChevronRight`, `CloudSun`, `Compass`, `Heart`, `History`, `ShieldCheck`, `ShoppingBag`, `AIBadge`, `Clock3` file ref in dossier (but import kept for flow list + getStageIcon)
- Replaced ~320 lines of inline JSX with `<HomeDossier ... />` (16 lines)
- Net reduction: 1685 → 1372 lines (-313)

## Props pasadas a HomeDossier
- `selectedAppointment: AppointmentInfo` — id, client, service
- `ep: EmotionalProfile` — decisionStyle, responseStyle, idealTone, anxietyLevel, priceSensitivity, visualValidation
- `mi: MaterialIntelligence` — avgCost, brands[], colorations, sessionTime, margin
- `clv: LifetimeValue` — ltv, avgTicket, annualVisits, repurchase
- `alerts: string[]` — AI alerts
- `recs: string[]` — AI recommendations
- `th: TechnicalHistory` — tonesUsed, recentServices, observations, preferences
- `selectedArrivalLabel: string` — computed arrival behavior label
- `selectedArrivalRecord: ArrivalRecord | undefined` — arrival record data
- `modoTecnico: boolean` — bilingual mode
- `registerArrival: () => void` — callback for arrival button
- `renderBilingual` — bilingual rendering function
- `chileTimeLabel` — date formatting function

## Validación
- ✅ TypeScript: 0 new errors (only 2 pre-existing)
- ✅ Same dossier layout: hero → listContainer → (emotional, material, LTV, arrival, alerts, recs, tech history, tech params)
- ✅ Same conditional rendering for modoTecnico (subLabelEn, TechParameters)
- ✅ Same bilingual pattern (renderBilingual passed through)
- ✅ Same fallback behavior (ep/mi/clv/alerts/recs/th all computed in page.tsx)
- ✅ Same icons in each section (Heart, ShoppingBag, Activity, Clock3, AlertTriangle, Brain, Compass)
- ✅ Same TechParameters conditioning on modoTecnico + selectedAppointment.id
- ✅ ClientAvatar reused from shared component
- ✅ No CSS changes, no visual changes
- ✅ No business logic moved

## Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `src/components/home/HomeDossier.tsx` | **CREATED** — Parent dossier component (146 lines) |
| `src/components/home/dossier/HomeDossierHeroCard.tsx` | **CREATED** (39 lines) |
| `src/components/home/dossier/HomeEmotionalProfile.tsx` | **CREATED** (89 lines) |
| `src/components/home/dossier/HomeMaterialIntelligence.tsx` | **CREATED** (64 lines) |
| `src/components/home/dossier/HomeCustomerLTV.tsx` | **CREATED** (71 lines) |
| `src/components/home/dossier/HomeArrivalBehavior.tsx` | **CREATED** (51 lines) |
| `src/components/home/dossier/HomeAIAlerts.tsx` | **CREATED** (34 lines) |
| `src/components/home/dossier/HomeAIRecommendation.tsx` | **CREATED** (37 lines) |
| `src/components/home/dossier/HomeTechnicalHistory.tsx` | **CREATED** (52 lines) |
| `src/components/home/dossier/HomeTechParameters.tsx` | **CREATED** (56 lines) |
| `src/app/page.tsx` | +1 import (HomeDossier), -320 inline lines, cleaned unused imports |

## Próximo paso
Phase E-6: Extract HomeAppointmentFlow — appointment flow list (W4) with loading states, click handlers, learning signals
