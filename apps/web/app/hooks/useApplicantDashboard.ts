/** @format */
import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  DashboardApplication,
  DashboardInterview,
  DashboardStats,
  ApplicationStatus,
} from "../types/dashboard.types";

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job?: {
    title?: string;
    company?: { companyName?: string; logoUrl?: string };
  };
}

interface RawInterview {
  id: string;
  type?: string;
  format?: string;
  durationMinutes?: number;
  scheduledAt: string;
  job?: { company?: { companyName?: string } };
}

interface RawStats {
  totalApplications: number;
  activeApplications: number;
  responseRate: number;
  responseRateDelta: number;
  weeklyCount: number;
  weeklyDelta: number;
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

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

function toInterviewLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const timeStr = date.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (date.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
  if (date.toDateString() === tomorrow.toDateString())
    return `Tomorrow, ${timeStr}`;
  return (
    date.toLocaleDateString("en-PK", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }) + `, ${timeStr}`
  );
}

function interviewDotColor(type?: string): string {
  switch (type) {
    case "technical":
      return "dot-blue";
    case "hr":
      return "dot-green";
    case "panel":
      return "dot-purple";
    default:
      return "dot-gray";
  }
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApplicantDashboard() {
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [interviews, setInterviews] = useState<DashboardInterview[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api<RawStats>(`${API_BASE}/users/dashboard-stats`, "GET"),
      api<RawApplication[]>(
        `${API_BASE}/applications/mine?limit=5&sort=recent`,
        "GET",
      ),
      api<RawInterview[]>(
        `${API_BASE}/interviews?status=upcoming&limit=5`,
        "GET",
      ),
    ])
      .then(([rawStats, rawApps, rawIvs]) => {
        if (cancelled) return;
        console.log("RawStats------->", rawStats);

        setStats({
          totalApplications: rawStats.totalApplications,
          activeApplications: rawStats.activeApplications,
          responseRate: rawStats.responseRate,
          responseRateDelta: rawStats.responseRateDelta,
          weeklyApplications: rawStats.weeklyCount,
          weeklyDelta: rawStats.weeklyDelta,
        });

        setApplications(
          (rawApps ?? []).map((app) => ({
            id: app.id,
            title: app.job?.title ?? "Unknown Role",
            company: app.job?.company?.companyName ?? "Unknown Company",
            logo: toInitials(app.job?.company?.companyName ?? "?"),
            logoUrl: app.job?.company?.logoUrl,
            time: toRelativeTime(app.createdAt),
            status: app.status,
          })),
        );

        setInterviews(
          (rawIvs ?? []).map((iv) => ({
            id: iv.id,
            title: `${iv.type ? iv.type.charAt(0).toUpperCase() + iv.type.slice(1) + " Round" : "Interview"} — ${iv.job?.company?.companyName ?? ""}`,
            sub: `${iv.format ?? "Video call"} · ${iv.durationMinutes ?? 45} min`,
            time: toInterviewLabel(iv.scheduledAt),
            color: interviewDotColor(iv.type),
          })),
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

  // ── Derived — status counts across applications ───────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    (
      [
        "applied",
        "reviewing",
        "shortlisted",
        "interview",
        "offered",
        "rejected",
        "withdrawn",
      ] as ApplicationStatus[]
    ).forEach((s) => {
      c[s] = applications.filter((a) => a.status === s).length;
    });
    return c;
  }, [applications]);

  // ── Derived — response rate copy ─────────────────────────────────────────
  const responseRateLabel = useMemo(() => {
    if (!stats) return "";
    if (stats.responseRate < 30)
      return "Below average — follow up on pending apps";
    if (stats.responseRate < 60) return "Getting there — keep applying";
    return "Great response rate! 🎉";
  }, [stats]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** Withdraw an application — optimistic update + rollback on failure */
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

  return {
    // data
    stats,
    applications,
    interviews,
    counts,
    loading,
    error,
    // derived
    responseRateLabel,
    // mutations
    withdrawApplication,
  };
}
