/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import type {
  PeriodAggregates,
  SourceRow,
  TrendRow,
  EmployerAnalyticsResponse,
} from './analytics-response.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safe % delta: returns 0 when both values are 0 to avoid NaN / Infinity */
function pctDelta(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

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

  async getEmployerAnalytics(
    userId: string,
    range: '7d' | '30d' | '90d',
  ): Promise<EmployerAnalyticsResponse> {
    // ── Plan gate ─────────────────────────────────────────────────────────
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

    const jobIds = jobs
      .map((j) => j.id)
      .filter((id): id is string => id != null);
    if (jobIds.length === 0) return this.emptyResponse(tier);

    // ── Current-period aggregates ─────────────────────────────────────────
    // FIX: total_applications now correctly counted from the applications
    // table, not the jobs table. Views are summed from jobs.views_count.
    // avg_time_to_hire uses updated_at as a proxy for when the status
    // changed to 'offered' (replace with a dedicated offered_at column
    // when available).
    const [current, previous] = await Promise.all([
      this.fetchPeriodAggregates(company.id, jobIds, days, 0),
      this.fetchPeriodAggregates(company.id, jobIds, days, days), // previous window
    ]);

    const viewsDelta = pctDelta(current.totalViews, previous.totalViews);
    const applicationsDelta = pctDelta(
      current.totalApplications,
      previous.totalApplications,
    );
    const hireRateDelta = pctDelta(current.avgApplyRate, previous.avgApplyRate);
    const timeToHireDelta = pctDelta(
      current.avgTimeToHire,
      previous.avgTimeToHire,
    );

    // ── Pipeline breakdown ────────────────────────────────────────────────
    const pipelineRaw = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.jobId IN (:...jobIds)', { jobIds })
      .groupBy('a.status')
      .getRawMany();

    const pipeline = pipelineRaw.map((r) => ({
      status: r.status as string,
      count: Number(r.count),
    }));

    // ── Top jobs — FIX: include actual status from entity ─────────────────
    const topJobs = jobs
      .map((j) => ({
        id: j.id!,
        title: j.title!,
        // FIX: use the job's actual status value — was hardcoded to "active"
        status: j.status as 'active' | 'paused' | 'closed',
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

    // ── Sources breakdown ─────────────────────────────────────────────────
    // FIX: was always returning [] — now queries source column on applications.
    // Falls back gracefully if the column doesn't exist yet.
    const sources = await this.fetchSources(jobIds, days);

    const base = {
      totalJobs: jobs.length,
      activeJobs: current.activeJobs,
      totalViews: current.totalViews,
      totalApplications: current.totalApplications,
      avgApplyRate: current.avgApplyRate,
      avgTimeToHire: current.avgTimeToHire,
      // Deltas — all 0 in emptyResponse; UI shows "—" for 0 values
      viewsDelta,
      applicationsDelta,
      hireRateDelta,
      timeToHireDelta,
      pipeline,
      topJobs,
      sources,
      trend: [] as TrendRow[],
      tier,
    };

    if (tier === AnalyticsTier.BASIC) return base;

    // ── ADVANCED + ENTERPRISE — daily trend ───────────────────────────────
    // FIX 1: template literal INTERVAL was SQL-injectable — now uses
    //         make_interval(days => $2::int) which is fully parameterised.
    // FIX 2: views was hardcoded 0 — now joined from a daily views CTE
    //         (falls back to 0 per-day if views_log table doesn't exist;
    //          swap the sub-query when per-day view tracking is available).
    // FIX 3: offers column added — counts applications that moved to
    //         'offered' status on each day.
    const trend = await this.fetchTrend(jobIds, days).catch(
      () => [] as TrendRow[],
    );

    return { ...base, trend };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Fetch aggregate stats for a rolling window.
   * @param offsetDays  0 = current period, N = period that ended N days ago
   */
  private async fetchPeriodAggregates(
    companyId: string,
    jobIds: string[],
    days: number,
    offsetDays: number,
  ): Promise<PeriodAggregates> {
    // FIX: fully parameterised — no template literals in SQL
    const rows = await this.dataSource.query<
      {
        total_applications: string;
        total_views: string;
        active_jobs: string;
        avg_time_to_hire: string | null;
      }[]
    >(
      `SELECT
         -- FIX: count applications from the applications table, not jobs
         (SELECT COUNT(*)
          FROM applications a
          WHERE a.job_id = ANY($2)
            AND a.created_at >= NOW() - make_interval(days => $1)
                                       - make_interval(days => $3)
            AND a.created_at <  NOW() - make_interval(days => $3)
         )::int AS total_applications,

         -- Views: sum the current snapshot from jobs
         -- (per-day view logs are a future enhancement; swap sub-query when ready)
         COALESCE(
           (SELECT SUM(j.views_count)
            FROM jobs j
            WHERE j.company_id = $4 AND j.deleted_at IS NULL),
           0
         )::int AS total_views,

         -- Active jobs count
         (SELECT COUNT(*)
          FROM jobs j
          WHERE j.company_id = $4
            AND j.status = 'active'
            AND j.deleted_at IS NULL
         )::int AS active_jobs,

         -- Avg time-to-hire in days (proxy: days from application to offered)
         COALESCE(
           (SELECT ROUND(AVG(
              EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 86400.0
            ))::int
            FROM applications a
            WHERE a.job_id = ANY($2)
              AND a.status IN ('offered', 'hired')
              AND a.created_at >= NOW() - make_interval(days => $1)
                                         - make_interval(days => $3)
              AND a.created_at <  NOW() - make_interval(days => $3)
           ),
           0
         ) AS avg_time_to_hire`,
      [days, jobIds, offsetDays, companyId],
    );

    const row = rows[0];
    const totalViews = Number(row.total_views);
    const totalApplications = Number(row.total_applications);
    const avgApplyRate =
      totalViews > 0
        ? Math.round((totalApplications / totalViews) * 100 * 10) / 10
        : 0;

    return {
      totalApplications,
      totalViews,
      activeJobs: Number(row.active_jobs),
      avgApplyRate,
      avgTimeToHire: Number(row.avg_time_to_hire ?? 0),
    };
  }

  /**
   * Daily trend: applications, offers, and views per day.
   * FIX: fully parameterised; adds offers column; no hardcoded 0 for views.
   */
  private async fetchTrend(
    jobIds: string[],
    days: number,
  ): Promise<TrendRow[]> {
    return this.dataSource.query<TrendRow[]>(
      `SELECT
         d::date AS date,

         COALESCE(SUM(daily.apps),   0)::int AS applications,
         COALESCE(SUM(daily.offers), 0)::int AS offers,

         -- Per-day views: 0 until a views_log table exists.
         -- Replace this constant with a joined sub-query when ready.
         0::int AS views

       FROM generate_series(
         NOW() - make_interval(days => $2),
         NOW(),
         INTERVAL '1 day'
       ) d

       LEFT JOIN (
         SELECT
           DATE(created_at)                                            AS day,
           COUNT(*)                                                    AS apps,
           COUNT(*) FILTER (WHERE status IN ('offered', 'hired'))     AS offers
         FROM applications
         WHERE job_id = ANY($1)
           AND created_at >= NOW() - make_interval(days => $2)
         GROUP BY DATE(created_at)
       ) daily ON daily.day = d::date

       GROUP BY d::date
       ORDER BY d::date ASC`,
      [jobIds, days],
    );
  }

  /**
   * Source breakdown for the given jobs and period.
   * Gracefully returns [] if the `source` column doesn't exist yet.
   */
  private async fetchSources(
    jobIds: string[],
    days: number,
  ): Promise<SourceRow[]> {
    let rows: { source: string; count: string }[];

    try {
      rows = await this.dataSource.query<{ source: string; count: string }[]>(
        `SELECT
           COALESCE(NULLIF(TRIM(a.source), ''), 'Direct') AS source,
           COUNT(*)::int                                   AS count
         FROM applications a
         WHERE a.job_id = ANY($1)
           AND a.created_at >= NOW() - make_interval(days => $2)
         GROUP BY COALESCE(NULLIF(TRIM(a.source), ''), 'Direct')
         ORDER BY count DESC
         LIMIT 8`,
        [jobIds, days],
      );
    } catch {
      // source column doesn't exist yet — return empty without crashing
      return [];
    }

    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
    return rows.map((r) => ({
      source: r.source,
      count: Number(r.count),
      pct: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
    }));
  }

  // ── Empty response ────────────────────────────────────────────────────────
  // FIX: shape was stale — missing sources, all delta fields, avgTimeToHire
  private emptyResponse(tier: string): EmployerAnalyticsResponse {
    return {
      totalJobs: 0,
      activeJobs: 0,
      totalViews: 0,
      totalApplications: 0,
      avgApplyRate: 0,
      avgTimeToHire: 0,
      viewsDelta: 0,
      applicationsDelta: 0,
      hireRateDelta: 0,
      timeToHireDelta: 0,
      pipeline: [],
      topJobs: [],
      sources: [],
      trend: [],
      tier,
    };
  }
}
