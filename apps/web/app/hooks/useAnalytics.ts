/** @format */
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { AnalyticsData, DateRange } from "../types/analytics.types";

export function useAnalytics() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<AnalyticsData>(
        `${API_BASE}/analytics/employer?range=${r}`,
        "GET",
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const changeRange = useCallback((r: DateRange) => setRange(r), []);

  return { data, loading, error, range, changeRange };
}
