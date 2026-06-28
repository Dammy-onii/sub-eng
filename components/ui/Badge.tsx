import type { ReactNode } from "react";
import type { Tone } from "@/lib/format";

const TONE: Record<Tone, string> = {
  green: "bg-[var(--green-soft)] text-[var(--green)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]",
  blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
  slate: "bg-[var(--slate-soft)] text-[var(--slate-text)]",
  brand: "bg-[var(--brand-soft)] text-[var(--brand-dark)]",
};

export const toneClass = (tone: Tone) => TONE[tone];

export function Badge({
  tone = "slate",
  children,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
