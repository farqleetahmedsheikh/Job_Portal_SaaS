/** @format */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { Applicant, AppStatus, SortKey } from "../types/applicants.types";
export interface JobMeta {
  id: string;
  title: string;
  location: string;
  locationType: string;
  createdAt: string; // ISO
}

interface Options {
  id: string;
}

export function useApplicants({ id }: Options) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [job, setJob] = useState<JobMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("match");
  const [sortOpen, setSortOpen] = useState(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Guard — never fire if id hasn't resolved yet
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all([
      api<JobMeta>(`${API_BASE}/jobs/${id}`, "GET"),
      api<Applicant[]>(`${API_BASE}/applications?jobId=${id}`, "GET"),
    ])
      .then(([jobData, appData]) => {
        if (!cancelled) {
          setJob(jobData);
          setApplicants(appData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Mutations — optimistic ────────────────────────────────────────────────
  const toggleStar = useCallback((id: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
    );
    // fire-and-forget — no rollback needed for star
    api(`${API_BASE}/applications/${id}/star`, "PATCH").catch(() => {});
  }, []);

  const changeStatus = useCallback((id: string, status: AppStatus) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    api(`${API_BASE}/applications/${id}/status`, "PATCH", { status }).catch(
      () => {
        // rollback on failure
        setApplicants((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: a.status } : a)),
        );
      },
    );
  }, []);

  // ── Bulk ──────────────────────────────────────────────────────────────────
  const toggleSelect = useCallback(
    (id: string) =>
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  const selectAll = useCallback(
    (all: Applicant[]) =>
      setSelected((prev) =>
        prev.length === all.length ? [] : all.map((a) => a.id),
      ),
    [],
  );

  const clearSelected = useCallback(() => setSelected([]), []);

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = applicants;
    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "match") return b.match - a.match;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
  }, [applicants, filter, search, sort]);

  // ── Pipeline counts ───────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applicants.length };
    [
      "new",
      "reviewing",
      "shortlisted",
      "interview",
      "offered",
      "rejected",
    ].forEach((s) => {
      c[s] = applicants.filter((a) => a.status === s).length;
    });
    return c;
  }, [applicants]);

  return {
    // data
    job,
    applicants,
    filtered,
    counts,
    loading,
    error,
    // filters
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    sortOpen,
    setSortOpen,
    // selection
    selected,
    toggleSelect,
    selectAll,
    clearSelected,
    // mutations
    toggleStar,
    changeStatus,
  };
}