"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { DunningSettings, ExhaustedAction, RetryStrategy } from "@/lib/types";
import { buildRetrySchedule } from "@/lib/state-machine";
import { Button, Field, Input, Modal, Select, Toggle } from "@/components/ui";

/** Mounted only while open (see DunningPage); draft seeds from saved settings. */
export function DunningSettingsModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [draft, setDraft] = useState<DunningSettings>(() => s.dunningSettings);

  const set = <K extends keyof DunningSettings>(key: K, value: DunningSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const preview = buildRetrySchedule(draft.maxRetries, draft.retryStrategy, draft.retryIntervalDays);

  return (
    <Modal
      open
      onClose={onClose}
      title="Failed-payment handling"
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { s.updateDunningSettings(draft); onClose(); }}>Save settings</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max retries before giving up" hint="How many charge attempts before the exhausted action">
            <Input
              type="number"
              min={1}
              max={10}
              value={draft.maxRetries}
              onChange={(e) => set("maxRetries", Math.max(1, Number(e.target.value)))}
            />
          </Field>
          <Field label="Retry strategy">
            <Select value={draft.retryStrategy} onChange={(e) => set("retryStrategy", e.target.value as RetryStrategy)}>
              <option value="smart">Smart (optimised windows)</option>
              <option value="fixed">Fixed interval</option>
              <option value="exponential">Exponential backoff</option>
            </Select>
          </Field>
          <Field label="Base interval (days)" hint="Used by fixed & exponential">
            <Input
              type="number"
              min={1}
              value={draft.retryIntervalDays}
              onChange={(e) => set("retryIntervalDays", Math.max(1, Number(e.target.value)))}
              disabled={draft.retryStrategy === "smart"}
            />
          </Field>
          <Field label="Grace period (days)" hint="Keep access this long after the first failure">
            <Input
              type="number"
              min={0}
              value={draft.gracePeriodDays}
              onChange={(e) => set("gracePeriodDays", Math.max(0, Number(e.target.value)))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="When retries are exhausted">
              <Select value={draft.exhaustedAction} onChange={(e) => set("exhaustedAction", e.target.value as ExhaustedAction)}>
                <option value="mark_unpaid">Mark subscription unpaid (keep record)</option>
                <option value="cancel">Cancel the subscription</option>
                <option value="downgrade_free">Downgrade to free tier</option>
              </Select>
            </Field>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
          <Toggle
            checked={draft.retryOnCardUpdate}
            onChange={(v) => set("retryOnCardUpdate", v)}
            label="Retry immediately when the customer updates their card"
            hint="A customer.card_updated event triggers an out-of-schedule charge"
          />
          <Toggle
            checked={draft.pauseAccessDuringDunning}
            onChange={(v) => set("pauseAccessDuringDunning", v)}
            label="Suspend access during dunning"
            hint="Off = soft dunning (keep access while retrying); On = hard dunning"
          />
          <Toggle
            checked={draft.emailOnFailure}
            onChange={(v) => set("emailOnFailure", v)}
            label="Email the customer on each failed attempt"
            hint="Includes a link to the self-service portal to fix their card"
          />
        </div>

        <div className="rounded-lg bg-[var(--surface-2)] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--faint)]">Resulting schedule</p>
          <div className="flex flex-wrap items-center gap-2">
            {preview.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)]">
                  #{i + 1} <span className="text-[var(--faint)]">{step}</span>
                </span>
                {i < preview.length - 1 && <span className="text-[var(--faint)]">→</span>}
              </div>
            ))}
            <span className="text-[var(--faint)]">→</span>
            <span className="rounded-md bg-[var(--red-soft)] px-2.5 py-1 text-xs font-medium text-[var(--red)]">
              {draft.exhaustedAction === "cancel" ? "Cancel" : draft.exhaustedAction === "downgrade_free" ? "Downgrade" : "Mark unpaid"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
