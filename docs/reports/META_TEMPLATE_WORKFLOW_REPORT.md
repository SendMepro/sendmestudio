# Meta Template Workflow Report

## Files Changed

- `src/app/campaigns/page.tsx`
- `src/app/campaigns/campaigns.module.css`
- `src/app/campaigns/templateWorkflow.ts`

## Workflow Added

- Campaign narratives now use reusable external template objects.
- Each template contains:
  - `id`
  - `title`
  - `category`
  - `body`
  - `targetAudience`
  - `metaStatus`
  - `metaTemplateName`
  - `language`
  - `variables`
  - `createdAt`
  - `updatedAt`

## Functions Added

- `loadCampaignTemplates()`
- `saveCampaignTemplate(template)`
- `submitTemplateToMeta(template)`
- `updateMetaTemplateStatus(templateId, status)`

## UI Behavior

- Left column shows only real templates/campaigns.
- If no templates exist, the UI shows `Crear nueva narrativa`.
- Added Meta status badges:
  - Draft
  - Pending Meta
  - Approved
  - Rejected
  - Scheduled
  - Sent
- Added `Submit to Meta`, `Mock approve`, and `Mock reject` actions.
- Added warning: `Outbound WhatsApp campaigns require Meta-approved templates.`
- `Launch` is disabled unless `metaStatus === "approved"`.
- Rejected templates show rejection reason and remain editable.

## Notes

- Meta integration is mocked but ready for a later API connection.
- Templates are persisted locally for now and can be swapped for real backend storage later.
