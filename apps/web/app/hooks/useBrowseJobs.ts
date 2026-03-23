/** @format */
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api }      from "../lib";
import { API_BASE } from "../constants";
import { useUser }  from "../store/session.store";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BrowseJob {
  id:             string;
  title:          string;
  company:        { id: string; companyName: string; logoUrl: string | null; };
  location:       string;
  locationType:   string;
  type:           string;
  experienceLevel:string;
  salaryMin:      number | null;
  salaryMax:      number | null;
  salaryCurrency: string;
  description:    string;
  skills:         string[];
  publishedAt:    string;
  expiresAt:      string | null;
  isUrgent?:      boolean;
  isFeatured?:    boolean;
  // computed client-side
  matchScore:     number;
  matchedSkills:  string[];
}

export interface BrowseFilters {
  search:      string;
  types:       Set<string>;
  modes:       Set<string>;
  experience:  Set<string>;
  salaryMin:   string;
  salaryMax:   string;
}

export type SortKey = "newest" | "match" | "salary";

const INIT_FILTERS: BrowseFilters = {
  search:     "",
  types:      new Set(),
  modes:      new Set(),
  experience: new Set(),
  salaryMin:  "",
  salaryMax:  "",
};

// ── Match score — intersection of applicant skills vs job required skills ──────
function computeMatch(jobSkills: string[], profileSkills: string[]): {
  score: number; matched: string[];
} {
  if (!profileSkills.length || !jobSkills.length) {
    return { score: 0, matched: [] };
  }
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase().trim()));
  const matched    = jobSkills.filter((s) => profileSet.has(s.toLowerCase().trim()));
  const score      = Math.round((matched.length / jobSkills.length) * 100);
  return { score, matched };
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useBrowseJobs() {
  const user           = useUser();
  const profileSkills  = useMemo(
    () => user?.applicantProfile?.skills ?? [],
    [user],
  );

  const [rawJobs,  setRawJobs]  = useState<BrowseJob[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [sort,     setSort]     = useState<SortKey>("newest");
  const [filters,  setFilters]  = useState<BrowseFilters>(INIT_FILTERS);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (f: BrowseFilters, s: SortKey, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("sort",  s === "match" ? "newest" : s); // backend does newest; we re-sort by match
      params.set("page",  String(p));
      params.set("limit", "20");
      if (f.search)    params.set("q",        f.search);
      if (f.salaryMin) params.set("salaryMin", f.salaryMin);
      [...f.types].forEach((t)      => params.append("type",           t));
      [...f.modes].forEach((m)      => params.append("locationType",   m.toLowerCase()));
      [...f.experience].forEach((e) => params.append("experienceLevel", e));

      const res = await api<{
        items: Omit<BrowseJob, "matchScore" | "matchedSkills">[];
        total: number;
      }>(`${API_BASE}/jobs?${params.toString()}`, "GET");

      // Compute match scores client-side
      const withScores: BrowseJob[] = res.items.map((job) => {
        const { score, matched } = computeMatch(job.skills ?? [], profileSkills);
        return { ...job, matchScore: score, matchedSkills: matched };
      });

      setRawJobs(withScores);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [profileSkills]);

  // Debounced fetch on filter/sort/page change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchJobs(filters, sort, page);
    }, filters.search ? 400 : 0); // debounce search input only
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, sort, page, fetchJobs]);

  // Fetch saved jobs on mount
  useEffect(() => {
    api<{ id: string }[]>(`${API_BASE}/jobs/saved`, "GET")
      .then((data) => setSavedIds(new Set(data.map((j) => j.id))))
      .catch(() => {});
  }, []);

  // ── Client-side sort by match (after fetch) ────────────────────────────────
  const jobs = useMemo(() => {
    if (sort !== "match") return rawJobs;
    return [...rawJobs].sort((a, b) => b.matchScore - a.matchScore);
  }, [rawJobs, sort]);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const setSearch = useCallback((v: string) => {
    setFilters((p) => ({ ...p, search: v }));
    setPage(1);
  }, []);

  const toggleSet = useCallback((
    key: keyof Pick<BrowseFilters, "types" | "modes" | "experience">,
    val: string,
  ) => {
    setFilters((prev) => {
      const next = new Set(prev[key]);
      next.has(val) ? next.delete(val) : next.add(val);
      return { ...prev, [key]: next };
    });
    setPage(1);
  }, []);

  const setSalary = useCallback((key: "salaryMin" | "salaryMax", val: string) => {
    setFilters((p) => ({ ...p, [key]: val }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INIT_FILTERS);
    setPage(1);
  }, []);

  const activeChips = useMemo(() => [
    ...[...filters.types].map((v) => ({
      label: v, clear: () => toggleSet("types", v),
    })),
    ...[...filters.modes].map((v) => ({
      label: v, clear: () => toggleSet("modes", v),
    })),
    ...[...filters.experience].map((v) => ({
      label: v, clear: () => toggleSet("experience", v),
    })),
    ...(filters.salaryMin ? [{ label: `Min ${filters.salaryMin}k`, clear: () => setSalary("salaryMin", "") }] : []),
    ...(filters.salaryMax ? [{ label: `Max ${filters.salaryMax}k`, clear: () => setSalary("salaryMax", "") }] : []),
  ], [filters, toggleSet, setSalary]);

  // ── Save / unsave ──────────────────────────────────────────────────────────
  const toggleSave = useCallback(async (jobId: string) => {
    const isSaved = savedIds.has(jobId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    try {
      await api(
        `${API_BASE}/jobs/${jobId}/save`,
        isSaved ? "DELETE" : "POST",
      );
    } catch {
      // rollback
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
    }
  }, [savedIds]);

  const totalPages = Math.ceil(total / 20);

  return {
    jobs, loading, error,
    total, page, totalPages, setPage,
    sort, setSort,
    filters, setSearch, toggleSet, setSalary,
    resetFilters, activeChips,
    savedIds, toggleSave,
    profileSkills,
  };
}