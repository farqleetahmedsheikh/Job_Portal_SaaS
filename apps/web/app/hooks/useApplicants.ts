/* eslint-disable @typescript-eslint/no-explicit-any */
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
  createdAt: string;
}

interface Options {
  id: string;
}

// ── Normaliser ────────────────────────────────────────────────────────────────
function toInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function normalise(a: any): Applicant & { userId?: string } {
  const p = a.applicant?.applicantProfile;
  const name = a.applicant?.fullName ?? "Unknown";
  return {
    id: a.id,
    name,
    avatar: toInitials(name),
    avatarUrl: a.applicant?.avatarUrl ?? null,
    title: p?.jobTitle ?? "—",
    location: p?.location ?? "—",
    experience: p?.experienceYears ? `${p.experienceYears} yrs` : "—",
    skills: p?.skills ?? [],
    appliedAt: a.createdAt ?? a.appliedAt,
    status: a.status,
    match: a.matchScore ?? 0,
    starred: a.isStarred ?? false,
    resumeUrl: a.resume?.url ?? null,
    userId: a.applicant?.id, // ← real user ID for message link
  };
}

export function useApplicants({ id }: Options) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [job, setJob] = useState<JobMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("match");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      api<JobMeta>(`${API_BASE}/jobs/${id}`, "GET"),
      api<any[]>(`${API_BASE}/applications?jobId=${id}`, "GET"),
    ])
      .then(([jobData, appData]) => {
        if (!cancelled) {
          setJob(jobData);
          setApplicants(appData.map(normalise)); // ← normalise here
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

  // ── Mutations ─────────────────────────────────────────────────────────────
  const toggleStar = useCallback((appId: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, starred: !a.starred } : a)),
    );
    api(`${API_BASE}/applications/${appId}/star`, "PATCH").catch(() => {});
  }, []);

  const changeStatus = useCallback((appId: string, status: AppStatus) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a)),
    );
    api(`${API_BASE}/applications/${appId}/status`, "PATCH", { status }).catch(
      () => {
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: a.status } : a)),
        );
      },
    );
  }, []);

  // ── Bulk ──────────────────────────────────────────────────────────────────
  const toggleSelect = useCallback(
    (appId: string) =>
      setSelected((prev) =>
        prev.includes(appId)
          ? prev.filter((x) => x !== appId)
          : [...prev, appId],
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

  // ── Derived ───────────────────────────────────────────────────────────────
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
    job,
    applicants,
    filtered,
    counts,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    sortOpen,
    setSortOpen,
    selected,
    toggleSelect,
    selectAll,
    clearSelected,
    toggleStar,
    changeStatus,
  };
}
