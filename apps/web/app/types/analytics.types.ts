/** @format */
// app/employer/analytics/analytics.types.ts

export type DateRange = "7d" | "30d" | "90d" | "12m";

export interface OverviewStats {
  totalViews: number;
  totalApplications: number;
  hireRate: number; // 0–100 percent
  avgTimeToHire: number; // days
  viewsDelta: number; // percent change vs previous period
  applicationsDelta: number;
  hireRateDelta: number;
  timeToHireDelta: number;
}

export interface ChartPoint {
  label: string; // "Mar 1", "Week 12", etc.
  views: number;
  applications: number;
  offers: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number; // relative to first stage
}

export interface TopJob {
  id: string;
  title: string;
  views: number;
  applications: number;
  hireRate: number;
  status: "active" | "paused" | "closed";
}

export interface SourceBreakdown {
  source: string;
  count: number;
  pct: number;
}

export interface AnalyticsData {
  overview: OverviewStats;
  chart: ChartPoint[];
  funnel: FunnelStage[];
  topJobs: TopJob[];
  sources: SourceBreakdown[];
}
