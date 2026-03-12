/** @format */
"use client";

import { useState, useEffect } from "react";
import { api }                 from "../lib";
import { API_BASE }            from "../constants";
import type { DashboardData }  from "../types/emp-dashboard.types";

interface State {
  data:    DashboardData | null;
  loading: boolean;
  error:   string | null;
}

export function useEmployerDashboard() {
  const [state, setState] = useState<State>({
    data: null, loading: true, error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Three parallel requests — backend returns each separately
        const [stats, applications, interviews, jobs] = await Promise.all([
          api<DashboardData["stats"]>(
            `${API_BASE}/users/dashboard-stats`, "GET",
          ),
          api<DashboardData["applications"]>(
            `${API_BASE}/applications/mine?limit=5&sort=recent`, "GET",
          ),
          api<DashboardData["interviews"]>(
            `${API_BASE}/interviews?status=upcoming&limit=5`, "GET",
          ),
          api<DashboardData["jobs"]>(
            `${API_BASE}/jobs/mine?status=active&limit=10`, "GET",
          ),
        ]);

        if (!cancelled) {
          setState({
            data: { stats, applications, interviews, jobs },
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load dashboard",
          });
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return state;
}