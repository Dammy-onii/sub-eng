"use client";

import { STATUS_ORDER, TRANSITIONS } from "@/lib/state-machine";
import { SUB_STATUS_META } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/ui";

const LAYERS = [
  {
    name: "Downstream product teams",
    color: "var(--accent)",
    items: ["Your apps consume the API + webhooks", "Never rebuild billing again"],
  },
  {
    name: "Nomba Recur — Subscriptions Engine",
    color: "var(--brand)",
    items: [
      "Plan & catalog service",
      "Subscription state machine + billing clock",
      "Invoicing & proration",
      "Dunning / recovery scheduler",
      "Webhook dispatcher (multi-tenant)",
    ],
  },
  {
    name: "Nomba payment primitives",
    color: "var(--ink-2)",
    items: ["Checkout API", "Tokenised cards", "Charge API", "Transfers"],
  },
];

const PRIMITIVES: [string, string][] = [
  ["Checkout API", "Collects the first payment and tokenises the customer's card during signup."],
  ["Tokenised cards", "The stored token is what makes recurring billing possible — reused for every cycle and every dunning retry."],
  ["Charge API", "Server-driven charge against a token. The billing clock calls this on each renewal and each retry."],
  ["Transfers", "Moves settled funds to merchant balances and powers refunds on cancellation/proration credits."],
];

const LIFECYCLE: [string, string, string][] = [
  ["1", "Subscribe", "Checkout collects + tokenises the card. The engine creates the subscription (incomplete → active, or trialing)."],
  ["2", "Billing clock", "A scheduler watches current_period_end. At each tick it generates a draft invoice for the subscription items."],
  ["3", "Charge", "The invoice is charged via the Charge API against the stored token. Success advances the period; failure → past_due."],
  ["4", "Dunning", "past_due invoices enter the retry schedule. A recovered charge returns the sub to active; exhaustion applies your policy."],
  ["5", "Changes", "Upgrades/downgrades mid-cycle compute proration: credit unused time, charge the new plan's remainder."],
  ["6", "Notify", "Every transition emits a signed webhook so downstream systems stay in sync without polling."],
];

export function ArchitecturePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="How the engine works"
        description="Nomba ships payment primitives but no managed subscriptions layer. Recur is the missing middle: it owns the billing clock, the lifecycle state machine, and the developer-facing API, sitting between product teams and Nomba's raw APIs."
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">System layers</h2>
        <div className="space-y-3">
          {LAYERS.map((l) => (
            <div key={l.name} className="rounded-xl border p-4" style={{ borderColor: l.color, background: `${l.color}0d` }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-sm font-semibold text-[var(--text)]">{l.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {l.items.map((it) => (
                  <span key={it} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)]">{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-[var(--faint)]">Requests flow down · events &amp; webhooks flow back up</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">Subscription state machine</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Every subscription lives in exactly one state. The engine only follows the declared edges below — each
          triggered by a billing event, never an ad-hoc write.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const meta = SUB_STATUS_META[status];
            const outgoing = TRANSITIONS.filter((t) => t.from === status && t.to !== status);
            return (
              <div key={status} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
                <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">{meta.desc}</p>
                <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
                  {outgoing.length === 0 ? (
                    <span className="text-[10px] text-[var(--faint)]">Terminal state</span>
                  ) : (
                    outgoing.map((t) => (
                      <div key={t.event} className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                        <code className="text-[var(--brand-dark)]">{t.event}</code>
                        <span>→</span>
                        <span className="font-medium">{SUB_STATUS_META[t.to].label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">Billing lifecycle</h2>
        <ol className="space-y-3">
          {LIFECYCLE.map(([n, t, d]) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">{n}</span>
              <div>
                <div className="text-sm font-medium text-[var(--text)]">{t}</div>
                <p className="text-xs text-[var(--muted)]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">Mapping to Nomba primitives</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIMITIVES.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-sm font-semibold text-[var(--text)]">{t}</div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Multi-tenant cleanliness</h2>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Every object — plan, customer, subscription, invoice, webhook endpoint — is scoped to a tenant
          (<code>acct_*</code>). API keys, event streams and the billing clock all partition on that tenant id, so one
          merchant&apos;s data, retries and payouts never bleed into another&apos;s. Downstream developers get a clean,
          idempotent REST surface plus webhooks; they never touch Nomba&apos;s raw APIs directly.
        </p>
      </Card>
    </div>
  );
}
