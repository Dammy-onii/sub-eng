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
} from "./types";

// "Now" anchor for the prototype.
const NOW = new Date("2026-06-26T12:00:00Z");
const day = 86400000;
function iso(offsetDays: number): string {
  return new Date(NOW.getTime() + offsetDays * day).toISOString();
}

export const seedCycles: BillingCycle[] = [
  { id: "cyc_monthly", label: "Monthly", interval: "monthly", intervalCount: 1, intervalUnit: "month", builtIn: true },
  { id: "cyc_annual", label: "Annual", interval: "annual", intervalCount: 1, intervalUnit: "month", builtIn: true },
  { id: "cyc_quarterly", label: "Quarterly", interval: "custom", intervalCount: 3, intervalUnit: "month" },
  { id: "cyc_weekly", label: "Weekly", interval: "custom", intervalCount: 7, intervalUnit: "day" },
  { id: "cyc_30d", label: "Every 30 days", interval: "custom", intervalCount: 30, intervalUnit: "day" },
];

export const seedDunningSettings: DunningSettings = {
  maxRetries: 4,
  retryStrategy: "smart",
  retryIntervalDays: 2,
  gracePeriodDays: 3,
  exhaustedAction: "mark_unpaid",
  pauseAccessDuringDunning: false,
  emailOnFailure: true,
  retryOnCardUpdate: true,
};

export const seedPlans: Plan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    description: "For solo builders getting their first recurring revenue.",
    amount: 250000,
    currency: "NGN",
    cycleId: "cyc_monthly",
    interval: "monthly",
    intervalCount: 1,
    intervalUnit: "month",
    pricingModel: "flat",
    prorationEnabled: true,
    trialDays: 7,
    status: "active",
    features: ["Up to 100 subscribers", "Email support", "Basic webhooks"],
    createdAt: iso(-210),
  },
  {
    id: "plan_growth",
    name: "Growth",
    description: "Per-seat billing for scaling teams.",
    amount: 450000,
    currency: "NGN",
    cycleId: "cyc_monthly",
    interval: "monthly",
    intervalCount: 1,
    intervalUnit: "month",
    pricingModel: "per_seat",
    prorationEnabled: true,
    trialDays: 14,
    status: "active",
    features: ["Unlimited subscribers", "Priority support", "All webhooks", "Proration"],
    createdAt: iso(-180),
  },
  {
    id: "plan_scale_annual",
    name: "Scale (Annual)",
    description: "Annual commitment with two months free.",
    amount: 4500000,
    currency: "NGN",
    cycleId: "cyc_annual",
    interval: "annual",
    intervalCount: 1,
    intervalUnit: "month",
    pricingModel: "flat",
    prorationEnabled: true,
    trialDays: 0,
    status: "active",
    features: ["Everything in Growth", "Dedicated CSM", "SLA", "Custom retry rules"],
    createdAt: iso(-150),
  },
  {
    id: "plan_metered",
    name: "Usage (API)",
    description: "Metered billing — ₦12 per 1,000 API calls, billed every 30 days.",
    amount: 1200,
    currency: "NGN",
    cycleId: "cyc_30d",
    interval: "custom",
    intervalCount: 30,
    intervalUnit: "day",
    pricingModel: "usage",
    prorationEnabled: false,
    trialDays: 0,
    status: "active",
    features: ["Pay as you go", "Usage records via API", "Volume tiers"],
    createdAt: iso(-90),
  },
];

export const seedCustomers: Customer[] = [
  {
    id: "cus_amaka",
    name: "Amaka Obi",
    email: "amaka@brightpay.ng",
    phone: "+234 803 111 2233",
    card: { token: "tok_4af2", brand: "Visa", last4: "4242", expMonth: 8, expYear: 2028 },
    createdAt: iso(-160),
  },
  {
    id: "cus_tunde",
    name: "Tunde Bakare",
    email: "tunde@kola.africa",
    phone: "+234 706 998 1100",
    card: { token: "tok_9c01", brand: "Mastercard", last4: "5577", expMonth: 2, expYear: 2027 },
    createdAt: iso(-120),
  },
  {
    id: "cus_zainab",
    name: "Zainab Yusuf",
    email: "zainab@medbridge.io",
    card: { token: "tok_1d77", brand: "Verve", last4: "0031", expMonth: 11, expYear: 2026 },
    createdAt: iso(-75),
  },
  {
    id: "cus_emeka",
    name: "Emeka Nwosu",
    email: "emeka@swiftlogi.com",
    card: { token: "tok_88ad", brand: "Visa", last4: "1881", expMonth: 5, expYear: 2025 },
    createdAt: iso(-50),
  },
  {
    id: "cus_grace",
    name: "Grace Eze",
    email: "grace@finhub.ng",
    card: null,
    createdAt: iso(-3),
  },
];

export const seedSubscriptions: Subscription[] = [
  {
    id: "sub_amaka01",
    customerId: "cus_amaka",
    planId: "plan_growth",
    status: "active",
    quantity: 5,
    currentPeriodStart: iso(-12),
    currentPeriodEnd: iso(18),
    cancelAtPeriodEnd: false,
    createdAt: iso(-160),
  },
  {
    id: "sub_tunde01",
    customerId: "cus_tunde",
    planId: "plan_scale_annual",
    status: "active",
    quantity: 1,
    currentPeriodStart: iso(-40),
    currentPeriodEnd: iso(325),
    cancelAtPeriodEnd: true,
    createdAt: iso(-120),
  },
  {
    id: "sub_zainab01",
    customerId: "cus_zainab",
    planId: "plan_starter",
    status: "past_due",
    quantity: 1,
    currentPeriodStart: iso(-5),
    currentPeriodEnd: iso(25),
    cancelAtPeriodEnd: false,
    createdAt: iso(-75),
  },
  {
    id: "sub_emeka01",
    customerId: "cus_emeka",
    planId: "plan_metered",
    status: "active",
    quantity: 1,
    currentPeriodStart: iso(-8),
    currentPeriodEnd: iso(22),
    cancelAtPeriodEnd: false,
    createdAt: iso(-50),
  },
  {
    id: "sub_grace01",
    customerId: "cus_grace",
    planId: "plan_growth",
    status: "trialing",
    quantity: 3,
    currentPeriodStart: iso(-3),
    currentPeriodEnd: iso(11),
    trialEnd: iso(11),
    cancelAtPeriodEnd: false,
    createdAt: iso(-3),
  },
];

export const seedInvoices: Invoice[] = [
  { id: "in_001", subscriptionId: "sub_amaka01", customerId: "cus_amaka", amount: 2250000, status: "paid", periodStart: iso(-12), periodEnd: iso(18), attemptCount: 1, created: iso(-12), description: "Growth × 5 seats" },
  { id: "in_002", subscriptionId: "sub_amaka01", customerId: "cus_amaka", amount: 2250000, status: "paid", periodStart: iso(-42), periodEnd: iso(-12), attemptCount: 1, created: iso(-42), description: "Growth × 5 seats" },
  { id: "in_003", subscriptionId: "sub_tunde01", customerId: "cus_tunde", amount: 4500000, status: "paid", periodStart: iso(-40), periodEnd: iso(325), attemptCount: 1, created: iso(-40), description: "Scale annual commitment" },
  { id: "in_004", subscriptionId: "sub_zainab01", customerId: "cus_zainab", amount: 250000, status: "open", periodStart: iso(-5), periodEnd: iso(25), attemptCount: 2, created: iso(-5), description: "Starter monthly" },
  { id: "in_005", subscriptionId: "sub_emeka01", customerId: "cus_emeka", amount: 384000, status: "paid", periodStart: iso(-8), periodEnd: iso(22), attemptCount: 1, created: iso(-8), description: "Usage — 320k API calls" },
];

export const seedDunning: DunningCase[] = [
  { id: "dun_001", invoiceId: "in_004", subscriptionId: "sub_zainab01", customerId: "cus_zainab", amount: 250000, attempt: 2, maxAttempts: 4, lastAttemptAt: iso(-1), nextRetryAt: iso(2), lastError: "insufficient_funds", status: "retrying" },
  { id: "dun_002", invoiceId: "in_006", subscriptionId: "sub_emeka01", customerId: "cus_emeka", amount: 384000, attempt: 1, maxAttempts: 4, lastAttemptAt: iso(-0.2), nextRetryAt: iso(1), lastError: "expired_card", status: "retrying" },
];

export const seedEvents: WebhookEvent[] = [
  { id: "evt_91", type: "invoice.payment_failed", created: iso(-0.2), status: "delivered", object: "in_006", summary: "Charge declined (expired_card)" },
  { id: "evt_90", type: "subscription.trial_will_end", created: iso(-0.5), status: "delivered", object: "sub_grace01", summary: "Trial ends in 3 days" },
  { id: "evt_89", type: "invoice.paid", created: iso(-8), status: "delivered", object: "in_005", summary: "Usage invoice settled" },
  { id: "evt_88", type: "subscription.created", created: iso(-3), status: "delivered", object: "sub_grace01", summary: "Growth × 3 (trial)" },
  { id: "evt_87", type: "invoice.payment_failed", created: iso(-1), status: "failed", object: "in_004", summary: "Endpoint returned 500" },
  { id: "evt_86", type: "customer.card_updated", created: iso(-2), status: "delivered", object: "cus_amaka", summary: "Tokenised card refreshed" },
];

export const seedEndpoints: WebhookEndpoint[] = [
  { id: "we_live", url: "https://api.brightpay.ng/webhooks/nomba-recur", events: ["subscription.*", "invoice.*", "customer.card_updated"], status: "enabled", createdAt: iso(-160) },
  { id: "we_analytics", url: "https://hooks.kola.africa/billing", events: ["invoice.paid", "invoice.payment_failed"], status: "enabled", createdAt: iso(-90) },
];

export const EVENT_CATALOG = [
  "subscription.created",
  "subscription.updated",
  "subscription.paused",
  "subscription.resumed",
  "subscription.canceled",
  "subscription.trial_will_end",
  "invoice.created",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "customer.created",
  "customer.card_updated",
  "plan.created",
  "plan.updated",
];
