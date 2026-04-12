import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  // Expire featured jobs daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireFeaturedJobs(): Promise<void> {
    const result = await this.jobRepo.update(
      {
        isFeatured: true,
        featuredUntil: LessThan(new Date()),
      },
      {
        isFeatured: false,
        featuredUntil: undefined,
      },
    );
    this.logger.log(`Expired ${result.affected} featured jobs`);
  }
}
