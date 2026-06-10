# DOCS ROOT CLEANUP AUDIT

**Date:** 2026-05-30T22:43 UTC  
**Status:** ✅ Audit Complete (no files moved/modified)  

---

## 1. Root .md File Inventory

**Total files:** 59 `.md` files in project root  
**Referenced from `src/`, `project-memory/`, `docs/`, or `package.json`:** **0** (none)

All 59 files are completely **orphaned** — no code, no documentation index, no configuration file references them. They exist only as standalone documents.

---

## 2. Classification

### 🟢 KEEP_ROOT (files that logically belong in root)

| File | Rationale |
|------|-----------|
| `AGENTS.md` | Project-wide agent instructions. Referenced by `CLAUDE.md` inline `@AGENTS.md`. |
| `CLAUDE.md` | Agent configuration file. Analogous to `.cursorrules` / `.clinerules`. |
| `CONTEXT.md` | Project context / README-alternative. Top-level project doc. |
| `README.md` | Standard root README (Next.js boilerplate + project info). |
| `DESIGN.md` | Design system reference (may be consumed by agents/IDEs). |

**5 files — KEEP_ROOT**

---

### 🟡 MOVE_SAFE (reports that can be safely moved — no references to update)

These are historical code-change reports that were placed at root instead of `project-memory/`. No code references them. Move to `docs/reports/`.

| File | Category | Suggested folder |
|------|----------|-----------------|
| `AI_BADGE_COMPONENT_REPORT.md` | Component report | `docs/reports/` |
| `AI_KPI_SECTION_OVERFLOW_FIX_REPORT.md` | Fix report | `docs/reports/` |
| `AI_PRIORITY_MODULE_SIMPLIFICATION.md` | Refactor report | `docs/reports/` |
| `ATELIER_INTELLIGENCE_SCROLL_FIX_REPORT.md` | Fix report | `docs/reports/` |
| `ATELIER_OPERATIONAL_FLOW_RESTRUCTURE.md` | Restructure report | `docs/reports/` |
| `CAMPAIGNS_REFINEMENT_REPORT.md` | Campaign report | `docs/reports/` |
| `CLOUDFLARE_WHATSAPP_WEBHOOK_SETUP.md` | Setup guide | `docs/reports/` |
| `DESIGN_SYSTEM_RESPONSIVE_QA.md` | QA rules | `docs/reports/` |
| `EDITORIAL_SCROLL_COLLISION_FIX_REPORT.md` | Fix report | `docs/reports/` |
| `EDITORIAL_SYSTEM_INTEGRATION_REPORT.md` | Integration report | `docs/reports/` |
| `FRONT_DESIGN_AUDIT_SYSTEM.md` | Audit report | `docs/reports/` |
| `GLOBAL_SPACING_AND_OVERFLOW_AUDIT.md` | QA report | `docs/reports/` |
| `HOME_LIGHT_GLASS_REFINEMENT_REPORT.md` | Home report | `docs/reports/` |
| `HOME_LUXURY_SALON_DASHBOARD_REPORT.md` | Home report | `docs/reports/` |
| `INBOX_COMPOSER_SPACE_OPTIMIZATION_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_CONTEXT_MATCH_ANIMATION_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_CONVERSATION_FLOW_ANIMATION_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_FUNCTIONALITY_FIX_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_LIGHT_GLASS_REFERENCE_MATCH.md` | Inbox report | `docs/reports/` |
| `INBOX_MEDIA_ALBUM_PREVIEW_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_RESIZABLE_COMPOSER_REPORT.md` | Inbox report | `docs/reports/` |
| `INBOX_SELECTED_RESOURCE_COMPOSER_FIX.md` | Inbox report | `docs/reports/` |
| `INBOX_SWIPE_REPLY_INTERACTION_REPORT.md` | Inbox report | `docs/reports/` |
| `LAYOUT_QA_REPORT.md` | QA report | `docs/reports/` |
| `META_TEMPLATE_WORKFLOW_REPORT.md` | Campaign report | `docs/reports/` |
| `SALON_INTELLIGENCE_ROUTE_FIX_REPORT.md` | Fix report | `docs/reports/` |
| `SALON_INTELLIGENCE_STRUCTURE_FIX_REPORT.md` | Fix report | `docs/reports/` |
| `SALON_TERMINOLOGY_MIGRATION_REPORT.md` | Migration report | `docs/reports/` |
| `SENDMESTUDIO_DESIGN_AUDIT_REPORT.md` | Design audit | `docs/reports/` |
| `SHARED_SIDEBAR_NAVIGATION_REPORT.md` | Sidebar report | `docs/reports/` |
| `SIDEBAR_EXPAND_STATE_FIX_REPORT.md` | Sidebar report | `docs/reports/` |
| `SIDEBAR_HOME_NAV_FIX_REPORT.md` | Sidebar report | `docs/reports/` |
| `SIDEBAR_REFINEMENT_REPORT.md` | Sidebar report | `docs/reports/` |
| `SIDEBAR_UNREAD_BADGE_REPORT.md` | Sidebar report | `docs/reports/` |
| `WHATSAPP_CLOUD_API_INTEGRATION_REPORT.md` | Integration report | `docs/reports/` |

**35 files — MOVE_SAFE**

---

### 🔵 MOVE_UPDATE_REFERENCES (files with potential cross-references or that may be referenced by agents)

These are system/prompt/design documents that may be consumed by AI agents or be referenced from other files. Check for any `@` references or agent instructions before moving.

| File | Category | Suggested folder | Notes |
|------|----------|-----------------|-------|
| `00_SYSTEM_PROMPT_MASTER.md` | System prompt | `docs/prompts/` | Numbered system prompt — may be referenced by agents |
| `01_ANALYTICS_SYSTEM_PROMPT.md` | System prompt | `docs/prompts/` | — |
| `02_LIQUID_GLASS_DIRECTION.md` | Design direction | `docs/design/` | — |
| `03_AGENT_ECOSYSTEM_REBUILD.md` | Agent architecture | `docs/salon-ai/` | — |
| `04_COORDINADOR_LOGICO.md` | Logic coordinator | `docs/salon-ai/` | — |
| `05_UI_UX_DIRECTOR_AGENT.md` | Agent prompt | `docs/prompts/` | — |
| `06_ANALYTICS_LAYOUT_RULES.md` | Layout rules | `docs/design/` | — |
| `Manual_Editorial_Luxury.md` | Editorial guide | `docs/editorial/` | — |
| `MASTER_VISUAL_IDENTITY.md` | Visual identity | `docs/design/` | — |
| `SALON_AI_USAGE_SYSTEM.md` | AI system | `docs/salon-ai/` | — |
| `SALON_BUSINESS_INTELLIGENCE_FLOW.md` | Business flow | `docs/salon-ai/` | — |
| `SALON_INTELLIGENCE_SYSTEM.md` | AI system | `docs/salon-ai/` | — |
| `SENDMESTUDIO_CREATIVE_DIRECTION_SYSTEM.md` | Creative direction | `docs/design/` | — |
| `SENDMESTUDIO_DESIGN.md` | Design reference | `docs/design/` | — |
| `SENDMESTUDIO_SUPER_BRAIN_v2.md` | Agent architecture | `docs/salon-ai/` | — |
| `SENDMESTUDIO_UI_PROMPT_MASTER.md` | UI prompt master | `docs/prompts/` | — |
| `STUDIO_PULSE_SYSTEM.md` | System doc | `docs/salon-ai/` | — |
| `SUPER_BRAIN_BY_QWEEN.md` | Agent architecture | `docs/salon-ai/` | — |
| `VISUAL_HIERARCHY_SYSTEM.md` | Design rules | `docs/design/` | — |

**19 files — MOVE_UPDATE_REFERENCES**

---

## 3. Proposed Folder Structure

| Folder | Purpose |
|--------|---------|
| `docs/reports/` | Historical code-change / fix / migration reports (35 files) |
| `docs/prompts/` | System prompts for AI agents (4 files) |
| `docs/design/` | Design system, visual identity, layout rules (6 files) |
| `docs/salon-ai/` | AI architecture, super-brain, intelligence system docs (7 files) |
| `docs/editorial/` | Editorial content guides (1 file) |
| Root `./` | Keep only: `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `DESIGN.md`, `README.md` |

---

## 4. Migration Table

| # | File | Current path | Proposed path | References | Action |
|---|------|-------------|---------------|------------|--------|
| 1 | `AGENTS.md` | `./AGENTS.md` | `./AGENTS.md` | None found | 🟢 KEEP_ROOT |
| 2 | `CLAUDE.md` | `./CLAUDE.md` | `./CLAUDE.md` | None found | 🟢 KEEP_ROOT |
| 3 | `CONTEXT.md` | `./CONTEXT.md` | `./CONTEXT.md` | None found | 🟢 KEEP_ROOT |
| 4 | `DESIGN.md` | `./DESIGN.md` | `./DESIGN.md` | None found | 🟢 KEEP_ROOT |
| 5 | `README.md` | `./README.md` | `./README.md` | None found | 🟢 KEEP_ROOT |
| 6 | `AI_BADGE_COMPONENT_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 7 | `AI_KPI_SECTION_OVERFLOW_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 8 | `AI_PRIORITY_MODULE_SIMPLIFICATION.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 9 | `ATELIER_INTELLIGENCE_SCROLL_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 10 | `ATELIER_OPERATIONAL_FLOW_RESTRUCTURE.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 11 | `CAMPAIGNS_REFINEMENT_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 12 | `CLOUDFLARE_WHATSAPP_WEBHOOK_SETUP.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 13 | `DESIGN_SYSTEM_RESPONSIVE_QA.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 14 | `EDITORIAL_SCROLL_COLLISION_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 15 | `EDITORIAL_SYSTEM_INTEGRATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 16 | `FRONT_DESIGN_AUDIT_SYSTEM.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 17 | `GLOBAL_SPACING_AND_OVERFLOW_AUDIT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 18 | `HOME_LIGHT_GLASS_REFINEMENT_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 19 | `HOME_LUXURY_SALON_DASHBOARD_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 20 | `INBOX_COMPOSER_SPACE_OPTIMIZATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 21 | `INBOX_CONTEXT_MATCH_ANIMATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 22 | `INBOX_CONVERSATION_FLOW_ANIMATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 23 | `INBOX_FUNCTIONALITY_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 24 | `INBOX_LIGHT_GLASS_REFERENCE_MATCH.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 25 | `INBOX_MEDIA_ALBUM_PREVIEW_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 26 | `INBOX_RESIZABLE_COMPOSER_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 27 | `INBOX_SELECTED_RESOURCE_COMPOSER_FIX.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 28 | `INBOX_SWIPE_REPLY_INTERACTION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 29 | `LAYOUT_QA_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 30 | `META_TEMPLATE_WORKFLOW_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 31 | `SALON_INTELLIGENCE_ROUTE_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 32 | `SALON_INTELLIGENCE_STRUCTURE_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 33 | `SALON_TERMINOLOGY_MIGRATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 34 | `SENDMESTUDIO_DESIGN_AUDIT_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 35 | `SHARED_SIDEBAR_NAVIGATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 36 | `SIDEBAR_EXPAND_STATE_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 37 | `SIDEBAR_HOME_NAV_FIX_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 38 | `SIDEBAR_REFINEMENT_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 39 | `SIDEBAR_UNREAD_BADGE_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 40 | `WHATSAPP_CLOUD_API_INTEGRATION_REPORT.md` | root | `docs/reports/` | None | 🟡 MOVE_SAFE |
| 41 | `00_SYSTEM_PROMPT_MASTER.md` | root | `docs/prompts/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 42 | `01_ANALYTICS_SYSTEM_PROMPT.md` | root | `docs/prompts/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 43 | `05_UI_UX_DIRECTOR_AGENT.md` | root | `docs/prompts/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 44 | `SENDMESTUDIO_UI_PROMPT_MASTER.md` | root | `docs/prompts/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 45 | `02_LIQUID_GLASS_DIRECTION.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 46 | `06_ANALYTICS_LAYOUT_RULES.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 47 | `MASTER_VISUAL_IDENTITY.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 48 | `SENDMESTUDIO_CREATIVE_DIRECTION_SYSTEM.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 49 | `SENDMESTUDIO_DESIGN.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 50 | `VISUAL_HIERARCHY_SYSTEM.md` | root | `docs/design/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 51 | `03_AGENT_ECOSYSTEM_REBUILD.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 52 | `04_COORDINADOR_LOGICO.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 53 | `SALON_AI_USAGE_SYSTEM.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 54 | `SALON_BUSINESS_INTELLIGENCE_FLOW.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 55 | `SALON_INTELLIGENCE_SYSTEM.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 56 | `SENDMESTUDIO_SUPER_BRAIN_v2.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 57 | `STUDIO_PULSE_SYSTEM.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 58 | `SUPER_BRAIN_BY_QWEEN.md` | root | `docs/salon-ai/` | None | 🔵 MOVE_UPDATE_REFERENCES |
| 59 | `Manual_Editorial_Luxury.md` | root | `docs/editorial/` | None | 🔵 MOVE_UPDATE_REFERENCES |

---

## 5. Rollback Plan

If anything goes wrong after moving files:

```bash
# Phase 1: Restore MOVE_SAFE files (reports)
git checkout HEAD -- *.md
# OR manually:
mv docs/reports/AI_BADGE_COMPONENT_REPORT.md ./
mv docs/reports/AI_KPI_SECTION_OVERFLOW_FIX_REPORT.md ./
# ... repeat for all 35 MOVE_SAFE files
# (Each move is reversible since no references exist)

# Phase 2: Restore MOVE_UPDATE_REFERENCES files
mv docs/prompts/00_SYSTEM_PROMPT_MASTER.md ./
mv docs/prompts/01_ANALYTICS_SYSTEM_PROMPT.md ./
# ... repeat for 19 MOVE_UPDATE_REFERENCES files

# Phase 3: Verify with git diff
git diff --stat  # Should show only deleted root files and new docs/ files
```

### Recovery branches:
```bash
git stash  # If you want to undo everything immediately
git checkout -b cleanup-safe-rollback
git revert HEAD~#  # Where # is the number of commits made during cleanup
```

---

## 6. Summary

| Category | Count | Action |
|----------|-------|--------|
| 🟢 KEEP_ROOT | 5 | Keep in project root |
| 🟡 MOVE_SAFE | 35 | Move to `docs/reports/` — no reference updates needed |
| 🔵 MOVE_UPDATE_REFERENCES | 19 | Move to `docs/{prompts,design,salon-ai,editorial}/` — verify agent references first |
| **Total** | **59** | |

**Key finding:** Zero root `.md` files are referenced by `src/`, `project-memory/`, `docs/`, or `package.json`. The cleanup carries **no risk of broken code references**. The only risk is if AI agents are instructed to read specific file paths — check `AGENTS.md` and `CLAUDE.md` for any hardcoded paths before moving the 19 docs.
