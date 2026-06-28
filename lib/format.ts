import type { Interval, SubStatus, InvoiceStatus } from "./types";

export type Tone = "green" | "amber" | "red" | "blue" | "slate" | "brand";

export function naira(kobo: number): string {
  const value = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return mins <= 0 ? `in ${-mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return hrs <= 0 ? `in ${-hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days <= 0 ? `in ${-days}d` : `${days}d ago`;
}

export function intervalSuffix(interval: Interval, count = 1): string {
  if (interval === "monthly") return "/mo";
  if (interval === "annual") return "/yr";
  return `/${count}d`;
}

export const SUB_STATUS_META: Record<
  SubStatus,
  { label: string; tone: Tone; desc: string }
> = {
  trialing: { label: "Trialing", tone: "blue", desc: "In free trial, no charge yet" },
  active: { label: "Active", tone: "green", desc: "Paid and current" },
  past_due: { label: "Past due", tone: "amber", desc: "Payment failed, recovering" },
  paused: { label: "Paused", tone: "slate", desc: "Billing temporarily halted" },
  canceled: { label: "Canceled", tone: "slate", desc: "Ended by customer or merchant" },
  incomplete: { label: "Incomplete", tone: "amber", desc: "First payment not confirmed" },
  unpaid: { label: "Unpaid", tone: "red", desc: "Dunning exhausted" },
};

export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: Tone }
> = {
  paid: { label: "Paid", tone: "green" },
  open: { label: "Open", tone: "amber" },
  uncollectible: { label: "Uncollectible", tone: "red" },
  void: { label: "Void", tone: "slate" },
};
