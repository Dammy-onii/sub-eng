import type { ReactNode } from "react";
import type { Tone } from "@/lib/format";
import { Card } from "./Card";
import { toneClass } from "./Badge";

export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--faint)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-[var(--muted)]">
          {tone ? <span className={`${toneClass(tone)} rounded px-1 py-0.5`}>{sub}</span> : sub}
        </div>
      )}
    </Card>
  );
}
