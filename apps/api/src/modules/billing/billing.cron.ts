import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { InterviewStatus } from '../../common/enums/enums';
import { VerificationService } from './verification.service';

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Interview) // ✅ new
    private readonly interviewRepo: Repository<Interview>,
    private readonly verificationService: VerificationService,
  ) {}

  // ── Expire featured jobs daily at midnight ─────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireFeaturedJobs(): Promise<void> {
    const result = await this.jobRepo.update(
      { isFeatured: true, featuredUntil: LessThan(new Date()) },
      { isFeatured: false, featuredUntil: undefined },
    );
    this.logger.log(`Expired ${result.affected} featured jobs`);

    const expiredCompanies =
      await this.verificationService.expireVerificationTrials();
    if (expiredCompanies > 0) {
      this.logger.log(`Expired ${expiredCompanies} company verifications`);
    }
  }

  // ── Auto-expire interviews every 15 minutes ────────────────────────────────
  // Marks as completed if scheduledAt + durationMins has passed
  @Cron('*/15 * * * *')
  async expireInterviews(): Promise<void> {
    // ✅ Do everything in DB — no JS memory needed
    const result = await this.interviewRepo
      .createQueryBuilder()
      .update(Interview)
      .set({ status: InterviewStatus.COMPLETED })
      .where('status = :status', { status: InterviewStatus.UPCOMING })
      .andWhere(`scheduled_at + (duration_mins * interval '1 minute') < NOW()`)
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Auto-expired ${result.affected} interviews`);
    }
  }
}
