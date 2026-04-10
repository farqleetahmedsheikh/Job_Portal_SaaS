/** @format */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  Interview,
  InterviewStatus,
  InterviewFormat,
  InterviewType,
  ScheduleForm,
} from "../types/interviews.types";

interface Options {
  mode: "employer" | "applicant";
}

// ── Value guards ──────────────────────────────────────────────────────────────
const VALID_STATUSES: InterviewStatus[] = [
  "upcoming",
  "completed",
  "cancelled",
];
const VALID_FORMATS: InterviewFormat[] = ["video", "phone", "onsite", "async"];
const VALID_TYPES: InterviewType[] = [
  "technical",
  "hr",
  "panel",
  "cultural",
  "final",
];

const toStatus = (v: string): InterviewStatus =>
  VALID_STATUSES.includes(v?.toLowerCase() as InterviewStatus)
    ? (v.toLowerCase() as InterviewStatus)
    : "upcoming";

const toFormat = (v: string): InterviewFormat =>
  VALID_FORMATS.includes(v?.toLowerCase() as InterviewFormat)
    ? (v.toLowerCase() as InterviewFormat)
    : "video";

const toType = (v: string): InterviewType =>
  VALID_TYPES.includes(v?.toLowerCase() as InterviewType)
    ? (v.toLowerCase() as InterviewType)
    : "technical";

// ── Normalise raw API → Interview ─────────────────────────────────────────────
function normalise(raw: any): Interview {
  const candidate = raw.candidate ?? raw.applicant ?? {};
  const job = raw.job ?? {};
  const company = job?.company ?? {};

  return {
    id: raw.id,
    // job
    jobId: job?.id ?? "",
    jobTitle: job?.title ?? "—",
    company: company?.companyName ?? "—",
    companyLogoUrl: company?.logoUrl ?? undefined,
    // candidate
    candidate: candidate?.fullName ?? "Unknown",
    applicationId: raw.applicationId ?? "",
    avatarUrl: candidate?.avatarUrl ?? null,
    role: job?.title ?? "—",
    // schedule — backend may send format in "type" column (legacy)
    scheduledAt: raw.scheduledAt,
    duration: raw.durationMins ?? 45,
    format: toFormat(raw.format ?? raw.type),
    type: toType(raw.interviewType ?? raw.roundType ?? "technical"),
    location: raw.location ?? undefined,
    meetLink: raw.meetLink ?? null,
    // people
    interviewers: (raw.panelists ?? []).map(
      (p: any) => p.name ?? p.user?.fullName ?? "",
    ),
    panelists: (raw.panelists ?? []).map((p: any) => ({
      name: p.name ?? p.user?.fullName ?? "",
      role: p.role ?? "",
      avatarUrl: p.user?.avatarUrl ?? undefined,
    })),
    // meta
    status: toStatus(raw.status),
    notes: raw.notes ?? null,
  };
}

export function useInterviews({ mode }: Options) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | InterviewStatus>("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInterviews = useCallback(() => {
    setLoading(true);
    const url =
      mode === "employer"
        ? `${API_BASE}/interviews`
        : `${API_BASE}/interviews/mine`;

    api<any[]>(url, "GET")
      .then((data) => setInterviews(data.map(normalise)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // ── Cancel (optimistic) ────────────────────────────────────────────────────
  const handleCancel = useCallback(
    async (id: string, reason?: string) => {
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "cancelled" as InterviewStatus } : iv,
        ),
      );
      try {
        await api(`${API_BASE}/interviews/${id}`, "DELETE", { reason });
      } catch {
        fetchInterviews(); // rollback
      }
    },
    [fetchInterviews],
  );

  // ── handleSchedule — EmployerInterviewsPage compat ─────────────────────────
  const handleSchedule = useCallback(
    async (_form: ScheduleForm) => {
      setSubmitting(false);
      setShowModal(false);
      fetchInterviews();
    },
    [fetchInterviews],
  );

  const onScheduled = useCallback(() => {
    setShowModal(false);
    fetchInterviews();
  }, [fetchInterviews]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const now = new Date();

  const todayList = useMemo(
    () =>
      interviews.filter(
        (iv) =>
          iv.status === "upcoming" &&
          new Date(iv.scheduledAt).toDateString() === now.toDateString(),
      ),
    [interviews],
  );

  const upcomingList = useMemo(
    () =>
      interviews.filter((iv) => {
        if (iv.status !== "upcoming") return false;
        const d = new Date(iv.scheduledAt);
        return d.toDateString() !== now.toDateString() && d > now;
      }),
    [interviews],
  );

  const pastList = useMemo(
    () =>
      interviews.filter(
        (iv) =>
          iv.status === "completed" ||
          iv.status === "cancelled" ||
          (iv.status === "upcoming" && new Date(iv.scheduledAt) < now),
      ),
    [interviews],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? interviews
        : interviews.filter((iv) => iv.status === filter),
    [interviews, filter],
  );

  const counts = useMemo(
    () => ({
      all: interviews.length,
      upcoming: interviews.filter((iv) => iv.status === "upcoming").length,
      today: todayList.length,
      completed: interviews.filter((iv) => iv.status === "completed").length,
      cancelled: interviews.filter((iv) => iv.status === "cancelled").length,
    }),
    [interviews, todayList],
  );

  return {
    loading,
    error,
    interviews,
    filtered,
    todayList,
    upcomingList,
    pastList,
    counts,
    filter,
    setFilter,
    showModal,
    setShowModal,
    submitting,
    handleCancel,
    handleSchedule,
    onScheduled,
    refetch: fetchInterviews,
  };
}
