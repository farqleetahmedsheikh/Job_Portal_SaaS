import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../common/enums/enums';
import { PLAN_LIMITS, TRIAL_DAYS } from '../../config/plan-limits.config';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
  ) {}

  // ── Get or create FREE subscription ───────────────────────────────────────
  async getOrCreate(userId: string): Promise<Subscription> {
    let sub = await this.repo.findOne({ where: { userId } });
    if (!sub) {
      sub = this.repo.create({
        userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        jobPostsRemaining: PLAN_LIMITS[SubscriptionPlan.FREE].jobPostsPerMonth,
        featuredSlotsRemaining: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.nextMonth(),
        billingInterval: BillingInterval.MONTHLY,
      });
      await this.repo.save(sub);
    }
    return sub;
  }

  // ── Activate after successful payment ────────────────────────────────────
  async activate(
    userId: string,
    plan: SubscriptionPlan,
    gatewaySubscriptionId: string,
    gatewayCustomerId: string,
    billingInterval: BillingInterval = BillingInterval.MONTHLY,
  ): Promise<Subscription> {
    const limits = PLAN_LIMITS[plan];
    const now = new Date();

    const sub = await this.getOrCreate(userId);

    Object.assign(sub, {
      plan,
      status: SubscriptionStatus.ACTIVE,
      billingInterval,
      jobPostsRemaining: limits.jobPostsPerMonth,
      featuredSlotsRemaining: limits.featuredSlotsPerMonth,
      currentPeriodStart: now,
      currentPeriodEnd:
        billingInterval === BillingInterval.YEARLY
          ? this.nextYear(now)
          : this.nextMonth(now),
      gatewaySubscriptionId,
      gatewayCustomerId,
      cancelledAt: null,
    });

    return this.repo.save(sub);
  }

  // ── Reset monthly quotas — called by cron or webhook ─────────────────────
  async resetMonthlyQuotas(userId: string): Promise<void> {
    const sub = await this.repo.findOne({ where: { userId } });
    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return;

    const limits = PLAN_LIMITS[sub.plan];
    await this.repo.update(sub.id, {
      jobPostsRemaining: limits.jobPostsPerMonth,
      featuredSlotsRemaining: limits.featuredSlotsPerMonth,
      currentPeriodStart: new Date(),
      currentPeriodEnd: this.nextMonth(),
    });
  }

  async startTrial(
    userId: string,
    plan: SubscriptionPlan = SubscriptionPlan.STARTER,
  ): Promise<Subscription> {
    const sub = await this.getOrCreate(userId);
    if (sub.trialUsedAt) {
      throw new BadRequestException('Trial already used for this account');
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + TRIAL_DAYS);
    const limits = PLAN_LIMITS[plan];

    Object.assign(sub, {
      plan,
      status: SubscriptionStatus.TRIALING,
      billingInterval: BillingInterval.MONTHLY,
      trialStartAt: now,
      trialEndAt: end,
      trialUsedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      jobPostsRemaining: limits.jobPostsPerMonth,
      featuredSlotsRemaining: limits.featuredSlotsPerMonth,
    });

    return this.repo.save(sub);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  async cancel(userId: string): Promise<void> {
    await this.repo.update(
      { userId },
      {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    );
  }

  // ── Mark past due ─────────────────────────────────────────────────────────
  async markPastDue(gatewaySubscriptionId: string): Promise<void> {
    await this.repo.update(
      { gatewaySubscriptionId },
      { status: SubscriptionStatus.PAST_DUE },
    );
  }

  // ── Downgrade to FREE when subscription lapses ────────────────────────────
  async downgradeToFree(userId: string): Promise<void> {
    const limits = PLAN_LIMITS[SubscriptionPlan.FREE];
    await this.repo.update(
      { userId },
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        jobPostsRemaining: limits.jobPostsPerMonth,
        featuredSlotsRemaining: 0,
        gatewaySubscriptionId: undefined, // ✅ was undefined
        gatewayCustomerId: undefined, // ✅ also fix this
        cancelledAt: new Date(),
      },
    );
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async findByGatewayId(
    gatewaySubscriptionId: string,
  ): Promise<Subscription | null> {
    return this.repo.findOne({ where: { gatewaySubscriptionId } });
  }

  private nextMonth(from = new Date()): Date {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d;
  }

  private nextYear(from = new Date()): Date {
    const d = new Date(from);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
}
