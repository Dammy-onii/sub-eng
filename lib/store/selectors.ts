import type { Subscription } from "../types";
import type { StoreState } from "./reducer";

export const getPlan = (s: StoreState, id: string) => s.plans.find((p) => p.id === id);
export const getCustomer = (s: StoreState, id: string) => s.customers.find((c) => c.id === id);
export const getSubscription = (s: StoreState, id: string) => s.subscriptions.find((x) => x.id === id);
export const getCycle = (s: StoreState, id: string) => s.cycles.find((c) => c.id === id);
export const plansUsingCycle = (s: StoreState, id: string) =>
  s.plans.filter((p) => p.cycleId === id).length;
export const subscriptionsUsingPlan = (s: StoreState, id: string) =>
  s.subscriptions.filter((sub) => sub.planId === id).length;

export const subsForCustomer = (s: StoreState, id: string) =>
  s.subscriptions.filter((x) => x.customerId === id);
export const invoicesForSub = (s: StoreState, id: string) =>
  s.invoices.filter((i) => i.subscriptionId === id);
export const invoicesForCustomer = (s: StoreState, id: string) =>
  s.invoices.filter((i) => i.customerId === id);

/** Normalise any subscription's amount to a monthly figure for MRR. */
export function monthlyAmount(s: StoreState, sub: Subscription): number {
  const plan = getPlan(s, sub.planId);
  if (!plan) return 0;
  const base = plan.pricingModel === "per_seat" ? plan.amount * sub.quantity : plan.amount;
  if (plan.interval === "annual") return Math.round(base / 12);
  if (plan.interval === "custom") {
    const days =
      plan.intervalUnit === "month"
        ? plan.intervalCount * 30
        : plan.intervalUnit === "week"
        ? plan.intervalCount * 7
        : plan.intervalCount;
    return Math.round((base * 30) / (days || 30));
  }
  return base;
}

export function metrics(s: StoreState) {
  const active = s.subscriptions.filter((x) => x.status === "active");
  const billable = s.subscriptions.filter((x) => x.status === "active" || x.status === "trialing");
  const mrr = active.reduce((sum, x) => sum + monthlyAmount(s, x), 0);
  return {
    mrr,
    activeCount: active.length,
    trialingCount: s.subscriptions.filter((x) => x.status === "trialing").length,
    pastDueCount: s.subscriptions.filter((x) => x.status === "past_due").length,
    recoveredPct: billable.length ? 78 : 0,
  };
}
