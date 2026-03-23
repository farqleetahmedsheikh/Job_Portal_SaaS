/**
 * eslint-disable no-useless-catch
 *
 * @format
 */

/** @format */
import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  Interview,
  InterviewStatus,
  InterviewType,
  InterviewFormat,
  FilterTab,
  ScheduleForm,
} from "../types/interviews.types";

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface RawInterview {
  id: string;
  type?: string;
  format?: string;
  status: string;
  scheduledAt: string;
  durationMinutes?: number;
  duration?: number;
  location?: string;
  meetLink?: string;
  notes?: string | null;
  interviewers?: string[];
  panelists?: { name?: string; role?: string; avatarUrl?: string }[];
  candidate?: { fullName?: string; avatarUrl?: string };
  application?: { role?: string };
  job?: {
    id?: string;
    title?: string;
    company?: { name?: string; logoUrl?: string };
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

function toType(raw?: string): InterviewType {
  const allowed: InterviewType[] = [
    "technical",
    "hr",
    "panel",
    "cultural",
    "final",
  ];
  return allowed.includes(raw as InterviewType)
    ? (raw as InterviewType)
    : "technical";
}

function toFormat(raw?: string): InterviewFormat {
  const allowed: InterviewFormat[] = ["video", "phone", "onsite", "async"];
  return allowed.includes(raw as InterviewFormat)
    ? (raw as InterviewFormat)
    : "video";
}

function toStatus(raw: string): InterviewStatus {
  const allowed: InterviewStatus[] = ["upcoming", "completed", "cancelled"];
  return allowed.includes(raw as InterviewStatus)
    ? (raw as InterviewStatus)
    : "upcoming";
}

function normalize(iv: RawInterview): Interview {
  return {
    id: iv.id,
    jobId: iv.job?.id ?? "",
    jobTitle: iv.job?.title ?? "Unknown Role",
    company: iv.job?.company?.name ?? "Unknown Company",
    companyLogo: toInitials(iv.job?.company?.name ?? "?"),
    companyLogoUrl: iv.job?.company?.logoUrl,
    candidate: iv.candidate?.fullName ?? "—",
    avatarUrl: iv.candidate?.avatarUrl ?? null,
    role: iv.application?.role ?? iv.job?.title ?? "—",
    scheduledAt: iv.scheduledAt,
    duration: iv.duration ?? iv.durationMinutes ?? 45, // accept either field
    format: toFormat(iv.format),
    type: toType(iv.type),
    location: iv.location,
    meetLink: iv.meetLink ?? null,
    interviewers: iv.interviewers ?? [],
    panelists: (iv.panelists ?? []).map((p) => ({
      name: p.name ?? "Interviewer",
      role: p.role ?? "—",
      avatarUrl: p.avatarUrl,
    })),
    status: toStatus(iv.status),
    notes: iv.notes ?? null,
  };
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// ─── Options ──────────────────────────────────────────────────────────────────

interface UseInterviewsOptions {
  /**
   * "applicant" → GET /interviews/mine  (read-only)
   * "employer"  → GET /interviews       (+ schedule / cancel)
   */
  mode: "applicant" | "employer";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInterviews({ mode }: UseInterviewsOptions) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const endpoint =
    mode === "applicant"
      ? `${API_BASE}/interviews/mine`
      : `${API_BASE}/interviews`;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api<RawInterview[]>(endpoint, "GET")
      .then((data) => {
        if (!cancelled) {
          setInterviews(data.map(normalize));
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
  }, [endpoint]);

  // ── Derived — counts ──────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: interviews.length,
      upcoming: interviews.filter((iv) => iv.status === "upcoming").length,
      completed: interviews.filter((iv) => iv.status === "completed").length,
      cancelled: interviews.filter((iv) => iv.status === "cancelled").length,
      today: interviews.filter(
        (iv) => iv.status === "upcoming" && isToday(iv.scheduledAt),
      ).length,
    }),
    [interviews],
  );

  // ── Derived — filtered + sorted ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? interviews
        : interviews.filter((iv) => iv.status === filter);
    return [...list].sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
  }, [interviews, filter]);

  // ── Derived — grouped lists (employer page) ───────────────────────────────
  const todayList = useMemo(
    () =>
      filtered.filter(
        (iv) => iv.status === "upcoming" && isToday(iv.scheduledAt),
      ),
    [filtered],
  );

  const upcomingList = useMemo(
    () =>
      filtered.filter(
        (iv) => iv.status === "upcoming" && !isToday(iv.scheduledAt),
      ),
    [filtered],
  );

  const pastList = useMemo(
    () => filtered.filter((iv) => iv.status !== "upcoming"),
    [filtered],
  );

  // ── Derived — next upcoming (applicant hero banner) ───────────────────────
  const nextInterview = useMemo(
    () =>
      interviews
        .filter((iv) => iv.status === "upcoming")
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        )[0] ?? null,
    [interviews],
  );

  // ── Mutation — cancel (optimistic + rollback) ─────────────────────────────
  const handleCancel = useCallback((id: string) => {
    setInterviews((prev) =>
      prev.map((iv) =>
        iv.id === id ? { ...iv, status: "cancelled" as const } : iv,
      ),
    );
    api(`${API_BASE}/interviews/${id}/cancel`, "PATCH").catch(() => {
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "upcoming" as const } : iv,
        ),
      );
    });
  }, []);

  // ── Mutation — schedule ───────────────────────────────────────────────────
  const handleSchedule = useCallback(async (form: ScheduleForm) => {
    setSubmitting(true);
    try {
      const created = await api<RawInterview>(
        `${API_BASE}/interviews`,
        "POST",
        {
          candidateId: form.candidateId || undefined,
          candidate: form.candidate,
          role: form.role || undefined,
          scheduledAt: `${form.date}T${form.time}:00`,
          duration: Number(form.duration),
          type: form.type,
          interviewers: form.interviewers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          notes: form.notes || undefined,
        },
      );
      setInterviews((prev) => [normalize(created), ...prev]);
      setShowModal(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    // data
    interviews,
    filtered,
    counts,
    // grouped — employer page
    todayList,
    upcomingList,
    pastList,
    // next upcoming — applicant hero
    nextInterview,
    // state
    loading,
    error,
    // filter
    filter,
    setFilter,
    // employer modal
    showModal,
    setShowModal,
    submitting,
    // mutations
    handleCancel,
    handleSchedule,
  };
}
