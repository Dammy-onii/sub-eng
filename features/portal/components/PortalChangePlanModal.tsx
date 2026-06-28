"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { naira } from "@/lib/format";
import { computeProration } from "@/lib/state-machine";
import { Button, Modal } from "@/components/ui";
import { ProrationPreview } from "@/features/subscriptions/components/ProrationPreview";

export function PortalChangePlanModal({
  open,
  onClose,
  subId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  subId: string;
  onDone: () => void;
}) {
  const s = useStore();
  const sub = s.getSubscription(subId);
  const [target, setTarget] = useState(sub?.planId ?? "");
  const [now] = useState(() => new Date());

  if (!sub) return null;
  const oldPlan = s.getPlan(sub.planId)!;
  const newPlan = s.getPlan(target) ?? oldPlan;
  const amt = (p = oldPlan) => (p.pricingModel === "per_seat" ? p.amount * sub.quantity : p.amount);
  const pr = computeProration(amt(oldPlan), amt(newPlan), sub.currentPeriodStart, sub.currentPeriodEnd, now);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change your plan"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={target === sub.planId}
            onClick={() => {
              s.changePlan(subId, target);
              onClose();
              onDone();
            }}
          >
            Switch plan
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {s.plans
          .filter((p) => p.status === "active")
          .map((p) => {
            const amount = p.pricingModel === "per_seat" ? p.amount * sub.quantity : p.amount;
            const selected = target === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setTarget(p.id)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                  selected ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">
                    {p.name} {p.id === sub.planId && <span className="text-[var(--faint)]">(current)</span>}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{p.description}</div>
                </div>
                <div className="text-sm font-semibold text-[var(--text)]">{naira(amount)}</div>
              </button>
            );
          })}
      </div>

      {target !== sub.planId && (
        <div className="mt-4">
          <ProrationPreview result={pr} oldPlanName={oldPlan.name} newPlanName={newPlan.name} />
        </div>
      )}
    </Modal>
  );
}
