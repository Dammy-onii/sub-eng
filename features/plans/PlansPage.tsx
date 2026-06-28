"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Plan } from "@/lib/types";
import { Button, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { PlanCard } from "./components/PlanCard";
import { PlanFormModal } from "./components/PlanFormModal";
import { BillingCyclesModal } from "./components/BillingCyclesModal";

export function PlansPage() {
  const s = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [cyclesOpen, setCyclesOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(plan: Plan) {
    setEditing(plan);
    setFormOpen(true);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Plans"
        description="Define what you sell and how it bills. A plan pins the amount, currency, billing cycle, pricing model and proration policy."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCyclesOpen(true)}>
              <Icon.clock width={16} height={16} /> Billing cycles
            </Button>
            <Button onClick={openCreate}>
              <Icon.plus width={16} height={16} /> New plan
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.plans.map((p) => (
          <PlanCard key={p.id} plan={p} onEdit={openEdit} />
        ))}
      </div>

      {formOpen && <PlanFormModal onClose={() => setFormOpen(false)} plan={editing} />}
      <BillingCyclesModal open={cyclesOpen} onClose={() => setCyclesOpen(false)} />
    </div>
  );
}
