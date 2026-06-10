# AgentLifecycleAgent

## Purpose
Manages the full lifecycle of all current and future agents in the Emotional Salon system. Provides operations for registration, state transitions, cleanup, and registry synchronization.

## Responsibilities
1. **registerAgent()** — Register a new agent with initial status
2. **unregisterAgent()** — Permanently remove an agent from the active registry
3. **archiveAgent()** — Move an agent to archived state (preserved but not active)
4. **deprecateAgent()** — Mark an agent as deprecated (still present but not recommended)
5. **activateAgent()** — Transition an agent from inactive/planned to active
6. **deactivateAgent()** — Temporarily disable an agent without removing it
7. **updateAgentMetadata()** — Update an agent's metadata (description, dependencies, etc.)
8. **detectOrphanAgents()** — Find agents with no dependencies pointing to them
9. **detectDuplicateAgents()** — Find agents with the same or overlapping responsibilities
10. **detectInactiveAgents()** — Find agents that have been inactive beyond a threshold
11. **syncRegistry()** — Synchronize in-memory state with persisted registry files

## Inputs
- `agentDef` — Agent definition (name, phase, description, dependencies, inputs, outputs)
- `agentName` — Name of the agent to operate on
- `metadata` — Updated metadata fields
- `thresholdDays` — Inactivity threshold for detection

## Outputs
- Success/failure for each mutation operation
- Reports for detection operations (list of orphaned/duplicate/inactive agents)
- Sync result with file I/O status

## Registry Integration
The AgentLifecycleAgent operates on top of `AgentRegistry`:
- `registerAgent()` delegates to `AgentRegistry.registerAgent()`
- `updateAgentStatus()` delegates to `AgentRegistry.updateAgentStatus()`
- Detection operations read from `AgentRegistry.listAgents()`
- `syncRegistry()` serializes registry state to `agent-registry.json`

## Future Home Integration
- Home agents will transition through lifecycle: planned → created → active
- `activateAgent("HomeOrchestratorAgent")` enables Home coordination
- `deactivateAgent("HomeHealthCheckAgent")` suspends health checks during maintenance

## Future Messages Integration
- Messages agents follow lifecycle based on deployment readiness
- `deprecateAgent("DraftResponseAgentV1")` marks old draft logic
- `archiveAgent("IntentDetectionAgentV1")` preserves old version

## Future Campaign Integration
- Campaign agents lifecycle tied to campaign seasons
- `activateAgent("CampaignComplianceAgent")` during active campaign periods
- `deactivateAgent("CampaignLearningAgent")` when learning pipeline is paused

## Future Intelligence Integration
- Intelligence agents lifecycle tied to data pipeline availability
- `archiveAgent("SalonTrendsAgent")` preserves historical trend logic
- `detectInactiveAgents()` finds intelligence agents not receiving data

## Versioning Strategy
Agents use semantic versioning for their implementation:
- Major — Breaking changes to public API
- Minor — New capabilities
- Patch — Bug fixes

The lifecycle status is independent of version. An agent can be:
- `active` at v1.0.0 and later `active` at v2.0.0
- `deprecated` at v1.x while replacement is `active` at v2.x

## Agent Status Definitions

| Status | Meaning | Can receive work? | Can be modified? | Persisted? |
|--------|---------|:---:|:---:|:---:|
| **planned** | Design complete, not yet implemented | No | Yes | Yes (registry) |
| **created** | Implementation exists, not yet activated | No | Yes | Yes |
| **active** | Fully operational, handling tasks | Yes | Yes | Yes |
| **inactive** | Temporarily disabled, preserved | No | No | Yes |
| **deprecated** | Still works but replacement exists | Yes (legacy) | No | Yes |
| **archived** | Preserved for history, not runnable | No | No | Yes (cold) |

### Status Transition Diagram

```
planned ──► created ──► active ──► inactive ──► archived
                          │
                          ├──► deprecated ──► archived
                          │
                          └──► inactive ──► active (reactivate)
```

Allowed transitions:
- `planned` → `created`
- `created` → `active`
- `active` → `inactive`
- `active` → `deprecated`
- `inactive` → `active` (reactivation)
- `inactive` → `archived`
- `deprecated` → `archived`
- `archived` → [no outgoing transitions] (immutable)
- `created` → `archived` (skip active if never needed)
- `planned` → `archived` (cancelled before creation)
