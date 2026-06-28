"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { naira, shortDate, SUB_STATUS_META } from "@/lib/format";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { StatusFilter, SUB_FILTERS, type SubFilter } from "./components/StatusFilter";

export function SubscriptionsPage() {
  const s = useStore();
  const [filter, setFilter] = useState<SubFilter>("all");

  const counts = Object.fromEntries(
    SUB_FILTERS.map((f) => [
      f,
      f === "all" ? s.subscriptions.length : s.subscriptions.filter((x) => x.status === f).length,
    ])
  ) as Record<SubFilter, number>;

  const rows = s.subscriptions.filter((x) => filter === "all" || x.status === filter);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Subscriptions"
        description="Every subscription is a state machine. The engine moves it between states as billing events arrive."
        action={
          <Link href="/subscriptions/new">
            <Button>
              <Icon.plus width={16} height={16} /> New subscription
            </Button>
          </Link>
        }
      />

      <StatusFilter value={filter} counts={counts} onChange={setFilter} />

      <Card pad={false}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--faint)]">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">MRR</th>
              <th className="px-5 py-3 font-medium">Current period</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((sub) => {
              const cust = s.getCustomer(sub.customerId);
              const plan = s.getPlan(sub.planId);
              const meta = SUB_STATUS_META[sub.status];
              return (
                <tr key={sub.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[var(--text)]">{cust?.name}</div>
                    <div className="text-xs text-[var(--faint)]">{cust?.email}</div>
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">
                    {plan?.name}
                    {sub.quantity > 1 && <span className="text-[var(--faint)]"> × {sub.quantity}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    {sub.cancelAtPeriodEnd && sub.status !== "canceled" && (
                      <span className="ml-1 text-[10px] text-[var(--amber)]">cancels at period end</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{naira(s.monthlyAmount(sub))}</td>
                  <td className="px-5 py-3 text-xs text-[var(--muted)]">
                    {shortDate(sub.currentPeriodStart)} → {shortDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/subscriptions/${sub.id}`} className="text-xs font-medium text-[var(--brand-dark)] hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
