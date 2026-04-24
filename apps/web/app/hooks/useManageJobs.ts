/** @format */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { Job, JobStatus } from "../types/manage-jobs.types";

export function useManageJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<Job[]>(`${API_BASE}/jobs/mine`, "GET")
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
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

  // ── Toggle active ↔ paused — optimistic ──────────────────────────────────
  const toggleStatus = useCallback(
    async (id: string, newStatus: JobStatus) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;

      // Block expired → active without billing
      if (job.status === "expired" && newStatus === "active") {
        setShowUpgradeModal(true);
        return;
      }

      // Confirm closing a job with late-stage applicants
      if (newStatus === "closed" && (job.interviewCount ?? 0) > 0) {
        if (
          !confirm(
            `This job has ${job.interviewCount} applicants in the interview stage. Close anyway?`,
          )
        )
          return;
      }

      // Optimistic update + rollback
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j)),
      );
      try {
        await api(`${API_BASE}/jobs/${id}/status`, "PATCH", {
          status: newStatus,
        });
      } catch {
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, status: job.status } : j)),
        );
      }
    },
    [jobs],
  );
  // ── Duplicate ─────────────────────────────────────────────────────────────
  const duplicateJob = useCallback(async (id: string) => {
    try {
      const created = await api<Job>(
        `${API_BASE}/jobs/${id}/duplicate`,
        "POST",
      );
      setJobs((prev) => [created, ...prev]);
    } catch {
      /* swallow — user can retry */
    }
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteJob = useCallback(async (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setConfirmDelete(null);
    try {
      await api(`${API_BASE}/jobs/${id}`, "DELETE");
    } catch {
      // rollback — re-fetch to restore accurate state
      api<Job[]>(`${API_BASE}/jobs/mine`, "GET")
        .then((data) => setJobs(data))
        .catch(() => {});
    }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = jobs;
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [jobs, filter, search]);

  const counts = useMemo(
    () => ({
      all: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      paused: jobs.filter((j) => j.status === "paused").length,
      draft: jobs.filter((j) => j.status === "draft").length,
      closed: jobs.filter((j) => j.status === "closed").length,
      expired: jobs.filter((j) => j.status === "expired").length,
    }),
    [jobs],
  );

  const totalApps = useMemo(
    () =>
      jobs
        .filter((j) => j.status === "active")
        .reduce((a, j) => a + j.applicants, 0),
    [jobs],
  );

  const totalNew = useMemo(
    () => jobs.reduce((a, j) => a + j.newApps, 0),
    [jobs],
  );

  return {
    // data
    filtered,
    counts,
    totalApps,
    totalNew,
    loading,
    error,
    // filters
    filter,
    setFilter,
    search,
    setSearch,
    // mutations
    toggleStatus,
    duplicateJob,
    deleteJob,
    // delete modal
    confirmDelete,
    setConfirmDelete,
  };
}
