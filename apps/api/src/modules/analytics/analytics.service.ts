/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { LimitsService } from '../billing/limits.service';
import { AnalyticsTier } from '../../common/enums/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly limits: LimitsService,
  ) {}

  async getEmployerAnalytics(userId: string, range: '7d' | '30d' | '90d') {
    const planLimits = await this.limits.getLimits(userId);
    const tier = planLimits.analytics;

    if (tier === AnalyticsTier.NONE) {
      throw new ForbiddenException(
        'Analytics are not available on your current plan. Upgrade to Starter or above.',
      );
    }

    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company) return this.emptyResponse(tier);

    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // ── All employer jobs ─────────────────────────────────────────────────
    const jobs = await this.jobRepo.find({
      where: { companyId: company.id },
      select: [
        'id',
        'title',
        'status',
        'viewsCount',
        'applicantCount',
        'publishedAt',
      ],
    });

    const jobIds = jobs.map((j) => j.id);
    if (jobIds.length === 0) return this.emptyResponse(tier);

    // ── Aggregates via SQL (replaces JS reduce loops) ─────────────────────
    const aggregates = await this.dataSource.query(
      `SELECT
         COUNT(*)::int                                    AS total_applications,
         COALESCE(SUM(j.views_count), 0)::int             AS total_views,
         COUNT(*) FILTER (WHERE j.status = 'active')::int AS active_jobs
       FROM jobs j
       WHERE j.company_id = $1 AND j.deleted_at IS NULL`,
      [company.id],
    );
    const {
      total_applications: totalApplications,
      total_views: totalViews,
      active_jobs: activeJobs,
    } = aggregates[0];
    const avgApplyRate =
      totalViews > 0
        ? Math.round((totalApplications / totalViews) * 100 * 10) / 10
        : 0;

    // ── Pipeline breakdown ────────────────────────────────────────────────
    const pipeline = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.jobId IN (:...jobIds)', { jobIds })
      .groupBy('a.status')
      .getRawMany();

    // ── Top jobs ──────────────────────────────────────────────────────────
    const topJobs = jobs
      .map((j) => ({
        id: j.id!,
        title: j.title!,
        views: j.viewsCount ?? 0,
        applications: j.applicantCount ?? 0,
        applyRate:
          (j.viewsCount ?? 0) > 0
            ? Math.round(((j.applicantCount ?? 0) / j.viewsCount!) * 100 * 10) /
              10
            : 0,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5);

    const base = {
      totalJobs: jobs.length,
      activeJobs,
      totalViews,
      totalApplications,
      avgApplyRate,
      pipeline: pipeline.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      topJobs,
      trend: [] as any[],
      tier,
    };

    if (tier === AnalyticsTier.BASIC) return base;

    // ── ADVANCED + ENTERPRISE — daily trend ───────────────────────────────
    const trend = await this.dataSource
      .query(
        `SELECT
         d::date AS date,
         COALESCE(SUM(a.apps), 0)::int AS applications,
         0::int AS views
       FROM generate_series(
         NOW() - INTERVAL '${days} days', NOW(), INTERVAL '1 day'
       ) d
       LEFT JOIN (
         SELECT DATE(created_at) AS day, COUNT(*) AS apps
         FROM applications
         WHERE job_id = ANY($1) AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(created_at)
       ) a ON a.day = d::date
       GROUP BY d::date
       ORDER BY d::date ASC`,
        [jobIds],
      )
      .catch(() => []);

    return { ...base, trend };
  }

  private emptyResponse(tier: string) {
    return {
      totalJobs: 0,
      activeJobs: 0,
      totalViews: 0,
      totalApplications: 0,
      avgApplyRate: 0,
      pipeline: [],
      topJobs: [],
      trend: [],
      tier,
    };
  }
}
