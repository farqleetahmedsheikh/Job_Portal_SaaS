/** @format */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import { useUser } from "../store/session.store";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface SavedJobItem {
  id: string; // savedJob row id
  jobId: string;
  savedAt: string; // ISO
  job: {
    id: string;
    title: string;
    type: string;
    locationType: string;
    location: string;
    experienceLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    skills: string[];
    expiresAt: string | null;
    status: string;
    company: {
      id: string;
      companyName: string;
      logoUrl: string | null;
    };
  };
  // computed
  matchScore: number;
  matchedSkills: string[];
  applied: boolean;
  isExpired: boolean;
  daysLeft: number | null;
}

export type SortKey = "saved" | "match" | "deadline";
export type FilterKey = "all" | "not-applied" | "applied" | "expiring";

function computeMatch(jobSkills: string[], profileSkills: string[]) {
  if (!jobSkills.length || !profileSkills.length)
    return { score: 0, matched: [] as string[] };
  const set = new Set(profileSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => set.has(s.toLowerCase()));
  return {
    score: Math.round((matched.length / jobSkills.length) * 100),
    matched,
  };
}

function calcDaysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000),
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useSavedJobs() {
  const user = useUser();
  const profileSkills = useMemo(
    () => user?.applicantProfile?.skills ?? [],
    [user],
  );

  const [raw, setRaw] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("saved");
  const [sortOpen, setSortOpen] = useState(false);

  // ── Fetch saved jobs + applied job IDs in parallel ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api<SavedJobItem[]>(`${API_BASE}/jobs/saved`, "GET"),
      api<{ jobId: string }[]>(
        `${API_BASE}/applications/mine?fields=jobId`,
        "GET",
      ).catch(() => [] as { jobId: string }[]),
    ])
      .then(([saved, applications]) => {
        if (cancelled) return;

        const appliedSet = new Set(applications.map((a) => a.jobId));

        const enriched = saved.map((s) => {
          const { score, matched } = computeMatch(
            s.job.skills ?? [],
            profileSkills,
          );
          const dl = calcDaysLeft(s.job.expiresAt);
          return {
            ...s,
            matchScore: score,
            matchedSkills: matched,
            applied: appliedSet.has(s.job.id),
            isExpired: dl !== null ? dl === 0 : s.job.status === "closed",
            daysLeft: dl,
          };
        });

        setRaw(enriched);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load saved jobs",
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileSkills]);

  // ── Unsave — optimistic ────────────────────────────────────────────────────
  const handleUnsave = useCallback(async (jobId: string) => {
    setRaw((prev) => prev.filter((j) => j.job.id !== jobId));
    try {
      await api(`${API_BASE}/jobs/${jobId}/save`, "DELETE");
    } catch {
      // re-fetch to restore on failure
      api<SavedJobItem[]>(`${API_BASE}/jobs/saved`, "GET")
        .then((data) => setRaw(data))
        .catch(() => {});
    }
  }, []);

  // ── Derived list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = raw;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.job.title.toLowerCase().includes(q) ||
          j.job.company.companyName.toLowerCase().includes(q),
      );
    }

    if (filter === "not-applied")
      list = list.filter((j) => !j.applied && !j.isExpired);
    if (filter === "applied") list = list.filter((j) => j.applied);
    if (filter === "expiring")
      list = list.filter(
        (j) => !j.isExpired && j.daysLeft !== null && j.daysLeft <= 7,
      );

    return [...list].sort((a, b) => {
      if (sort === "match") return b.matchScore - a.matchScore;
      if (sort === "deadline") {
        if (!a.job.expiresAt) return 1;
        if (!b.job.expiresAt) return -1;
        return (
          new Date(a.job.expiresAt).getTime() -
          new Date(b.job.expiresAt).getTime()
        );
      }
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  }, [raw, search, filter, sort]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: raw.length,
      notApplied: raw.filter((j) => !j.applied && !j.isExpired).length,
      applied: raw.filter((j) => j.applied).length,
      expired: raw.filter((j) => j.isExpired).length,
      expiring: raw.filter(
        (j) => !j.isExpired && j.daysLeft !== null && j.daysLeft <= 7,
      ).length,
    }),
    [raw],
  );

  return {
    filtered,
    stats,
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    sortOpen,
    setSortOpen,
    handleUnsave,
  };
}
