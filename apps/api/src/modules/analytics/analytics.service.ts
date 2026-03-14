/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/** @format */

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type DateRange = '7d' | '30d' | '90d' | '12m';

interface RangeConfig {
  interval: string;
  trunc: string;
  labelFmt: string;
  periods: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly ds: DataSource) {}

  async getEmployerAnalytics(ownerId: string, range: DateRange) {
    const cfg = this.rangeConfig(range);
    const [overview, chart, funnel, topJobs, sources] = await Promise.all([
      this.getOverview(ownerId, cfg),
      this.getChart(ownerId, cfg),
      this.getFunnel(ownerId, cfg),
      this.getTopJobs(ownerId, cfg),
      this.getSources(ownerId, cfg),
    ]);
    return { overview, chart, funnel, topJobs, sources };
  }

  // ── Overview ───────────────────────────────────────────────────────────────
  private async getOverview(ownerId: string, cfg: RangeConfig) {
    const [cur, prev] = await Promise.all([
      this.overviewQuery(ownerId, cfg.interval, '0'),
      this.overviewQuery(ownerId, cfg.interval, cfg.interval),
    ]);
    const delta = (c: number, p: number) =>
      p === 0 ? 0 : Math.round(((c - p) / p) * 100);
    return {
      totalViews: cur.views,
      totalApplications: cur.apps,
      hireRate: cur.apps > 0 ? Math.round((cur.offers / cur.apps) * 100) : 0,
      avgTimeToHire: cur.avg_days,
      viewsDelta: delta(cur.views, prev.views),
      applicationsDelta: delta(cur.apps, prev.apps),
      hireRateDelta: delta(cur.offers, prev.offers),
      timeToHireDelta: delta(cur.avg_days, prev.avg_days),
    };
  }

  private async overviewQuery(
    ownerId: string,
    interval: string,
    offset: string,
  ) {
    const rows = await this.ds.query(
      `SELECT
         COALESCE(SUM(j.views_count), 0)::int                          AS views,
         COUNT(a.id)::int                                              AS apps,
         COUNT(a.id) FILTER (WHERE a.status::text = 'offered')::int   AS offers,
         COALESCE(
           AVG(
             EXTRACT(EPOCH FROM (
               (SELECT MIN(ash.changed_at)
                FROM application_status_history ash
                WHERE ash.application_id = a.id AND ash.to_status::text = 'offered')
               - j.created_at
             )) / 86400
           )::int,
           0
         )                                                             AS avg_days
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       LEFT JOIN applications a ON a.job_id = j.id
         AND a.created_at >= NOW() - $2::interval - $3::interval
         AND a.created_at <  NOW() - $3::interval
       WHERE c.owner_id = $1
         AND j.deleted_at IS NULL
         AND j.created_at >= NOW() - $2::interval - $3::interval
         AND j.created_at <  NOW() - $3::interval`,
      [ownerId, interval, offset === '0' ? '0 seconds' : offset],
    );
    return rows[0] ?? { views: 0, apps: 0, offers: 0, avg_days: 0 };
  }

  // ── Chart ──────────────────────────────────────────────────────────────────
  private async getChart(ownerId: string, cfg: RangeConfig) {
    const rows = await this.ds.query(
      `SELECT
         date_trunc($3, gs.bucket)                                              AS bucket,
         COALESCE(SUM(j.views_count), 0)::int                                  AS views,
         COUNT(DISTINCT a.id)::int                                              AS applications,
         COUNT(DISTINCT a.id) FILTER (WHERE a.status::text = 'offered')::int   AS offers
       FROM generate_series(
         date_trunc($3, NOW() - $2::interval),
         date_trunc($3, NOW()),
         ('1 ' || $3)::interval
       ) AS gs(bucket)
       LEFT JOIN jobs j
         ON j.created_at >= gs.bucket
        AND j.created_at <  gs.bucket + ('1 ' || $3)::interval
        AND j.deleted_at IS NULL
       LEFT JOIN companies c ON c.id = j.company_id AND c.owner_id = $1
       LEFT JOIN applications a
         ON a.job_id = j.id
        AND a.created_at >= gs.bucket
        AND a.created_at <  gs.bucket + ('1 ' || $3)::interval
       GROUP BY 1
       ORDER BY 1`,
      [ownerId, cfg.interval, cfg.trunc],
    );
    return rows.map((r: any) => ({
      label: this.formatBucket(r.bucket, cfg.trunc),
      views: r.views,
      applications: r.applications,
      offers: r.offers,
    }));
  }

  // ── Funnel ─────────────────────────────────────────────────────────────────
  private async getFunnel(ownerId: string, cfg: RangeConfig) {
    const rows = await this.ds.query(
      `SELECT
         COUNT(*)::int                                                                                              AS applied,
         COUNT(*) FILTER (WHERE a.status::text IN ('reviewing','shortlisted','interview','offered','hired'))::int  AS reviewed,
         COUNT(*) FILTER (WHERE a.status::text IN ('shortlisted','interview','offered','hired'))::int              AS shortlisted,
         COUNT(*) FILTER (WHERE a.status::text IN ('interview','offered','hired'))::int                            AS interview,
         COUNT(*) FILTER (WHERE a.status::text IN ('offered','hired'))::int                                        AS offered,
         COUNT(*) FILTER (WHERE a.status::text = 'hired')::int                                                     AS hired
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE c.owner_id = $1
         AND a.created_at >= NOW() - $2::interval`,
      [ownerId, cfg.interval],
    );
    const r = rows[0] ?? {};
    const total = r.applied || 1;
    return [
      { stage: 'Applied', count: r.applied ?? 0 },
      { stage: 'Reviewed', count: r.reviewed ?? 0 },
      { stage: 'Shortlisted', count: r.shortlisted ?? 0 },
      { stage: 'Interview', count: r.interview ?? 0 },
      { stage: 'Offered', count: r.offered ?? 0 },
      { stage: 'Hired', count: r.hired ?? 0 },
    ].map((s) => ({ ...s, pct: Math.round((s.count / total) * 100) }));
  }

  // ── Top jobs ───────────────────────────────────────────────────────────────
  private async getTopJobs(ownerId: string, cfg: RangeConfig) {
    const rows = await this.ds.query(
      `SELECT
         j.id,
         j.title,
         j.views_count                                                                AS views,
         j.status::text                                                               AS status,
         COUNT(a.id)::int                                                            AS applications,
         COUNT(a.id) FILTER (WHERE a.status::text IN ('offered','hired'))::int       AS hires
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       LEFT JOIN applications a
         ON a.job_id = j.id
        AND a.created_at >= NOW() - $2::interval
       WHERE c.owner_id = $1
         AND j.deleted_at IS NULL
       GROUP BY j.id, j.title, j.views_count, j.status
       ORDER BY applications DESC
       LIMIT 8`,
      [ownerId, cfg.interval],
    );
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      views: r.views ?? 0,
      applications: r.applications,
      hireRate:
        r.applications > 0 ? Math.round((r.hires / r.applications) * 100) : 0,
      status: r.status,
    }));
  }

  // ── Sources ────────────────────────────────────────────────────────────────
  private async getSources(ownerId: string, cfg: RangeConfig) {
    // Cast enum → text BEFORE NULLIF to avoid "invalid input value for enum" error
    const rows = await this.ds.query(
      `SELECT
         COALESCE(NULLIF(a.source::text, ''), 'Direct') AS source,
         COUNT(*)::int                                  AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE c.owner_id = $1
         AND a.created_at >= NOW() - $2::interval
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT 6`,
      [ownerId, cfg.interval],
    );
    const total = rows.reduce((s: number, r: any) => s + r.count, 0) || 1;
    return rows.map((r: any) => ({
      source: r.source,
      count: r.count,
      pct: Math.round((r.count / total) * 100),
    }));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private rangeConfig(range: DateRange): RangeConfig {
    switch (range) {
      case '7d':
        return {
          interval: '7 days',
          trunc: 'day',
          labelFmt: 'day',
          periods: 7,
        };
      case '30d':
        return {
          interval: '30 days',
          trunc: 'day',
          labelFmt: 'day',
          periods: 30,
        };
      case '90d':
        return {
          interval: '90 days',
          trunc: 'week',
          labelFmt: 'week',
          periods: 13,
        };
      case '12m':
        return {
          interval: '12 months',
          trunc: 'month',
          labelFmt: 'month',
          periods: 12,
        };
    }
  }

  private formatBucket(bucket: string | Date, trunc: string): string {
    const d = new Date(bucket);
    if (trunc === 'day')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (trunc === 'week') return `Wk ${this.isoWeek(d)}`;
    if (trunc === 'month')
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return d.toISOString().slice(0, 10);
  }

  private isoWeek(d: Date): number {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(
      ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
    );
  }
}
