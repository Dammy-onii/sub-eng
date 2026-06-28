"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Plan, PricingModel } from "@/lib/types";
import { Button, Field, Input, Modal, Select, Textarea, Toggle } from "@/components/ui";

interface Props {
  onClose: () => void;
  /** When provided, the modal edits this plan; otherwise it creates one. */
  plan?: Plan | null;
}

const blankForm = {
  name: "",
  description: "",
  amount: "2500",
  cycleId: "cyc_monthly",
  pricingModel: "flat" as PricingModel,
  trialDays: "0",
  proration: true,
  features: "",
};

/**
 * Mounted only while open (see PlansPage), so the initial state below is
 * derived directly from `plan` — no syncing effect required.
 */
export function PlanFormModal({ onClose, plan }: Props) {
  const s = useStore();
  const isEdit = Boolean(plan);
  const [form, setForm] = useState(() =>
    plan
      ? {
          name: plan.name,
          description: plan.description,
          amount: String(plan.amount / 100),
          cycleId: plan.cycleId,
          pricingModel: plan.pricingModel,
          trialDays: String(plan.trialDays),
          proration: plan.prorationEnabled,
          features: plan.features.join("\n"),
        }
      : blankForm
  );

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    if (!form.name.trim()) return;
    const cycle = s.getCycle(form.cycleId) ?? s.cycles[0];
    const input = {
      name: form.name.trim(),
      description: form.description.trim() || "—",
      amount: Math.round(Number(form.amount) * 100),
      cycleId: cycle.id,
      interval: cycle.interval,
      intervalCount: cycle.intervalCount,
      intervalUnit: cycle.intervalUnit,
      pricingModel: form.pricingModel,
      prorationEnabled: form.proration,
      trialDays: Number(form.trialDays),
      features: form.features
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    if (isEdit && plan) s.updatePlan(plan.id, input);
    else s.addPlan(input);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit plan" : "Create a plan"}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? "Save changes" : "Create plan"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Plan name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pro Monthly" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Shown in checkout and the customer portal" />
          </Field>
        </div>
        <Field label="Amount (₦)" hint="Per interval, or per seat/unit">
          <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
        </Field>
        <Field label="Pricing model">
          <Select value={form.pricingModel} onChange={(e) => set("pricingModel", e.target.value as PricingModel)}>
            <option value="flat">Flat rate</option>
            <option value="per_seat">Per seat</option>
            <option value="usage">Usage-based</option>
          </Select>
        </Field>
        <Field label="Billing cycle" hint="Managed in “Billing cycles”">
          <Select value={form.cycleId} onChange={(e) => set("cycleId", e.target.value)}>
            {s.cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Trial (days)">
          <Input type="number" value={form.trialDays} onChange={(e) => set("trialDays", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Features" hint="One per line">
            <Textarea rows={3} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder={"Unlimited subscribers\nPriority support"} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Toggle
            checked={form.proration}
            onChange={(v) => set("proration", v)}
            label="Enable proration on mid-cycle plan changes"
            hint="Credit unused time and charge the new plan's remainder"
          />
        </div>
      </div>
    </Modal>
  );
}
