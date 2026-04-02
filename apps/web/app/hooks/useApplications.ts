/** @format */
import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  Application,
  AppStatus,
  ApplicationStats,
  SortKey,
  JobType,
} from "../types/applications.types";

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface RawApplication {
  id: string;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  source?: string;
  notes?: string;
  job?: {
    id?: string;
    title?: string;
    salaryMin?: string;
    salaryMax: string;
    locationType?: string;
    location?: string;
    company?: { companyName?: string; logoUrl?: string };
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

function toDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function toJobType(raw?: string): JobType {
  const map: Record<string, JobType> = {
    "full-time": "full-time",
    "part-time": "part-time",
    contract: "contract",
    remote: "remote",
  };
  return map[raw?.toLowerCase() ?? ""] ?? "full-time";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api<RawApplication[]>(`${API_BASE}/applications/mine`, "GET")
      .then((data) => {
        console.log("Data ------->", data);
        if (cancelled) return;
        setApplications(
          data.map(
            (a): Application => ({
              id: a.id,
              role: a.job?.title ?? "Unknown Role",
              company: a.job?.company?.companyName ?? "Unknown Company",
              logo: toInitials(a.job?.company?.companyName ?? "?"),
              logoUrl: a.job?.company?.logoUrl,
              location: a.job?.location ?? "—",
              type: toJobType(a.job?.locationType),
              salary: `${a.job?.salaryMin} - ${a.job?.salaryMax}`,
              appliedDate: toDateLabel(a.createdAt),
              lastUpdate: toRelativeTime(a.updatedAt),
              status: a.status,
              source: a.source ?? "—",
              notes: a.notes,
              jobUrl: a.job?.id ? `/applicant/jobs/${a.job.id}` : undefined,
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

  // ── Derived — stats ───────────────────────────────────────────────────────
  const stats = useMemo(
    (): ApplicationStats => ({
      total: applications.length,
      active: applications.filter(
        (a) => !["rejected", "withdrawn"].includes(a.status),
      ).length,
      interview: applications.filter((a) => a.status === "interview").length,
      offered: applications.filter((a) => a.status === "offered").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications],
  );

  // ── Derived — counts per status tab ──────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    (
      [
        "applied",
        "reviewing",
        "interview",
        "offered",
        "rejected",
        "withdrawn",
      ] as AppStatus[]
    ).forEach((s) => {
      c[s] = applications.filter((a) => a.status === s).length;
    });
    return c;
  }, [applications]);

  // ── Derived — filtered + sorted list ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = applications;

    if (activeFilter !== "all") {
      list = list.filter((a) => a.status === activeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.role.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "company") return a.company.localeCompare(b.company);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0; // "date" — keep server order (newest first)
    });
  }, [applications, activeFilter, search, sortBy]);

  // ── Mutation — withdraw (optimistic + rollback) ───────────────────────────
  const withdrawApplication = useCallback(
    (id: string) => {
      const prev = applications.find((a) => a.id === id)?.status;
      setApplications((list) =>
        list.map((a) => (a.id === id ? { ...a, status: "withdrawn" } : a)),
      );
      api(`${API_BASE}/applications/${id}/withdraw`, "PATCH").catch(() => {
        setApplications((list) =>
          list.map((a) => (a.id === id && prev ? { ...a, status: prev } : a)),
        );
      });
    },
    [applications],
  );

  // ── Mutation — remove (optimistic + rollback) ─────────────────────────────
  const removeApplication = useCallback(
    (id: string) => {
      const snapshot = applications;
      setApplications((list) => list.filter((a) => a.id !== id));
      api(`${API_BASE}/applications/${id}`, "DELETE").catch(() => {
        setApplications(snapshot);
      });
    },
    [applications],
  );

  return {
    // data
    applications,
    filtered,
    stats,
    counts,
    loading,
    error,
    // filters
    activeFilter,
    setActiveFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    // mutations
    withdrawApplication,
    removeApplication,
  };
}
