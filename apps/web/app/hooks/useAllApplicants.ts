/* eslint-disable @typescript-eslint/no-unused-vars */
/** @format */
import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  AllApplicant,
  AllApplicantsStats,
  ApplicantStatus,
  JobOption,
  SortKey,
} from "../types/all-applicants.types";

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface RawApplicant {
  id: string;
  status: ApplicantStatus;
  isStarred: boolean; // ✗ starred
  matchScore?: number;
  createdAt: string;
  resume?: {
    // ✗ resumeUrl (it's a nested object)
    fileUrl?: string;
  };
  applicant?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
    applicantProfile?: {
      // title/location/skills/experience are nested here
      jobTitle?: string;
      location?: string;
      experienceYears?: number;
      skills?: string[];
    };
  };
  job?: {
    id?: string;
    title?: string;
  };
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function toRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAllApplicants() {
  const [applicants, setApplicants] = useState<AllApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | "all">(
    "all",
  );
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [starredOnly, setStarredOnly] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api<RawApplicant[]>(
      `${API_BASE}/applications?scope=employer&limit=200`,
      "GET",
    )
      .then((data) => {
        if (cancelled) return;
        setApplicants(
          data.map(
            (a): AllApplicant => ({
              id: a.id,
              name: a.applicant?.fullName ?? "Unknown",
              email: a.applicant?.email ?? "",
              avatar: toInitials(a.applicant?.fullName ?? "?"),
              avatarUrl: a.applicant?.avatarUrl,
              title: a.applicant?.applicantProfile?.jobTitle ?? "—", // ✗ a.applicant?.title
              location: a.applicant?.applicantProfile?.location ?? "—", // ✗ a.applicant?.location
              match: a.matchScore ?? 0, // field doesn't exist, stays 0
              status: a.status,
              appliedAt: a.createdAt,
              starred: a.isStarred, // ✗ a.starred
              jobId: a.job?.id ?? "",
              jobTitle: a.job?.title ?? "Unknown Job",
              resumeUrl: a.resume?.fileUrl ?? "", // ✗ a.resumeUrl (resume is an object)
              skills: a.applicant?.applicantProfile?.skills ?? [], // ✗ a.applicant?.skills
              experience: a.applicant?.applicantProfile?.experienceYears, // ✗ a.applicant?.experience
            }),
          ),
        );
        setLoading(false);
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
  }, []);

  // ── Derived — job options for filter dropdown ─────────────────────────────
  const jobOptions = useMemo((): JobOption[] => {
    const map = new Map<string, JobOption>();
    applicants.forEach((a) => {
      const existing = map.get(a.jobId);
      if (existing) {
        existing.count++;
      } else {
        map.set(a.jobId, { id: a.jobId, title: a.jobTitle, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [applicants]);

  // ── Derived — stats ───────────────────────────────────────────────────────
  const stats = useMemo(
    (): AllApplicantsStats => ({
      total: applicants.length,
      new: applicants.filter((a) => a.status === "new").length,
      shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
      interview: applicants.filter((a) => a.status === "interview").length,
      offered: applicants.filter((a) => a.status === "offered").length,
    }),
    [applicants],
  );

  // ── Derived — counts per status tab ──────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applicants.length };
    (
      [
        "new",
        "reviewing",
        "shortlisted",
        "interview",
        "offered",
        "rejected",
      ] as ApplicantStatus[]
    ).forEach((s) => {
      c[s] = applicants.filter((a) => a.status === s).length;
    });
    return c;
  }, [applicants]);

  // ── Derived — filtered + sorted list ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = applicants;

    if (statusFilter !== "all")
      list = list.filter((a) => a.status === statusFilter);
    if (jobFilter !== "all") list = list.filter((a) => a.jobId === jobFilter);
    if (starredOnly) list = list.filter((a) => a.starred);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.skills.some((s) => s.toLowerCase().includes(q)),
      );
    }

    return [...list].sort((a, b) => {
      if (sort === "match") return b.match - a.match;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "status") return a.status.localeCompare(b.status);
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
  }, [applicants, statusFilter, jobFilter, starredOnly, search, sort]);

  // ── Mutation — star (optimistic) ─────────────────────────────────────────
  const toggleStar = useCallback((id: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
    );
    api(`${API_BASE}/applications/${id}/star`, "PATCH").catch(() => {
      setApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
      );
    });
  }, []);

  // ── Mutation — status change (optimistic + rollback) ─────────────────────
  const changeStatus = useCallback(
    (id: string, status: ApplicantStatus) => {
      const prev = applicants.find((a) => a.id === id)?.status;
      setApplicants((list) =>
        list.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      api(`${API_BASE}/applications/${id}/status`, "PATCH", { status }).catch(
        () => {
          setApplicants((list) =>
            list.map((a) => (a.id === id && prev ? { ...a, status: prev } : a)),
          );
        },
      );
    },
    [applicants],
  );

  return {
    // data
    applicants,
    filtered,
    stats,
    counts,
    jobOptions,
    loading,
    error,
    // filters
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    jobFilter,
    setJobFilter,
    sort,
    setSort,
    starredOnly,
    setStarredOnly,
    // mutations
    toggleStar,
    changeStatus,
  };
}
