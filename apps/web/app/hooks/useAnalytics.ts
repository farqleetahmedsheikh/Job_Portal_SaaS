/** @format */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { AnalyticsData, DateRange } from "../types/analytics.types";

// ── Transform raw backend response → UI shape ─────────────────────────────────
function transform(raw: any): AnalyticsData {
  const totalViews = raw.totalViews ?? 0;
  const totalApps = raw.totalApplications ?? 0;

  // Build funnel from pipeline
  const pipelineMap: Record<string, number> = {};
  (raw.pipeline ?? []).forEach((p: any) => {
    pipelineMap[String(p.status).toLowerCase()] = p.count;
  });

  const funnelStages = [
    { stage: "Applied", count: totalApps },
    { stage: "Reviewing", count: pipelineMap["reviewing"] ?? 0 },
    { stage: "Shortlisted", count: pipelineMap["shortlisted"] ?? 0 },
    { stage: "Interview", count: pipelineMap["interview"] ?? 0 },
    { stage: "Offered", count: pipelineMap["offered"] ?? 0 },
  ];
  const funnel = funnelStages.map((s) => ({
    ...s,
    pct: totalApps > 0 ? Math.round((s.count / totalApps) * 100) : 0,
  }));

  // Build chart from trend
  const chart = (raw.trend ?? []).map((t: any) => ({
    label: new Date(t.date).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    }),
    views: t.views ?? 0,
    applications: t.applications ?? 0,
    offers: t.offers ?? 0, // use backend value when available
  }));

  // FIX: topJobs — use backend's actual status, don't hardcode "active"
  const topJobs = (raw.topJobs ?? []).map((j: any) => ({
    id: String(j.id),
    title: String(j.title ?? "Untitled"),
    views: j.views ?? 0,
    applications: j.applications ?? 0,
    hireRate: j.applyRate ?? j.hireRate ?? 0,
    // Use backend status if valid; fall back to "active"
    status: (["active", "paused", "closed"].includes(j.status)
      ? j.status
      : "active") as "active" | "paused" | "closed",
  }));

  // Sources — map from backend if provided
  const sources = (raw.sources ?? []).map((s: any, i: number) => ({
    source: String(s.source ?? s.name ?? `Source ${i + 1}`),
    count: s.count ?? 0,
    pct: s.pct ?? s.percentage ?? 0,
  }));

  return {
    overview: {
      totalViews,
      // NOTE: deltas are 0 until backend provides them — UI treats 0 as "unknown"
      viewsDelta: raw.viewsDelta ?? 0,
      totalApplications: totalApps,
      applicationsDelta: raw.applicationsDelta ?? 0,
      hireRate: raw.avgApplyRate ?? raw.hireRate ?? 0,
      hireRateDelta: raw.hireRateDelta ?? 0,
      avgTimeToHire: raw.avgTimeToHire ?? 0,
      timeToHireDelta: raw.timeToHireDelta ?? 0,
    },
    chart,
    funnel,
    topJobs,
    sources,
    tier: raw.tier ?? "none",
    // pass-through fields for plan-gate checks
    totalJobs: raw.totalJobs ?? 0,
    activeJobs: raw.activeJobs ?? 0,
    totalViews,
    totalApplications: totalApps,
    avgApplyRate: raw.avgApplyRate ?? 0,
    trend: raw.trend ?? [],
    pipeline: raw.pipeline ?? [],
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAnalytics() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  // loading: only true on the very first fetch (shows skeleton)
  const [loading, setLoading] = useState(true);
  // isRefreshing: true on manual refresh or range change after first load
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track whether we've completed the initial load so range changes don't re-show skeleton
  const hasFetched = useRef(false);

  const load = useCallback(async (r: DateRange, manual = false) => {
    if (!hasFetched.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const raw = await api<any>(
        `${API_BASE}/analytics/employer?range=${r}`,
        "GET",
      );
      setData(transform(raw));
      setLastUpdated(new Date());
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const changeRange = useCallback((r: DateRange) => setRange(r), []);

  // Manual refresh — keeps existing data visible while fetching
  const refresh = useCallback(() => void load(range, true), [load, range]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    range,
    changeRange,
    refresh,
    lastUpdated,
  };
}
