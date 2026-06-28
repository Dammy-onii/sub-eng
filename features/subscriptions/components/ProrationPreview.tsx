import { naira } from "@/lib/format";
import type { ProrationResult } from "@/lib/state-machine";

export function ProrationPreview({
  result,
  oldPlanName,
  newPlanName,
}: {
  result: ProrationResult;
  oldPlanName: string;
  newPlanName: string;
}) {
  const { daysRemaining, daysTotal, unusedCredit, proratedCharge, netToday } = result;
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-4 text-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--faint)]">
        Proration · {daysRemaining} of {daysTotal} days left
      </p>
      <div className="flex justify-between py-0.5 text-[var(--muted)]">
        <span>Unused credit ({oldPlanName})</span>
        <span>− {naira(unusedCredit)}</span>
      </div>
      <div className="flex justify-between py-0.5 text-[var(--muted)]">
        <span>Prorated {newPlanName}</span>
        <span>{naira(proratedCharge)}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
        <span>Charged today</span>
        <span className={netToday < 0 ? "text-[var(--green)]" : "text-[var(--text)]"}>
          {netToday < 0 ? `${naira(Math.abs(netToday))} credit` : naira(netToday)}
        </span>
      </div>
    </div>
  );
}
