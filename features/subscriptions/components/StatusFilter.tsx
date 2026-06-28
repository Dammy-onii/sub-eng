"use client";

import type { SubStatus } from "@/lib/types";
import { SUB_STATUS_META } from "@/lib/format";

export type SubFilter = "all" | SubStatus;

export const SUB_FILTERS: SubFilter[] = [
  "all",
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
];

export function StatusFilter({
  value,
  counts,
  onChange,
}: {
  value: SubFilter;
  counts: Record<SubFilter, number>;
  onChange: (f: SubFilter) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {SUB_FILTERS.map((f) => {
        const active = value === f;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--ink)] text-white"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {f === "all" ? "All" : SUB_STATUS_META[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        );
      })}
    </div>
  );
}
