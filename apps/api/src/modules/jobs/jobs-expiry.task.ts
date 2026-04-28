/** @format */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { JobStatus } from '../../common/enums/enums';

@Injectable()
export class JobsExpiryTask {
  private readonly logger = new Logger(JobsExpiryTask.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  /**
   * Runs every day at midnight.
   * Marks all ACTIVE jobs whose deadline has passed as EXPIRED.
   * Uses both deadline (date) and expiresAt (timestamptz) — whichever is set.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOverdueJobs(): Promise<void> {
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]); // YYYY-MM-DD at 00:00 UTC

    try {
      // Expire by deadline (date column — compare date-only)
      const byDeadline = await this.jobRepo
        .createQueryBuilder()
        .update(Job)
        .set({ status: JobStatus.EXPIRED })
        .where('status = :status', { status: JobStatus.ACTIVE })
        .andWhere('deadline IS NOT NULL')
        .andWhere('deadline < :today', { today })
        .execute();

      // Expire by expiresAt (timestamptz column — compare full timestamp)
      const byExpiresAt = await this.jobRepo
        .createQueryBuilder()
        .update(Job)
        .set({ status: JobStatus.EXPIRED })
        .where('status = :status', { status: JobStatus.ACTIVE })
        .andWhere('expires_at IS NOT NULL')
        .andWhere('expires_at < :now', { now })
        .execute();

      const total = (byDeadline.affected ?? 0) + (byExpiresAt.affected ?? 0);
      if (total > 0) {
        this.logger.log(`Expired ${total} overdue job(s)`);
      }
    } catch (err) {
      this.logger.error('Failed to run job expiry task', err);
    }
  }
}
