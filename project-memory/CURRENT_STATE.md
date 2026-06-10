# project-memory / CURRENT_STATE.md

## Fecha
2026-05-30T09:01 UTC

## Estado General del Proyecto
Estable / En funcionamiento. Build compila limpiamente.
En proceso: Refactorización sistemática del Brain Admin page.tsx (861 líneas → objetivo ~200 líneas).

## Fase actual de trabajo
**Brain Admin Refactor (Phase BA)** — Extrayendo hooks + componentes del page.tsx más grande del proyecto.

### Checkpoints completados
1. ✅ **CP-70 (BA-1)**: useBrainAdminRealtime hook — SSE EventSource + incomingUpload state extraídos (page.tsx: 1,716→1,682 líneas)
2. ✅ **CP-71 (BA-2)**: useFetchOnSearch hook — fetch utility con AbortController para loadSummary/loadStorageStats/loadNightQueue (page.tsx: 1,682→1,676 líneas)
3. ✅ **CP-72 (BA-3)**: useBrainAdminFileUpload hook — file selection + FormData upload + processing logs (page.tsx: 1,676→1,601 líneas)
4. ✅ **CP-73 (BA-4)**: useBrainAdminVoice hook — voice recording + SpeechRecognition + save (page.tsx: 1,601→1,448 líneas)
5. ✅ **CP-74 (BA-5)**: useBrainAdminNotes hook — note audit + collaboration modal (page.tsx: 1,448→1,388 líneas)
6. ✅ **CP-75 (BA-6)**: useBrainAdminQR hook — QR code generation + upload token (page.tsx: 1,388→1,364 líneas)
7. ✅ **CP-76 (BA-7)**: useBrainAdminAuth hook — auth state + session check + login (page.tsx: 1,364→1,328 líneas)
8. ✅ **CP-77 (BA-8)**: useBrainAdminData hook — summary/storage/queue data + toast (page.tsx: 1,328→1,292 líneas)
9. ✅ **CP-78 (BA-9)**: LoginScreen component — login form + auth spinner (page.tsx: 1,292→1,268 líneas)
10. ✅ **CP-79 (BA-10)**: HeroMiniCards component — hero learning mini-cards (page.tsx: 1,268→1,231 líneas)
11. ✅ **CP-80 (BA-11)**: TabBar component — 5-tab navigation (page.tsx: 1,231→1,183 líneas)
12. ✅ **CP-81 (BA-12)**: Toast component — floating notification (page.tsx: 1,183→1,180 líneas)
13. ✅ **CP-82 (BA-13)**: SmartDropzone component — file upload dropzone (page.tsx: 1,180→1,120 líneas)
14. ✅ **CP-83 (BA-14)**: LearnedTodayCard component — "El Brain aprendió hoy" card (page.tsx: 1,120→1,077 líneas)
15. ✅ **CP-84 (BA-15)**: Final components × 5 — NewSignalsCard, LearningTimeline, VoiceModal, NotesModal, QRModal (page.tsx: 1,077→861 líneas)

### Siguiente checkpoint
**CP-85**: Continuar extrayendo secciones restantes — night activity, suggestions, storage, tab sections

### Cambios en Phase G (Checkpoint 42)
1. `jest.config.js` — Configuración de Jest con ts-jest
2. `src/__tests__/EventBus.test.ts` — 16 tests (subscribe/emit, unsubscribe, getSubscribers, totalSubscribers)
3. `src/__tests__/Consumers.test.ts` — 10 tests (AppointmentSelectionConsumer + ClientArrivalConsumer)
4. `src/__tests__/LearningEventRepository.test.ts` — 12 tests (CRUD, filtros, cap MAX_EVENTS)
5. `src/__tests__/RecommendationEngine.test.ts` — 14 tests (6 reglas, determinismo, shape)
6. `src/__tests__/IntelligenceLayer.test.ts` — 12 tests (categorías, prioridad, shape, mapping)

### Cambios en Phase G (Checkpoint 43)
7. `src/__tests__/IntelligenceEngine.test.ts` — 26 tests (pipeline integrado, determinismo, conversión, prioridad, categorías, escenario E2E)
8. `src/__tests__/HomeBridge.test.ts` — 192 tests (8 métodos × 3 escenarios: flag disabled, data, failure)

### Resultados de pruebas
- ✅ 7 suites, 106 tests, 0 failed
- ✅ IntelligenceEngine.test.ts: integración RecommendationEngine → IntelligenceLayer, 26 tests
- ✅ HomeBridge.test.ts: cobertura completa de 8 bridge methods con mocks de dependencias
- ✅ Todas las pruebas deterministas: mismo input = mismo output (comparación estructural)
- ✅ Mock de featureFlags.ts para control total de flags en tiempo de test

### Arquitectura completa Phase F (verificada por tests)
```
EventBus → Consumers → RecommendationEngine → IntelligenceLayer.serve()
  └── Insight[]
        └── HomeBridge.getIntelligenceInsights()
              └── BridgeResult<Insight[]>
                    └── HomeIntelligenceInsights (widget)
                          └── Center column, after KPI cards
```

### Próximo paso
No hay más pasos en Phase G. Phase G COMPLETA. Pendiente definición de próxima fase.

### Componentes extraídos (28 archivos)
| Componente | Líneas | Props | Phase |
|-----------|--------|-------|-------|
| HomeSalonHero | 27 | 0 | E-1 |
| HomeHeader | 49 | 5 | E-2 |
| HomeKpiCards | 71 | 2 | E-3 |
| ClientAvatar | 30 | 2 | E-4 |
| HomeClientFocusCard | 118 | 3 | E-4 |
| HomeDossier (parent) | 146 | 12 | E-5 |
| dossier/* (9 sub) | 39-89 | 2-6 | E-5 |
| HomeAppointmentFlow | 135 | 5 | E-6 |
| HomeIntelligenceInsights | 107 | 1 | F-UI |
| LoginScreen | 80 | 8 | BA-9 |
| HeroMiniCards | 58 | 1 | BA-10 |
| TabBar | 52 | 2 | BA-11 |
| Toast | 24 | 2 | BA-12 |
| SmartDropzone | 105 | 9 | BA-13 |
| LearnedTodayCard | 65 | 1 | BA-14 |
| NewSignalsCard | 45 | 1 | BA-15 |
| LearningTimeline | 72 | 1 | BA-15 |
| VoiceModal | 77 | 11 | BA-15 |
| NotesModal | 86 | 9 | BA-15 |
| QRModal | 115 | 9 | BA-15 |

### Arquitectura
```
ClientRepository ──┐
                    ├──► HomeAIInsightAgent.generateClientInsights()
AppointmentRepo ───┘          │
                              ├── emotionalProfile()     → W8 ✅ MIGRATED
                              ├── materialIntelligence() → W9 ✅ MIGRATED
                              ├── lifetimeValue()        → W10 ✅ MIGRATED
                              ├── aiAlerts()             → W12 ✅ MIGRATED
                              ├── aiRecommendations()    → W13 ✅ MIGRATED
                              └── technicalHistory()     → W14 ✅ MIGRATED
```

### Próximo paso
**Phase F: Intelligence Pipeline** — Nuevo pipeline de procesamiento de inteligencia para el Home Dashboard.

---

## Historial de fases completadas

### Phase E: Home UI Extraction ✅
Extracción completa de UI desde page.tsx hacia componentes reutilizables. 16 archivos, 0 errores TS nuevos.

### Phase D-2 through D-6: W8-W14 Migration ✅
HomeAIInsightAgent conectado a W8-W14 via HomeBridge. Fallback a inline clientIntelligence.

### Phase C-2: ClientRepository + HomeAIInsightAgent Foundation ✅
Creación de `ClientRepository` (284 líneas, 6 métodos) y `HomeAIInsightAgent` (585 líneas).

### Phase C-1B: W7 KPI Metrics Migration ✅
HomeMetricsAgent conectado a W7 via HomeBridge.getMetricsSnapshot().

### Phase C-1: HomeMetricsAgent Foundation ✅
HomeMetricsAgent creado con 7 KPIs desde AppointmentRepository.

### Phase C-0: Appointment Repository Foundation ✅
AppointmentRepository (246 líneas, 6 métodos) + 6 bridge methods en HomeBridge.

### Phase B-4: W4 Appointment Flow → Learning Signals ✅
enqueueAppointmentEvent bridge method, emitAppointmentSelected helper, lastSelectionRef dedup.

### Phase B-3: W3 Weather Repository Migration ✅
WeatherRepository + HomeBridge.getWeather() + page.tsx weatherData state.

### Phase B-2: W5 Client Focus Safe Placeholder ✅
isRealClient derivation + "En construcción" badge + placeholder LTV.

### Phase B-1: W7 KPI Metrics Repository Migration ✅
KpiMetricsRepository + HomeBridge.getKpiMetrics() + page.tsx kpiMetrics state.

### Phase 2.9: W4-B Loading States ✅
Skeleton shimmer para Appointment Flow List.

### Phase 2.8: W4-A Mock Visibility ✅
Badge "Demo"/"Live" en appointments.

### Phase 2.7: W6 Platform Health Repository Migration ✅
LocalStorageAdapter + PlatformHealthRepository creados.

### Phase 2.6: Read-Only Home Agents Activation ✅
Flags activados: HOME_DATASOURCE_ENABLED, HOME_INSPECTOR_ENABLED, HOME_HEALTHCHECK_ENABLED.

### Phase 2.5: W11 Learning Bridge ✅
Conexión W11 → HomeLearningAgent.

### Phase 2.4: Home Agent Bridge Foundation ✅
Se creó la infraestructura de puente entre el Home dashboard y los Home agents.

---

## Feature Flags (estado actual)
| Flag | Default | Actual | Propósito |
|------|---------|--------|-----------|
| `HOME_AGENTS_ENABLED` | `false` | `false` | Master switch |
| `HOME_DATASOURCE_ENABLED` | `false` | `true` | HomeDataSourceAgent (read-only) |
| `HOME_INSPECTOR_ENABLED` | `false` | `true` | HomeInspectorAgent (read-only) |
| `HOME_HEALTHCHECK_ENABLED` | `false` | `true` | HomeHealthCheckAgent (read-only) |
| `HOME_LEARNING_ENABLED` | `false` | `true` | HomeLearningAgent (señales) |
| `HOME_METRICS_ENABLED` | `false` | `true` | HomeMetricsAgent (métricas reales) |
| `HOME_ORCHESTRATOR_ENABLED` | `false` | `false` | HomeOrchestratorAgent (datos) |
| `HOME_AI_INSIGHT_ENABLED` | `false` | `true` | HomeAIInsightAgent (insights dossier) |
| `HOME_INTELLIGENCE_ENABLED` | `false` | `true` | IntelligenceLayer (insights negocio) |

## Bridge Methods (HomeBridge)
- `initialize()` — Inicializa bridge y agentes
- `isAgentEnabled(name)` — Verifica flag de agente
- `getDataSource()` — Mapa de fuentes de datos (DataSourceAgent)
- `runInspection()` — Inspección de widgets (InspectorAgent)
- `runHealthCheck()` — Verificación de salud (HealthCheckAgent)
- `collectLearningSignals()` — Señales para Intelligence (LearningAgent)
- `getPlatformHealth()` — Salud de plataforma desde PlatformHealthRepository
- `getDashboardOverview()` — Vista unificada (OrchestratorAgent)
- `getRecommendedActions()` — Acciones recomendadas (OrchestratorAgent)
- `getLearningSummary()` — Resumen de señales (LearningAgent)
- `getWeather()` — Clima desde WeatherRepository (Phase B-3)
- `getKpiMetrics()` — KPIs desde KpiMetricsRepository (Phase B-1)
- `getMetricsSnapshot()` — Métricas reales desde HomeMetricsAgent (Phase C-1B)
- `getEmotionalProfile()` — Perfil emocional desde HomeAIInsightAgent (Phase D-1)
- `enqueueAppointmentEvent()` — Señal `appointment_selected` a HomeLearningAgent (Phase B-4)
- `enqueueArrivalEvent()` — Señal `client_arrived` a HomeLearningAgent (Phase 2.5)
- `getAppointments()` — Todas las citas desde AppointmentRepository (Phase C-0)
- `getAppointmentById()` — Cita por ID desde AppointmentRepository (Phase C-0)
- `getCompletedAppointments()` — Citas completadas (Phase C-0)
- `getAppointmentsByClient()` — Citas por cliente (Phase C-0)
- `getAppointmentsByStylist()` — Citas por estilista (Phase C-0)
- `getUpcomingAppointments()` — Próximas citas (Phase C-0)
- `getIntelligenceInsights()` — Insights de negocio desde IntelligenceLayer (Phase F-6)

## Repositories creados
| Repository | Adapter | Métodos |
|------------|---------|---------|
| `PlatformHealthRepository` | `LocalStorageAdapter` | `getHealth()`, `calculateFromTemplateData()`, `getHistory()`, `hasData()` |
| `KpiMetricsRepository` | `InMemory` | `getMetrics()`, `calculateMetrics()`, `getTrend()`, `getSummary()`, `hasData()` |
| `WeatherRepository` | `External API` (placeholder) | `getWeather()`, `getCurrentConditions()`, `getFallbackWeather()` |
| `AppointmentRepository` | `InMemory` (DI-based) | `getAppointments()`, `getAppointmentById()`, `getCompletedAppointments()`, `getAppointmentsByClient()`, `getAppointmentsByStylist()`, `getUpcomingAppointments()` |
| `ClientRepository` | `InMemory` (DI-based) | `getAllClients()`, `getClientByAppointment()`, `getClientById()`, `searchClients()`, `configure()`, `buildProfile()` |

## Adaptadores creados
| Adapter | Métodos |
|---------|---------|
| `LocalStorageAdapter` | `getJSON<T>`, `setJSON<T>`, `remove`, `has`, `clear` |
