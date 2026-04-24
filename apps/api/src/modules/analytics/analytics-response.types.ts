// ── Internal query shapes (used by service private helpers) ──────────────────

export interface PeriodAggregates {
  totalApplications: number;
  totalViews: number;
  activeJobs: number;
  avgApplyRate: number;
  avgTimeToHire: number;
}

export interface SourceRow {
  source: string;
  count: number;
  pct: number;
}

export interface TrendRow {
  date: string;
  applications: number;
  views: number;
  offers: number;
}

export interface PipelineRow {
  status: string;
  count: number;
}

export interface TopJobRow {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'closed';
  views: number;
  applications: number;
  applyRate: number;
}

// ── Public response shape returned by AnalyticsService ───────────────────────

export interface EmployerAnalyticsResponse {
  totalJobs: number;
  activeJobs: number;
  totalViews: number;
  totalApplications: number;
  avgApplyRate: number;
  avgTimeToHire: number;
  viewsDelta: number;
  applicationsDelta: number;
  hireRateDelta: number;
  timeToHireDelta: number;
  pipeline: PipelineRow[];
  topJobs: TopJobRow[];
  sources: SourceRow[];
  trend: TrendRow[];
  tier: string;
}
