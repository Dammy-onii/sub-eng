"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { naira, shortDate } from "@/lib/format";
import { Badge, Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export function NewSubscriptionPage() {
  const s = useStore();
  const router = useRouter();

  const [customerId, setCustomerId] = useState(s.customers[0]?.id ?? "");
  const [planId, setPlanId] = useState(s.plans[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [withTrial, setWithTrial] = useState(true);
  const [nowMs] = useState(() => Date.now());

  const plan = s.getPlan(planId);
  const cust = s.getCustomer(customerId);
  const qty = Math.max(1, Number(quantity) || 1);
  const base = plan ? (plan.pricingModel === "per_seat" ? plan.amount * qty : plan.amount) : 0;
  const trialApplies = withTrial && (plan?.trialDays ?? 0) > 0;

  function create() {
    if (!customerId || !planId) return;
    const subId = s.createSubscription({ customerId, planId, quantity: qty, withTrial });
    router.push(`/subscriptions/${subId}`);
  }

  return (
    <div className="animate-fade-up">
      <Link href="/subscriptions" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]">
        ← Subscriptions
      </Link>
      <PageHeader
        title="New subscription"
        description="Attach a customer's tokenised card to a plan. The engine charges the first invoice (or starts a trial), then auto-renews on the cycle."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Customer</h2>
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {s.customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </Select>
            {cust && !cust.card && (
              <p className="mt-2 text-xs text-[var(--amber)]">
                ⚠ No tokenised card on file. In production, Checkout would collect one before activation.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Plan & quantity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plan">
                <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  {s.plans.filter((p) => p.status === "active").map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {naira(p.amount)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity / seats" hint={plan?.pricingModel === "per_seat" ? "Billed per seat" : "Flat plan"}>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={plan?.pricingModel !== "per_seat"}
                />
              </Field>
            </div>
            {(plan?.trialDays ?? 0) > 0 && (
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={withTrial}
                  onChange={(e) => setWithTrial(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                <span className="text-sm text-[var(--text)]">Start with {plan?.trialDays}-day free trial</span>
              </label>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Plan</dt><dd className="text-[var(--text)]">{plan?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Billing</dt><dd className="text-[var(--text)] capitalize">{plan?.interval}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Recurring total</dt><dd className="font-semibold text-[var(--text)]">{naira(base)}</dd></div>
          </dl>

          <div className="my-4 border-t border-[var(--border)]" />

          <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm">
            {trialApplies ? (
              <>
                <Badge tone="blue">Trial</Badge>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  No charge today. First charge of {naira(base)} on{" "}
                  {shortDate(new Date(nowMs + (plan?.trialDays ?? 0) * 86400000).toISOString())}.
                </p>
              </>
            ) : (
              <>
                <Badge tone="green">Charge now</Badge>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {naira(base)} charged today via Nomba Charge API, then auto-renews.
                </p>
              </>
            )}
          </div>

          <Button className="mt-4 w-full" onClick={create}>Create subscription</Button>
          <p className="mt-2 text-center text-[10px] text-[var(--faint)]">
            Emits <code>subscription.created</code> to your webhooks
          </p>
        </Card>
      </div>
    </div>
  );
}
