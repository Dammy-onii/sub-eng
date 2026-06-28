"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { naira, relativeTime, SUB_STATUS_META } from "@/lib/format";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

const PRIMITIVES: [string, string][] = [
  ["Checkout API", "Collects the first payment & tokenises the card"],
  ["Tokenised cards", "Stored token reused for every renewal"],
  ["Charge API", "Drives each recurring & retry charge"],
  ["Transfers", "Settles payouts and processes refunds"],
];

export function OverviewPage() {
  const s = useStore();
  const m = s.metrics();
  const recent = s.events.slice(0, 6);

  const upcoming = s.subscriptions
    .filter((x) => x.status === "active" || x.status === "trialing")
    .sort(
      (a, b) =>
        new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime()
    )
    .slice(0, 5);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Overview"
        description="A managed recurring-billing layer on top of Nomba's Checkout, Tokenised Cards, Charge and Transfers APIs."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR" value={naira(m.mrr)} sub="Normalised across all intervals" />
        <StatCard label="Active subscriptions" value={String(m.activeCount)} sub={`${m.trialingCount} trialing`} />
        <StatCard label="Past due" value={String(m.pastDueCount)} sub="In dunning recovery" tone={m.pastDueCount ? "amber" : undefined} />
        <StatCard label="Recovery rate" value={`${m.recoveredPct}%`} sub="Failed payments recovered" tone="green" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" pad={false}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Upcoming renewals</h2>
            <Link href="/subscriptions" className="text-xs font-medium text-[var(--brand-dark)] hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--faint)]">
                <th className="px-5 py-2 font-medium">Customer</th>
                <th className="px-5 py-2 font-medium">Plan</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 text-right font-medium">Renews</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((sub) => {
                const cust = s.getCustomer(sub.customerId);
                const plan = s.getPlan(sub.planId);
                const meta = SUB_STATUS_META[sub.status];
                return (
                  <tr key={sub.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-3">
                      <Link href={`/subscriptions/${sub.id}`} className="font-medium text-[var(--text)] hover:text-[var(--brand-dark)]">
                        {cust?.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">{plan?.name}</td>
                    <td className="px-5 py-3"><Badge tone={meta.tone} dot>{meta.label}</Badge></td>
                    <td className="px-5 py-3 text-right text-[var(--muted)]">{relativeTime(sub.currentPeriodEnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card pad={false}>
          <div className="border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent events</h2>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((e) => (
              <li key={e.id} className="flex gap-3 px-5 py-3">
                <span className="mt-0.5 text-[var(--brand)]"><Icon.bolt width={14} height={14} /></span>
                <div className="min-w-0">
                  <code className="text-xs font-medium text-[var(--text)]">{e.type}</code>
                  <p className="truncate text-xs text-[var(--muted)]">{e.summary}</p>
                  <span className="text-[10px] text-[var(--faint)]">{relativeTime(e.created)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRIMITIVES.map(([t, d]) => (
          <Card key={t}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Icon.bolt width={15} height={15} className="text-[var(--brand)]" />
              {t}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{d}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
