"use client";

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
import { Icon } from "@/components/icons";

export function CustomerDetailPage({ id }: { id: string }) {
  const s = useStore();
  const c = s.getCustomer(id);

  if (!c) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Customer not found" />
        <EmptyState title="No such customer" />
      </div>
    );
  }

  const subs = s.subsForCustomer(c.id);
  const invoices = s.invoicesForCustomer(c.id);

  return (
    <div className="animate-fade-up">
      <Link href="/customers" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]">
        ← Customers
      </Link>
      <PageHeader title={c.name} description={c.email} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--faint)]">Customer ID</dt>
              <dd><code className="text-xs">{c.id}</code></dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--faint)]">Phone</dt>
              <dd className="text-[var(--text)]">{c.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--faint)]">Tokenised card</dt>
              <dd className="text-[var(--text)]">
                {c.card ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon.card width={15} height={15} /> {c.card.brand} •••• {c.card.last4} · exp {c.card.expMonth}/
                    {String(c.card.expYear).slice(-2)}
                  </span>
                ) : (
                  <Badge tone="amber">No card on file</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--faint)]">Customer since</dt>
              <dd className="text-[var(--text)]">{shortDate(c.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card pad={false}>
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Subscriptions</h2>
            </div>
            {subs.length === 0 ? (
              <div className="p-5"><EmptyState title="No subscriptions" /></div>
            ) : (
              subs.map((sub) => {
                const plan = s.getPlan(sub.planId);
                const meta = SUB_STATUS_META[sub.status];
                return (
                  <Link
                    key={sub.id}
                    href={`/subscriptions/${sub.id}`}
                    className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 first:border-t-0 hover:bg-[var(--surface-2)]"
                  >
                    <div>
                      <div className="font-medium text-[var(--text)]">{plan?.name}</div>
                      <div className="text-xs text-[var(--faint)]">Renews {shortDate(sub.currentPeriodEnd)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted)]">{naira(s.monthlyAmount(sub))}/mo</span>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </Card>

          <Card pad={false}>
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="p-5"><EmptyState title="No invoices" /></div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {invoices.map((inv) => {
                    const im = INVOICE_STATUS_META[inv.status];
                    return (
                      <tr key={inv.id} className="border-t border-[var(--border)] first:border-t-0">
                        <td className="px-5 py-3">
                          <div className="text-[var(--text)]">{inv.description}</div>
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
      </div>
    </div>
  );
}
