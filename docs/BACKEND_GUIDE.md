# Backend Guide — Nomba Recur Subscriptions Engine

This document tells backend developers exactly what the frontend expects: the
**data shapes**, the **database tables**, the **forms** that submit data, and the
**API endpoints** (with request/response payloads) needed to replace the
in-memory mock with a real service.

The frontend talks to a single layer — `lib/store`. Today that layer holds data
in memory; your job is to make each action in `lib/store/StoreProvider.tsx` call
a real endpoint instead. The shapes below are the contract.

- **All money is in kobo** (integer). 1 NGN = 100 kobo. `250000` = ₦2,500.
- **All timestamps are ISO 8601 strings** (`2026-06-26T12:00:00.000Z`).
- **Everything is scoped to a tenant** (`account_id`, like `acct_*`). Each
  request is authenticated as one account; never return another account's rows.

---

## 1. Database tables

11 tables. The TypeScript source of truth is [`lib/types.ts`](../lib/types.ts).

### 1.1 `accounts` (tenants)
The merchant using the engine. Everything below has an `account_id` FK (omitted
from each table for brevity).

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `acct_…` |
| name | string | |
| api_key_hash | string | for authenticating API calls |
| created_at | timestamp | |

### 1.2 `billing_cycles`
Reusable cadences a plan can bill on.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `cyc_…` |
| label | string | e.g. "Quarterly" |
| interval | enum | `monthly` \| `annual` \| `custom` |
| interval_count | int | for `custom`, e.g. 3 |
| interval_unit | enum | `day` \| `week` \| `month` |
| built_in | boolean | built-ins can't be deleted |

Delete rule: reject if `built_in = true` **or** any plan references the cycle.

### 1.3 `plans`
What a customer subscribes to.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `plan_…` |
| name | string | |
| description | string | |
| amount | int (kobo) | per interval, or per seat/unit |
| currency | string | `NGN` |
| cycle_id | FK → billing_cycles | |
| interval / interval_count / interval_unit | | denormalised from the cycle |
| pricing_model | enum | `flat` \| `per_seat` \| `usage` |
| proration_enabled | boolean | |
| trial_days | int | 0 = no trial |
| status | enum | `active` \| `archived` |
| features | string[] | bullet list (jsonb or join table) |
| created_at | timestamp | |

Delete rule: reject if any subscription references the plan (archive instead).

### 1.4 `customers`
Who pays.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `cus_…` |
| name | string | |
| email | string | |
| phone | string? | |
| created_at | timestamp | |

### 1.5 `cards` (tokenised)
One default card per customer in the UI (model as 1-many if you support more).
**Never store the PAN** — only the Nomba token + display metadata.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id / token | string | Nomba tokenised-card reference (`tok_…`) |
| customer_id | FK → customers | |
| brand | enum | `Visa` \| `Mastercard` \| `Verve` |
| last4 | string | |
| exp_month | int | |
| exp_year | int | |

### 1.6 `subscriptions`
One customer's ongoing agreement to a plan.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `sub_…` |
| customer_id | FK → customers | |
| plan_id | FK → plans | |
| status | enum | `incomplete` \| `trialing` \| `active` \| `past_due` \| `paused` \| `unpaid` \| `canceled` |
| quantity | int | seats (for `per_seat`) |
| current_period_start | timestamp | |
| current_period_end | timestamp | the billing clock fires here |
| cancel_at_period_end | boolean | |
| trial_end | timestamp? | |
| created_at | timestamp | |

Status is a **state machine** — see [§4](#4-subscription-state-machine). Only
move along declared edges.

### 1.7 `invoices`
A bill generated each cycle (and for proration).

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `in_…` |
| subscription_id | FK | |
| customer_id | FK | |
| amount | int (kobo) | |
| status | enum | `paid` \| `open` \| `uncollectible` \| `void` |
| period_start / period_end | timestamp | |
| attempt_count | int | charge attempts so far |
| description | string | |
| created | timestamp | |

### 1.8 `dunning_cases`
A failed invoice in recovery (1 per failing invoice).

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `dun_…` |
| invoice_id / subscription_id / customer_id | FK | |
| amount | int (kobo) | |
| attempt | int | attempts made |
| max_attempts | int | snapshot of settings at creation |
| last_attempt_at | timestamp | |
| next_retry_at | timestamp? | null when resolved/exhausted |
| last_error | string | `insufficient_funds`, `expired_card`, … |
| status | enum | `retrying` \| `recovered` \| `exhausted` |

### 1.9 `dunning_settings` (one row per account)
Policy that governs failed-payment handling.

| Column | Type | Notes |
| ------ | ---- | ----- |
| max_retries | int | attempts before the exhausted action |
| retry_strategy | enum | `smart` \| `fixed` \| `exponential` |
| retry_interval_days | int | base gap for fixed/exponential |
| grace_period_days | int | keep access this long after 1st failure |
| exhausted_action | enum | `mark_unpaid` \| `cancel` \| `downgrade_free` |
| pause_access_during_dunning | boolean | soft vs hard dunning |
| email_on_failure | boolean | |
| retry_on_card_update | boolean | retry immediately on `card_updated` |

### 1.10 `webhook_endpoints`
Where the engine POSTs events.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `we_…` |
| url | string | |
| events | string[] | subscribed topics, supports `*` (e.g. `invoice.*`) |
| status | enum | `enabled` \| `disabled` |
| created_at | timestamp | |

### 1.11 `webhook_events`
The event log / delivery records.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | string PK | `evt_…` |
| type | string | e.g. `invoice.payment_failed` |
| object | string | related object id |
| summary | string | human-readable |
| status | enum | `delivered` \| `failed` \| `pending` |
| created | timestamp | |

---

## 2. API endpoints

REST, JSON, all under `/v1`, authenticated per account. Use **idempotency keys**
on every POST that creates money movement (create subscription, change plan,
retry). Each maps to a function in `lib/store/StoreProvider.tsx`.

### Plans
| Method & path | Frontend action | Body |
| ------------- | --------------- | ---- |
| `GET /plans` | initial load | — |
| `POST /plans` | `addPlan` | PlanInput (below) |
| `PATCH /plans/:id` | `updatePlan` | PlanInput |
| `POST /plans/:id/archive` | `archivePlan` | — |
| `POST /plans/:id/unarchive` | `unarchivePlan` | — |
| `DELETE /plans/:id` | `deletePlan` | — → `409` if subscriptions exist |

```jsonc
// PlanInput (POST/PATCH /plans)
{
  "name": "Pro Monthly",
  "description": "For growing teams",
  "amount": 450000,                 // kobo
  "cycleId": "cyc_monthly",
  "interval": "monthly",            // denormalised from the cycle
  "intervalCount": 1,
  "intervalUnit": "month",
  "pricingModel": "per_seat",       // flat | per_seat | usage
  "prorationEnabled": true,
  "trialDays": 14,
  "features": ["Unlimited subscribers", "Priority support"]
}
```

### Billing cycles
| Method & path | Frontend action |
| ------------- | --------------- |
| `GET /billing-cycles` | initial load |
| `POST /billing-cycles` | `addCycle` → `{ label, interval, intervalCount, intervalUnit }` |
| `DELETE /billing-cycles/:id` | `deleteCycle` → `409` if built-in or in use |

### Customers & cards
| Method & path | Frontend action | Body |
| ------------- | --------------- | ---- |
| `GET /customers` | list | — |
| `GET /customers/:id` | detail | — |
| `POST /customers` | `addCustomer` | `{ name, email }` |
| `POST /customers/:id/card` | `updateCard` | tokenisation result from Checkout (returns brand/last4/exp) |

> Card capture happens through **Nomba Checkout / tokenised cards** on the
> client. The backend stores only the returned token + metadata.

### Subscriptions
| Method & path | Frontend action | Body |
| ------------- | --------------- | ---- |
| `GET /subscriptions` | list (supports `?status=`) | — |
| `GET /subscriptions/:id` | detail | — |
| `POST /subscriptions` | `createSubscription` | `{ customerId, planId, quantity, withTrial }` |
| `POST /subscriptions/:id/pause` | `pauseSubscription` | — |
| `POST /subscriptions/:id/resume` | `resumeSubscription` | — |
| `POST /subscriptions/:id/cancel` | `cancelSubscription` | `{ atPeriodEnd: boolean }` |
| `POST /subscriptions/:id/change-plan` | `changePlan` | `{ newPlanId }` → applies proration |
| `GET /subscriptions/:id/change-plan/preview` | proration preview | `?newPlanId=` → returns ProrationResult |

```jsonc
// ProrationResult (preview response)
{
  "daysTotal": 30,
  "daysRemaining": 18,
  "unusedCredit": 270000,   // kobo credited from old plan
  "proratedCharge": 162000, // kobo for new plan remainder
  "netToday": -108000       // negative = customer is credited
}
```

### Invoices
| Method & path | Notes |
| ------------- | ----- |
| `GET /invoices?subscriptionId=` / `?customerId=` | list (used on detail pages & portal) |
| `GET /invoices/:id` | single invoice / receipt |

### Dunning
| Method & path | Frontend action |
| ------------- | --------------- |
| `GET /dunning` | recovery queue |
| `POST /dunning/:id/retry` | `retryDunning` → re-runs Charge; updates case + subscription + invoice |
| `GET /dunning/settings` | load policy |
| `PUT /dunning/settings` | `updateDunningSettings` → DunningSettings (table 1.9) |

### Developers / webhooks
| Method & path | Notes |
| ------------- | ----- |
| `GET /webhook-endpoints` | list |
| `POST /webhook-endpoints` | `{ url, events[] }` |
| `PATCH /webhook-endpoints/:id` | enable/disable, edit events |
| `GET /events` | event log (paginated) |

---

## 3. Forms (UI → endpoint)

Each form in the UI and the endpoint it should submit to:

| Form / dialog | Location | Fields | Submits to |
| ------------- | -------- | ------ | ---------- |
| Create / Edit plan | Plans → "New plan" / "Edit" | name, description, amount, cycleId, pricingModel, trialDays, prorationEnabled, features | `POST /plans` / `PATCH /plans/:id` |
| Billing cycles | Plans → "Billing cycles" | label, interval, intervalCount, intervalUnit (+ delete) | `POST` / `DELETE /billing-cycles` |
| Add customer | Customers → "Add customer" | name, email | `POST /customers` |
| New subscription | Subscriptions → "New subscription" | customerId, planId, quantity, withTrial | `POST /subscriptions` |
| Change plan | Subscription detail & portal | newPlanId (with live proration preview) | preview `GET` then `POST …/change-plan` |
| Cancel subscription | Subscription detail & portal | atPeriodEnd | `POST …/cancel` |
| Update card | Portal | card via Nomba Checkout | `POST /customers/:id/card` |
| Dunning settings | Dunning → "Settings" | the 8 DunningSettings fields | `PUT /dunning/settings` |

---

## 4. Subscription state machine

Implement these transitions and nothing else (source:
[`lib/state-machine.ts`](../lib/state-machine.ts)). Each is triggered by a
billing event, not an ad-hoc write.

```
incomplete ──activate(first charge ok)──▶ active
incomplete ──trial_start────────────────▶ trialing
trialing   ──trial_converted(charge ok)─▶ active
trialing   ──payment_failed─────────────▶ past_due
active     ──payment_failed─────────────▶ past_due
active     ──pause──────────────────────▶ paused
paused     ──resume─────────────────────▶ active
past_due   ──payment_recovered──────────▶ active        (dunning retry succeeds)
past_due   ──dunning_exhausted──────────▶ unpaid        (or cancel / downgrade per settings)
any        ──cancel─────────────────────▶ canceled
```

### Billing clock (the part with no UI)
A scheduled job must, per subscription:
1. At `current_period_end`, create an invoice for the subscription items
   (`amount = plan.amount`, ×`quantity` if `per_seat`).
2. Charge it via the **Nomba Charge API** against the stored card token.
3. On success: mark invoice `paid`, advance `current_period_*`, emit `invoice.paid`.
4. On failure: mark subscription `past_due`, open a `dunning_case`, schedule the
   first retry from `dunning_settings`, emit `invoice.payment_failed`.
5. Run retries on schedule until recovered or `max_retries` reached, then apply
   `exhausted_action`.

---

## 5. Webhook events

Emit on every state change so downstream systems never poll. Topics
(`lib/seed.ts` → `EVENT_CATALOG`):

```
subscription.created      invoice.created
subscription.updated      invoice.paid
subscription.paused       invoice.payment_failed
subscription.resumed      invoice.payment_action_required
subscription.canceled     customer.created
subscription.trial_will_end   customer.card_updated
plan.created              plan.updated
```

Payload shape the frontend already renders:

```jsonc
{
  "id": "evt_abc",
  "type": "invoice.payment_failed",
  "created": "2026-06-26T12:00:00.000Z",
  "delivery": "delivered",            // delivered | failed | pending
  "data": { "object": "in_004", "summary": "Charge declined (expired_card)" }
}
```

Sign each delivery (HMAC over the raw body) and let consumers verify it — same
pattern Recur itself uses against Nomba's webhooks.

---

## 6. Mapping to Nomba primitives

| Engine operation | Nomba primitive |
| ---------------- | --------------- |
| Collect first payment + tokenise card | **Checkout API** |
| Store card for reuse | **Tokenised cards** |
| Every renewal + every dunning retry | **Charge API** |
| Payouts to merchant balance, refunds on proration credit | **Transfers** |

---

## 7. Build order (suggested)

1. `accounts` + auth, then `plans` + `billing_cycles` (pure CRUD).
2. `customers` + card tokenisation via Checkout.
3. `subscriptions` create + the state machine.
4. The **billing clock** (invoice generation + Charge).
5. `dunning_cases` + `dunning_settings` + retry scheduler.
6. `webhook_endpoints` + signed delivery + `events` log.

Each step can ship behind the existing UI by swapping the matching function in
`lib/store/StoreProvider.tsx` from in-memory to `fetch`.
