# Home Fix Priority Plan

## Fecha
2026-05-29 @ 23:24 UTC

## Fase
Phase 2.1 — Critical Findings Analysis (No Code, No Agents, No Database Dependency)

## Restricción importante
Este proyecto **no tiene base de datos**. Todas las soluciones usan solo:
- `localStorage` (navegador)
- `InMemoryAdapter` (estado en la aplicación)
- Archivos JSON locales (`data/`)
- APIs existentes

> 🔮 **Future database-ready, not implemented now** — marcado cuando corresponde.

---

## Priorización de Widgets

### CRÍTICO — Arreglar Inmediatamente

| # | Widget | Por qué es crítico | Depende de | Esfuerzo | ¿Solucionable ahora? |
|---|--------|-------------------|------------|----------|---------------------|
| **W8** | Perfil Emocional | Propuesta de valor central. Roto para clientes reales. Afecta cada cita. | Pipeline de datos reales + HomeAIInsightAgent | Medio | **Sí, parcialmente.** Estado "en construcción" con InMemoryAdapter |
| **W9** | Inteligencia Material | Misma cadena de dependencia que Perfil Emocional. | Pipeline de datos reales | Medio | **Sí, parcialmente.** Misma solución que W8 |
| **W10** | Customer LTV | Requiere historial de transacciones. Fundación para segmentación de valor. | Integración store clientes + HomeMetricsAgent | Medio | **Sí, parcialmente.** Calcular desde data/customers/ |
| **W12** | Alertas AI | 100% mock. Da falsa sensación de capacidad AI. | Pipeline AI real + HomeAIInsightAgent | Alto | **Sí, parcialmente.** Mostrar estado "sin datos" en lugar de mock |
| **W13** | Recomendación AI | Feature AI más visible. Actualmente muestra texto falso. | Pipeline AI real + HomeAIInsightAgent | Alto | **Sí, parcialmente.** Misma solución que W12 |
| **W14** | Historial Técnico | Estilistas dependen de esto para decisiones de servicio. Vacío para clientes reales. | Historial de servicios + pipeline de datos | Medio | **Sí, parcialmente.** Leer desde data/customers/ |

**Total widgets críticos: 6** (todas las secciones del dossier)
**Estos widgets forman la columna derecha del dashboard — la sección más usada por los estilistas.**

### ALTO — Arreglar Pronto

| # | Widget | Por qué es alto | Depende de | Esfuerzo | ¿Solucionable ahora? |
|---|--------|----------------|------------|----------|---------------------|
| **W4** | Appointment Flow List | Datos mock ocultan problemas reales. Sin estado de carga. | Flag isMock + UI de carga | Bajo | **Sí.** Flag isMock y skeleton loading son puramente UI + InMemoryAdapter |
| **W5** | Client Focus Card | Muestra "Nuevo"/"0%" para clientes reales que regresan. | Misma solución que widgets dossier | Bajo | **Sí.** Estado "perfil en construcción" |
| **W7** | KPI Metrics | Tres números hardcodeados. Nunca cambian. Engañosos para decisiones de negocio. | HomeMetricsAgent + datos de citas | Medio | **Sí.** Calcular KPIs desde AppointmentRepository (mock + API) |
| **W6** | Platform Health | Solo localStorage. Inconsistente entre dispositivos. | PlatformHealthRepository con adapter | Medio | **Sí.** Migrar a PlatformHealthRepository con InMemoryAdapter + localStorage |

**Total widgets altos: 4**
**Estos widgets son visibles diariamente y afectan la confianza en la plataforma.**

### MEDIO — Arreglar Cuando Sea Posible

| # | Widget | Por qué es medio | Depende de | Esfuerzo | ¿Solucionable ahora? |
|---|--------|-----------------|------------|----------|---------------------|
| **W2** | Header Feed | Tips estáticos nunca cambian. Se beneficiarían de AI real. | HomeOrchestratorAgent + pipeline AI | Bajo | **Sí.** Tips dinámicos simples desde datos operativos |
| **W3** | Weather/Date/Time | Clima hardcodeado. Problema cosmético menor. | API de clima externa | Bajo | **Sí, parcialmente.** El clima real requiere API externa, pero se puede ocultar |

**Total widgets medios: 2**
**Estos widgets son mejoras nice-to-have, no bloquean funcionalidad.**

### BAJO — Arreglar Después / Opcional

| # | Widget | Por qué es bajo | Depende de | Esfuerzo | ¿Solucionable ahora? |
|---|--------|----------------|------------|----------|---------------------|
| **W1** | Salon Hero | Branding estático. Funciona correctamente como está. | Ninguno | Ninguno | N/A — funciona |
| **W11** | Llegada Behavior | Datos reales (manuales). Funciona correctamente. | Solo necesita forwarding a Intelligence | Bajo | **Sí.** Ya funciona, solo agregar evento de aprendizaje |
| **W15** | Parámetros Técnicos | Herramienta de debug para desarrolladores. Oculta por defecto. | Ninguno | Ninguno | N/A — solo debug |

**Total widgets bajos: 3**
**Estos widgets funcionan correctamente o son cosméticos.**

---

## Distribución de Prioridades

```
CRÍTICO: 6 widgets ────── ████████████████████████  40%
ALTO:    4 widgets ────── ████████████████           27%
MEDIO:   2 widgets ────── ████████                   13%
BAJO:    3 widgets ────── ████████████               20%
```

---

## Fases de Implementación

### Fase 1 — Detener el Sangrado (Días 1-2)
**Objetivo:** Prevenir UX engañosa para citas reales

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Agregar flag `isMock` para distinguir datos mock de reales | W4, W5, W8-W14 | InMemoryAdapter | 0.5 día |
| Agregar estado "en construcción" para secciones de dossier sin datos reales | W8, W9, W10, W12, W13, W14 | InMemoryAdapter | 0.5 día |
| Separar citas mock visualmente (borde punteado o badge) | W4 | UI pura | 0.5 día |
| Agregar skeleton loading para fetch de citas | W4 | UI pura | 0.5 día |

**Entregable:** El dashboard ya no pretende tener datos reales cuando no los tiene.

### Fase 2 — Infraestructura de Datos (Días 3-5)
**Objetivo:** Conectar fuentes de datos reales al dashboard usando repositorios

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Implementar `AppointmentRepository` con InMemoryAdapter | W4-W15 | InMemoryAdapter + API | 0.5 día |
| Implementar `ClientRepository` con InMemoryAdapter (lee de `data/customers/`) | W8-W14 | InMemoryAdapter + JSON | 1 día |
| Implementar `IntelligenceRepository` con InMemoryAdapter + localStorage | W4-W15 | InMemoryAdapter + localStorage | 1 día |
| Implementar `PlatformHealthRepository` con InMemoryAdapter + localStorage | W6 | InMemoryAdapter + localStorage | 0.5 día |
| Construir HomeDataSourceAgent para agregar fuentes de datos | W4-W15 | Repositorios | 1 día |
| Construir HomeOrchestratorAgent para coordinar datos de widgets | W4-W15 | Repositorios | 1 día |

**Entregable:** Datos reales fluyen desde archivos/API/localStorage a los widgets del dashboard.

### Fase 3 — Pipeline de Intelligence (Días 6-8)
**Objetivo:** Reenviar datos del dashboard al sistema Intelligence

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Implementar HomeLearningAgent con cola de eventos | W4-W15 | IntelligenceRepository | 1 día |
| Reenviar eventos de creación de citas | W4 | IntelligenceRepository | 0.5 día |
| Reenviar datos de preferencias de cliente | W8, W9, W14 | IntelligenceRepository | 1 día |
| Reenviar datos de LTV y recompra | W10 | IntelligenceRepository | 0.5 día |
| Reenviar comportamiento de llegada | W11 | IntelligenceRepository | 0.5 día |
| Reenviar cambios de Platform Health | W6 | IntelligenceRepository | 0.5 día |
| Crear stub de Intelligence para recibir eventos | Todos | IntelligenceRepository | 1 día |

**Entregable:** Todos los datos de Home alimentan Intelligence, incluso si Intelligence no está completamente construido.

### Fase 4 — Métricas Reales (Días 9-11)
**Objetivo:** Reemplazar KPIs hardcodeados con cálculos reales

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Construir HomeMetricsAgent para calcular KPIs reales | W7 | AppointmentRepository | 1 día |
| Conectar datos de ventas desde API de citas | W7 | AppointmentRepository | 0.5 día |
| Calcular ocupación desde horario | W7 | AppointmentRepository | 0.5 día |
| Calcular potencial de ingresos desde reservas pendientes | W7 | AppointmentRepository | 0.5 día |
| Migrar PlatformHealthRepository a adapter (InMemory + localStorage) | W6 | PlatformHealthRepository | 1 día |

**Entregable:** Los KPIs reflejan métricas de negocio reales.

### Fase 5 — Insights AI Reales (Días 12-15+)
**Objetivo:** Reemplazar datos de dossier mock con insights AI reales

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Construir HomeAIInsightAgent | W8-W14 | IntelligenceRepository + ClientRepository | 2-3 días |
| Conectar a sección Intelligence (ClientProfileAgent, PreferenceMiningAgent) | W8-W14 | IntelligenceRepository | 2 días |
| Generar perfiles emocionales reales desde datos de clientes | W8 | ClientRepository | 1 día |
| Generar inteligencia material real desde historial de servicios | W9 | ClientRepository | 0.5 día |
| Generar LTV real desde datos de transacciones | W10 | AppointmentRepository | 0.5 día |
| Generar alertas AI reales desde patrones de comportamiento | W12 | IntelligenceRepository | 1 día |
| Generar recomendaciones AI reales desde análisis combinado | W13 | IntelligenceRepository | 1 día |
| Generar historial técnico real desde registros de servicios | W14 | ClientRepository | 0.5 día |

**Entregable:** El dossier muestra insights AI reales y personalizados.

### Fase 6 — Pulido (Días 16-18)
**Objetivo:** Mejorar widgets restantes y eliminar datos mock

| Tarea | Widgets | Almacenamiento | Esfuerzo |
|-------|---------|---------------|----------|
| Generar header feed dinámico desde datos operativos reales | W2 | IntelligenceRepository | 1 día |
| Integrar API de clima real (cuando esté disponible) | W3 | API externa | 0.5 día |
| Eliminar datos mock de page.tsx | Todos | Repositorios (todos reales ahora) | 0.5 día |
| Optimización de rendimiento | Todos | N/A | 1 día |

**Entregable:** Cero datos mock, todo real.

---

## Mapa de Dependencias

```
Fase 1 (Detener Sangrado) — solo UI, sin repositorios
    │
    ▼
Fase 2 (Infraestructura de Datos) — crear repositorios + adapters
    │
    ├────────────────────────────────────┐
    ▼                                    ▼
Fase 3 (Pipeline Intelligence)     Fase 4 (Métricas Reales)
    │                                    │
    └────────────────┬───────────────────┘
                     ▼
              Fase 5 (Insights AI Reales)
                     │
                     ▼
              Fase 6 (Pulido)
```

Fase 1 y Fase 2 pueden empezar inmediatamente. Fase 3 depende de Fase 2. Fase 4 es independiente de Fase 3. Fase 5 depende de Fase 3 (sección Intelligence) y Fase 4 (métricas reales). Fase 6 es la limpieza final.

---

## Resumen de Almacenamiento por Fase

| Fase | Almacenamiento Primario | Almacenamiento Secundario | ¿Requiere DB? |
|------|------------------------|--------------------------|:-------------:|
| 1 — Detener Sangrado | UI pura (flags, estados) | Ninguno | ❌ No |
| 2 — Infraestructura | InMemoryAdapter | localStorage, JSON files | ❌ No |
| 3 — Pipeline Intelligence | IntelligenceRepository (InMemory) | localStorage | ❌ No |
| 4 — Métricas Reales | AppointmentRepository (InMemory) | API de citas | ❌ No |
| 5 — Insights AI | ClientRepository + IntelligenceRepository | InMemory + localStorage | ❌ No |
| 6 — Pulido | Todos los repositorios | N/A | ❌ No |

**Ninguna fase requiere base de datos.** El `DatabaseAdapter` se puede agregar en el futuro sin modificar ninguna fase.

---

## Evaluación de Riesgos

| Riesgo | Fase | Impacto | Mitigación |
|--------|------|---------|------------|
| Eliminar datos mock rompe demo | 1 | Medio | Mantener datos mock detrás de feature flag |
| Estructura de customer data está incompleta | 2 | Alto | Auditar `data/customers/` antes de empezar Fase 2 |
| Sección Intelligence no existe | 3 | Medio | Usar stub/logger en lugar de agentes Intelligence reales |
| KPIs reales requieren APIs que no existen | 4 | Alto | Crear stubs de API primero, luego construir las reales |
| Insights AI requieren servicio AI externo | 5 | Alto | Empezar con insights basados en reglas, agregar AI después |

---

## Estimación de Recursos

| Fase | Días | Desarrolladores | Enfoque |
|------|:----:|:---------------:|---------|
| 1 — Detener el Sangrado | 2 | 1 | Seguridad UX, flags de datos mock |
| 2 — Infraestructura de Datos | 3 | 1 | Repositorios, adapters, eventos |
| 3 — Pipeline Intelligence | 3 | 1 | Eventos de aprendizaje, persistencia |
| 4 — Métricas Reales | 3 | 1 | Cálculos KPI, Platform Health |
| 5 — Insights AI Reales | 4 | 1-2 | Agentes AI, integración Intelligence |
| 6 — Pulido | 3 | 1 | Contenido dinámico, eliminación de mock |

**Total: ~18 días (3.5 semanas) para refactor completo de Home**
**MVP (Fases 1-2): ~5 días para eliminar todos los riesgos críticos y altos**
**Sin base de datos en ningún paso** — todo funciona con localStorage, InMemory y archivos JSON.
