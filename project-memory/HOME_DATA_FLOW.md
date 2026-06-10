# Home Data Flow Map

## Date
2026-05-29 @ 23:15 UTC

## Data Flow Diagrams

### 1. Appointment Data Flow

```
Source:                   Service:                   Processor:              Consumer:               UI Component:
╔══════════════════╗     ╔════════════════════╗     ╔════════════════════╗  ╔══════════════════╗   ╔══════════════════════╗
║ Hardcoded        ║────▶║ inline data       ║────▶║ none               ║─▶║ Home page        ║──▶║ Appointment Flow     ║
║ appointments[5]  ║     ║ (page.tsx lines   ║     ║ (direct access)    ║  ║ state merging    ║   ║ · Flow List (left)   ║
║ (mock)           ║     ║  29-339)          ║     ║                    ║  ║                   ║   ║ · Client Focus Card  ║
╚══════════════════╝     ╚════════════════════╝     ╚════════════════════╝  ║                   ║   ║ · All Dossier        ║
                                                                             ║                   ║   ║   sections           ║
Source:                   Service:                   Processor:              ║                   ║   ╚══════════════════════╝
╔══════════════════╗     ╔════════════════════╗     ╔════════════════════╗  ║                   ║
║ data/            ║────▶║ GET /api/          ║────▶║ Array.map +       ║─▶║ liveAppointments ║
║ appointments.json║     ║ appointments       ║     ║ formatClientName  ║  ║ (merged array)   ║
║ (real)           ║     ║ (route.ts)         ║     ║ getStylistFullName║  ╚══════════════════╝
╚══════════════════╝     ╚════════════════════╝     ╚════════════════════╝
                                                    
Intelligence Output: Appointment frequency, popular services, stylist workload
Risk: Mock data is always merged — hard to distinguish real from fake
Missing Piece: No deduplication, no "isMock" flag
```

### 2. Client Intelligence Data Flow

```
Source:                   Service:                   Processor:              Consumer:               UI Component:
╔══════════════════╗     ╔════════════════════╗     ╔════════════════════╗  ╔══════════════════╗   ╔══════════════════════════════╗
║ Hardcoded        ║────▶║ inline data       ║────▶║ getClient          ║─▶║ selected         ║──▶║ Dossier Sections:            ║
║ clientIntelligence║    ║ (per appointment)  ║     ║ Intelligence()    ║  ║ Appointment      ║   ║ · Emotional Profile          ║
║ (mock)           ║     ║ lines 52-338      ║     ║ (line 382-387)    ║  ║ (state)          ║   ║ · Material Intelligence      ║
╚══════════════════╝     ╚════════════════════╝     ╚════════════════════╝  ╚══════════════════╝   ║ · CLV                         ║
                                                                                                     ║ · AI Alerts                   ║
Source:                   Service:                   Processor:                                       ║ · AI Recommendations          ║
╔══════════════════════╗ ╔════════════════════╗     ╔════════════════════╗                            ║ · Technical History           ║
║ defaultClient        ║─▶║ (fallback)        ║────▶║ none               ║                            ║ · Tech Parameters (hidden)    ║
║ Intelligence         ║   ║                   ║     ║ (direct access)    ║                            ╚══════════════════════════════╝
║ (mock)               ║   ║                   ║     ║                    ║
╚══════════════════════╝   ╚════════════════════╝     ╚════════════════════╝
                                                    
Intelligence Output: Emotional patterns, service preferences, pricing sensitivity
Risk: ALL data is mock — real appointments get default intelligence with "Nuevo / New" values
Missing Piece: No real AI pipeline, no scoring engine, no profile aggregation
```

### 3. KPIs & Metrics Data Flow

```
Source:                   Service:                   Processor:              Consumer:               UI Component:
╔══════════════════╗     ╔════════════════════╗     ╔════════════════════╗  ╔══════════════════╗   ╔══════════════════╗
║ Hardcoded        ║────▶║ inline            ║────▶║ none               ║─▶║ <section>        ║──▶║ KPI Mini Cards   ║
║ metrics[3]       ║     ║ (lines 416-420)   ║     ║                    ║  ║ kpiRow           ║   ║ (4 cards)         ║
║ (mock)           ║     ║                    ║     ║                    ║  ╚══════════════════╝   ╚══════════════════╝
╚══════════════════╝     ╚════════════════════╝     ╚════════════════════╝
                                                    
Intelligence Output: Sales trends, occupancy patterns, revenue potential
Risk: No real data integration — metrics never update
Missing Piece: No sales API, no occupancy calculation, no revenue tracking
```

### 4. Platform Health Data Flow

```
Source:                   Service:                   Processor:                 Consumer:               UI Component:
╔═════════════════════╗  ╔═══════════════════════╗  ╔═══════════════════════╗  ╔══════════════════╗   ╔══════════════════════╗
║ localStorage        ║─▶║ campaigns:meta-      ║──▶║ calculatePlatform    ║─▶║ platformHealth   ║──▶║ Platform Health Card ║
║ (browser)           ║  ║ templates             ║  ║ Health()             ║  ║ (state)          ║   ║ (KPI Row, first)    ║
╚═════════════════════╝  ║ campaigns:template-   ║  ║ (lines 640-669)      ║  ╚══════════════════╝   ╚══════════════════════╝
                         ║ health-history        ║  ║ rejections -9,       ║
                         ╚═══════════════════════╝  ║ highRisk -10,        ║
                                                    ║ medRisk -4           ║
                                                    ╚══════════════════════╝
                                                    
Intelligence Output: Template health trends, campaign risk patterns
Risk: localStorage is per-device, not persistent
Missing Piece: Server-side health monitoring, real rejection data from Meta API
```

### 5. Arrival Behavior Data Flow

```
Source:                   Service:                   Processor:                 Consumer:               UI Component:
╔══════════════════════╗ ╔════════════════════════╗ ╔════════════════════════╗ ╔══════════════════════╗ ╔══════════════════════╗
║ User button press    ║─▶║ registerArrival()     ║──▶║ chileMinutesNow -    ║─▶║ arrivalRecords     ║──▶║ Arrival Behavior    ║
║ (manual)             ║  ║ (line ~849)           ║  ║ appointmentMinutes   ║  ║ (state +           ║  ║ card                ║
╚══════════════════════╝  ╚════════════════════════╝  ╚════════════════════════╝  ║ localStorage)      ║  ╚══════════════════════╝
                                                                                  ╚══════════════════════╝
                                                    
Intelligence Output: Punctuality patterns, lateness risk for appointments
Risk: Manual entry only — no automatic detection
Missing Piece: Auto-detection via geolocation or scheduler
```

### 6. Header Feed Data Flow

```
Source:                   Service:                   Processor:                 Consumer:               UI Component:
╔══════════════════╗     ╔════════════════════╗     ╔════════════════════╗     ╔══════════════════╗   ╔══════════════════════╗
║ Hardcoded        ║────▶║ inline            ║────▶║ setInterval(30s)  ║─────▶║ feedIndex (state) ║──▶║ Header Feed          ║
║ headerFeed[6]    ║     ║ (lines 389-414)   ║     ║ rotate feed       ║     ╚══════════════════╝   ║ (rotating tips)      ║
║ (mock tips)      ║     ║                    ║     ║                    ║                          ╚══════════════════════╝
╚══════════════════╝     ╚════════════════════╝     ╚════════════════════╝
                                                    
Intelligence Output: None (static tips — no data dependency)
Risk: Tips never change based on real conditions
Missing Piece: Dynamic feed based on real-time operational data
```

### 7. Header Date/Time/Weather Flow

```
Source:                   Service:                   Consumer:               UI Component:
╔══════════════════╗     ╔════════════════════╗     ╔══════════════════╗   ╔══════════════════╗
║ new Date()       ║────▶║ Intl.DateTime     ║─────▶║ currentTime      ║──▶║ Header right     ║
║ (real-time)      ║     ║ Format("es-CL")   ║     ║ (state, 30s)     ║   ║ · Weather icon   ║
╚══════════════════╝     ╚════════════════════╝     ╚══════════════════╝   ║ · Date + Time    ║
                                                                           ║ · "Santiago, 18°C║
Source:                   Service:                                         ╚══════════════════╝
╔══════════════════╗     ╔════════════════════╗
║ Hardcoded        ║────▶║ "Santiago, 18°C"  ║
║ (mock weather)  ║     ║ <CloudSun />      ║
╚══════════════════╝     ╚════════════════════╝
                                                    
Intelligence Output: Visit timing patterns, weather-related service preferences
Risk: Weather is hardcoded
Missing Piece: Real weather API integration
```

## Summary of All Data Flows

| Flow | Data Quality | Intelligence Pipeline | Urgency |
|------|:-----------:|:--------------------:|:-------:|
| Appointments | ⚠️ Mock + Real merged | ❌ None | High |
| Client Intelligence | ❌ 100% Mock | ❌ None | Critical |
| KPIs / Metrics | ❌ 100% Mock | ❌ None | High |
| Platform Health | ⚠️ localStorage only | ❌ None | Medium |
| Arrival Behavior | ✅ Real (manual) | ❌ None | Low |
| Header Feed | ❌ Static mock | ❌ None | Low |
| Date/Time/Weather | ⚠️ Real time + mock weather | ❌ None | Low |

**Key Insight:** The Home page has 7 distinct data flows. 5 of 7 are fully or partially mock. None feed into an Intelligence pipeline. The **Client Intelligence flow** is the most critical to address because all dossier sections depend on it.
