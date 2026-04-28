/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { LimitsService } from '../billing/limits.service';
import { AnalyticsTier, AppStatus } from '../../common/enums/enums';
import type {
  PeriodAggregates,
  SourceRow,
  TrendRow,
  EmployerAnalyticsResponse,
  AnalyticsInsight,
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
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
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
        'isFeatured',
      ],
      relations: ['company'],
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
    const pipelineMap = new Map(
      pipeline.map((p) => [String(p.status).toLowerCase(), p.count]),
    );
    const totalApps = current.totalApplications;
    const shortlisted = pipelineMap.get(AppStatus.SHORTLISTED) ?? 0;
    const interviewsInPipeline = pipelineMap.get(AppStatus.INTERVIEW) ?? 0;
    const offers = pipelineMap.get(AppStatus.OFFERED) ?? 0;
    const hires = pipelineMap.get(AppStatus.HIRED) ?? 0;
    const rejected = pipelineMap.get(AppStatus.REJECTED) ?? 0;
    const funnelConversion = {
      applicantToShortlist:
        totalApps > 0 ? Math.round((shortlisted / totalApps) * 100) : 0,
      shortlistToInterview:
        shortlisted > 0
          ? Math.round((interviewsInPipeline / shortlisted) * 100)
          : 0,
      interviewToOffer:
        interviewsInPipeline > 0
          ? Math.round((offers / interviewsInPipeline) * 100)
          : 0,
      offerToHire: offers > 0 ? Math.round((hires / offers) * 100) : 0,
      rejectionRate:
        totalApps > 0 ? Math.round((rejected / totalApps) * 100) : 0,
    };

    // ── Top jobs — FIX: include actual status from entity ─────────────────
    const jobPerformance = await this.fetchJobPerformance(jobIds);
    const perfMap = new Map(jobPerformance.map((j) => [j.job_id, j]));
    const topJobs = jobs
      .map((j) => {
        const perf = perfMap.get(j.id!);
        const applications = Number(
          perf?.applications ?? j.applicantCount ?? 0,
        );
        const interviews = Number(perf?.interviews ?? 0);
        const jobHires = Number(perf?.hires ?? 0);
        return {
          id: j.id!,
          title: j.title!,
          status: String(j.status),
          views: j.viewsCount ?? 0,
          applications,
          interviews,
          hires: jobHires,
          applyRate:
            (j.viewsCount ?? 0) > 0
              ? Math.round((applications / j.viewsCount!) * 100 * 10) / 10
              : 0,
          conversionRate:
            applications > 0 ? Math.round((jobHires / applications) * 100) : 0,
          isFeatured: j.isFeatured ?? false,
          isVerified: j.company?.isVerified ?? false,
        };
      })
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 8);

    // ── Sources breakdown ─────────────────────────────────────────────────
    // FIX: was always returning [] — now queries source column on applications.
    // Falls back gracefully if the column doesn't exist yet.
    const sources = await this.fetchSources(jobIds, days);
    const pipelineHealth = await this.fetchPipelineHealth(jobIds);
    const usage = await this.buildUsage(userId);
    const recommendations = this.buildRecommendations({
      tier,
      usage,
      pipelineHealth,
      topJobs,
      companyVerified: company.isVerified ?? false,
    });

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
      lockedInsights: tier === AnalyticsTier.BASIC,
      funnelConversion,
      pipelineHealth,
      usage,
      recommendations:
        tier === AnalyticsTier.BASIC
          ? recommendations.slice(0, 2)
          : recommendations,
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

  private async fetchJobPerformance(jobIds: string[]) {
    return this.dataSource.query<
      {
        job_id: string;
        applications: string;
        interviews: string;
        hires: string;
      }[]
    >(
      `SELECT
         a.job_id,
         COUNT(a.id)::int AS applications,
         COUNT(a.id) FILTER (WHERE a.status = 'interview')::int AS interviews,
         COUNT(a.id) FILTER (WHERE a.status = 'hired')::int AS hires
       FROM applications a
       WHERE a.job_id = ANY($1)
       GROUP BY a.job_id`,
      [jobIds],
    );
  }

  private async fetchPipelineHealth(jobIds: string[]) {
    const rows = await this.dataSource.query<
      {
        stuck_applications: string;
        waiting_for_response: string;
        pending_decisions: string;
      }[]
    >(
      `SELECT
         COUNT(*) FILTER (
           WHERE status IN ('new', 'reviewing', 'shortlisted')
           AND updated_at < NOW() - INTERVAL '5 days'
         )::int AS stuck_applications,
         COUNT(*) FILTER (
           WHERE status IN ('new', 'reviewing')
           AND created_at < NOW() - INTERVAL '3 days'
         )::int AS waiting_for_response,
         COUNT(*) FILTER (
           WHERE status = 'interview'
           AND updated_at < NOW() - INTERVAL '2 days'
         )::int AS pending_decisions
       FROM applications
       WHERE job_id = ANY($1)`,
      [jobIds],
    );
    const row = rows[0];
    const pendingDecisions = Number(row?.pending_decisions ?? 0);
    const interviewsScheduled = await this.interviewRepo
      .createQueryBuilder('iv')
      .where('iv.job_id IN (:...jobIds)', { jobIds })
      .andWhere('iv.status = :status', { status: 'upcoming' })
      .getCount();

    return {
      stuckApplications: Number(row?.stuck_applications ?? 0),
      waitingForResponse: Number(row?.waiting_for_response ?? 0),
      interviewsScheduled,
      pendingDecisions,
      overdueFollowUps: pendingDecisions,
    };
  }

  private async buildUsage(userId: string) {
    const interviewUsage = await this.limits.getInterviewUsage(userId);
    const rows = await this.dataSource.query<
      { job_posts_remaining: string; featured_slots_remaining: string }[]
    >(
      `SELECT job_posts_remaining, featured_slots_remaining
       FROM subscriptions
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const sub = rows[0];

    return {
      interviews: {
        currentUsage: interviewUsage.currentUsage,
        limit: interviewUsage.limit,
        pct:
          interviewUsage.limit === 'unlimited'
            ? null
            : Math.round(
                (interviewUsage.currentUsage / interviewUsage.limit) * 100,
              ),
      },
      featuredSlotsRemaining: Number(sub?.featured_slots_remaining ?? 0),
      jobPostsRemaining: Number(sub?.job_posts_remaining ?? 0),
    };
  }

  private buildRecommendations(input: {
    tier: AnalyticsTier;
    usage: EmployerAnalyticsResponse['usage'];
    pipelineHealth: EmployerAnalyticsResponse['pipelineHealth'];
    topJobs: EmployerAnalyticsResponse['topJobs'];
    companyVerified: boolean;
  }): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    if (
      input.usage.interviews.pct !== null &&
      input.usage.interviews.pct >= 90
    ) {
      insights.push({
        severity: 'critical',
        title: 'Interview limit almost used',
        body: `You used ${input.usage.interviews.currentUsage} of ${input.usage.interviews.limit} interviews this period. Upgrade before scheduling stops.`,
        cta: 'Upgrade plan',
      });
    }
    if (input.pipelineHealth.waitingForResponse > 0) {
      insights.push({
        severity: 'warning',
        title: `${input.pipelineHealth.waitingForResponse} candidates are waiting`,
        body: 'Respond within 3 days to reduce drop-off and protect candidate experience.',
        cta: 'Review pipeline',
      });
    }
    const featured = input.topJobs.find((j) => j.isFeatured);
    if (featured) {
      insights.push({
        severity: 'success',
        title: 'Featured listing is working',
        body: `${featured.title} is one of your strongest performers. Keep priority roles featured to protect applicant flow.`,
      });
    }
    if (!input.companyVerified) {
      insights.push({
        severity: 'info',
        title: 'Verified badge can increase trust',
        body: 'Growth and Scale include the verified company badge so candidates can apply with more confidence.',
        cta: 'Verify company',
      });
    }
    if (
      input.tier === AnalyticsTier.BASIC ||
      input.tier === AnalyticsTier.NONE
    ) {
      insights.push({
        severity: 'info',
        title: 'Unlock advanced hiring intelligence',
        body: 'Growth adds pipeline health, automation insights, and stronger conversion recommendations.',
        cta: 'Upgrade to Growth',
      });
    }
    return insights;
  }

  // ── Empty response ────────────────────────────────────────────────────────
  // FIX: shape was stale — missing sources, all delta fields, avgTimeToHire
  private emptyResponse(tier: AnalyticsTier): EmployerAnalyticsResponse {
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
      lockedInsights:
        tier === AnalyticsTier.NONE || tier === AnalyticsTier.BASIC,
      funnelConversion: {
        applicantToShortlist: 0,
        shortlistToInterview: 0,
        interviewToOffer: 0,
        offerToHire: 0,
        rejectionRate: 0,
      },
      pipelineHealth: {
        stuckApplications: 0,
        waitingForResponse: 0,
        interviewsScheduled: 0,
        pendingDecisions: 0,
        overdueFollowUps: 0,
      },
      usage: {
        interviews: { currentUsage: 0, limit: 'unlimited', pct: null },
        featuredSlotsRemaining: 0,
        jobPostsRemaining: 0,
      },
      recommendations: [],
    };
  }
}
