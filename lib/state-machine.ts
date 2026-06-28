import type { SubStatus } from "./types";

// ---------------------------------------------------------------------------
// Subscription lifecycle state machine.
// The engine only ever moves a subscription along these declared edges; every
// edge is triggered by a billing event (Charge result, trial expiry, dunning
// outcome, or an explicit merchant/customer action).
// ---------------------------------------------------------------------------

export type SubEvent =
  | "activate"
  | "trial_start"
  | "trial_converted"
  | "payment_failed"
  | "payment_recovered"
  | "dunning_exhausted"
  | "pause"
  | "resume"
  | "cancel"
  | "first_payment_failed";

interface Edge {
  from: SubStatus;
  event: SubEvent;
  to: SubStatus;
  note: string;
}

export const TRANSITIONS: Edge[] = [
  { from: "incomplete", event: "activate", to: "active", note: "Checkout / first Charge confirmed" },
  { from: "incomplete", event: "first_payment_failed", to: "incomplete", note: "Awaiting a valid card (23h window)" },
  { from: "incomplete", event: "trial_start", to: "trialing", note: "Plan has a trial; card tokenised" },
  { from: "trialing", event: "trial_converted", to: "active", note: "Trial ended, Charge succeeded" },
  { from: "trialing", event: "payment_failed", to: "past_due", note: "Trial ended, Charge declined" },
  { from: "trialing", event: "cancel", to: "canceled", note: "Cancelled during trial" },
  { from: "active", event: "payment_failed", to: "past_due", note: "Renewal Charge declined → dunning" },
  { from: "active", event: "pause", to: "paused", note: "Merchant/customer paused billing" },
  { from: "active", event: "cancel", to: "canceled", note: "Cancelled (now or at period end)" },
  { from: "past_due", event: "payment_recovered", to: "active", note: "Dunning retry Charge succeeded" },
  { from: "past_due", event: "dunning_exhausted", to: "unpaid", note: "All retries failed" },
  { from: "past_due", event: "cancel", to: "canceled", note: "Cancelled while past due" },
  { from: "paused", event: "resume", to: "active", note: "Billing resumed" },
  { from: "paused", event: "cancel", to: "canceled", note: "Cancelled while paused" },
  { from: "unpaid", event: "cancel", to: "canceled", note: "Closed out after dunning" },
];

export function nextStatus(from: SubStatus, event: SubEvent): SubStatus | null {
  const edge = TRANSITIONS.find((t) => t.from === from && t.event === event);
  return edge ? edge.to : null;
}

export function allowedEvents(from: SubStatus): Edge[] {
  return TRANSITIONS.filter((t) => t.from === from && t.from !== t.to);
}

export const STATUS_ORDER: SubStatus[] = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "paused",
  "unpaid",
  "canceled",
];

// ---- proration -------------------------------------------------------------

export interface ProrationResult {
  daysTotal: number;
  daysRemaining: number;
  unusedCredit: number;
  proratedCharge: number;
  netToday: number;
}

export function computeProration(
  oldAmount: number,
  newAmount: number,
  periodStart: string,
  periodEnd: string,
  now: Date = new Date()
): ProrationResult {
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const t = now.getTime();
  const daysTotal = Math.max(1, Math.round((end - start) / 86400000));
  const daysRemaining = Math.max(0, Math.round((end - t) / 86400000));
  const frac = daysRemaining / daysTotal;
  const unusedCredit = Math.round(oldAmount * frac);
  const proratedCharge = Math.round(newAmount * frac);
  return {
    daysTotal,
    daysRemaining,
    unusedCredit,
    proratedCharge,
    netToday: proratedCharge - unusedCredit,
  };
}

// ---- dunning retry scheduling ---------------------------------------------
import type { RetryStrategy } from "./types";

/** Days to wait before the Nth retry, given the tenant's strategy. */
export function retryGapDays(
  attempt: number,
  strategy: RetryStrategy,
  base: number
): number {
  if (strategy === "fixed") return base;
  if (strategy === "exponential") return base * Math.pow(2, attempt - 1);
  // smart: cluster early, then spread out (heuristic billing windows)
  const smart = [0, 1, 3, 5, 7];
  return smart[Math.min(attempt, smart.length - 1)];
}

export function buildRetrySchedule(
  maxRetries: number,
  strategy: RetryStrategy,
  base: number
): string[] {
  const out: string[] = [];
  for (let i = 1; i <= maxRetries; i++) {
    const gap = retryGapDays(i, strategy, base);
    out.push(gap === 0 ? "Immediately" : `+${gap} day${gap > 1 ? "s" : ""}`);
  }
  return out;
}
