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
  status: string;
  views: number;
  applications: number;
  interviews: number;
  hires: number;
  applyRate: number;
  conversionRate: number;
  isFeatured: boolean;
  isVerified: boolean;
}

export interface AnalyticsInsight {
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  body: string;
  cta?: string;
}

export interface PipelineHealth {
  stuckApplications: number;
  waitingForResponse: number;
  interviewsScheduled: number;
  pendingDecisions: number;
  overdueFollowUps: number;
}

export interface UsageInsights {
  interviews: {
    currentUsage: number;
    limit: number | 'unlimited';
    pct: number | null;
  };
  featuredSlotsRemaining: number;
  jobPostsRemaining: number;
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
  lockedInsights: boolean;
  funnelConversion: Record<string, number>;
  pipelineHealth: PipelineHealth;
  usage: UsageInsights;
  recommendations: AnalyticsInsight[];
}
