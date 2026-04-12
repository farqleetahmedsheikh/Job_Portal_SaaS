/** @format */

export type SubscriptionPlan = "free" | "starter" | "growth" | "scale";
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
  jobPostsPerMonth: number;
  applicantsPerJob: number | "Unlimited";
  maxApplicantsViewable: number | "Unlimited";
  teamSeats: number;
  featuredSlotsPerMonth: number;
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
    jobPostsPerMonth: 2,
    applicantsPerJob: 25,
    maxApplicantsViewable: 10,
    teamSeats: 1,
    featuredSlotsPerMonth: 0,
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
    jobPostsPerMonth: 5,
    applicantsPerJob: 50,
    maxApplicantsViewable: 50,
    teamSeats: 2,
    featuredSlotsPerMonth: 0,
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
    jobPostsPerMonth: 15,
    applicantsPerJob: 100,
    maxApplicantsViewable: "Unlimited",
    teamSeats: 5,
    featuredSlotsPerMonth: 1,
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
