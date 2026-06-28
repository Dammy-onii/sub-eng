"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  BillingCycle,
  DunningSettings,
  Subscription,
  SubStatus,
} from "../types";
import {
  seedPlans,
  seedCycles,
  seedCustomers,
  seedSubscriptions,
  seedInvoices,
  seedDunning,
  seedEvents,
  seedEndpoints,
  seedDunningSettings,
} from "../seed";
import { reducer, type StoreState, type PlanInput } from "./reducer";
import * as select from "./selectors";

let counter = 1000;
const uid = (prefix: string) => `${prefix}_${(++counter).toString(36)}`;
const now = () => new Date().toISOString();

const initialState: StoreState = {
  plans: seedPlans,
  cycles: seedCycles,
  customers: seedCustomers,
  subscriptions: seedSubscriptions,
  invoices: seedInvoices,
  dunning: seedDunning,
  events: seedEvents,
  endpoints: seedEndpoints,
  dunningSettings: seedDunningSettings,
};

export interface StoreApi extends StoreState {
  // selectors
  getPlan: (id: string) => ReturnType<typeof select.getPlan>;
  getCustomer: (id: string) => ReturnType<typeof select.getCustomer>;
  getSubscription: (id: string) => ReturnType<typeof select.getSubscription>;
  getCycle: (id: string) => ReturnType<typeof select.getCycle>;
  plansUsingCycle: (id: string) => number;
  subscriptionsUsingPlan: (id: string) => number;
  subsForCustomer: (id: string) => Subscription[];
  invoicesForSub: (id: string) => ReturnType<typeof select.invoicesForSub>;
  invoicesForCustomer: (id: string) => ReturnType<typeof select.invoicesForCustomer>;
  monthlyAmount: (sub: Subscription) => number;
  metrics: () => ReturnType<typeof select.metrics>;
  // actions
  addPlan: (input: PlanInput) => void;
  updatePlan: (id: string, input: PlanInput) => void;
  archivePlan: (id: string) => void;
  unarchivePlan: (id: string) => void;
  deletePlan: (id: string) => void;
  addCycle: (input: Omit<BillingCycle, "id">) => void;
  deleteCycle: (id: string) => void;
  addCustomer: (c: { name: string; email: string }) => string;
  updateCard: (customerId: string, last4: string) => void;
  createSubscription: (input: {
    customerId: string;
    planId: string;
    quantity: number;
    withTrial: boolean;
  }) => string;
  setSubStatus: (id: string, status: SubStatus, note?: string) => void;
  cancelSubscription: (id: string, atPeriodEnd: boolean) => void;
  pauseSubscription: (id: string) => void;
  resumeSubscription: (id: string) => void;
  changePlan: (subId: string, newPlanId: string) => void;
  retryDunning: (caseId: string, force?: "succeed" | "fail") => boolean;
  updateDunningSettings: (patch: Partial<DunningSettings>) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const api = useMemo<StoreApi>(() => {
    return {
      ...state,

      getPlan: (id) => select.getPlan(state, id),
      getCustomer: (id) => select.getCustomer(state, id),
      getSubscription: (id) => select.getSubscription(state, id),
      getCycle: (id) => select.getCycle(state, id),
      plansUsingCycle: (id) => select.plansUsingCycle(state, id),
      subscriptionsUsingPlan: (id) => select.subscriptionsUsingPlan(state, id),
      subsForCustomer: (id) => select.subsForCustomer(state, id),
      invoicesForSub: (id) => select.invoicesForSub(state, id),
      invoicesForCustomer: (id) => select.invoicesForCustomer(state, id),
      monthlyAmount: (sub) => select.monthlyAmount(state, sub),
      metrics: () => select.metrics(state),

      addPlan: (input) =>
        dispatch({ type: "ADD_PLAN", input, id: uid("plan"), ts: now(), evtId: uid("evt") }),
      updatePlan: (id, input) =>
        dispatch({ type: "UPDATE_PLAN", id, input, ts: now(), evtId: uid("evt") }),
      archivePlan: (id) => dispatch({ type: "TOGGLE_PLAN_ARCHIVE", id, archived: true }),
      unarchivePlan: (id) => dispatch({ type: "TOGGLE_PLAN_ARCHIVE", id, archived: false }),
      deletePlan: (id) => dispatch({ type: "DELETE_PLAN", id }),
      addCycle: (input) => dispatch({ type: "ADD_CYCLE", cycle: { ...input, id: uid("cyc") } }),
      deleteCycle: (id) => dispatch({ type: "DELETE_CYCLE", id }),

      addCustomer: ({ name, email }) => {
        const id = uid("cus");
        dispatch({ type: "ADD_CUSTOMER", name, email, id, ts: now(), evtId: uid("evt") });
        return id;
      },

      updateCard: (customerId, last4) =>
        dispatch({ type: "UPDATE_CARD", customerId, last4, token: uid("tok"), ts: now(), evtId: uid("evt") }),

      createSubscription: (input) => {
        const subId = uid("sub");
        dispatch({
          type: "CREATE_SUBSCRIPTION",
          input,
          ids: { subId, invId: uid("in"), evtSub: uid("evt"), evtInv: uid("evt") },
          ts: now(),
        });
        return subId;
      },

      setSubStatus: (id, status, note) =>
        dispatch({ type: "SET_SUB_STATUS", id, status, note: note ?? `Status → ${status}`, evtId: uid("evt"), ts: now() }),
      cancelSubscription: (id, atPeriodEnd) =>
        dispatch({ type: "CANCEL_SUB", id, atPeriodEnd, evtId: uid("evt"), ts: now() }),
      pauseSubscription: (id) => dispatch({ type: "PAUSE_SUB", id, evtId: uid("evt"), ts: now() }),
      resumeSubscription: (id) => dispatch({ type: "RESUME_SUB", id, evtId: uid("evt"), ts: now() }),

      changePlan: (subId, newPlanId) =>
        dispatch({
          type: "CHANGE_PLAN",
          subId,
          newPlanId,
          ids: { invId: uid("in"), evtPlan: uid("evt"), evtInv: uid("evt") },
          ts: now(),
        }),

      retryDunning: (caseId, force) => {
        const succeed = force === "succeed" ? true : force === "fail" ? false : Math.random() > 0.45;
        dispatch({ type: "RETRY_DUNNING", caseId, succeed, ts: now(), ids: { evt1: uid("evt"), evt2: uid("evt") } });
        return succeed;
      },

      updateDunningSettings: (patch) => dispatch({ type: "UPDATE_DUNNING_SETTINGS", patch }),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
