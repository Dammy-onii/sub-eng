// ---------------------------------------------------------------------------
// Domain model for the Nomba Recur subscriptions engine.
// All money is stored in kobo (1 NGN = 100 kobo), matching how Nomba's
// Charge/Checkout APIs represent amounts.
// ---------------------------------------------------------------------------

export type Interval = "monthly" | "annual" | "custom";
export type IntervalUnit = "day" | "week" | "month";
export type PricingModel = "flat" | "per_seat" | "usage";

/** A reusable billing cadence that plans reference. */
export interface BillingCycle {
  id: string;
  label: string;
  interval: Interval;
  intervalCount: number;
  intervalUnit: IntervalUnit;
  builtIn?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  amount: number; // kobo, per interval (or per unit for per_seat/usage)
  currency: "NGN";
  cycleId: string;
  interval: Interval;
  intervalCount: number;
  intervalUnit: IntervalUnit;
  pricingModel: PricingModel;
  prorationEnabled: boolean;
  trialDays: number;
  status: "active" | "archived";
  features: string[];
  createdAt: string;
}

// The full subscription lifecycle state machine.
export type SubStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "incomplete"
  | "unpaid";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  // Tokenised card reference (Nomba tokenised-cards primitive).
  card: {
    token: string;
    brand: "Visa" | "Mastercard" | "Verve";
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubStatus;
  quantity: number; // seats
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  createdAt: string;
}

export type InvoiceStatus = "paid" | "open" | "uncollectible" | "void";

export interface Invoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number; // kobo
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  attemptCount: number;
  created: string;
  description: string;
}

// A failed-payment recovery case in the dunning queue.
export interface DunningCase {
  id: string;
  invoiceId: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  attempt: number; // attempts so far
  maxAttempts: number;
  lastAttemptAt: string;
  nextRetryAt: string | null;
  lastError: string;
  status: "retrying" | "recovered" | "exhausted";
}

export type RetryStrategy = "fixed" | "exponential" | "smart";
export type ExhaustedAction = "mark_unpaid" | "cancel" | "downgrade_free";

/** Tenant-level policy that governs how failed payments are handled. */
export interface DunningSettings {
  maxRetries: number;
  retryStrategy: RetryStrategy;
  retryIntervalDays: number; // base gap for fixed / exponential
  gracePeriodDays: number; // keep access this long after first failure
  exhaustedAction: ExhaustedAction;
  pauseAccessDuringDunning: boolean;
  emailOnFailure: boolean;
  retryOnCardUpdate: boolean; // retry immediately when customer fixes card
}

export type WebhookStatus = "delivered" | "failed" | "pending";

export interface WebhookEvent {
  id: string;
  type: string; // e.g. subscription.created
  created: string;
  status: WebhookStatus;
  object: string; // related object id
  summary: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "enabled" | "disabled";
  createdAt: string;
}
