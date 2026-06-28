"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { naira, dateTime, relativeTime } from "@/lib/format";
import { buildRetrySchedule } from "@/lib/state-machine";
import { Badge, Button, Card, EmptyState, PageHeader, Toast, useToast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { DunningSettingsModal } from "./components/DunningSettingsModal";

const ERROR_LABEL: Record<string, string> = {
  insufficient_funds: "Insufficient funds",
  expired_card: "Expired card",
  do_not_honor: "Do not honor",
};

export function DunningPage() {
  const s = useStore();
  const { message, show } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const cfg = s.dunningSettings;
  const schedule = buildRetrySchedule(cfg.maxRetries, cfg.retryStrategy, cfg.retryIntervalDays);
  const active = s.dunning.filter((d) => d.status === "retrying");
  const resolved = s.dunning.filter((d) => d.status !== "retrying");
  const atRisk = active.reduce((sum, d) => sum + d.amount, 0);

  const exhaustedLabel =
    cfg.exhaustedAction === "cancel" ? "Cancel" : cfg.exhaustedAction === "downgrade_free" ? "Downgrade" : "Mark unpaid";

  function retry(id: string, force?: "succeed" | "fail") {
    const ok = s.retryDunning(id, force);
    show(ok ? "Charge recovered — subscription reactivated." : "Retry failed — rescheduled per your settings.");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dunning & recovery"
        description="When a renewal Charge is declined, the subscription moves to past_due and runs your automatic retry schedule. Recover the payment to reactivate it; exhaust the retries and the configured action applies."
        action={
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            <Icon.settings width={16} height={16} /> Settings
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--faint)]">In recovery</div>
          <div className="mt-1 text-2xl font-semibold">{active.length}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--faint)]">Revenue at risk</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--amber)]">{naira(atRisk)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--faint)]">Recovered</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--green)]">
            {s.dunning.filter((d) => d.status === "recovered").length}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--faint)]">Max retries</div>
          <div className="mt-1 text-2xl font-semibold">{cfg.maxRetries}</div>
        </Card>
      </div>

      {/* Live schedule reflecting current settings */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Automatic retry schedule
            <span className="ml-2 font-normal capitalize text-[var(--faint)]">· {cfg.retryStrategy}</span>
          </h2>
          <button onClick={() => setSettingsOpen(true)} className="text-xs font-medium text-[var(--brand-dark)] hover:underline">
            Edit
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {schedule.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                Attempt {i + 1}
                <span className="ml-1.5 text-[var(--faint)]">{step}</span>
              </span>
              {i < schedule.length - 1 && <span className="text-[var(--faint)]">→</span>}
            </div>
          ))}
          <span className="text-[var(--faint)]">→</span>
          <span className="rounded-lg bg-[var(--red-soft)] px-3 py-1.5 text-xs font-medium text-[var(--red)]">{exhaustedLabel}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Condition active={cfg.retryOnCardUpdate} label="Retry on card update" />
          <Condition active={cfg.pauseAccessDuringDunning} label={cfg.pauseAccessDuringDunning ? "Hard dunning (suspend access)" : "Soft dunning (keep access)"} />
          <Condition active={cfg.emailOnFailure} label="Email on failure" />
          <Condition active label={`${cfg.gracePeriodDays}-day grace period`} />
        </div>

        <p className="mt-3 text-xs text-[var(--muted)]">
          Each attempt re-runs the Nomba Charge API against the stored card token, firing
          <code className="mx-1">invoice.payment_failed</code> on every miss.
        </p>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Active cases</h2>
      {active.length === 0 ? (
        <EmptyState title="Nothing in recovery 🎉" hint="All renewals are settling cleanly." />
      ) : (
        <Card pad={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--faint)]">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Attempt</th>
                <th className="px-5 py-3 font-medium">Next retry</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map((d) => {
                const cust = s.getCustomer(d.customerId);
                return (
                  <tr key={d.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-3">
                      <Link href={`/customers/${d.customerId}`} className="font-medium text-[var(--text)] hover:text-[var(--brand-dark)]">
                        {cust?.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--text)]">{naira(d.amount)}</td>
                    <td className="px-5 py-3"><Badge tone="red">{ERROR_LABEL[d.lastError] ?? d.lastError}</Badge></td>
                    <td className="px-5 py-3 text-[var(--muted)]">{d.attempt} / {cfg.maxRetries}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{d.nextRetryAt ? relativeTime(d.nextRetryAt) : "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => retry(d.id, "succeed")}>Retry now</Button>
                        <Button size="sm" variant="secondary" onClick={() => retry(d.id, "fail")}>Simulate fail</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-[var(--text)]">Resolved</h2>
          <Card pad={false}>
            <table className="w-full text-sm">
              <tbody>
                {resolved.map((d) => {
                  const cust = s.getCustomer(d.customerId);
                  return (
                    <tr key={d.id} className="border-t border-[var(--border)] first:border-t-0">
                      <td className="px-5 py-3 font-medium text-[var(--text)]">{cust?.name}</td>
                      <td className="px-5 py-3 text-[var(--muted)]">{naira(d.amount)}</td>
                      <td className="px-5 py-3 text-xs text-[var(--faint)]">{dateTime(d.lastAttemptAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={d.status === "recovered" ? "green" : "red"}>
                          {d.status === "recovered" ? "Recovered" : "Exhausted"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {settingsOpen && <DunningSettingsModal onClose={() => setSettingsOpen(false)} />}
      <Toast message={message} />
    </div>
  );
}

function Condition({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        active ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "bg-[var(--slate-soft)] text-[var(--slate-text)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--brand)]" : "bg-[var(--faint)]"}`} />
      {label}
    </span>
  );
}
