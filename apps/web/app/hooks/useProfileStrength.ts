/** @format */

import { useState, useEffect } from "react";
import { useUser } from "../store/session.store";
import { api } from "../lib";
import { API_BASE } from "../constants";

export interface StrengthItem {
  label: string;
  done: boolean;
  weight: number;
}

export interface ProfileStrength {
  strength: number;
  checklist: StrengthItem[];
}

export function useProfileStrength() {
  const user = useUser();
  const [data, setData] = useState<ProfileStrength | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api<ProfileStrength>(
          `${API_BASE}/users/profile-strength`,
        );
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetch();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { data, loading, error };
}
