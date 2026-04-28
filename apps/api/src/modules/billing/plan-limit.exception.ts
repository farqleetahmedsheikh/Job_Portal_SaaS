import { ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan } from '../../common/enums/enums';

interface PlanLimitPayload {
  message: string;
  feature: string;
  currentUsage?: number;
  limit?: number | 'unlimited';
  requiredPlan?: SubscriptionPlan;
}

export class PlanLimitException extends ForbiddenException {
  constructor(payload: PlanLimitPayload) {
    super({
      message: payload.message,
      code: 'PLAN_LIMIT_REACHED',
      feature: payload.feature,
      currentUsage: payload.currentUsage,
      limit: payload.limit,
      requiredPlan: payload.requiredPlan,
    });
  }
}
