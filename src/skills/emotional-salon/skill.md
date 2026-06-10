# Emotional Salon Master Skill

## Purpose
The **Emotional Salon Master Skill** is the central coordination layer for the salon platform. It orchestrates system agents, section agents, safety checks, and intelligence flows to ensure the platform runs smoothly, compliantly, and intelligently.

## System Role
- Acts as the top-level routing layer for all section operations (Home, Messages, Campaigns, Intelligence)
- Coordinates **system agents** (AgentRegistry, AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent)
- Routes tasks to **section agents** (Home, Messages, Campaigns) once they are created
- Enforces **Meta / WhatsApp compliance** before any customer-facing action
- Feeds **learning data** to the Intelligence section for profiling and trends
- Maintains **checkpoint-based safety**: every modification goes through CuratorAgent → changes → HealthCheckAgent → checkpoint

## Main Sections

| Section | Status | Agents |
|---------|--------|--------|
| **System** | ✅ Created | AgentRegistry, AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent |
| **Home** | ⏳ Planned | HomeOrchestratorAgent, HomeInspectorAgent, HomeDataSourceAgent, HomeHealthCheckAgent, HomeLearningAgent |
| **Messages** | ⏳ Planned | ReceptionOrchestratorAgent, ConversationInspectorAgent, IntentDetectionAgent, DraftResponseAgent, MetaReplyGuardAgent, ConversationMemoryAgent |
| **Campaigns** | ⏳ Planned | CampaignOrchestratorAgent, AudienceAgent, TemplateValidationAgent, CampaignComplianceAgent, DeliveryMonitorAgent, CampaignLearningAgent |
| **Intelligence** | ⏳ Planned | IntelligenceOrchestratorAgent, ClientProfileAgent, PreferenceMiningAgent, OpportunityDetectionAgent, SalonTrendsAgent |

## Safety Rules

1. **Checkpoint before change** — Every modification to business logic must be preceded by a CuratorAgent checkpoint.
2. **Health check after change** — Every modification must be followed by a HealthCheckAgent verification.
3. **Recovery on failure** — If a change breaks the platform, RecoveryAgent restores the last stable checkpoint.
4. **No direct data mutation** — All data writes go through validated agents, never directly.
5. **Rollback always possible** — Every checkpoint preserves enough state to revert.

## Meta / WhatsApp Compliance Principles

- **Opt-in required** — Never message a customer without explicit opt-in consent
- **24-hour window** — Only reply within the 24-hour customer-initiated window without approved templates
- **Template approval** — Outbound campaigns use only Meta-approved message templates
- **Consent Guard** — CampaignComplianceAgent verifies opt-in before any broadcast
- **MetaReplyGuard** — Auto-replies are gated by safety checks (content, recipient, timing)
- **Rate limiting** — Outbound messages are throttled to avoid Meta spam flags

## Agent Coordination Strategy

```
EmotionalSalonOrchestrator
├── routeSection("home")       → delegates to HomeOrchestratorAgent
├── routeSection("messages")   → delegates to ReceptionOrchestratorAgent
├── routeSection("campaigns")  → delegates to CampaignOrchestratorAgent
├── sendLearningEvent(event)   → feeds Intelligence agents
├── runHealthCheck()           → calls HealthCheckAgent
├── inspectSection(name)       → calls AgentInspector
└── validateMetaCompliance()   → checks compliance before outbound actions
```

## Data Flow to Intelligence

1. **HomeLearningAgent** extracts client engagement patterns from Home
2. **ConversationMemoryAgent** extracts intents, preferences, and pain points from chats
3. **CampaignLearningAgent** extracts campaign performance and audience response
4. All learning data is routed through `sendLearningEvent()` → Intelligence agents
5. **IntelligenceOrchestratorAgent** consolidates into client profiles, trends, and opportunities

## Future Extension Plan

- **Phase 2** — Create Home section agents and connect them to the orchestrator
- **Phase 3** — Create Messages / Reception agents and connect them to the orchestrator
- **Phase 4** — Create Campaign agents and connect them to the orchestrator
- **Phase 5** — Create Intelligence agents and close the learning loop
- **Phase 6** — Connect the orchestrator to the UI (sidebar, dashboard widgets, admin panel)
- **Phase 7** — AI Usage Metering, Multi-tenant support, advanced analytics

## Dependencies

- `src/agents/system/*` — System agents (already created)
- `src/agents/home/*` — Home agents (planned, Phase 2)
- `src/agents/messages/*` — Messages agents (planned, Phase 3)
- `src/agents/campaigns/*` — Campaign agents (planned, Phase 4)
- `src/agents/intelligence/*` — Intelligence agents (planned, Phase 5)
