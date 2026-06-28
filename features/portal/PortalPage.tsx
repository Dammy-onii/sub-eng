"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { naira, shortDate, dateTime, SUB_STATUS_META, INVOICE_STATUS_META } from "@/lib/format";
import { Badge, Button, Card, Modal, Toast, useToast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { PortalChangePlanModal } from "./components/PortalChangePlanModal";
import { UpdateCardModal } from "./components/UpdateCardModal";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 font-medium text-[var(--text)]">{value}</div>
    </div>
  );
}

export function PortalPage() {
  const s = useStore();
  const { message, show } = useToast();

  // Demo: let the viewer impersonate any customer who has a subscription.
  const withSubs = s.customers.filter((c) => s.subsForCustomer(c.id).length > 0);
  const [customerId, setCustomerId] = useState(withSubs[0]?.id ?? "");
  const customer = s.getCustomer(customerId)!;
  const sub = s.subsForCustomer(customerId)[0];

  const [changeOpen, setChangeOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!sub) return <p className="text-sm text-[var(--muted)]">No subscription.</p>;

  const plan = s.getPlan(sub.planId)!;
  const meta = SUB_STATUS_META[sub.status];
  const invoices = s.invoicesForSub(sub.id);
  const amount = plan.pricingModel === "per_seat" ? plan.amount * sub.quantity : plan.amount;

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex items-center justify-between rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2.5">
        <span className="text-xs text-[var(--faint)]">Demo — viewing portal as:</span>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs"
        >
          {withSubs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">Hi {customer.name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Manage your subscription and billing.</p>

      <Card className="mt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text)]">{plan.name}</h2>
              <Badge tone={meta.tone} dot>{meta.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-[var(--text)]">{naira(amount)}</div>
            <div className="text-xs text-[var(--faint)]">
              {plan.interval === "annual" ? "per year" : plan.interval === "custom" ? `every ${plan.intervalCount}d` : "per month"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-3">
          <Info label="Next renewal" value={shortDate(sub.currentPeriodEnd)} />
          <Info label="Seats" value={String(sub.quantity)} />
          <Info label="Auto-renew" value={sub.cancelAtPeriodEnd ? "Off (ends soon)" : "On"} />
        </div>

        {sub.status === "past_due" && (
          <div className="mt-4 rounded-lg bg-[var(--red-soft)] p-3 text-xs text-[var(--red)]">
            ⚠ Your last payment failed. Update your card to keep your subscription active.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {sub.status !== "canceled" && <Button onClick={() => setChangeOpen(true)}>Change plan</Button>}
          <Button variant="secondary" onClick={() => setCardOpen(true)}>
            <Icon.card width={15} height={15} /> Update card
          </Button>
          {sub.status === "active" && !sub.cancelAtPeriodEnd && (
            <Button variant="ghost" onClick={() => setCancelOpen(true)}>Cancel subscription</Button>
          )}
          {sub.cancelAtPeriodEnd && sub.status !== "canceled" && (
            <Button
              variant="secondary"
              onClick={() => {
                s.setSubStatus(sub.id, "active", "Customer resumed auto-renew");
                show("Auto-renew turned back on.");
              }}
            >
              Resume auto-renew
            </Button>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Payment method</h2>
        {customer.card ? (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-12 items-center justify-center rounded-md bg-[var(--ink)] text-white">
              <Icon.card width={18} height={18} />
            </span>
            <div>
              <div className="text-sm font-medium text-[var(--text)]">{customer.card.brand} •••• {customer.card.last4}</div>
              <div className="text-xs text-[var(--faint)]">
                Expires {customer.card.expMonth}/{String(customer.card.expYear).slice(-2)} · tokenised
              </div>
            </div>
          </div>
        ) : (
          <Badge tone="amber">No card on file</Badge>
        )}
      </Card>

      <Card className="mt-4" pad={false}>
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Billing history</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--muted)]">No invoices yet.</p>
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
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs font-medium text-[var(--brand-dark)] hover:underline">Receipt</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <PortalChangePlanModal open={changeOpen} onClose={() => setChangeOpen(false)} subId={sub.id} onDone={() => show("Plan updated — proration applied.")} />
      <UpdateCardModal open={cardOpen} onClose={() => setCardOpen(false)} customerId={customerId} onDone={() => show("Card updated and re-tokenised.")} />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel subscription"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Keep subscription</Button>
            <Button
              variant="danger"
              onClick={() => {
                s.cancelSubscription(sub.id, true);
                setCancelOpen(false);
                show("Subscription will end at the period close.");
              }}
            >
              Cancel at period end
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          You&apos;ll keep access to <b>{plan.name}</b> until <b>{shortDate(sub.currentPeriodEnd)}</b>. No further charges after that.
        </p>
      </Modal>

      <Toast message={message} />
    </div>
  );
}
