"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { naira } from "@/lib/format";
import { computeProration } from "@/lib/state-machine";
import { Button, Modal, Select } from "@/components/ui";
import { ProrationPreview } from "./ProrationPreview";

export function ChangePlanModal({
  open,
  onClose,
  subId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  subId: string;
  onDone?: () => void;
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
      title="Change plan"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={target === sub.planId}
            onClick={() => {
              s.changePlan(subId, target);
              onClose();
              onDone?.();
            }}
          >
            Confirm change
          </Button>
        </>
      }
    >
      <Select value={target} onChange={(e) => setTarget(e.target.value)}>
        {s.plans
          .filter((p) => p.status === "active")
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {naira(p.amount)}
            </option>
          ))}
      </Select>

      <div className="mt-4">
        <ProrationPreview result={pr} oldPlanName={oldPlan.name} newPlanName={newPlan.name} />
      </div>
    </Modal>
  );
}
