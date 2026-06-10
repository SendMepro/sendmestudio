# Emotional Salon Intelligence Pipeline Proposal

## Fecha
2026-05-29 @ 23:24 UTC

## Propósito
Definir qué datos deben fluir desde la sección Home hacia el sistema Emotional Salon Intelligence, cómo deben fluir, y qué agentes deben manejar cada tipo de dato.

## Restricción importante
Este proyecto **no tiene base de datos**. El pipeline de Intelligence está diseñado para funcionar con:
- `localStorage` (navegador)
- `InMemoryAdapter` (estado en la aplicación)
- Archivos JSON locales (`data/learning/`)
- APIs existentes

> 🔮 Cuando exista base de datos, solo se necesitará cambiar el `IntelligenceRepository` a `DatabaseAdapter` — el resto del pipeline no cambia.

---

## Arquitectura del Flujo de Datos

```
Home Dashboard                    HomeLearningAgent                  Intelligence Section (futuro)
═══════════════                   ══════════════════                 ═══════════════════════════
                                   
┌──────────────────┐             ┌──────────────────────┐           ┌────────────────────────────┐
│ Appointment Flow  │─────event──▶│  Event Collector     │──store──▶│ IntelligenceRepository     │
│ List              │             │  (InMemoryAdapter)   │           │  ┌──────────────────────┐  │
└──────────────────┘             │                      │           │  │ LocalStorageAdapter  │  │
┌──────────────────┐             │  ┌─────────────────┐  │           │  │ (hoy)                │  │
│ Client Focus     │─────event──▶│  │ LearningEvent    │  │─batch──▶│  │ DatabaseAdapter      │  │
│ Card             │             │  │  Queue           │  │           │  │ (futuro 🔮)          │  │
└──────────────────┘             │  └─────────────────┘  │           │  └──────────────────────┘  │
┌──────────────────┐             └──────────────────────┘           └────────────────────────────┘
│ Arrival Behavior │─────event─────────────────────────────────────▶┌────────────────────────────┐
└──────────────────┘                                                 │ ClientProfileAgent        │
┌──────────────────┐                                                 │ (construye perfiles)      │
│ Platform Health  │─────event─────────────────────────────────────▶└────────────────────────────┘
└──────────────────┘                                                 ┌────────────────────────────┐
┌──────────────────┐                                                 │ PreferenceMiningAgent     │
│ Dossier Sections │─────event─────────────────────────────────────▶│ (mina preferencias)       │
└──────────────────┘                                                 └────────────────────────────┘
                                                                      ┌────────────────────────────┐
                                                                      │ OpportunityDetectionAgent │
                                                                      │ (detecta upsell/retention)│
                                                                      └────────────────────────────┘
                                                                      ┌────────────────────────────┐
                                                                      │ SalonTrendsAgent           │
                                                                      │ (rastrea tendencias)       │
                                                                      └────────────────────────────┘
```

---

## Puntos de Datos para Intelligence

### 1. Preferencias de Cliente
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Perfil Emocional → Estilo de decisión | Dossier W8 | String | "Secure proposals", "Privacy & visual validation" |
| Perfil Emocional → Tono ideal | Dossier W8 | String | "Warm & structured", "Calm & respectful" |
| Inteligencia Material → Marcas | Dossier W9 | String[] | ["Olaplex", "Wella", "Sebastian"] |
| Inteligencia Material → Coloraciones | Dossier W9 | String | "Warm satins", "Pastel Violet Fantasy" |
| Historial Técnico → Preferencias | Dossier W14 | String | "Warm satin tones. Avoids intense yellows." |

**Agente Intelligence:** PreferenceMiningAgent
**Prioridad:** Crítica
**Pipeline actual:** ❌ Ninguno — todos los datos son mock
**Almacenamiento local ahora:** `InMemoryAdapter` + persistencia periódica a `localStorage`

### 2. Solicitudes de Servicio / Intención de Reserva
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Servicio de cita seleccionado | Flow List W4 | String | "Balayage Olaplex", "Coloración Fantasía" |
| Estado de cita | Flow List W4 | String | "En curso", "Siguiente", "Finalizada", "Cancelada" |
| Origen de cita | Flow List W4 | String | "inbox_booking", "manual" |
| Estilista asignado | Flow List W4 | String | "Martina Salas", "Renata Ibarra" |

**Agente Intelligence:** ClientProfileAgent, PreferenceMiningAgent
**Prioridad:** Crítica
**Pipeline actual:** ❌ Ninguno — la API de citas existe pero no hay forwarding de eventos
**Almacenamiento local ahora:** `InMemoryAdapter` + API de citas

### 3. Patrones de Cancelación
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Cancelación de cita | Flow List W4 | Boolean | cancelled=true |
| Última visita delta | Dossier W8-W14 | Días | "Hace 41 días" |
| Riesgo detectado por AI | Dossier W12 | String | "Puede cancelar si espera demasiado" |
| Sugerencia de reagendado | Dossier W13 | String | "Enviar propuesta de reagendado por WhatsApp" |

**Agente Intelligence:** OpportunityDetectionAgent
**Prioridad:** Alta
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter`

### 4. Respuestas de Campañas
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Platform Health → Score | KPI Row W6 | Number | 92 |
| Platform Health → Estado | KPI Row W6 | String | "Healthy", "Warning", "Critical" |
| Rechazos de plantilla | KPI Row W6 | Number | 0-10+ |
| Nivel de riesgo | KPI Row W6 | String | "High Risk", "Medium Risk" |

**Agente Intelligence:** SalonTrendsAgent
**Prioridad:** Media
**Pipeline actual:** ⚠️ Parcial — datos existen en localStorage pero no hay forwarding
**Almacenamiento local ahora:** `localStorage` (ya está allí) + `PlatformHealthRepository`

### 5. Comportamiento en WhatsApp
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Origen de cita = "inbox_booking" | Flow List W4 | String | Indica reserva originada en WhatsApp |
| Alerta AI: preferencia de notificación | Dossier W12 | String | "Prefiere notificaciones por WhatsApp" |
| Recomendación AI: canal | Dossier W13 | String | "Send rescheduling proposal via WhatsApp" |

**Agente Intelligence:** ClientProfileAgent
**Prioridad:** Media
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter`

### 6. Historial de Citas
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Hora de cita | Flow List W4 | Time | "10:00", "11:30" |
| Fecha de cita | Flow List W4 | Date | Día actual |
| Servicio realizado | Flow List W4 | String | Nombre del servicio |
| Estilista asignado | Flow List W4 | String | Nombre del estilista |
| Servicios anteriores | Technical History W14 | String | "Balayage Olaplex, Ritual Repair" |
| Visitas totales (anual) | LTV W10 | Number | 14, 20 |

**Agente Intelligence:** ClientProfileAgent, SalonTrendsAgent
**Prioridad:** Alta
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter` + archivos `data/appointments.json`

### 7. Objeciones
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Alertas AI | Dossier W12 | String | "Sensible a la demora en lavado" |
| Alertas AI | Dossier W12 | String | "Baja tolerancia a esperas en caja" |
| Descripción de riesgo | Dossier W8-W14 | String | "Puede rechazar extras si la propuesta llega tarde" |

**Agente Intelligence:** PreferenceMiningAgent
**Prioridad:** Alta
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter`

### 8. Oportunidades de Seguimiento / Retención
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Recomendación AI | Dossier W13 | String | "Ofrecer próxima reserva de mantención antes del pago" |
| Siguiente acción recomendada | Client Focus W5 | String | "Agendar mantenimiento antes de cerrar caja" |
| Sugerencia de recuperación | Client Focus W5 | String | "Enviar propuesta de reagendado con beneficio" |
| Nivel de riesgo | Dossier W8-W14 | String | "Alto. Puede enfriarse si no se recontacta hoy" |

**Agente Intelligence:** OpportunityDetectionAgent
**Prioridad:** Alta
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter`

### 9. Oportunidades de Upsell
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Recomendación AI | Dossier W13 | String | "Ofrecer upgrade Olaplex antes del enjuague final" |
| Valor de impacto | Client Focus W5 | String | "+$96.000 CLP", "+$84.000 CLP" |
| Header Feed | W2 | String | "Ofrecer Ritual Repair a Julia Rojas aumenta el ticket promedio 15%" |

**Agente Intelligence:** OpportunityDetectionAgent
**Prioridad:** Media
**Pipeline actual:** ❌ Ninguno
**Almacenamiento local ahora:** `InMemoryAdapter`

### 10. Datos de Llegada / Puntualidad
| Origen | Widget Home | Tipo | Ejemplos |
|--------|-------------|------|----------|
| Delta de llegada | Dossier W11 | Number | minutos antes/después |
| Timestamp de llegada | Dossier W11 | DateTime | cuándo se presionó el botón "Arrived" |
| Hora de cita programada | Flow List W4 | Time | hora programada para comparación de puntualidad |

**Agente Intelligence:** ClientProfileAgent
**Prioridad:** Baja
**Pipeline actual:** ⚠️ Parcial — almacenado en localStorage pero no reenviado
**Almacenamiento local ahora:** `localStorage` (ya está allí)

---

## Esquema de LearningEvent

```typescript
// Ubicación propuesta: src/types/learning.ts

interface LearningEvent {
  id: string;
  type: LearningEventType;
  section: 'home' | 'messages' | 'campaigns' | 'intelligence';
  source: string;         // widget o agente que originó el evento
  clientId?: string;
  timestamp: string;      // ISO 8601
  data: Record<string, unknown>;
  metadata?: {
    isMock?: boolean;
    confidence?: number;
    sourceWidget?: string;
    sessionId?: string;
  };
}

type LearningEventType =
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'client_arrived'
  | 'client_preference_detected'
  | 'service_selected'
  | 'ai_recommendation_shown'
  | 'ai_recommendation_accepted'
  | 'upsell_opportunity_detected'
  | 'retention_risk_detected'
  | 'platform_health_changed'
  | 'campaign_template_rejected';
```

---

## Cola de Prioridad para Implementación

| Prioridad | Tipo de Dato | Por qué ahora | Almacenamiento actual | Esfuerzo |
|-----------|-------------|---------------|----------------------|----------|
| P0 | Preferencias de Cliente | Core para funcionalidad del dossier | InMemoryAdapter | 1 día |
| P0 | Solicitudes de Servicio | Ya disponible en API de citas | InMemoryAdapter + API | 0.5 día |
| P1 | Historial de Citas | Fundación para perfilado | InMemoryAdapter + data/appointments.json | 0.5 día |
| P1 | Oportunidades de Seguimiento/Retención | Valor directo para el negocio | InMemoryAdapter | 1 día |
| P1 | Objeciones | Mejora recomendaciones AI | InMemoryAdapter | 1 día |
| P2 | Oportunidades de Upsell | Driver de ingresos | InMemoryAdapter | 1 día |
| P2 | Patrones de Cancelación | Reduce churn | InMemoryAdapter | 1 día |
| P3 | Respuestas de Campañas | Depende de infraestructura de campañas | localStorage + PlatformHealthRepository | 2 días |
| P3 | Comportamiento en WhatsApp | Depende de agentes de análisis de mensajes | InMemoryAdapter | 2 días |
| P4 | Llegada / Puntualidad | Nice-to-have de optimización | localStorage (ya existe) | 0.5 día |

---

## Roadmap de Implementación

### Fase A — Infraestructura de Eventos (Día 1)
- Definir esquema `LearningEvent` en tipos compartidos
- Crear `HomeLearningAgent.ts` con cola de eventos
- Implementar `IntelligenceRepository` con `InMemoryAdapter`
- Persistir eventos a `localStorage` como backup
- Conectar selección/creación de citas a eventos

### Fase B — Pipeline de Preferencias de Cliente (Días 2-3)
- Reenviar datos del dossier (perfil emocional, material, historial técnico) como eventos de aprendizaje
- Implementar `ClientRepository` con `InMemoryAdapter`
- Agregar batching de eventos para evitar flooding

### Fase C — Pipeline de Comportamiento (Días 4-5)
- Reenviar registros de llegada, cambios de estado de citas
- Reenviar cambios de Platform Health
- Conectar a OpportunityDetectionAgent (futuro)

### Fase D — Integración con Intelligence (Semana 2+)
- IntelligenceOrchestratorAgent lee de `IntelligenceRepository`
- ClientProfileAgent construye perfiles desde eventos acumulados
- PreferenceMiningAgent mina patrones semanalmente
- OpportunityDetectionAgent escanea oportunidades de upsell/retención diariamente

> 🔮 **Futuro database-ready:** Cuando exista base de datos, solo se cambia el adapter del `IntelligenceRepository` de `LocalStorageAdapter` a `DatabaseAdapter`. Todos los agentes y el esquema `LearningEvent` permanecen iguales.
