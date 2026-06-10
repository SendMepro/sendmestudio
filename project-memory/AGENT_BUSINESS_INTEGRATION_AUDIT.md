# Agent vs Business Flow Boundary Audit

## Executive Summary

**No agent in the `src/agents/` ecosystem is invoked by any production business API route.** The agent ecosystem runs exclusively within the Supervisor dashboard context — it is a **monitoring/reporting layer** that annotates agent metadata but never participates in business logic execution.

---

## Production API Routes — Complete Map

### WhatsApp / Concierge Flow (primary business value)

| Route | File | Agent Invocations | Business Logic |
|-------|------|------------------|----------------|
| `POST /api/whatsapp/webhook` | `src/app/api/whatsapp/webhook/route.ts` | **None** | `normalizer.ts` → `store.ts` → `booking-context.ts` → `ai-concierge.ts` → `sender.ts` → `fetch(/api/appointments)` |
| `GET /api/whatsapp/webhook` | same file | None | Verification challenge |
| `POST /api/whatsapp/send` | `send/route.ts` | **None** | `sender.ts` → Meta API (manual send) |
| `GET /api/whatsapp/messages` | `messages/route.ts` | **None** | `store.ts` → `customer-assets.ts` |
| `POST /api/whatsapp/reaction` | `reaction/route.ts` | **None** | Meta reaction API |
| `GET /api/whatsapp/events` | `events/route.ts` | **None** | SSE event source |
| `POST /api/whatsapp/mode` | `mode/route.ts` | **None** | Toggle autoReply |
| `POST /api/appointments` | `appointments/route.ts` | **None** | Direct JSON file write + analytics |

**Key finding:** The entire booking pipeline (webhook → booking-context → ai-concierge → appointment creation) runs **zero agent code**. The `ai-concierge.ts` functions are pure business logic — they are not agents.

### Supervisor Dashboard

| Route | File | Agent Invocations | Notes |
|-------|------|------------------|-------|
| `GET /api/supervisor` | `supervisor/route.ts` | **Reads AgentRegistry + SystemSupervisor** | Dynamic `import()` — read-only, no side effects. Returns cached snapshot or registry-only heartbeats. |

**This is the ONLY route that touches agent code** — and it's read-only metadata, not business logic execution.

### Other API Routes — No Agent Involvement

All other routes (brain-admin, knowledge, customers, campaigns, analytics, google-drive, booking/availability, messages, clients, meta-templates, customer-assets, theme) have **zero imports from `src/agents/`**.

---

## Agent Ecosystem — Complete Classification

### System Agents (6)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `AgentRegistry` | active | **Used only by Supervisor route** | Only imported by `SystemSupervisorAgent.ts`, `HealthCheckAgent.ts`, `supervisor/route.ts`. No business code references it. |
| `AgentInspector` | active | **Decorative** | Only referenced inside `SystemSupervisorAgent.ts`. Never called by any route. |
| `CuratorAgent` | active | **Decorative** | Only referenced inside `SystemSupervisorAgent.ts`. Creates in-memory checkpoints. |
| `RecoveryAgent` | active | **Decorative** | Only referenced inside `SystemSupervisorAgent.ts`. Stub — `restore()` throws "not implemented". |
| `HealthCheckAgent` | active | **Decorative** | Runs shell execs (`npx tsc`, `npm run build`, `npx jest`). Only called via `SystemSupervisorAgent.initialize()` — which never runs in production. |
| `AgentLifecycleAgent` | active | **Decorative** | Only referenced inside `SystemSupervisorAgent.ts`. Never called by any route. |
| `SystemSupervisorAgent` | active | **Supervisor context only** | Exposes `getCachedReport()` for the supervisor API route. Is never invoked by any business route. |

### Skill / Orchestrator Agents (2)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `EmotionalSalonOrchestrator` | active | **Dead code — file does not exist** | Referenced in `adapters.ts` + `AGENT_DEFINITIONS`. No `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` file exists. `findstr` confirms zero references outside `src/agents/`. |
| `IntelligenceLayer` | active | **Decorative — agent wrapper exists, file exists** | `IntelligenceLayer.ts` exists in `src/agents/home/intelligence/`. But only referenced by `adapters.ts` + `AGENT_DEFINITIONS`. No business code imports it. |

### Home Agents (7)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `HomeOrchestratorAgent` | active | **Decorative — imported by HomeBridge, which is never imported** | `HomeBridge.ts` imports it, but zero pages/hooks/routes import `HomeBridge`. |
| `HomeDataSourceAgent` | active | **Decorative** | Same — only via `HomeBridge.ts` path |
| `HomeInspectorAgent` | active | **Decorative** | Same |
| `HomeHealthCheckAgent` | active | **Decorative** | Same |
| `HomeMetricsAgent` | active | **Decorative** | Same |
| `HomeAIInsightAgent` | active | **Decorative** | Same |
| `HomeLearningAgent` | active | **Decorative** | Same |

### Knowledge Agents (2)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `KnowledgeBundleAgent` | active | **Decorative** | Described in AGENT_DEFINITIONS as wrapping `useKnowledgeBundle` hook. But the hook (`src/app/knowledge/hooks/useKnowledgeBundle.ts`) does not reference this agent. |
| `KnowledgeCompletionAgent` | active | **Decorative** | Same pattern — hook exists, agent definition references it, hook doesn't import agent. |

### Brain Admin Agents (5)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `BrainDataAgent` | active | **Decorative** | Described as wrapping `useBrainAdminData` hook. Hook exists; doesn't import agent. |
| `BrainVoiceAgent` | active | **Decorative** | Same pattern |
| `BrainNotesAgent` | active | **Decorative** | Same pattern |
| `BrainQRTokenAgent` | active | **Decorative** | Same pattern |
| `BrainAuthAgent` | active | **Decorative** | Same pattern |

### Event Consumers + EventBus (3)

| Agent | Status | Classification | Evidence |
|-------|--------|---------------|----------|
| `EventBus` | active | **Decorative** | File exists in `src/agents/home/EventBus.ts`. Referenced by Home agents but nothing outside `src/agents/` imports it. |
| `ClientArrivalConsumer` | active | **Decorative** | Only referenced within `src/agents/home/` |
| `AppointmentSelectionConsumer` | active | **Decorative** | Only referenced within `src/agents/home/` |

---

## The Invocation Chain

```
Supervisor Dashboard page
  └── fetch("/api/supervisor")
        └── GET /api/supervisor (route.ts)
              ├── dynamic import("AgentRegistry")  →  reads agent list (read-only)
              ├── dynamic import("SystemSupervisorAgent")  →  reads cached snapshot (or null)
              └── returns JSON (all healthy_registered when no snapshot)


Business webhook (WhatsApp message arrives)
  └── POST /api/whatsapp/webhook
        └── maybeSendAutoReply()
              ├── generateBookingConciergeDecision()  [business logic, not agent]
              ├── generateConciergeDecision()  [business logic, not agent]
              ├── generateDeepSeekConciergeReply()  [business logic, not agent]
              └── fetch("/api/appointments")  [business logic, not agent]
```

**The boundary is absolute.** No path leads from a production business route into any `src/agents/` module.

---

## Dead / Aspirational References

- **`EmotionalSalonOrchestrator`** — Referenced in 3 places (AGENT_DEFINITIONS, adapters.ts, SystemSupervisorAgent.ts), file `src/skills/emotional-salon/EmotionalSalonOrchestrator.ts` does not exist.
- **`HomeBridge`** (`src/bridges/HomeBridge.ts`) — Full class with agent import list, feature flag gates, 600+ lines. **Zero imports from any page, hook, or route.** Completely disconnected code.
- **All adapters** (`src/agents/system/adapters.ts`) — Only used by `SystemSupervisorAgent.getAgentInstance()` for ping simulation. Never reach production business logic.

---

## Integration Gap: What Would Need to Change

For agents to participate in business flows, the following integration points are absent:

1. **No agent invocation from `ai-concierge.ts` or `booking-context.ts`** — These are pure business logic modules. No agent ecosystem bridge exists.
2. **No webhook-to-agent dispatch** — The webhook route directly calls `generateBookingConciergeDecision()` etc. without routing through an orchestrator agent.
3. **No agent lifecycle integration in business routes** — For example, `EmotionalSalonOrchestrator` could theoretically orchestrate the concierge flow, but it doesn't exist and nothing calls it.
4. **No event subscription from business routes to EventBus** — Business events (appointment_scheduled, ai_auto_replied) are emitted via `realtime.ts` (SSE), not via the agent `EventBus`.
5. **Supervisor lacks business visibility** — The supervisor has no visibility into concierge decisions, booking stages, or appointment creation. It only sees agent ping/health metadata.

---

## Recommendations

1. **Remove dead decorative agents** or mark them clearly as "planned/future" in AGENT_DEFINITIONS to reduce confusion.
2. **If agent orchestration is desired**, introduce an `OrchestrationAgent` that the webhook route calls, delegating concierge decisions through the agent ecosystem.
3. **Bridge Supervisor into business metrics** — The supervisor API could incorporate concierge decision metadata (e.g., booking signals detected, auto-replies sent) as agent-level metrics.
4. **Connect HomeBridge** if/when Home dashboard components need agent-backed data. Currently HomeBridge is wired to nothing.

---

## Verdict

| Count | Classification | Description |
|-------|----------------|-------------|
| **1** | **Used in production** | `SystemSupervisorAgent` + `AgentRegistry` (read-only, supervisor API only) |
| **21** | **Decorative / dead** | All other agents. Never invoked by business routes. Files may exist but are unreachable from production flow. |
| **0** | **Business path involvement** | No agent participates in WhatsApp concierge, booking, appointment creation, or any customer-facing flow. |
