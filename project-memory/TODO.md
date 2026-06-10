# TODO.md

## Phase G — Testing & QA (Checkpoint 43 ✅)

| # | Tarea | Estado | Archivo |
|:-:|-------|:------:|---------|
| 1 | Instalar Jest + ts-jest + types | ✅ Done | `package.json` |
| 2 | Configurar jest.config.js | ✅ Done | `jest.config.js` |
| 3 | Unit tests: EventBus | ✅ Done | `src/__tests__/EventBus.test.ts` |
| 4 | Unit tests: Consumers | ✅ Done | `src/__tests__/Consumers.test.ts` |
| 5 | Unit tests: LearningEventRepository | ✅ Done | `src/__tests__/LearningEventRepository.test.ts` |
| 6 | Unit tests: RecommendationEngine | ✅ Done | `src/__tests__/RecommendationEngine.test.ts` |
| 7 | Unit tests: IntelligenceLayer | ✅ Done | `src/__tests__/IntelligenceLayer.test.ts` |
| 8 | Run tests — 64 pass, 0 fail | ✅ Done | ✅ PASS |
| 9 | Unit tests: IntelligenceEngine (pipeline) | ✅ Done | `src/__tests__/IntelligenceEngine.test.ts` |
| 10 | Unit tests: HomeBridge (8 methods) | ✅ Done | `src/__tests__/HomeBridge.test.ts` |
| 11 | Run all tests — 106 pass, 0 fail | ✅ Done | ✅ PASS |
| 12 | Phase G complete | ✅ Done | ✅ REPORTED |

## Phase F — UI Integration ✅ COMPLETE

| # | Tarea | Estado | Archivo |
|:-:|-------|:------:|---------|
| 1 | Crear `HomeIntelligenceInsights` widget component | ✅ Done | `src/components/home/HomeIntelligenceInsights.tsx` |
| 2 | Añadir `intelligenceInsightsFromBridge` state + useEffect en page.tsx | ✅ Done | `src/app/page.tsx` |
| 3 | Renderizar widget en center column del dashboard | ✅ Done | `src/app/page.tsx` |
| 4 | CSS: estilos para insight cards | ✅ Done | `src/app/page.module.css` |
| 5 | TypeScript: 0 errores | ✅ Done | ✅ PASS |
| 6 | Fallback: sin insights → widget oculto | ✅ Done | ✅ PASS |

---

*Previous phases (E → F) fully completed. See CHANGELOG.md for full history.*
