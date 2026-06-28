"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Interval, IntervalUnit } from "@/lib/types";
import { Badge, Button, Field, Input, Modal, Select } from "@/components/ui";

export function BillingCyclesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [label, setLabel] = useState("");
  const [interval, setInterval] = useState<Interval>("custom");
  const [count, setCount] = useState("2");
  const [unit, setUnit] = useState<IntervalUnit>("month");

  function add() {
    if (!label.trim()) return;
    s.addCycle({
      label: label.trim(),
      interval,
      intervalCount: interval === "custom" ? Number(count) : 1,
      intervalUnit: unit,
    });
    setLabel("");
    setCount("2");
  }

  return (
    <Modal open={open} onClose={onClose} title="Billing cycles" wide
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}
    >
      <p className="mb-3 text-xs text-[var(--muted)]">
        Cycles are reusable cadences your plans bill on. Add custom ones (e.g. quarterly, every 45 days) and pick them
        when creating a plan.
      </p>

      <div className="mb-4 divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
        {s.cycles.map((c) => {
          const usedBy = s.plansUsingCycle(c.id);
          const locked = Boolean(c.builtIn) || usedBy > 0;
          const reason = c.builtIn
            ? "Built-in cycle"
            : usedBy > 0
            ? `Used by ${usedBy} plan${usedBy > 1 ? "s" : ""}`
            : "";
          return (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-[var(--text)]">{c.label}</span>
                <span className="ml-2 text-xs text-[var(--faint)]">
                  {c.interval === "monthly"
                    ? "every month"
                    : c.interval === "annual"
                    ? "every year"
                    : `every ${c.intervalCount} ${c.intervalUnit}${c.intervalCount > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={c.builtIn ? "slate" : "brand"}>{c.builtIn ? "Built-in" : "Custom"}</Badge>
                <button
                  onClick={() => s.deleteCycle(c.id)}
                  disabled={locked}
                  title={locked ? reason : "Delete cycle"}
                  className="text-xs font-medium text-[var(--muted)] enabled:hover:text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-[var(--surface-2)] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--faint)]">Add a cycle</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Label">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Quarterly" />
            </Field>
          </div>
          <Field label="Type">
            <Select value={interval} onChange={(e) => setInterval(e.target.value as Interval)}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </Select>
          </Field>
          {interval === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Every">
                <Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />
              </Field>
              <Field label="Unit">
                <Select value={unit} onChange={(e) => setUnit(e.target.value as IntervalUnit)}>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </Select>
              </Field>
            </div>
          )}
        </div>
        <Button className="mt-3" onClick={add}>Add cycle</Button>
      </div>
    </Modal>
  );
}
