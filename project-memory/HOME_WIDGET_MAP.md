# Home Widget Map

## Date
2026-05-29 @ 23:15 UTC

## Widget 1: Salon Hero
- **Purpose:** Branding banner with logo and tagline
- **Current File:** `src/app/page.tsx` (lines 936-944)
- **Data Source:** Static image + hardcoded text
- **Service/API Used:** None
- **Real Data or Mock:** Mock
- **Refresh Behavior:** Static
- **Loading State:** None (always visible)
- **Error State:** None
- **Empty State:** N/A
- **Risk:** Minimal
- **Should Feed Intelligence:** No
- **Recommended Agent Owner:** None

## Widget 2: Header Feed (Rotating Tips)
- **Purpose:** Display operational tips from AI, rotating every 30 seconds
- **Current File:** `src/app/page.tsx` (lines 389-414, 704-710, 948-951)
- **Data Source:** Hardcoded `headerFeed` array (6 items)
- **Service/API Used:** `setInterval` 30s rotation
- **Real Data or Mock:** ❌ Mock
- **Refresh Behavior:** Auto-rotates every 30s
- **Loading State:** None
- **Error State:** None
- **Empty State:** N/A (always 6 items)
- **Risk:** Tips are static; never reflect real operational conditions
- **Should Feed Intelligence:** Yes (could use real AI-generated tips)
- **Recommended Agent Owner:** HomeOrchestratorAgent, HomeLearningAgent

## Widget 3: Weather + Date/Time
- **Purpose:** Display current date, time, and weather
- **Current File:** `src/app/page.tsx` (lines 954-963)
- **Data Source:** `Date()` (real), "Santiago, 18°C" (mock)
- **Service/API Used:** `Intl.DateTimeFormat`
- **Real Data or Mock:** ⚠️ Date/time real, weather mock
- **Refresh Behavior:** 30-second interval for time; weather never refreshes
- **Loading State:** None
- **Error State:** None
- **Empty State:** N/A
- **Risk:** Weather is hardcoded; could confuse staff if they expect real weather
- **Should Feed Intelligence:** Yes (timing patterns)
- **Recommended Agent Owner:** HomeDataSourceAgent

## Widget 4: Appointment Flow List (Left Column)
- **Purpose:** List of all appointments for the day with status, stylist, service
- **Current File:** `src/app/page.tsx` (lines 870-932)
- **Data Source:** Merged mock (`appointments[5]`) + real (`/api/appointments`)
- **Service/API Used:** `GET /api/appointments`
- **Real Data or Mock:** ⚠️ Mixed (mock always present, real merged in)
- **Refresh Behavior:** On mount only
- **Loading State:** ❌ None (silent catch, shows mock)
- **Error State:** ❌ None (silent catch)
- **Empty State:** ❌ None (mock data always shown)
- **Risk:** **HIGH** — mock data masks empty real data; no loading/error states
- **Should Feed Intelligence:** Yes (appointment frequency, service popularity, stylist workload)
- **Recommended Agent Owner:** HomeOrchestratorAgent, HomeDataSourceAgent

## Widget 5: Client Focus Card (Selected Appointment)
- **Purpose:** Highlighted card for the selected appointment with LTV, service, time, progress, AI recommendation
- **Current File:** `src/app/page.tsx` (lines 967-1032)
- **Data Source:** Selected from `liveAppointments` (mock or real)
- **Service/API Used:** None (derived from widget 4 data)
- **Real Data or Mock:** ⚠️ Depends on selected appointment
- **Refresh Behavior:** Changes on selection click
- **Loading State:** None
- **Error State:** None
- **Empty State:** None (always has a selected appointment)
- **Risk:** **HIGH** — real appointments from Inbox have mock "LTV Nuevo" and mock "repurchase 0%"
- **Should Feed Intelligence:** Yes (recommendation acceptance, service preferences)
- **Recommended Agent Owner:** HomeOrchestratorAgent, HomeLearningAgent

## Widget 6: Platform Health Card
- **Purpose:** Show platform health score based on campaign template metrics
- **Current File:** `src/app/page.tsx` (lines 1035-1050)
- **Data Source:** `localStorage("campaigns:meta-templates")` + `localStorage("campaigns:template-health-history")`
- **Service/API Used:** `calculatePlatformHealth()` function
- **Real Data or Mock:** ⚠️ Partially real (reads localStorage if available)
- **Refresh Behavior:** On mount only
- **Loading State:** ❌ None (fallback to 92/Healthy)
- **Error State:** ⚠️ Try/catch returns default 92/Healthy
- **Empty State:** N/A (always shows a score)
- **Risk:** Medium — localStorage not persistent across devices
- **Should Feed Intelligence:** Yes (template health trends, compliance patterns)
- **Recommended Agent Owner:** HomeHealthCheckAgent, HomeLearningAgent

## Widget 7: KPI Metrics Cards (Sales, Potential, Occupancy)
- **Purpose:** Display daily sales, revenue potential, and occupancy percentage
- **Current File:** `src/app/page.tsx` (lines 1051-1066)
- **Data Source:** Hardcoded `metrics` array (lines 416-420)
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Static
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** N/A (always shows hardcoded values)
- **Risk:** **HIGH** — metrics never represent real business data
- **Should Feed Intelligence:** Yes (sales trends, occupancy patterns)
- **Recommended Agent Owner:** HomeOrchestratorAgent, HomeDataSourceAgent, HomeMetricsAgent

## Widget 8: Dossier — Emotional Profile
- **Purpose:** Client emotional profile with decision style, anxiety level, price sensitivity, visual validation
- **Current File:** `src/app/page.tsx` (lines 1100-1162)
- **Data Source:** `appointments[].clientIntelligence.emotionalProfile` (hardcoded per mock client)
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None (always has data from mock)
- **Empty State:** ❌ None (falls back to `defaultClientIntelligence`)
- **Risk:** **CRITICAL** — real appointments get generic/default profile with no real AI
- **Should Feed Intelligence:** Yes (emotional patterns, decision styles)
- **Recommended Agent Owner:** HomeAIInsightAgent, HomeLearningAgent

## Widget 9: Dossier — Material Intelligence
- **Purpose:** Client material preferences (brands, colorations, session time, margin)
- **Current File:** `src/app/page.tsx` (lines 1164-1203)
- **Data Source:** `appointments[].clientIntelligence.materialIntelligence`
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None
- **Risk:** **CRITICAL** — no real material data for actual clients
- **Should Feed Intelligence:** Yes (material preferences, margin analysis)
- **Recommended Agent Owner:** HomeAIInsightAgent, HomeLearningAgent

## Widget 10: Dossier — Customer Lifetime Value
- **Purpose:** Display LTV, avg ticket, annual visits, repurchase rate
- **Current File:** `src/app/page.tsx` (lines 1206-1252)
- **Data Source:** `appointments[].clientIntelligence.lifetimeValue`
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None
- **Risk:** **CRITICAL** — no real customer value data
- **Should Feed Intelligence:** Yes (customer value segmentation, retention trends)
- **Recommended Agent Owner:** HomeAIInsightAgent, HomeLearningAgent

## Widget 11: Dossier — Arrival Behavior
- **Purpose:** Track client punctuality (manual registration)
- **Current File:** `src/app/page.tsx` (lines 1255-1277)
- **Data Source:** `localStorage("dashboard:arrival-records")` (manual button press)
- **Service/API Used:** `registerArrival()` function
- **Real Data or Mock:** ✅ Real (if staff uses the button)
- **Refresh Behavior:** On button press
- **Loading State:** None
- **Error State:** ⚠️ Try/catch on localStorage parse
- **Empty State:** ✅ Shows "Sin registro de llegada"
- **Risk:** Low — manual only, no auto-detection
- **Should Feed Intelligence:** Yes (punctuality patterns, scheduling optimization)
- **Recommended Agent Owner:** HomeLearningAgent

## Widget 12: Dossier — AI Alerts
- **Purpose:** Display AI-detected alerts for the client (3 per client)
- **Current File:** `src/app/page.tsx` (lines 1280-1296)
- **Data Source:** `appointments[].clientIntelligence.aiAlerts`
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None
- **Risk:** **CRITICAL** — no real AI alerts for actual clients
- **Should Feed Intelligence:** Yes (risk patterns, alert effectiveness)
- **Recommended Agent Owner:** HomeAIInsightAgent

## Widget 13: Dossier — AI Recommendation
- **Purpose:** AI-generated recommendations for the current client (3 recommendations)
- **Current File:** `src/app/page.tsx` (lines 1299-1317)
- **Data Source:** `appointments[].clientIntelligence.aiRecommendations`
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None
- **Risk:** **CRITICAL** — no real AI generation for actual clients
- **Should Feed Intelligence:** Yes (recommendation acceptance, personalization patterns)
- **Recommended Agent Owner:** HomeAIInsightAgent

## Widget 14: Dossier — Technical History
- **Purpose:** Client technical hair history (tones, services, observations, preferences)
- **Current File:** `src/app/page.tsx` (lines 1320-1347)
- **Data Source:** `appointments[].clientIntelligence.technicalHistory`
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None
- **Risk:** **CRITICAL** — no real technical history for actual clients
- **Should Feed Intelligence:** Yes (technical preferences, service history patterns)
- **Recommended Agent Owner:** HomeAIInsightAgent, HomeLearningAgent

## Widget 15: Dossier — Technical Parameters (Modo Técnico)
- **Purpose:** Show AI technical parameters (confidence, temperature, embeddings, reasoning)
- **Current File:** `src/app/page.tsx` (lines 1350-1390)
- **Data Source:** Hardcoded per appointment ID
- **Service/API Used:** None
- **Real Data or Mock:** ❌ 100% Mock
- **Refresh Behavior:** Changes on appointment selection (hidden unless mode activated)
- **Loading State:** ❌ None
- **Error State:** ❌ None
- **Empty State:** ❌ None (hidden by default)
- **Risk:** Low (cosmetic/developer info)
- **Should Feed Intelligence:** No
- **Recommended Agent Owner:** None (developer debug tool)

---

## Widget Summary

| # | Widget | Data Quality | Risk Level | Intelligence Pipeline |
|---|--------|:-----------:|:----------:|:--------------------:|
| 1 | Salon Hero | ✅ Static | None | No |
| 2 | Header Feed | ❌ Mock | Low | Yes (future) |
| 3 | Weather/Date/Time | ⚠️ Mixed | Low | Yes (future) |
| 4 | Appointment Flow List | ⚠️ Mixed | **HIGH** | Yes |
| 5 | Client Focus Card | ⚠️ Mixed | **HIGH** | Yes |
| 6 | Platform Health | ⚠️ Partial | Medium | Yes |
| 7 | KPI Metrics | ❌ Mock | **HIGH** | Yes |
| 8 | Emotional Profile | ❌ Mock | **CRITICAL** | Yes |
| 9 | Material Intelligence | ❌ Mock | **CRITICAL** | Yes |
| 10 | Customer LTV | ❌ Mock | **CRITICAL** | Yes |
| 11 | Arrival Behavior | ✅ Real | Low | Yes |
| 12 | AI Alerts | ❌ Mock | **CRITICAL** | Yes |
| 13 | AI Recommendation | ❌ Mock | **CRITICAL** | Yes |
| 14 | Technical History | ❌ Mock | **CRITICAL** | Yes |
| 15 | Tech Parameters | ❌ Mock | Low | No |

**Total: 15 widgets — 8 critical risk, 3 high risk, 2 medium risk, 2 low risk**
**13 of 15 widgets should feed Intelligence (but none currently do)**
