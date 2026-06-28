# Nomba Recur — Subscriptions Engine

A managed recurring-billing layer built on top of Nomba's payment primitives
(Checkout, Tokenised Cards, Charge, Transfers). Nomba exposes raw payment APIs
but no managed subscriptions layer, so every product team rebuilds billing from
scratch. **Recur is that missing layer** — plan management, billing cycles,
proration, dunning/recovery, a customer self-service portal, and webhooks for
downstream systems.

> This repository is the **frontend** (a clickable prototype with an in-memory
> mock engine). It is designed so a backend can be slotted in behind it without
> touching the UI. Backend teams: start with [`docs/BACKEND_GUIDE.md`](docs/BACKEND_GUIDE.md).

---

## Running the project

Requirements: **Node 18.18+** and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

There is **no environment configuration** and **no backend** required to run the
prototype — all data is seeded in memory and resets on refresh.

---

## What you can do in the app

The app has two audiences, on two separate surfaces.

### Merchant console (the dashboard with the dark sidebar)

| Route             | What it does                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `/`               | Overview — MRR, active/trialing/past-due counts, renewals, events    |
| `/plans`          | Create / edit / archive plans, and manage **billing cycles**         |
| `/subscriptions`  | List + filter; create a subscription; per-subscription detail        |
| `/customers`      | List customers; per-customer detail (card, subs, invoices)           |
| `/dunning`        | Failed-payment recovery queue + configurable retry **settings**      |
| `/developers`     | Webhook endpoints, live event log, event catalog                     |
| `/architecture`   | In-app explainer of how the engine works                             |

### Customer self-service portal

| Route      | What it does                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `/portal`  | One customer manages **their own** plan, card, invoices, and cancellation |

---

## Navigating the codebase

The project is organised so that **routing, UI, features, and data are kept
separate**. (Full detail in [`ARCHITECTURE.md`](ARCHITECTURE.md).)

```
app/            Routing only — every page is a thin wrapper around a feature
  (console)/    Merchant dashboard routes (shared sidebar layout)
  portal/       Customer portal route (separate layout)

components/
  ui/           Design-system primitives (Button, Card, Modal, Badge, …)
  layout/       Sidebar, Topbar, ConsoleShell, PortalHeader
  icons/        Inline SVG icons

features/        One folder per feature; holds its page + local components
  overview/ plans/ subscriptions/ customers/ dunning/ developers/
  architecture/ portal/

lib/
  types.ts        The domain model (the source of truth for data shapes)
  format.ts       Money/date formatting + status metadata
  state-machine.ts Lifecycle transitions, proration, retry scheduling
  seed.ts         Mock/seed data
  store/          The in-memory "engine" (swap this for real API calls)
    reducer.ts      pure state transitions (all business logic lives here)
    selectors.ts    pure read helpers
    StoreProvider.tsx  React context that binds actions + selectors

docs/
  BACKEND_GUIDE.md  Tables, endpoints, request/response shapes, webhooks
```

### Where to start reading

1. **`lib/types.ts`** — every data shape the UI uses.
2. **`lib/store/reducer.ts`** — every operation the engine performs.
3. **`features/<name>/<Name>Page.tsx`** — the screen for each feature.
4. **`app/(console)/<name>/page.tsx`** — the route that renders it.

### Key conventions

- `app/` contains **no business logic** — pages just render a feature component.
- Imports use the **`@/` alias** (e.g. `@/lib/store`), which maps to the repo root.
- All data flows through **`lib/store`** — it is the only thing a backend needs
  to replace.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** for styling
- System font stack (no external font fetch, so it runs fully offline)

---

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — folder structure & design principles
- [`docs/BACKEND_GUIDE.md`](docs/BACKEND_GUIDE.md) — **for backend developers**:
  database tables, REST endpoints, request/response payloads, forms, and webhooks
