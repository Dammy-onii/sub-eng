"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { naira, shortDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { AddCustomerModal } from "./components/AddCustomerModal";

export function CustomersPage() {
  const s = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Customers"
        description="Each customer holds a tokenised card and one or more subscriptions. Tokens come from Nomba's tokenised-cards primitive."
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon.plus width={16} height={16} /> Add customer
          </Button>
        }
      />

      <Card pad={false}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--faint)]">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Card</th>
              <th className="px-5 py-3 font-medium">Subscriptions</th>
              <th className="px-5 py-3 font-medium">Lifetime value</th>
              <th className="px-5 py-3 font-medium">Since</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {s.customers.map((c) => {
              const subs = s.subsForCustomer(c.id);
              const ltv = s
                .invoicesForCustomer(c.id)
                .filter((i) => i.status === "paid")
                .reduce((sum, i) => sum + i.amount, 0);
              return (
                <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                  <td className="px-5 py-3">
                    <Link href={`/customers/${c.id}`} className="font-medium text-[var(--text)] hover:text-[var(--brand-dark)]">
                      {c.name}
                    </Link>
                    <div className="text-xs text-[var(--faint)]">{c.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    {c.card ? (
                      <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                        <Icon.card width={15} height={15} /> •••• {c.card.last4}
                      </span>
                    ) : (
                      <Badge tone="amber">No card</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{subs.length}</td>
                  <td className="px-5 py-3 text-[var(--muted)]">{naira(ltv)}</td>
                  <td className="px-5 py-3 text-xs text-[var(--muted)]">{shortDate(c.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/customers/${c.id}`} className="text-xs font-medium text-[var(--brand-dark)] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <AddCustomerModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
