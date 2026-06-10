# EmotionalSalonOrchestrator

## Orchestrator Responsibilities
The **EmotionalSalonOrchestrator** is the central routing and coordination hub for the Emotional Salon platform. It does not execute business logic itself — it delegates to specialized section agents and system agents.

### Core Responsibilities
1. **Route tasks** to the correct section orchestrator (Home, Messages, Campaigns)
2. **Call system agents** for inspection, health checks, checkpoints, and recovery
3. **Enforce Meta/WhatsApp compliance** before outbound actions
4. **Collect and forward learning data** to the Intelligence section
5. **Report system status** — what agents exist, their health, and the next recommended step

## How It Routes Tasks

```
Incoming request
    │
    ▼
EmotionalSalonOrchestrator.routeSection(sectionName)
    │
    ├── "home"       → HomeOrchestratorAgent (future)
    ├── "messages"   → ReceptionOrchestratorAgent (future)
    ├── "campaigns"  → CampaignOrchestratorAgent (future)
    └── "intelligence" → IntelligenceOrchestratorAgent (future)
```

Each section orchestrator is responsible for its own sub-agents (inspector, learning, health).

## How It Calls System Agents

### AgentInspector
- Called via `inspectSection(sectionName)`
- Returns an `InspectionReport` with files, dependencies, issues, and health

### CuratorAgent
- Called before any modification via `CuratorAgent.validateChange(change)`
- If a modification is approved, `CuratorAgent.createCheckpoint(...)` records the state

### HealthCheckAgent
- Called after modifications via `runHealthCheck()`
- Returns a `HealthReport` with build, lint, and route status

### RecoveryAgent
- Called if health check fails or a runtime error occurs
- `RecoveryAgent.restore(checkpointId)` rolls back to the last stable checkpoint

## How It Calls Future Home Agents

When Home section agents are created, the orchestrator will:

1. `HomeOrchestratorAgent.assembleDashboard()` — collect data from all Home widgets
2. `HomeInspectorAgent.inspect()` — check for missing widgets, broken data sources
3. `HomeDataSourceAgent.mapSources()` — identify where each data point comes from
4. `HomeHealthCheckAgent.verify()` — ensure the Home page renders correctly
5. `HomeLearningAgent.extractInsights()` — send engagement data to Intelligence

## How It Calls Future Messages Agents

When Messages section agents are created, the orchestrator will:

1. `ReceptionOrchestratorAgent.handleIncoming(message)` — process new WhatsApp message
2. `ConversationInspectorAgent.analyze(conversation)` — detect missing client info
3. `IntentDetectionAgent.detectIntent(message)` — classify customer intent
4. `DraftResponseAgent.suggest(intent, context)` — generate draft reply
5. `MetaReplyGuardAgent.isSafe(draft)` — verify reply is compliant
6. `ConversationMemoryAgent.extract(conversation)` — send learning data to Intelligence

## How It Calls Future Campaign Agents

When Campaign section agents are created, the orchestrator will:

1. `CampaignOrchestratorAgent.createCampaign(params)` — start campaign creation flow
2. `AudienceAgent.buildSegment(criteria)` — build and validate audience
3. `TemplateValidationAgent.validate(template)` — check if template needs Meta approval
4. `CampaignComplianceAgent.check(campaign)` — opt-in, frequency, spam compliance
5. `DeliveryMonitorAgent.monitor(campaignId)` — track delivery KPIs
6. `CampaignLearningAgent.analyze(results)` — send campaign insights to Intelligence

## How It Sends Learning Data to Intelligence

```
sendLearningEvent(event)
    │
    ├── event.type = "client_engagement"  → ClientProfileAgent (future)
    ├── event.type = "preference"         → PreferenceMiningAgent (future)
    ├── event.type = "opportunity"        → OpportunityDetectionAgent (future)
    └── event.type = "trend"              → SalonTrendsAgent (future)
```

The orchestrator queues learning events and forwards them to Intelligence agents asynchronously. This keeps the main request path fast while intelligence data accumulates in the background.

## How It Uses CuratorAgent Before Modifications

Before any code or data modification:

1. Call `CuratorAgent.validateChange(change)` — is this change safe?
2. If allowed: call `CuratorAgent.createCheckpoint(id, description, files, phase)`
3. Proceed with the modification
4. After modification: call `runHealthCheck()` to verify
5. If health check passes: mark checkpoint as `stable`
6. If health check fails: call `RecoveryAgent.restore(checkpointId)`

## How It Uses HealthCheckAgent After Modifications

After any modification:

1. Call `HealthCheckAgent.runChecks(routesToCheck)`
2. Evaluate the `overall` status
3. If `healthy` or `degraded`: proceed, log health report
4. If `unhealthy`: trigger recovery via `RecoveryAgent.restore(lastCheckpointId)`

## How It Uses RecoveryAgent If Something Breaks

1. Orchestrator detects failure (health check fail, runtime error, user report)
2. Identify the last stable checkpoint from CuratorAgent
3. Call `RecoveryAgent.restore(checkpointId)`
4. RecoveryAgent reverts all files touched since that checkpoint
5. Orchestrator logs the recovery report and alerts the user
