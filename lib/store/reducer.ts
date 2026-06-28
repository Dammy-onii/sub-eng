import type {
  Plan,
  Customer,
  Subscription,
  Invoice,
  DunningCase,
  WebhookEvent,
  WebhookEndpoint,
  BillingCycle,
  DunningSettings,
  SubStatus,
} from "../types";
import { computeProration, retryGapDays } from "../state-machine";

export interface StoreState {
  plans: Plan[];
  cycles: BillingCycle[];
  customers: Customer[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  dunning: DunningCase[];
  events: WebhookEvent[];
  endpoints: WebhookEndpoint[];
  dunningSettings: DunningSettings;
}

/** Inputs that the UI provides; ids/timestamps/rng are injected by actions
 *  so the reducer itself stays pure and deterministic. */
export type PlanInput = Omit<
  Plan,
  "id" | "createdAt" | "currency" | "status"
>;

export type Action =
  | { type: "ADD_PLAN"; input: PlanInput; id: string; ts: string; evtId: string }
  | { type: "UPDATE_PLAN"; id: string; input: PlanInput; ts: string; evtId: string }
  | { type: "TOGGLE_PLAN_ARCHIVE"; id: string; archived: boolean }
  | { type: "DELETE_PLAN"; id: string }
  | { type: "ADD_CYCLE"; cycle: BillingCycle }
  | { type: "DELETE_CYCLE"; id: string }
  | { type: "ADD_CUSTOMER"; name: string; email: string; id: string; ts: string; evtId: string }
  | { type: "UPDATE_CARD"; customerId: string; last4: string; token: string; ts: string; evtId: string }
  | {
      type: "CREATE_SUBSCRIPTION";
      input: { customerId: string; planId: string; quantity: number; withTrial: boolean };
      ids: { subId: string; invId: string; evtSub: string; evtInv: string };
      ts: string;
    }
  | { type: "SET_SUB_STATUS"; id: string; status: SubStatus; note: string; evtId: string; ts: string }
  | { type: "CANCEL_SUB"; id: string; atPeriodEnd: boolean; evtId: string; ts: string }
  | { type: "PAUSE_SUB"; id: string; evtId: string; ts: string }
  | { type: "RESUME_SUB"; id: string; evtId: string; ts: string }
  | {
      type: "CHANGE_PLAN";
      subId: string;
      newPlanId: string;
      ids: { invId: string; evtPlan: string; evtInv: string };
      ts: string;
    }
  | { type: "RETRY_DUNNING"; caseId: string; succeed: boolean; ts: string; ids: { evt1: string; evt2: string } }
  | { type: "UPDATE_DUNNING_SETTINGS"; patch: Partial<DunningSettings> };

function evt(
  id: string,
  type: string,
  object: string,
  summary: string,
  ts: string
): WebhookEvent {
  return { id, type, object, summary, created: ts, status: "delivered" };
}

function periodEndFrom(plan: Plan, from: Date): Date {
  const end = new Date(from);
  if (plan.interval === "annual") end.setFullYear(from.getFullYear() + 1);
  else if (plan.interval === "custom") {
    if (plan.intervalUnit === "month") end.setMonth(from.getMonth() + plan.intervalCount);
    else if (plan.intervalUnit === "week") end.setDate(from.getDate() + plan.intervalCount * 7);
    else end.setDate(from.getDate() + plan.intervalCount);
  } else end.setMonth(from.getMonth() + 1);
  return end;
}

function planAmount(plan: Plan, qty: number): number {
  return plan.pricingModel === "per_seat" ? plan.amount * qty : plan.amount;
}

export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "ADD_PLAN": {
      const plan: Plan = {
        ...action.input,
        id: action.id,
        currency: "NGN",
        status: "active",
        createdAt: action.ts,
      };
      return {
        ...state,
        plans: [plan, ...state.plans],
        events: [evt(action.evtId, "plan.created", plan.id, `${plan.name} created`, action.ts), ...state.events],
      };
    }

    case "UPDATE_PLAN": {
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.id ? { ...p, ...action.input } : p
        ),
        events: [evt(action.evtId, "plan.updated", action.id, `${action.input.name} updated`, action.ts), ...state.events],
      };
    }

    case "TOGGLE_PLAN_ARCHIVE":
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.id ? { ...p, status: action.archived ? "archived" : "active" } : p
        ),
      };

    case "DELETE_PLAN":
      // Guard: a plan with existing subscriptions must be archived, not deleted,
      // so historical invoices/subscriptions keep a valid reference.
      if (state.subscriptions.some((sub) => sub.planId === action.id)) return state;
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };

    case "ADD_CYCLE":
      return { ...state, cycles: [...state.cycles, action.cycle] };

    case "DELETE_CYCLE":
      // Guard: never drop a built-in cycle or one a plan still references.
      if (
        state.cycles.find((c) => c.id === action.id)?.builtIn ||
        state.plans.some((p) => p.cycleId === action.id)
      ) {
        return state;
      }
      return { ...state, cycles: state.cycles.filter((c) => c.id !== action.id) };

    case "ADD_CUSTOMER": {
      const customer: Customer = {
        id: action.id,
        name: action.name,
        email: action.email,
        card: null,
        createdAt: action.ts,
      };
      return {
        ...state,
        customers: [customer, ...state.customers],
        events: [evt(action.evtId, "customer.created", customer.id, `${action.name} added`, action.ts), ...state.events],
      };
    }

    case "UPDATE_CARD":
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.customerId
            ? { ...c, card: { token: action.token, brand: "Visa", last4: action.last4, expMonth: 12, expYear: 2029 } }
            : c
        ),
        events: [evt(action.evtId, "customer.card_updated", action.customerId, `Card ending ${action.last4} tokenised`, action.ts), ...state.events],
      };

    case "CREATE_SUBSCRIPTION": {
      const plan = state.plans.find((p) => p.id === action.input.planId);
      if (!plan) return state;
      const now = new Date(action.ts);
      const trialing = action.input.withTrial && plan.trialDays > 0;
      const trialEnd = new Date(now);
      trialEnd.setDate(now.getDate() + plan.trialDays);
      const periodEnd = trialing ? trialEnd : periodEndFrom(plan, now);

      const sub: Subscription = {
        id: action.ids.subId,
        customerId: action.input.customerId,
        planId: action.input.planId,
        status: trialing ? "trialing" : "active",
        quantity: action.input.quantity,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        trialEnd: trialing ? trialEnd.toISOString() : undefined,
        cancelAtPeriodEnd: false,
        createdAt: now.toISOString(),
      };

      const newEvents: WebhookEvent[] = [
        evt(action.ids.evtSub, "subscription.created", sub.id, `${plan.name} for customer`, action.ts),
      ];
      let invoices = state.invoices;
      if (!trialing) {
        const amount = planAmount(plan, action.input.quantity);
        const inv: Invoice = {
          id: action.ids.invId,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          amount,
          status: "paid",
          periodStart: sub.currentPeriodStart,
          periodEnd: sub.currentPeriodEnd,
          attemptCount: 1,
          created: action.ts,
          description: `${plan.name}${plan.pricingModel === "per_seat" ? ` × ${action.input.quantity} seats` : ""}`,
        };
        invoices = [inv, ...invoices];
        newEvents.unshift(evt(action.ids.evtInv, "invoice.paid", inv.id, "First charge settled via Nomba Charge API", action.ts));
      }

      return {
        ...state,
        subscriptions: [sub, ...state.subscriptions],
        invoices,
        events: [...newEvents, ...state.events],
      };
    }

    case "SET_SUB_STATUS":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.id ? { ...s, status: action.status } : s
        ),
        events: [evt(action.evtId, "subscription.updated", action.id, action.note, action.ts), ...state.events],
      };

    case "CANCEL_SUB":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.id
            ? action.atPeriodEnd
              ? { ...s, cancelAtPeriodEnd: true }
              : { ...s, status: "canceled", cancelAtPeriodEnd: false }
            : s
        ),
        events: [
          evt(action.evtId, "subscription.canceled", action.id, action.atPeriodEnd ? "Scheduled to cancel at period end" : "Canceled immediately", action.ts),
          ...state.events,
        ],
      };

    case "PAUSE_SUB":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) => (s.id === action.id ? { ...s, status: "paused" } : s)),
        events: [evt(action.evtId, "subscription.paused", action.id, "Billing paused", action.ts), ...state.events],
      };

    case "RESUME_SUB":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) => (s.id === action.id ? { ...s, status: "active" } : s)),
        events: [evt(action.evtId, "subscription.resumed", action.id, "Billing resumed", action.ts), ...state.events],
      };

    case "CHANGE_PLAN": {
      const sub = state.subscriptions.find((s) => s.id === action.subId);
      const oldPlan = sub && state.plans.find((p) => p.id === sub.planId);
      const newPlan = state.plans.find((p) => p.id === action.newPlanId);
      if (!sub || !oldPlan || !newPlan) return state;
      const pr = computeProration(
        planAmount(oldPlan, sub.quantity),
        planAmount(newPlan, sub.quantity),
        sub.currentPeriodStart,
        sub.currentPeriodEnd,
        new Date(action.ts)
      );
      const subscriptions = state.subscriptions.map((s) =>
        s.id === action.subId ? { ...s, planId: action.newPlanId } : s
      );
      const newEvents: WebhookEvent[] = [
        evt(action.ids.evtPlan, "subscription.updated", action.subId, `Plan changed to ${newPlan.name}`, action.ts),
      ];
      let invoices = state.invoices;
      if (pr.netToday > 0) {
        const inv: Invoice = {
          id: action.ids.invId,
          subscriptionId: action.subId,
          customerId: sub.customerId,
          amount: pr.netToday,
          status: "paid",
          periodStart: action.ts,
          periodEnd: sub.currentPeriodEnd,
          attemptCount: 1,
          created: action.ts,
          description: `Proration: ${oldPlan.name} → ${newPlan.name}`,
        };
        invoices = [inv, ...invoices];
        newEvents.unshift(evt(action.ids.evtInv, "invoice.paid", inv.id, `Prorated charge to ${newPlan.name}`, action.ts));
      }
      return { ...state, subscriptions, invoices, events: [...newEvents, ...state.events] };
    }

    case "RETRY_DUNNING": {
      const dc = state.dunning.find((d) => d.id === action.caseId);
      if (!dc) return state;
      const { maxRetries, retryStrategy, retryIntervalDays, exhaustedAction } = state.dunningSettings;

      if (action.succeed) {
        return {
          ...state,
          dunning: state.dunning.map((d) =>
            d.id === action.caseId ? { ...d, status: "recovered", nextRetryAt: null } : d
          ),
          invoices: state.invoices.map((i) => (i.id === dc.invoiceId ? { ...i, status: "paid" } : i)),
          subscriptions: state.subscriptions.map((s) =>
            s.id === dc.subscriptionId ? { ...s, status: "active" } : s
          ),
          events: [
            evt(action.ids.evt1, "invoice.paid", dc.invoiceId, "Recovered via dunning retry", action.ts),
            evt(action.ids.evt2, "subscription.updated", dc.subscriptionId, "past_due → active (recovered)", action.ts),
            ...state.events,
          ],
        };
      }

      const attempt = dc.attempt + 1;
      const exhausted = attempt >= maxRetries;
      const gap = retryGapDays(attempt, retryStrategy, retryIntervalDays);
      const dunning = state.dunning.map((d) =>
        d.id === action.caseId
          ? {
              ...d,
              attempt,
              maxAttempts: maxRetries,
              lastAttemptAt: action.ts,
              status: (exhausted ? "exhausted" : "retrying") as DunningCase["status"],
              nextRetryAt: exhausted ? null : new Date(new Date(action.ts).getTime() + gap * 86400000).toISOString(),
            }
          : d
      );

      if (exhausted) {
        const exhaustedStatus: SubStatus = exhaustedAction === "cancel" ? "canceled" : "unpaid";
        return {
          ...state,
          dunning,
          subscriptions: state.subscriptions.map((s) =>
            s.id === dc.subscriptionId ? { ...s, status: exhaustedStatus } : s
          ),
          invoices: state.invoices.map((i) =>
            i.id === dc.invoiceId ? { ...i, status: "uncollectible" } : i
          ),
          events: [
            evt(action.ids.evt1, "subscription.updated", dc.subscriptionId, `Dunning exhausted → ${exhaustedStatus}`, action.ts),
            ...state.events,
          ],
        };
      }

      return {
        ...state,
        dunning,
        events: [evt(action.ids.evt1, "invoice.payment_failed", dc.invoiceId, `Retry ${attempt} failed`, action.ts), ...state.events],
      };
    }

    case "UPDATE_DUNNING_SETTINGS":
      return { ...state, dunningSettings: { ...state.dunningSettings, ...action.patch } };

    default:
      return state;
  }
}
