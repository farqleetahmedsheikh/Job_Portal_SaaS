import { SubscriptionPlan } from '../../common/enums/enums';
import { PlanLimitException } from './plan-limit.exception';

describe('PlanLimitException', () => {
  it('returns the structured upgrade response shape', () => {
    const response = new PlanLimitException({
      message: 'Interview limit reached for your current plan',
      feature: 'interviews',
      currentUsage: 5,
      limit: 5,
      requiredPlan: SubscriptionPlan.STARTER,
    }).getResponse();

    expect(response).toMatchObject({
      message: 'Interview limit reached for your current plan',
      code: 'PLAN_LIMIT_REACHED',
      feature: 'interviews',
      currentUsage: 5,
      limit: 5,
      requiredPlan: SubscriptionPlan.STARTER,
    });
  });
});
