import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DailyApplyLimit } from './entities/daily-apply-limit.entity';
import { Subscription } from './entities/subscription.entity';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../companies/entities/company.entity';

import {
  SubscriptionPlan,
  SubscriptionStatus,
  JobStatus,
  AiMatcherTier,
} from '../../common/enums/enums';
import { PLAN_LIMITS, PlanLimits } from '../../config/plan-limits.config';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class LimitsService {
  private readonly logger = new Logger(LimitsService.name);

  constructor(
    @InjectRepository(DailyApplyLimit)
    private readonly applyLimitRepo: Repository<DailyApplyLimit>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // ── Get active plan limits ────────────────────────────────────────────────
  async getLimits(userId: string): Promise<PlanLimits> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    return PLAN_LIMITS[sub?.plan ?? SubscriptionPlan.FREE];
  }

  // ── Applicant: 20 applications/day ───────────────────────────────────────
  async checkAndIncrementApplyLimit(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const record = await this.applyLimitRepo.findOne({
      where: { userId, date: today },
    });

    if (record && record.count >= 20) {
      throw new BadRequestException(
        'You have reached the daily application limit (20/day). Try again tomorrow.',
      );
    }

    await this.applyLimitRepo.upsert(
      { userId, date: today, count: (record?.count ?? 0) + 1 },
      ['userId', 'date'],
    );
  }

  // ── Employer: consume one job post slot ──────────────────────────────────
  async consumeJobPostSlot(userId: string): Promise<void> {
    const sub = await this.subscriptions.getOrCreate(userId);

    if (sub.jobPostsRemaining <= 0) {
      const plan = sub.plan;
      const limit = PLAN_LIMITS[plan].jobPostsPerMonth;
      throw new BadRequestException(
        `You've used all ${limit} job posts for this month. ` +
          `Upgrade your plan or purchase an extra post add-on.`,
      );
    }

    await this.subRepo.decrement({ id: sub.id }, 'jobPostsRemaining', 1);
  }

  // ── Get applicant cap for new job ─────────────────────────────────────────
  async getApplicantCap(userId: string): Promise<number> {
    const limits = await this.getLimits(userId);
    const cap = limits.applicantsPerJob;
    return cap === Infinity ? 999999 : cap;
  }

  // ── Check if job still accepts applications ───────────────────────────────
  async checkJobAcceptsApplications(jobId: string): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      select: ['id', 'status', 'applicantCount', 'applicantCap'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException(
        'This job is no longer accepting applications.',
      );
    }

    if (job.applicantCount >= job.applicantCap) {
      throw new BadRequestException(
        'This position has reached its applicant limit.',
      );
    }
  }

  // ── Increment applicant count — auto-close if cap hit ────────────────────
  async incrementApplicantCount(jobId: string): Promise<void> {
    await this.jobRepo.increment({ id: jobId }, 'applicantCount', 1);

    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      select: ['id', 'applicantCount', 'applicantCap'],
    });

    if (job && job.applicantCount >= job.applicantCap) {
      await this.jobRepo.update(jobId, {
        status: JobStatus.CLOSED,
        capReachedAt: new Date(),
      });
      this.logger.log(`Job ${jobId} auto-closed — applicant cap reached`);
    }
  }

  // ── Check viewable applicant count limit ─────────────────────────────────
  async getViewableApplicantLimit(userId: string): Promise<number> {
    const limits = await this.getLimits(userId);
    return limits.maxApplicantsViewable === Infinity
      ? 999999
      : limits.maxApplicantsViewable;
  }

  // ── Consume featured slot ─────────────────────────────────────────────────
  async consumeFeaturedSlot(userId: string): Promise<void> {
    const sub = await this.subscriptions.getOrCreate(userId);

    if (sub.featuredSlotsRemaining <= 0) {
      throw new BadRequestException(
        'No featured slots remaining this month. Purchase a featured add-on.',
      );
    }

    await this.subRepo.decrement({ id: sub.id }, 'featuredSlotsRemaining', 1);
  }

  // ── Feature gate ──────────────────────────────────────────────────────────
  async requireFeature(
    userId: string,
    feature: keyof Pick<
      PlanLimits,
      | 'hasTalentDb'
      | 'hasAutomation'
      | 'hasExport'
      | 'hasVerifiedBadge'
      | 'hasSavedSearches'
      | 'hasMarketIntel'
      | 'aiInsights'
    >,
  ): Promise<void> {
    const limits = await this.getLimits(userId);
    if (!limits[feature]) {
      throw new ForbiddenException(
        `Your current plan does not include this feature. Please upgrade.`,
      );
    }
  }

  async requireAiMatcher(
    userId: string,
    tier: 'basic' | 'advanced',
  ): Promise<void> {
    const limits = await this.getLimits(userId);
    const has =
      tier === 'basic'
        ? limits.aiMatcher !== AiMatcherTier.NONE
        : limits.aiMatcher === AiMatcherTier.ADVANCED;

    if (!has) {
      throw new ForbiddenException(
        `AI matcher (${tier}) is not available on your current plan.`,
      );
    }
  }
}
