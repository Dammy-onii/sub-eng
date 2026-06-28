"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  naira,
  shortDate,
  dateTime,
  SUB_STATUS_META,
  INVOICE_STATUS_META,
} from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { LifecyclePanel } from "./components/LifecyclePanel";
import { ChangePlanModal } from "./components/ChangePlanModal";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--faint)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--text)]">{value}</dd>
    </div>
  );
}

export function SubscriptionDetailPage({ id }: { id: string }) {
  const s = useStore();
  const sub = s.getSubscription(id);
  const [changeOpen, setChangeOpen] = useState(false);

  if (!sub) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Subscription not found" />
        <EmptyState title="This subscription doesn't exist" hint="It may have been a demo id." />
      </div>
    );
  }

  const cust = s.getCustomer(sub.customerId)!;
  const plan = s.getPlan(sub.planId)!;
  const meta = SUB_STATUS_META[sub.status];
  const invoices = s.invoicesForSub(sub.id);

  return (
    <div className="animate-fade-up">
      <Link href="/subscriptions" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]">
        ← Subscriptions
      </Link>
      <PageHeader
        title={cust.name}
        description={`${plan.name}${sub.quantity > 1 ? ` × ${sub.quantity} seats` : ""} · ${naira(s.monthlyAmount(sub))}/mo equivalent`}
        action={<Badge tone={meta.tone} dot>{meta.label}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Details</h2>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Detail label="Subscription ID" value={<code className="text-xs">{sub.id}</code>} />
              <Detail label="Plan" value={plan.name} />
              <Detail label="Status" value={meta.desc} />
              <Detail label="Seats / quantity" value={String(sub.quantity)} />
              <Detail label="Current period" value={`${shortDate(sub.currentPeriodStart)} → ${shortDate(sub.currentPeriodEnd)}`} />
              <Detail label="Renewal" value={sub.cancelAtPeriodEnd ? "Cancels at period end" : "Auto-renews"} />
              {sub.trialEnd && <Detail label="Trial ends" value={shortDate(sub.trialEnd)} />}
              <Detail label="Card on file" value={cust.card ? `${cust.card.brand} •••• ${cust.card.last4}` : "None"} />
            </dl>
          </Card>

          <Card pad={false}>
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No invoices yet" hint="The first charge runs when the trial ends." />
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {invoices.map((inv) => {
                    const im = INVOICE_STATUS_META[inv.status];
                    return (
                      <tr key={inv.id} className="border-t border-[var(--border)] first:border-t-0">
                        <td className="px-5 py-3">
                          <div className="font-medium text-[var(--text)]">{inv.description}</div>
                          <div className="text-xs text-[var(--faint)]">{dateTime(inv.created)}</div>
                        </td>
                        <td className="px-5 py-3"><Badge tone={im.tone}>{im.label}</Badge></td>
                        <td className="px-5 py-3 text-right font-medium text-[var(--text)]">{naira(inv.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <LifecyclePanel sub={sub} onChangePlan={() => setChangeOpen(true)} />
          <Link href={`/customers/${cust.id}`} className="block text-center text-xs font-medium text-[var(--brand-dark)] hover:underline">
            View customer →
          </Link>
        </div>
      </div>

      <ChangePlanModal open={changeOpen} onClose={() => setChangeOpen(false)} subId={sub.id} />
    </div>
  );
}
