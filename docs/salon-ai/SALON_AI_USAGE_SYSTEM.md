# SALON_AI_USAGE_SYSTEM

## 1. Objective

`Salon Intelligence` is the premium abstraction layer for all AI monetization inside SendMe Studio.

The salon owner must never see:

- tokens
- model names
- API costs
- technical infrastructure terms

Everything is translated into one premium business concept:

`Salon Intelligence Credits`

This makes AI feel like a luxury operating layer for the salon, not like a developer billing panel.

---

## 2. Core Pricing Logic

Each salon account operates with a hybrid monetization model:

### Base subscription

Every salon has:

- a monthly plan
- included Salon Intelligence Credits
- renewal date
- usage cycle

### Extra capacity

In addition to the monthly plan, the salon can purchase:

- extra credit packs
- usage extensions for high-demand months
- future premium add-ons by module

### Hybrid logic

The system supports:

- recurring monthly revenue through plan subscription
- variable usage expansion through extra packs
- plan upgrades for high-consumption salons

---

## 3. Credit Architecture

Each salon should have:

- `plan_id`
- `billing_cycle_start`
- `billing_cycle_end`
- `included_credits`
- `extra_credits_purchased`
- `rollover_credits`
- `credits_used`
- `credits_remaining`
- `projected_monthly_usage`
- `renewal_date`
- `usage_status`

### Effective credit balance

Recommended calculation:

`available_credits = included_credits + extra_credits_purchased + rollover_credits - credits_used`

### Usage status bands

- `Healthy`: 0% to 59%
- `Attention`: 60% to 79%
- `High usage`: 80% to 94%
- `Critical`: 95% to 100%
- `Overage`: above included balance when allowed

---

## 4. Usage Flow

Every AI action should:

1. identify salon
2. identify action type
3. calculate credit cost
4. register usage event
5. decrement available balance
6. update current cycle totals
7. update projected monthly usage
8. evaluate alert rules

### Usage event structure

Recommended event fields:

- `salon_id`
- `action_type`
- `credits_consumed`
- `source_module`
- `user_id`
- `client_id` optional
- `campaign_id` optional
- `reservation_id` optional
- `timestamp`
- `business_outcome` optional

---

## 5. AI Action Consumption Mapping

The platform should map salon-visible actions to internal credit costs.

Example baseline mapping:

- AI WhatsApp replies: `1 credit`
- AI concierge suggestions: `3 credits`
- Emotional analysis: `6 credits`
- Client intelligence analysis: `8 credits`
- AI recommendations bundle: `10 credits`
- AI reports: `24 credits`
- Campaign generation: `45 credits`
- Premium campaign regeneration / rewrite: `18 credits`
- Content generation asset set: `12 credits`

These values should remain configurable in product logic and not hardcoded into the UI.

---

## 6. UI Metric Definitions

The UI should expose elegant business language only.

### Usage Overview

- `Salon Intelligence Usage`
  Total credits consumed in the active monthly cycle.

- `Remaining Intelligence Capacity`
  Remaining credits available for the salon before renewal.

- `Projected Monthly Usage`
  Estimated total credits that will be consumed before cycle close.

- `AI Activity Today`
  Total AI-assisted actions performed today.

### AI Impact KPIs

- `AI Revenue Impact`
  Revenue influenced by AI-assisted actions, campaigns, concierge or recovery flows.

- `Repurchase Opportunities Generated`
  Number of actionable return opportunities surfaced by the intelligence system.

- `WhatsApp Conversations Assisted`
  Number of salon conversations enhanced by AI concierge assistance.

- `Campaigns Generated`
  Number of AI-generated campaign assets or launch packages.

- `AI Concierge Actions`
  Suggestions, nudges, follow-ups and assisted decision moments executed by the system.

---

## 7. Renewal Logic

Each salon plan renews monthly.

At renewal:

1. previous cycle is closed
2. included credits for the new cycle are loaded
3. rollover logic is applied if enabled
4. expired promotional or temporary credits are removed if necessary
5. usage counters reset for the new cycle
6. projections restart from new-cycle activity

### Renewal fields

- `renewal_date`
- `current_cycle_start`
- `current_cycle_end`
- `previous_cycle_used`
- `new_cycle_included_credits`

---

## 8. Overage Logic

The system should support multiple monetization policies.

### Option A: Hard stop

When credits reach zero:

- premium AI actions pause
- non-AI product access remains active
- the salon sees a premium upgrade / pack suggestion

### Option B: Soft overage

When credits reach zero:

- AI actions continue
- overage usage is recorded
- overage is billed at cycle close

### Option C: Auto-pack expansion

When a threshold is reached:

- a predefined extra credit pack is applied
- billing is queued automatically or suggested to the salon owner

Recommended initial product strategy:

- start with alerting + manual extra pack purchase
- add automatic pack expansion later

---

## 9. Rollover Logic

The system should be prepared for accumulation logic.

### Possible modes

- `No rollover`
  Unused included credits expire at cycle close.

- `Partial rollover`
  A limited percentage of unused credits moves into the next cycle.

- `Tier-based rollover`
  Higher plans retain more unused credits.

- `Pack rollover`
  Extra purchased credit packs can remain active longer than included plan credits.

### Recommendation

Support these fields from the beginning:

- `rollover_enabled`
- `rollover_cap`
- `rollover_expiration_date`
- `rollover_source_type`

Even if the first live version does not yet expose rollover in the UI.

---

## 10. Alerts Logic

The system should generate elegant salon-facing alerts such as:

- `Your AI usage is reaching 80%`
- `2 campaigns generated high engagement`
- `Upgrade recommended for high-usage salons`
- `Remaining intelligence capacity may be insufficient for next week’s campaign schedule`

### Alert triggers should consider

- percent used
- acceleration of daily usage
- campaign-heavy periods
- high WhatsApp assistance volume
- projected overage before renewal

---

## 11. Future Billing Flow

The architecture should be ready for Stripe or equivalent billing orchestration.

### Future flow

1. salon subscribes to monthly plan
2. system assigns included credits
3. AI usage events decrement balance
4. threshold alerts trigger
5. salon purchases extra pack or upgrades plan
6. cycle closes
7. usage summary is archived for analytics and billing reconciliation

### Billing entities to prepare

- `subscription_plan`
- `credit_wallet`
- `usage_event`
- `credit_pack_purchase`
- `billing_invoice_reference`
- `renewal_event`
- `usage_alert`

---

## 12. Enterprise Scaling Considerations

The system should scale beyond one salon.

### Multi-location groups

Enterprise accounts may need:

- shared credit pools
- per-location budgets
- location-level usage tracking
- global AI impact dashboards

### Role-based visibility

Different stakeholders may need different views:

- owner
- general manager
- front desk lead
- marketing lead
- finance/admin

### Operational resilience

The system should support:

- eventual consistency in usage tracking
- auditability of credit consumption
- replay-safe billing events
- configurable action pricing by plan or geography

---

## 13. Product Positioning

This feature is not “AI billing”.

It is:

`The Intelligence Capacity Layer of the Luxury Salon Operating System`

That means the salon experiences:

- clarity
- elegance
- predictability
- growth visibility
- premium operational confidence

Not:

- developer metrics
- token anxiety
- raw API accounting
- technical SaaS friction
