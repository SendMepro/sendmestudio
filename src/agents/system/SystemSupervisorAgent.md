# SystemSupervisorAgent

## Rol
Guardián de nivel superior para todo el ecosistema de agentes. Supervisa la salud, detecta fallos y coordina la gobernanza.

## Responsabilidades
- **Monitorear** agentes registrados mediante polling periódico (heartbeat)
- **Detectar** fallos (timeout, crash, estado obsoleto)
- **Orquestar** HealthCheckAgent en inicio para verificar build/tsc/tests
- **Orquestar** AgentInspector en inicio para verificar estructura de agentes
- **Producir** reporte de supervisión unificado (`SupervisorReport`)
- **Rastrear** estado de salud por agente (alive/degraded/unreachable) con contador de fallos consecutivos

## No hace
- No enruta peticiones de negocio (eso es responsabilidad de `EmotionalSalonOrchestrator`)
- No modifica el ciclo de vida de agentes (eso es Phase 5 con `AgentLifecycleAgent`)
- No ejecuta recuperación automática (eso es Phase 4 con `RecoveryAgent`)

## API Pública

| Método | Descripción |
|--------|-------------|
| `initialize()` | Inicializa el supervisor: registra agentes, ejecuta health check e inspección, inicia polling |
| `shutdown()` | Detiene polling y resetea estado |
| `startPolling()` / `stopPolling()` | Control del ciclo de polling |
| `pingAll()` | Ping a todos los agentes gestionados, retorna heartbeats actualizados |
| `getReport()` | Retorna `SupervisorReport` completo |
| `registerManagedAgent(agent)` / `unregisterManagedAgent(name)` | Gestión del mapa de heartbeats |
| `getHeartbeat(name)` | Estado de un agente específico |
| `runInspection(sectionPath?)` | Ejecuta AgentInspector y cachea resultado |
| `runHealthCheck()` | Ejecuta HealthCheckAgent y cachea resultado |
| `runRecovery(checkpointId)` | Ejecuta RecoveryAgent |
| `createCheckpoint(id, desc, files, phase)` | Crea checkpoint via CuratorAgent |

## Reporte de Supervisión

```
SupervisorReport {
  supervisor: "SystemSupervisorAgent",
  version: "1.0.0",
  uptime: number,           // segundos desde init
  managedCount: number,      // agentes en heartbeat map
  heartbeats: AgentHeartbeat[],
  totalAlive: number,
  totalDegraded: number,
  totalUnreachable: number,
  lastInspection: InspectionReport | null,
  lastHealthCheck: AgentHealthReport | null,
  lastCheckpoint: Checkpoint | null,
  lastRecovery: RecoveryReport | null,
  overall: "healthy" | "degraded" | "critical",
  pollIntervalMs: number,
  isPolling: boolean,
  checkedAt: string,
}
```

## Heartbeat por agente

```
AgentHeartbeat {
  agentName: string,
  status: "alive" | "degraded" | "unreachable",
  lastPing: string,           // ISO timestamp
  consecutiveFailures: number,
  lastError: string | null,
}
```

## Integración con agentes existentes

El supervisor usa un switch interno (`getAgentInstance()`) que asigna nombres a singletons. Actualmente mapea los 6 agentes de sistema:

- AgentRegistry
- AgentInspector
- CuratorAgent
- RecoveryAgent
- HealthCheckAgent
- AgentLifecycleAgent
- SystemSupervisorAgent (auto-registrado)

Los agentes Home y Bridges se registran en el heartbeat map pero devuelven `unreachable` hasta que se añadan adaptadores de ping. Esto es correcto para Phase 3 — Phase 4+ añadirá soporte completo.

## Singleton
```typescript
export const SystemSupervisor = new SystemSupervisorAgent();
```
