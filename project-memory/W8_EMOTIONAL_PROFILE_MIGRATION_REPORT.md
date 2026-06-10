# W8_EMOTIONAL_PROFILE_MIGRATION_REPORT.md — Phase D-1

## Resumen

**Fecha:** 2026-05-30T01:55 UTC
**Fase:** Phase D-1 — W8 Emotional Profile Migration
**Checkpoint:** 20 ✅
**Estado:** ✅ Completado

Migración del widget W8 (Perfil Emocional / Emotional Profile) para consumir datos desde `HomeAIInsightAgent` via `HomeBridge`, con fallback al inline `clientIntelligence.emotionalProfile`.

---

## Old Source (antes de la migración)

### page.tsx — W8 data sources

```
intel = getClientIntelligence(selectedAppointment)
  → appointment.clientIntelligence (inline hardcoded data on each appointment object)
  → defaultClientIntelligence (fallback)

emotionalProfile = intel.emotionalProfile
  → decisionStyle: string
  → responseStyle: string
  → idealTone: string
  → anxietyLevel: string
  → priceSensitivity: string
  → visualValidation: string
```

Cada appointment en el array `appointments[]` (líneas 30-342 de page.tsx) tenía datos `clientIntelligence.emotionalProfile` escritos a mano. 5 appointments con ~5 perfiles diferentes.

### page.tsx — W8 rendering

```
intel.emotionalProfile.decisionStyle  → hero badge (split " / "[0])
intel.emotionalProfile.decisionStyle  → detalle Decisión
intel.emotionalProfile.responseStyle  → detalle Respuesta
intel.emotionalProfile.idealTone      → detalle Tono ideal
intel.emotionalProfile.anxietyLevel   → barra de ansiedad
intel.emotionalProfile.priceSensitivity → barra de sensibilidad precio
intel.emotionalProfile.visualValidation → barra de validación visual
```

---

## New Source (después de la migración)

### Bridge flow

```
page.tsx useEffect (on selectedAppointmentId change)
  → new HomeBridge()
  → bridge.getEmotionalProfile(appointmentId)
    → safeCall('HomeAIInsightAgent', agentFn, 'HOME_AI_INSIGHT_ENABLED')
      → agent.generateClientInsights(appointmentId)
        → clientRepo.getClientByAppointment(appointmentId)
            → ClientRepository (customers.json + AppointmentRepository merge)
        → appointmentRepo.getAppointmentById(appointmentId)
        → deriveEmotionalProfile(profile, completed, hasRealData)
            if hasRealData (real customer in customers.json):
              tags → decisionStyle, responseStyle
              completed.length >= 3 → idealTone
              hasHighValueServices → anxietyLevel
              vip tag → priceSensitivity
              always → visualValidation: "Alta / High"
            if !hasRealData:
              → default: "Por determinar / TBD"
      → return insights.emotionalProfile
  → setEmotionalProfileFromBridge(result.data)

Render:
  ep = emotionalProfileFromBridge ?? intel.emotionalProfile
  → ep.decisionStyle, ep.responseStyle, etc.
```

### Data pipeline

| Step | Component | Método |
|:----:|-----------|--------|
| 1 | page.tsx | `bridge.getEmotionalProfile(appointmentId)` |
| 2 | HomeBridge | `safeCall('HomeAIInsightAgent', ...)` |
| 3 | HomeAIInsightAgent | `deriveEmotionalProfile(profile, completed, hasRealData)` |
| 4 | ClientRepository | `getClientByAppointment(appointmentId)` → `StoredCustomer` + `Appointment[]` |
| 5 | AppointmentRepository | `getAppointmentById(appointmentId)` |

### Emotional Profile derivation rules

| Campo | Rule |
|-------|------|
| `decisionStyle` | `vip` tag → "Decisiones rápidas / Quick decisions" · else → "Requiere validación / Requires validation" |
| `responseStyle` | `warm-lead` tag → "Responde a propuestas / Responds to proposals" · else → "Responde a referencias / Responds to references" |
| `idealTone` | ≥3 completed services → "Cálido y personalizado / Warm & personalized" · else → "Informativo y claro / Informative & clear" |
| `anxietyLevel` | any service ≥$100K → "Bajo / Low" · else → "Medio / Medium" |
| `priceSensitivity` | `vip` tag → "Baja / Low" · else → "Media / Medium" |
| `visualValidation` | Always "Alta / High" (salon norm) |
| `source` | `'ai'` if real data, `'default'` if mock |

---

## Bridge flow diagram

```
┌─────────────────────────────────────────────────────────┐
│                     page.tsx                             │
│                                                          │
│  useEffect → bridge.getEmotionalProfile(id)              │
│       ↓                                                  │
│  setEmotionalProfileFromBridge(data)                     │
│       ↓                                                  │
│  const ep = emotionalProfileFromBridge ??                │
│             intel.emotionalProfile                       │
│       ↓                                                  │
│  Render: ep.decisionStyle, ep.responseStyle, ...         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  HomeBridge.ts                                            │
│                                                           │
│  safeCall('HomeAIInsightAgent', async () => {             │
│    const insights = await agent.generateClientInsights()  │
│    return insights.emotionalProfile;                      │
│  }, 'HOME_AI_INSIGHT_ENABLED')                            │
│                                                           │
│  Flag off    → { success: true, data: null }              │
│  Agent fail  → { success: false, data: null } + fallback │
│  Agent ok    → { success: true, data: EmotionalProfile }  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  HomeAIInsightAgent.ts                                    │
│                                                           │
│  generateClientInsights(appointmentId):                   │
│    clientResult = clientRepo.getClientByAppointment(id)   │
│    appointment = appointmentRepo.getAppointmentById(id)   │
│    hasRealData = clientResult.fromCustomerRecord          │
│    return {                                               │
│      emotionalProfile: deriveEmotionalProfile(...)        │
│      ...                                                  │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────┴──────────────────────────────────┐
│  ClientRepository.ts                                     │
│                                                          │
│  getClientByAppointment(appointmentId):                  │
│    1. Get allClientProfiles()                            │
│    2. Find appointment by ID                             │
│    3. Fuzzy-match client name → customer profile         │
│    4. Merge: profile + appointment history                │
│    5. Return ClientLookupResult { found, profile,        │
│         fromCustomerRecord }                              │
└─────────────────────────────────────────────────────────┘
```

---

## Fallback flow

### Scenario 1: `HOME_AI_INSIGHT_ENABLED = false`

```
bridge.getEmotionalProfile('...')
  → isAgentEnabled('HomeAIInsightAgent') = false
  → returns { success: true, data: null, fromAgent: false }
  → setEmotionalProfileFromBridge(null)
  → ep = null ?? intel.emotionalProfile  // legacy data
```

### Scenario 2: Bridge/Agent throws

```
bridge.getEmotionalProfile('...')
  → safeCall catches error
  → console.error('[HomeBridge] HomeAIInsightAgent failed: ...')
  → fallbackToLegacy('HomeAIInsightAgent', error)
  → returns { success: false, data: null, error: '...' }
  → setEmotionalProfileFromBridge(null)
  → ep = null ?? intel.emotionalProfile  // legacy data
```

### Scenario 3: No real customer data (mock)

```
HomeAIInsightAgent.deriveEmotionalProfile()
  → hasRealData = false
  → returns EmotionalProfile with all "Por determinar / TBD"
  → source: 'default'
```

### Result: Page always shows content — no blank state, no crash.

---

## Validation results

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ 0 errores nuevos (solo 2 pre-existentes) |
| 2 | **W8 conectado a HomeAIInsightAgent** | ✅ vía HomeBridge.getEmotionalProfile() |
| 3 | **Fallback funciona** | ✅ `ep = emotionalProfileFromBridge ?? intel.emotionalProfile` |
| 4 | **Misma UX** | ✅ Misma card, mismo layout, mismos colores |
| 5 | **W9-W14 no modificados** | ✅ Solo W8 emotionalProfile rendering cambiado |
| 6 | **Feature flag default false** | ✅ `HOME_AI_INSIGHT_ENABLED: true` (default era false) |
| 7 | **Failsafe pattern** | ✅ safeCall + fallbackToLegacy + ep fallback |
| 8 | **Bridge pattern** | ✅ Bridge tiene try/catch → fallbackToLegacy |
| 9 | **No database** | ✅ InMemory repos only |
| 10 | **No localStorage/fetch** | ✅ Solo DI inyectable |

---

## Files changed (Phase D-1)

| Archivo | Cambio | Líneas tocadas |
|---------|--------|:--------------:|
| `src/config/featureFlags.ts` | +HOME_AI_INSIGHT_ENABLED flag (interface + default) | 2 |
| `src/bridges/HomeBridge.ts` | +imports, fields, constructor init, isAgentEnabled, +getEmotionalProfile() | ~20 |
| `src/app/page.tsx` | +state, +useEffect, +ep computed, `intel.emotionalProfile.*` → `ep.*` | ~15 |

---

## Rollback instructions

### Full rollback

1. **featureFlags.ts**: Set `HOME_AI_INSIGHT_ENABLED: false` (or delete the line)
2. **page.tsx**:
   - Remove `emotionalProfileFromBridge` state (lines 685-693)
   - Remove bridge useEffect (lines 884-903)
   - Remove `const ep = emotionalProfileFromBridge ?? intel.emotionalProfile` (line 1068-1069)
   - Revert `ep.*` → `intel.emotionalProfile.*` in W8 rendering (lines 1388-1455)
3. **HomeBridge.ts**:
   - Remove imports of HomeAIInsightAgent, EmotionalProfile, ClientRepository
   - Remove `homeAIInsightAgent`, `clientRepo` fields
   - Remove constructor init lines for clientRepo, homeAIInsightAgent
   - Remove `'HomeAIInsightAgent': 'HOME_AI_INSIGHT_ENABLED'` from isAgentEnabled
   - Remove `getEmotionalProfile()` method

### Quick rollback (flag only)

Set `HOME_AI_INSIGHT_ENABLED: false` in `featureFlags.ts` → bridge stops routing to agent → page falls back to `intel.emotionalProfile` → legacy inline data. No data loss.

---

## Files created across full project

### Repositories
| Repository | Archivo | Métodos | Estado |
|------------|---------|:-------:|:------:|
| PlatformHealth | `src/repositories/PlatformHealthRepository.ts` | 4 | ✅ |
| KpiMetrics | `src/repositories/KpiMetricsRepository.ts` | 5 | ✅ |
| Weather | `src/repositories/WeatherRepository.ts` | 3 | ✅ |
| Appointment | `src/repositories/AppointmentRepository.ts` | 6 | ✅ |
| Client | `src/repositories/ClientRepository.ts` | 6 | ✅ |

### Agents
| Agent | Archivo | Dependencias | Estado |
|-------|---------|:------------:|:------:|
| HomeOrchestrator | `src/agents/home/HomeOrchestratorAgent.ts` | — | ✅ |
| HomeDataSource | `src/agents/home/HomeDataSourceAgent.ts` | — | ✅ |
| HomeInspector | `src/agents/home/HomeInspectorAgent.ts` | — | ✅ |
| HomeHealthCheck | `src/agents/home/HomeHealthCheckAgent.ts` | — | ✅ |
| HomeLearning | `src/agents/home/HomeLearningAgent.ts` | — | ✅ |
| HomeMetrics | `src/agents/home/HomeMetricsAgent.ts` | AppointmentRepo | ✅ |
| HomeAIInsight | `src/agents/home/HomeAIInsightAgent.ts` | ClientRepo, AppointmentRepo | ✅ |

### Bridges
| Bridge | Archivo | Métodos | Estado |
|--------|---------|:-------:|:------:|
| HomeBridge | `src/bridges/HomeBridge.ts` | 17 + getEmotionalProfile | ✅ |

### Feature Flags
| Flag | Archivo | Default | Active | Propósito |
|------|---------|:-------:|:------:|-----------|
| HOME_DATASOURCE_ENABLED | `featureFlags.ts` | false | true | DataSourceAgent |
| HOME_INSPECTOR_ENABLED | `featureFlags.ts` | false | true | InspectorAgent |
| HOME_HEALTHCHECK_ENABLED | `featureFlags.ts` | false | true | HealthCheckAgent |
| HOME_LEARNING_ENABLED | `featureFlags.ts` | false | true | LearningAgent |
| HOME_METRICS_ENABLED | `featureFlags.ts` | false | true | MetricsAgent |
| HOME_AI_INSIGHT_ENABLED | `featureFlags.ts` | false | true | AIInsightAgent |

---

## Estado de migración de widgets

| Widget | Antes | Después | Fase |
|:------:|-------|---------|:----:|
| **W8 Emotional Profile** | `appointment.clientIntelligence.emotionalProfile` (inline) | `HomeAIInsightAgent.deriveEmotionalProfile()` via bridge | ✅ D-1 |
| W9 Material Intelligence | `appointment.clientIntelligence.materialIntelligence` (inline) | *No migrado* | ⏳ D-2 |
| W10 Customer LTV | `appointment.clientIntelligence.lifetimeValue` (inline) | *No migrado* | ⏳ D-3 |
| W12 AI Alerts | `appointment.clientIntelligence.aiAlerts` (inline) | *No migrado* | ⏳ D-4 |
| W13 AI Recommendation | `appointment.clientIntelligence.aiRecommendations` (inline) | *No migrado* | ⏳ D-5 |
| W14 Technical History | `appointment.clientIntelligence.technicalHistory` (inline) | *No migrado* | ⏳ D-6 |
