import { BillingInterval, SubscriptionPlan } from '../common/enums/enums';
import {
  getPlanPrice,
  PLAN_LIMITS,
  PLAN_PRICES,
  TRIAL_DAYS,
} from './plan-limits.config';

describe('plan pricing and trials', () => {
  it('charges 10 months for yearly access', () => {
    expect(getPlanPrice(SubscriptionPlan.GROWTH, BillingInterval.YEARLY)).toBe(
      PLAN_PRICES[SubscriptionPlan.GROWTH] * 10,
    );
  });

  it('keeps monthly pricing unchanged', () => {
    expect(getPlanPrice(SubscriptionPlan.STARTER)).toBe(
      PLAN_PRICES[SubscriptionPlan.STARTER],
    );
  });

  it('defines a 7-day trial', () => {
    expect(TRIAL_DAYS).toBe(7);
  });

  it('keeps basic interview scheduling available on every plan with free/starter caps', () => {
    expect(PLAN_LIMITS[SubscriptionPlan.FREE].hasInterviewScheduling).toBe(
      true,
    );
    expect(PLAN_LIMITS[SubscriptionPlan.FREE].maxInterviewsPerMonth).toBe(5);
    expect(PLAN_LIMITS[SubscriptionPlan.STARTER].maxInterviewsPerMonth).toBe(
      20,
    );
    expect(PLAN_LIMITS[SubscriptionPlan.GROWTH].maxInterviewsPerMonth).toBe(
      Infinity,
    );
  });

  it('gates monetized interview and template features to paid tiers', () => {
    expect(PLAN_LIMITS[SubscriptionPlan.FREE].hasInterviewReminders).toBe(
      false,
    );
    expect(PLAN_LIMITS[SubscriptionPlan.STARTER].hasInterviewReminders).toBe(
      true,
    );
    expect(PLAN_LIMITS[SubscriptionPlan.STARTER].hasCustomEmailTemplates).toBe(
      false,
    );
    expect(PLAN_LIMITS[SubscriptionPlan.GROWTH].hasCustomEmailTemplates).toBe(
      true,
    );
    expect(
      PLAN_LIMITS[SubscriptionPlan.SCALE].hasAdvancedContractTemplates,
    ).toBe(true);
  });
});
