"use client";

import { useStore } from "@/lib/store";
import { SUB_STATUS_META } from "@/lib/format";
import { allowedEvents } from "@/lib/state-machine";
import type { Subscription } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

export function LifecyclePanel({
  sub,
  onChangePlan,
}: {
  sub: Subscription;
  onChangePlan: () => void;
}) {
  const s = useStore();
  const meta = SUB_STATUS_META[sub.status];
  const edges = allowedEvents(sub.status);

  return (
    <>
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">Lifecycle</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Actions available from <b>{meta.label}</b>:
        </p>
        <div className="space-y-2">
          {edges.length === 0 && <p className="text-xs text-[var(--faint)]">Terminal state — no transitions.</p>}

          {sub.status === "active" && (
            <>
              <Button variant="secondary" className="w-full" onClick={() => s.pauseSubscription(sub.id)}>
                Pause billing
              </Button>
              <Button variant="secondary" className="w-full" onClick={onChangePlan}>
                Change plan (proration)
              </Button>
            </>
          )}
          {sub.status === "paused" && (
            <Button variant="secondary" className="w-full" onClick={() => s.resumeSubscription(sub.id)}>
              Resume billing
            </Button>
          )}
          {sub.status === "past_due" && (
            <Button className="w-full" onClick={() => s.setSubStatus(sub.id, "active", "Manually marked recovered")}>
              Mark recovered
            </Button>
          )}
          {sub.status !== "canceled" && sub.status !== "unpaid" && (
            <>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => s.cancelSubscription(sub.id, true)}
                disabled={sub.cancelAtPeriodEnd}
              >
                {sub.cancelAtPeriodEnd ? "Scheduled to cancel" : "Cancel at period end"}
              </Button>
              <Button variant="danger" className="w-full" onClick={() => s.cancelSubscription(sub.id, false)}>
                Cancel immediately
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Possible transitions</h2>
        <ul className="space-y-2 text-xs">
          {edges.map((e) => (
            <li key={e.event} className="flex items-start gap-2">
              <Badge tone={SUB_STATUS_META[e.to].tone}>{SUB_STATUS_META[e.to].label}</Badge>
              <span className="text-[var(--muted)]">{e.note}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
