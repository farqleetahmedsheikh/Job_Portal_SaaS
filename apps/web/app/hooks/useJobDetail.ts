/** @format */
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";

export interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  type: string;
  locationType: string;
  location: string;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryIsPublic: boolean;
  openings: number;
  deadline: string | null;
  status: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  niceToHave: string | null;
  benefits: string | null;
  skills: string[];
  viewsCount: number;
  applicantsCount: number;
  publishedAt: string | null;
  expiresAt: string | null;
  company: {
    id: string;
    companyName: string;
    industry: string;
    location: string;
    website: string | null;
    logoUrl: string | null;
    description: string | null;
    isVerified: boolean;
    perks: { perk: string }[];
  };
}

export function useJobDetail(id: string) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch job ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<JobDetail>(`${API_BASE}/jobs/${id}`, "GET"),
      api<{ saved: boolean }>(
        `${API_BASE}/jobs/${id}/saved-status`,
        "GET",
      ).catch(() => ({ saved: false })),
      api<{ applied: boolean }>(
        `${API_BASE}/applications/status?jobId=${id}`,
        "GET",
      ).catch(() => ({ applied: false })),
    ])
      .then(([jobData, savedData, appliedData]) => {
        if (cancelled) return;
        setJob(jobData);
        setIsSaved(savedData.saved);
        setHasApplied(appliedData.applied);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load job");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Save / unsave ──────────────────────────────────────────────────────────
  const toggleSave = useCallback(async () => {
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      await api(`${API_BASE}/jobs/${id}/save`, prev ? "DELETE" : "POST");
    } catch {
      setIsSaved(prev); // rollback
    }
  }, [isSaved, id]);

  // ── Apply ──────────────────────────────────────────────────────────────────
  const handleApply = useCallback(
    async (coverLetter?: string) => {
      setApplying(true);
      setApplyError(null);
      try {
        await api(`${API_BASE}/applications`, "POST", {
          id,
          coverLetter: coverLetter?.trim() || undefined,
        });
        setHasApplied(true);
        setShowModal(false);
      } catch (err) {
        setApplyError(err instanceof Error ? err.message : "Failed to apply");
      } finally {
        setApplying(false);
      }
    },
    [id],
  );

  return {
    job,
    loading,
    error,
    isSaved,
    toggleSave,
    hasApplied,
    applying,
    applyError,
    showModal,
    setShowModal,
    handleApply,
  };
}
