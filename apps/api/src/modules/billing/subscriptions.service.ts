import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/enums/enums';
import { PLAN_LIMITS } from '../../config/plan-limits.config';

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
  ): Promise<Subscription> {
    const limits = PLAN_LIMITS[plan];
    const now = new Date();

    const sub = await this.getOrCreate(userId);

    Object.assign(sub, {
      plan,
      status: SubscriptionStatus.ACTIVE,
      jobPostsRemaining: limits.jobPostsPerMonth,
      featuredSlotsRemaining: limits.featuredSlotsPerMonth,
      currentPeriodStart: now,
      currentPeriodEnd: this.nextMonth(now),
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
}
