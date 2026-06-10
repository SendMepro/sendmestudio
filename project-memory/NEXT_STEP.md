# Next Step: Agent Governance / SystemSupervisorAgent Audit

All UI extraction phases are **complete**. The next work is **Agent Governance** — auditing the agent ecosystem before creating new section agents.

## ✅ Completed Phases

| Phase | Status | Summary |
|-------|--------|---------|
| **Home (E/F/G)** | ✅ COMPLETE | 16 components, 7 agents, 5 repositories, 106 tests, full intelligence pipeline |
| **Inbox (H-1..H-5)** | ✅ COMPLETE | 19 checkpoints, 21 new files, page.tsx 2,617→1,516 lines (−42%) |
| **Brain Admin (BA)** | ✅ COMPLETE | 19 new files, page.tsx 1,716→861 lines (−50%) |
| **Knowledge (CP-94)** | ✅ COMPLETE | 12 new files, page.tsx 718→135 lines (−81%) |
| **Campaigns** | ✅ COMPLETE | Hooks integrated, verified passing |
| **Clients/Muses** | ✅ REMOVED | Sidebar entry removed, route deprecated, Contacts drawer is replacement |
| **Docs Relocation** | ✅ COMPLETE | 54 root .md files moved to docs/ subfolders |
| **Build Fix** | ✅ COMPLETE | TS errors resolved, build passes (tsc --noEmit: 0 errors) |

## 🔜 Next: Agent Governance Audit

Based on the AGENT_INVENTORY.md report, the priority is:

### 1. Audit the Agent Ecosystem
- No runtime supervision exists — `EmotionalSalonOrchestrator` is a skeleton
- 17 agents are `planned` (zero code) for Messages, Campaigns, Intelligence sections
- `IntelligenceRepository.ts` documented but missing
- Home agents are partially connected (7 exist, but 4 are skeletons, orchestrator flag = OFF)
- No agent supervises other agents at runtime

### 2. SystemSupervisorAgent Design
- Define supervision contracts (health pings, failure detection, restart policies)
- Design the SupervisorAgent class that calls AgentInspector, CuratorAgent, RecoveryAgent, HealthCheckAgent
- Plan the message flow: SupervisorAgent → AgentInspector → SectionAgents → Repositories → UI

### 3. Then: Create Missing Section Agents
- Messages agents (6 planned)
- Campaigns agents (6 planned)
- Intelligence section agents (5 planned)
- Missing repositories (IntelligenceRepository, ConversationRepository, CampaignRepository)

## NOT Inbox Extraction

Phase H-1 through H-5 are **already done**. Inbox extraction is complete. Do not restart it.
