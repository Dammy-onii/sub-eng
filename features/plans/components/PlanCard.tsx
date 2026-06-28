"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { naira } from "@/lib/format";
import type { Plan, PricingModel } from "@/lib/types";
import { Badge, Button, Card, Modal } from "@/components/ui";
import { Icon } from "@/components/icons";

const MODEL_LABEL: Record<PricingModel, string> = {
  flat: "Flat rate",
  per_seat: "Per seat",
  usage: "Usage-based",
};

export function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: (plan: Plan) => void }) {
  const s = useStore();
  const cycle = s.getCycle(plan.cycleId);
  const subCount = s.subscriptionsUsingPlan(plan.id);
  const canDelete = subCount === 0;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text)]">{plan.name}</h3>
          <Badge tone={plan.status === "active" ? "brand" : "slate"}>{MODEL_LABEL[plan.pricingModel]}</Badge>
        </div>
        {plan.status === "archived" && <Badge tone="slate">Archived</Badge>}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{plan.description}</p>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-[var(--text)]">{naira(plan.amount)}</span>
        <span className="text-xs text-[var(--faint)]">
          {plan.pricingModel === "per_seat" ? "/seat" : plan.pricingModel === "usage" ? "/unit" : ""} · {cycle?.label}
        </span>
      </div>

      <ul className="mt-3 flex-1 space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-[var(--muted)]">
            <span className="mt-0.5 text-[var(--brand)]">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--faint)]">
        <span>
          {plan.trialDays > 0 ? `${plan.trialDays}-day trial` : "No trial"} ·{" "}
          {plan.prorationEnabled ? "Proration on" : "No proration"}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => onEdit(plan)} className="inline-flex items-center gap-1 font-medium text-[var(--brand-dark)] hover:underline">
            <Icon.edit width={13} height={13} /> Edit
          </button>
          {plan.status === "active" ? (
            <button onClick={() => s.archivePlan(plan.id)} className="font-medium text-[var(--muted)] hover:text-[var(--amber)]">
              Archive
            </button>
          ) : (
            <button onClick={() => s.unarchivePlan(plan.id)} className="font-medium text-[var(--muted)] hover:text-[var(--green)]">
              Unarchive
            </button>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!canDelete}
            title={canDelete ? "Delete plan" : `Archive instead — ${subCount} subscription${subCount > 1 ? "s" : ""} use this plan`}
            className="font-medium text-[var(--muted)] enabled:hover:text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>

      {confirmOpen && (
        <Modal
          open
          onClose={() => setConfirmOpen(false)}
          title="Delete plan"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  s.deletePlan(plan.id);
                  setConfirmOpen(false);
                }}
              >
                Delete plan
              </Button>
            </>
          }
        >
          <p className="text-sm text-[var(--muted)]">
            Permanently delete <b>{plan.name}</b>? This can&apos;t be undone. Plans with existing subscriptions
            can&apos;t be deleted — archive them instead to preserve billing history.
          </p>
        </Modal>
      )}
    </Card>
  );
}
