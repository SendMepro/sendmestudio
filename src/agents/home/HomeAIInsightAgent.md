# HomeAIInsightAgent

**Propósito:** Generar insights reales para las secciones del dossier de cliente (W8-W14) a partir de datos combinados de ClientRepository y AppointmentRepository.

**Fase:** Phase C-2 — ClientRepository + HomeAIInsightAgent Foundation

## Responsabilidades

| Sección Dossier | Widget | Insight Generado |
|----------------|:------:|------------------|
| Perfil Emocional | W8 | Decision style, response style, ideal tone, anxiety level, price sensitivity, visual validation |
| Inteligencia Material | W9 | Marcas preferidas, coloraciones, tiempo promedio, margen |
| Customer LTV | W10 | LTV estimado, ticket promedio, visitas anuales, tasa de recompra |
| Comportamiento de Llegada | W11 | Patrones de llegada (early/late/on-time), puntualidad |
| AI Alerts | W12 | Alertas de riesgo, oportunidades de venta, patrones de cancelación |
| AI Recommendation | W13 | Recomendaciones personalizadas para el siguiente servicio |
| Historial Técnico | W14 | Tonos usados, servicios recientes, observaciones, preferencias |

## Fuentes de Datos

| Fuente | Método | Propósito |
|--------|--------|-----------|
| `ClientRepository` | `getClientByAppointment()` | Perfil del cliente, tags, intereses, historial |
| `AppointmentRepository` | `getAppointmentsByClient()` | Servicios previos, estilistas, frecuencias |
| `ClientRepository` | `searchClients()` | Búsqueda por nombre/tags |

## Arquitectura

```
ClientRepository ──┐
                    ├──► HomeAIInsightAgent.generateClientInsights()
AppointmentRepo ───┘          │
                              ├── emotionalProfile()
                              ├── materialIntelligence()
                              ├── lifetimeValue()
                              ├── aiAlerts()
                              ├── aiRecommendations()
                              └── technicalHistory()
```

## Dependencias

| Dependencia | Estado | Inyección |
|-------------|:------:|:---------:|
| `ClientRepository` | ✅ Creado (Phase C-2) | Constructor |
| `AppointmentRepository` | ✅ Creado (Phase C-0) | Constructor |

## Failsafe

- `generateClientInsights()` siempre retorna un `ClientInsightsSnapshot` completo
- Si una sección falla, esa sección retorna valores por defecto
- Si todo falla, retorna `zeroInsights()` con timestamps

## Próximos Pasos

| Paso | Acción |
|:----:|--------|
| 1 | ✅ Crear HomeAIInsightAgent (foundation) |
| 2 | ⏳ Integrar en HomeBridge como `getClientInsights()` |
| 3 | ⏳ Conectar W8-W14 al agente (Phase D) |
