/** @format */

export type DateRange = "7d" | "30d" | "90d";

// Exported so page.tsx can use it for series toggle state
export type SeriesKey = "views" | "applications" | "offers";

export interface ChartPoint {
  label: string;
  views: number;
  applications: number;
  offers: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export interface TopJob {
  id: string;
  title: string;
  views: number;
  applications: number;
  interviews?: number;
  hires?: number;
  hireRate: number;
  conversionRate?: number;
  status: string;
  isFeatured?: boolean;
  isVerified?: boolean;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  pct: number;
}

export interface AnalyticsOverview {
  totalViews: number;
  viewsDelta: number;
  totalApplications: number;
  applicationsDelta: number;
  hireRate: number;
  hireRateDelta: number;
  avgTimeToHire: number;
  timeToHireDelta: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  chart: ChartPoint[];
  funnel: FunnelStage[];
  topJobs: TopJob[];
  sources: SourceBreakdown[];
  tier: string;
  // raw backend pass-through fields for plan-gate checks
  totalJobs: number;
  activeJobs: number;
  totalViews: number;
  totalApplications: number;
  avgApplyRate: number;
  trend: unknown[];
  pipeline: { status: string; count: number }[];
  lockedInsights?: boolean;
  funnelConversion?: Record<string, number>;
  pipelineHealth?: {
    stuckApplications: number;
    waitingForResponse: number;
    interviewsScheduled: number;
    pendingDecisions: number;
    overdueFollowUps: number;
  };
  usage?: {
    interviews: {
      currentUsage: number;
      limit: number | "unlimited";
      pct: number | null;
    };
    featuredSlotsRemaining: number;
    jobPostsRemaining: number;
  };
  recommendations?: {
    severity: "info" | "warning" | "critical" | "success";
    title: string;
    body: string;
    cta?: string;
  }[];
}
