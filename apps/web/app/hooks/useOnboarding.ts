/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../constants";
import { api } from "../lib";

export type OnboardingRole = "applicant" | "employer";

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: string | null;
  onboardingRole: OnboardingRole | null;
  role: string;
}

export function useOnboarding(enabled = true) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await api<OnboardingStatus>(
        `${API_BASE}/onboarding/status`,
        "GET",
      );
      setStatus(next);
      return next;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load onboarding";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const complete = useCallback(async (onboardingRole?: OnboardingRole) => {
    const next = await api<OnboardingStatus>(
      `${API_BASE}/onboarding/complete`,
      "PATCH",
      onboardingRole ? { onboardingRole } : {},
    );
    setStatus(next);
    return next;
  }, []);

  return { status, loading, error, complete, refetch: load };
}
