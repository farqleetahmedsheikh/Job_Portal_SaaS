/** @format */

export type SubscriptionPlan = "free" | "starter" | "growth" | "scale";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "trialing";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "expired"
  | "lapsed";
export type AddonType = "extra_post" | "boost_cap" | "feature_job";
export type BillingEventType =
  | "subscription_charge"
  | "addon_charge"
  | "refund"
  | "dispute";

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval?: BillingInterval;
  currency?: string;
  trialStartAt?: string;
  trialEndAt?: string;
  trialUsedAt?: string;
  jobPostsRemaining: number;
  featuredSlotsRemaining: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanCapabilities {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval?: BillingInterval;
  currency?: string;
  paymentProvider?: string;
  trialEndAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  limits: Record<string, boolean | number | string>;
  usage: {
    interviews: {
      plan: SubscriptionPlan;
      currentUsage: number;
      limit: number | "unlimited";
      periodStart: string;
      periodEnd: string;
    };
    jobPostsRemaining: number;
    featuredSlotsRemaining: number;
  };
}

export interface PaymentOptions {
  country: string;
  currency: string;
  provider: "safepay" | "manual" | "stripe";
  configured: boolean;
  checkoutAvailable: boolean;
  message: string;
}

export interface BillingEvent {
  id: string;
  userId: string;
  type: BillingEventType;
  amount: number;
  currency: string;
  gatewayPaymentId?: string;
  createdAt: string;
}

export interface PlanMeta {
  key: SubscriptionPlan;
  label: string;
  price: number; // PKR/month
  yearlyPrice?: number;
  jobPostsPerMonth: number;
  applicantsPerJob: number | "Unlimited";
  maxApplicantsViewable: number | "Unlimited";
  teamSeats: number;
  featuredSlotsPerMonth: number;
  maxInterviewsPerMonth: number | "Unlimited";
  hasInterviewReminders: boolean;
  hasCalendarSync: boolean;
  hasCustomEmailTemplates: boolean;
  hasContractTemplates: boolean;
  hasOfferLetters: boolean;
  aiMatcher: "None" | "Basic" | "Advanced";
  hasTalentDb: boolean;
  hasAutomation: boolean;
  hasExport: boolean;
  hasVerifiedBadge: boolean;
  hasSavedSearches: boolean;
  hasMarketIntel: boolean;
  support: "Email" | "Priority" | "Dedicated";
  highlight?: boolean; // true = most popular badge
}

export const PLANS: PlanMeta[] = [
  {
    key: "free",
    label: "Free",
    price: 0,
    jobPostsPerMonth: 1,
    applicantsPerJob: 25,
    maxApplicantsViewable: 10,
    teamSeats: 1,
    featuredSlotsPerMonth: 0,
    maxInterviewsPerMonth: 5,
    hasInterviewReminders: false,
    hasCalendarSync: false,
    hasCustomEmailTemplates: false,
    hasContractTemplates: false,
    hasOfferLetters: false,
    aiMatcher: "None",
    hasTalentDb: false,
    hasAutomation: false,
    hasExport: false,
    hasVerifiedBadge: false,
    hasSavedSearches: false,
    hasMarketIntel: false,
    support: "Email",
  },
  {
    key: "starter",
    label: "Starter",
    price: 9999,
    jobPostsPerMonth: 3,
    applicantsPerJob: 50,
    maxApplicantsViewable: 50,
    teamSeats: 2,
    featuredSlotsPerMonth: 0,
    maxInterviewsPerMonth: 20,
    hasInterviewReminders: true,
    hasCalendarSync: false,
    hasCustomEmailTemplates: false,
    hasContractTemplates: true,
    hasOfferLetters: true,
    aiMatcher: "Basic",
    hasTalentDb: false,
    hasAutomation: false,
    hasExport: true,
    hasVerifiedBadge: false,
    hasSavedSearches: false,
    hasMarketIntel: false,
    support: "Priority",
  },
  {
    key: "growth",
    label: "Growth",
    price: 19999,
    jobPostsPerMonth: 10,
    applicantsPerJob: 150,
    maxApplicantsViewable: "Unlimited",
    teamSeats: 5,
    featuredSlotsPerMonth: 1,
    maxInterviewsPerMonth: "Unlimited",
    hasInterviewReminders: true,
    hasCalendarSync: true,
    hasCustomEmailTemplates: true,
    hasContractTemplates: true,
    hasOfferLetters: true,
    aiMatcher: "Basic",
    hasTalentDb: true,
    hasAutomation: true,
    hasExport: true,
    hasVerifiedBadge: true,
    hasSavedSearches: true,
    hasMarketIntel: false,
    support: "Priority",
    highlight: true,
  },
  {
    key: "scale",
    label: "Scale",
    price: 29999,
    jobPostsPerMonth: 30,
    applicantsPerJob: "Unlimited",
    maxApplicantsViewable: "Unlimited",
    teamSeats: 10,
    featuredSlotsPerMonth: 3,
    maxInterviewsPerMonth: "Unlimited",
    hasInterviewReminders: true,
    hasCalendarSync: true,
    hasCustomEmailTemplates: true,
    hasContractTemplates: true,
    hasOfferLetters: true,
    aiMatcher: "Advanced",
    hasTalentDb: true,
    hasAutomation: true,
    hasExport: true,
    hasVerifiedBadge: true,
    hasSavedSearches: true,
    hasMarketIntel: true,
    support: "Dedicated",
  },
];

export const PLAN_ORDER: SubscriptionPlan[] = [
  "free",
  "starter",
  "growth",
  "scale",
];

export function isUpgrade(
  from: SubscriptionPlan,
  to: SubscriptionPlan,
): boolean {
  return PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);
}

export function getPlanMeta(plan: SubscriptionPlan): PlanMeta {
  return PLANS.find((p) => p.key === plan)!;
}
