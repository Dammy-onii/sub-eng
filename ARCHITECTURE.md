# Nomba Recur — code structure

A managed recurring-billing layer (UI prototype) on top of Nomba's Checkout,
Tokenised Cards, Charge and Transfers primitives.

## Folder layout

```
app/                      # Routing only — thin wrappers, no business logic
  (console)/              # Merchant dashboard (shared sidebar layout)
    page.tsx              # /            → OverviewPage
    plans/                # /plans
    subscriptions/        # list, /new, /[id]
    customers/            # list, /[id]
    dunning/              # /dunning
    developers/           # /developers
    architecture/         # /architecture
  portal/                 # Customer self-service portal (separate layout)

components/
  ui/                     # Design-system primitives (one concern per file)
  layout/                 # Sidebar, Topbar, ConsoleShell, PortalHeader
  icons/                  # Inline SVG icon set

features/                 # Feature modules — each owns its page + components
  overview/ plans/ subscriptions/ customers/ dunning/ developers/
  architecture/ portal/

lib/
  types.ts                # Domain model
  format.ts               # Money/date formatting + status metadata
  state-machine.ts        # Lifecycle edges, proration, retry scheduling
  seed.ts                 # Mock data
  store/                  # In-memory engine
    reducer.ts            #   pure state transitions (all business logic)
    selectors.ts          #   pure read helpers
    StoreProvider.tsx     #   React context, binds actions/selectors
    index.ts
```

## Principles

- **`app/` is routing only.** Every page file just renders a feature component,
  so routing concerns never mix with UI logic.
- **Feature-first.** Each feature folder holds its page and the components only
  it uses; shared UI lives in `components/ui`.
- **One source of truth.** `lib/store` is a `useReducer` store: `reducer.ts`
  holds all mutations as pure functions, `selectors.ts` holds pure reads, and
  the provider injects ids/timestamps/rng so the reducer stays deterministic
  and testable. Swap this layer for real Nomba API calls + a DB to ship it.
- **`@/` path alias** everywhere instead of brittle relative imports.

## Replacing the mock with a real backend

`lib/store` is the only thing that touches data. To go live:

1. Turn each reducer case into an API call (`Charge`, `Checkout`, `Transfers`).
2. Persist entities in a tenant-scoped database (`acct_*`).
3. Run the billing clock + dunning scheduler server-side; have webhooks update
   the client instead of the in-memory reducer.
```
