# CLIENT_REPOSITORY_AI_INSIGHT_FOUNDATION_REPORT.md — Phase C-2

## Resumen

**Fecha:** 2026-05-30T01:49 UTC
**Fase:** Phase C-2 — ClientRepository + HomeAIInsightAgent Foundation
**Checkpoint:** 19 ✅
**Estado:** ✅ Completado

Creación de `ClientRepository` (lectura de `data/customers/customers.json` + merge con AppointmentRepository) y `HomeAIInsightAgent` (generación de insights para W8-W14 dossier sections). Foundation read-only — no modifica ningún widget.

---

## Files Created

| Archivo | Tipo | Líneas |
|---------|:----:|:------:|
| `src/repositories/ClientRepository.ts` | Repositorio | 284 |
| `src/agents/home/HomeAIInsightAgent.ts` | Agente | 585 |
| `src/agents/home/HomeAIInsightAgent.md` | Documentación | 60 |

---

## ClientRepository Architecture

```
ClientRepository
├── constructor(appointmentRepo: AppointmentRepository)
├── configure(config: ClientSourceConfig)            ← DI: fetchCustomers, fetchCustomerById
│
├── getAllClients(): Promise<ClientProfile[]>         ← Merged from customers + appointments
├── getClientByAppointment(id): ClientLookupResult   ← By appointment ID
├── getClientById(customerId): ClientLookupResult    ← By customers.json ID
├── searchClients(query): ClientProfile[]            ← Fuzzy name/tag/interest search
│
└── buildProfile(name, apps, customer): ClientProfile ← Internal merge logic
```

### Types

| Type | Campos clave |
|------|-------------|
| `StoredCustomer` | id, phone, displayName, firstName, tags, interests, requestedServices, lastVisit, lifecycleStage, aiSummary |
| `ClientProfile` | customerId, name, phone, tags, interests, lastVisit, lifecycleStage, aiSummary, consentWhatsapp, appointmentHistory, completedAppointments, favoriteServices, preferredStylist |
| `ClientLookupResult` | found, profile, fromCustomerRecord |

### Data sources

| Source | Via | Estado |
|--------|:---:|:------:|
| `data/customers/customers.json` | `ClientSourceConfig.fetchCustomers()` | ✅ Existe (1 customer actualmente) |
| `AppointmentRepository` | Constructor injection | ✅ Creado (Phase C-0) |

### Client matching strategy

Client name from appointments ↔ customer.firstName uses fuzzy substring matching.
When a real `clientId` field is added to appointments, matching will use exact IDs.

---

## HomeAIInsightAgent Architecture

```
HomeAIInsightAgent
├── constructor(clientRepo, appointmentRepo)
│
├── generateClientInsights(appointmentId)             ← Full pipeline by appointment
├── generateFromProfile(profile, currentAppointment)  ← Direct from known profile
│
├── deriveEmotionalProfile()   → EmotionalProfile     (W8)
├── deriveMaterialIntelligence() → MaterialIntelligence (W9)
├── deriveLifetimeValue()      → LifetimeValue         (W10)
├── deriveAlerts()             → AIAlert[]             (W12)
├── deriveRecommendations()    → AIRecommendation[]    (W13)
├── deriveTechnicalHistory()   → TechnicalHistory      (W14)
│
└── zeroInsights()  ← Error fallback
```

### ClientInsightsSnapshot

```typescript
interface ClientInsightsSnapshot {
  clientName: string;
  clientId: string | null;
  emotionalProfile: EmotionalProfile;      // W8
  materialIntelligence: MaterialIntelligence; // W9
  lifetimeValue: LifetimeValue;            // W10
  aiAlerts: AIAlert[];                     // W12
  aiRecommendations: AIRecommendation[];   // W13
  technicalHistory: TechnicalHistory;      // W14
  generatedAt: string;                     // ISO timestamp
  hasRealData: boolean;
}
```

### Insight Derivation Logic

| Section | Source Data | Rule |
|---------|-------------|------|
| **Emotional Profile** | tags, completed services count, service value | VIP tag → quick decisions; multiple services → warm tone; high-value services → low anxiety |
| **Material Intelligence** | completed services, price estimates | avgCost from keyword map; brands from service names; coloration detection |
| **Lifetime Value** | completed services, price estimates, frequency | avgTicket × annualVisits × 3 years projection |
| **AI Alerts** | cancellations, service upgrades, last visit, WhatsApp consent | Multiple cancels → risk alert; no premium service → opportunity; 60+ days → critical |
| **AI Recommendations** | favorite services, service types, last visit | Favorites renewal; cross-sell corte→tratamiento; re-engagement at 45-60 days |
| **Technical History** | completed services, service names | Color detection; last 3 services summary; preference extraction |

---

## Dependencies

| Dependencia | Estado | Tipo |
|-------------|:------:|:----:|
| AppointmentRepository | ✅ Creado (Phase C-0) | Constructor injection |
| ClientRepository | ✅ Creado (Phase C-2) | Constructor injection |
| data/customers/customers.json | ✅ Existe | Via fetchCustomers config |

---

## Lo que NO se modificó

- ❌ W8-W14 widgets (page.tsx dossier sections)
- ❌ HomeBridge.ts
- ❌ HomeMetricsAgent
- ❌ feature flags
- ❌ Ningún widget o UI
- ❌ Messages, Campaigns, Meta, WhatsApp
- ❌ No database dependencies

---

## Validación

| # | Check | Resultado |
|:-:|-------|:---------:|
| 1 | **TypeScript compila** | ✅ Sin errores en archivos nuevos (solo 3 pre-existentes) |
| 2 | **ClientRepository creado** | ✅ 284 líneas, 6 métodos públicos |
| 3 | **HomeAIInsightAgent creado** | ✅ 585 líneas, 6 derive* methods, types exportados |
| 4 | **Documentación creada** | ✅ HomeAIInsightAgent.md (60 líneas) |
| 5 | **Usa AppointmentRepository** | ✅ Constructor injection en ambos |
| 6 | **No imports from page.tsx** | ✅ Ningún import de UI |
| 7 | **No imports localStorage/fetch/DB** | ✅ Solo CI inyectable |
| 8 | **No widget modificado** | ✅ page.tsx intacto |
| 9 | **Failsafe pattern** | ✅ try/catch → zeroInsights() en agente |
| 10 | **Testable** | ✅ generateFromProfile() es pure function |

---

## Rollback

| Escenario | Acción |
|-----------|--------|
| Repository not needed | Delete `src/repositories/ClientRepository.ts` |
| Agent not needed | Delete `src/agents/home/HomeAIInsightAgent.ts` and `.md` |
| Full rollback | Delete all 3 files — no other code references them yet |

---

## Future Integration

| Phase | Integración | Acción |
|:-----:|-------------|--------|
| C-2 (next) | HomeBridge | +getClientInsights() bridge method behind feature flag |
| D | W8-W14 Dossier | Replace inline clientIntelligence with HomeAIInsightAgent data |
| D | HomeLearningAgent | Emit `insight_changed` events on insight generation |
