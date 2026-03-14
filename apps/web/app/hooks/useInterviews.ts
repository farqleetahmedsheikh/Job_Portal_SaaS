/* eslint-disable no-useless-catch */
/** @format */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  Interview,
  InterviewStatus,
  ScheduleForm,
} from "../types/interviews.types";

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | InterviewStatus>("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<Interview[]>(`${API_BASE}/interviews`, "GET")
      .then((data) => {
        if (!cancelled) {
          setInterviews(data);
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
  }, []);

  // ── Cancel — optimistic ───────────────────────────────────────────────────
  const handleCancel = useCallback((id: string) => {
    setInterviews((prev) =>
      prev.map((iv) =>
        iv.id === id ? { ...iv, status: "cancelled" as const } : iv,
      ),
    );
    api(`${API_BASE}/interviews/${id}/cancel`, "PATCH").catch(() => {
      // rollback
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "upcoming" as const } : iv,
        ),
      );
    });
  }, []);

  // ── Schedule ──────────────────────────────────────────────────────────────
  const handleSchedule = useCallback(async (form: ScheduleForm) => {
    setSubmitting(true);
    try {
      const created = await api<Interview>(`${API_BASE}/interviews`, "POST", {
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
      });
      setInterviews((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);
  // ── Derived ───────────────────────────────────────────────────────────────
  const now = Date.now();

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const filtered = useMemo(
    () => interviews.filter((iv) => filter === "all" || iv.status === filter),
    [interviews, filter],
  );

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

  return {
    loading,
    error,
    filter,
    setFilter,
    showModal,
    setShowModal,
    submitting,
    // grouped lists
    todayList,
    upcomingList,
    pastList,
    filtered,
    counts,
    // mutations
    handleCancel,
    handleSchedule,
  };
}
