# project-memory / DECISIONS.md

## Decisiones de Arquitectura

### 1. Arquitectura de Agentes en Capas
**Decisión**: Crear 3 capas: `skills/` (orquestación), `agents/` (inteligencia), `modules/` (UI).
**Razón**: Separación clara de responsabilidades, permite que los agentes trabajen independientemente de la UI.
**No cambiar**: No mezclar lógica de agentes en componentes UI.

### 2. Sistema de Memoria Persistente
**Decisión**: Usar archivos Markdown + JSON en `project-memory/` para estado, decisiones y checkpoints.
**Razón**: JCode puede fallar entre sesiones; la memoria debe sobrevivir a reinicios.
**No cambiar**: No usar base de datos para esto; los archivos son portables y legibles por humanos.

### 3. Preservación de Funcionalidad Existente
**Decisión**: No reescribir secciones funcionales (Home, Inbox, Campaigns).
**Razón**: Ya están conectadas a Meta/WhatsApp y funcionando.
**No cambiar**: Solo agregar capa de agentes encima, no modificar el núcleo.

### 4. Cambios Pequeños e Incrementales
**Decisión**: Cada cambio debe ser atómico, validable y reversible.
**Razón**: Minimizar riesgo de romper funcionalidad existente.
**No cambiar**: No hacer refactors grandes de una sola vez.

### 5. Checkpoint Antes de Cada Cambio
**Decisión**: Antes de modificar cualquier archivo, crear checkpoint (copiar o registrar estado).
**Razón**: Poder revertir cualquier cambio que rompa algo.
**No cambiar**: Saltarse este paso aunque el cambio parezca seguro.

### 6. CuratorAgent como Guardián
**Decisión**: CuratorAgent valida cada cambio antes y después.
**Razón**: Proteger el proyecto de cambios no validados.
**No cambiar**: No deshabilitar la validación del CuratorAgent.

### 7. Meta/WhatsApp Compliance
**Decisión**: Toda interacción con clientes debe pasar por compliance checks.
**Razón**: Meta puede suspender la integración si se violan políticas.
**No cambiar**: No enviar mensajes sin verificar consentimiento, ventana 24h y aprobación de plantilla.

### 8. AgentRegistry como Fuente de Verdad
**Decisión**: Todos los agentes deben registrarse en AgentRegistry.
**Razón**: El orquestador necesita saber qué agentes existen y sus responsabilidades.
**No cambiar**: No ejecutar agentes no registrados.

### 9. Separación de Responsabilidades por Sección
**Decisión**: Cada sección (Home, Messages, Campaigns, Intelligence) tiene su propio orchestrator, inspector, learning agent.
**Razón**: Cada sección tiene necesidades y fuentes de datos diferentes.
**No cambiar**: No centralizar toda la lógica en un solo agente.

### 10. Inspector Agents para Diagnóstico
**Decisión**: Cada sección tiene un inspector que detecta datos faltantes, widgets rotos, servicios desconectados.
**Razón**: Detectar problemas temprano sin depender de errores en runtime.
**No cambiar**: No omitir inspección antes de cambios.
