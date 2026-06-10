# Fix: Dossier CSS Import Paths

> **Build fix | Phase H interruption**
> Completed: 2026-05-30

---

## Problem

Next.js build failed because 9 dossier components imported `page.module.css` using a wrong relative path.

**Wrong**: `../../app/page.module.css`
**Correct**: `../../../app/page.module.css`

The components are at `src/components/home/dossier/` (3 levels from `src/`), but the import used `../../app/` (2 levels up).

## Files Fixed

| File | Line Changed |
|------|-------------|
| `src/components/home/dossier/HomeAIAlerts.tsx` | Line 2 |
| `src/components/home/dossier/HomeAIRecommendation.tsx` | Line 3 |
| `src/components/home/dossier/HomeArrivalBehavior.tsx` | Line 2 |
| `src/components/home/dossier/HomeCustomerLTV.tsx` | Line 2 |
| `src/components/home/dossier/HomeDossierHeroCard.tsx` | Line 3 |
| `src/components/home/dossier/HomeEmotionalProfile.tsx` | Line 2 |
| `src/components/home/dossier/HomeMaterialIntelligence.tsx` | Line 2 |
| `src/components/home/dossier/HomeTechParameters.tsx` | Line 2 |
| `src/components/home/dossier/HomeTechnicalHistory.tsx` | Line 2 |

## Build Status

**TypeScript check**: Passes for all 9 fixed files. No new errors.

**Pre-existing errors (not addressed)**:
1. `src/app/inbox/page.tsx:2909` — `setThreadItemRef` div/button type mismatch
2. `src/app/page.tsx:1253` — `FlowAppointment` type mismatch (unrelated)

**Next.js build**: Fails due to pre-existing error #1. CSS import issue is fully resolved.
