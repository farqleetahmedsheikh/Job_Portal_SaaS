/** @format */
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store/session.store";
import { api } from "../lib";
import type { LoginPayload, RegisterPayload, AuthResponse } from "../types";
import { API_BASE } from "../constants";
import { dashboardPathForRole } from "../lib/roles";
import {
  normalizeSessionUser,
  type RawSessionUser,
} from "../lib/session";

export function useSession() {
  const { state, setUser, clearUser, setLoading, setHydrated } =
    useSessionStore();
  const { user, isLoading } = state;
  const router = useRouter();

  // ── Hydrate on hard refresh ───────────────────────────
  const hydrate = useCallback(async () => {
    try {
      // /auth/me returns SafeUser directly
      const me = await api<RawSessionUser>(`${API_BASE}/auth/me`);
      setUser(normalizeSessionUser(me));
    } catch {
      clearUser(); // not logged in — that's fine
    } finally {
      setHydrated(true);
    }
  }, [setUser, clearUser, setHydrated]);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(
    async (data: LoginPayload): Promise<string | null> => {
      setLoading(true);
      try {
        // Backend returns SafeUser directly — token is in httpOnly cookie
        const user = await api<AuthResponse & RawSessionUser>(
          `${API_BASE}/auth/login`,
          "POST",
          data,
        );
        const safeUser = normalizeSessionUser(user);
        setUser(safeUser);
        if (!safeUser.isProfileComplete) {
          router.replace("/complete-profile");
          return null;
        }

        router.push(dashboardPathForRole(safeUser.role));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Login failed";
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, router],
  );

  // ── Register ──────────────────────────────────────────
  const register = useCallback(
    async (data: RegisterPayload): Promise<string | null> => {
      setLoading(true);
      try {
        // Backend returns SafeUser directly
        const user = await api<AuthResponse & RawSessionUser>(
          `${API_BASE}/auth/register`,
          "POST",
          data,
        );

        setUser(normalizeSessionUser(user));

        // After register → complete profile, not dashboard
        router.push("/complete-profile");
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Registration failed";
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, router],
  );

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api(`${API_BASE}/auth/logout`, "POST");
    } finally {
      clearUser();
      router.push("/login");
    }
  }, [clearUser, router]);

  return { user, isLoading, login, register, logout, hydrate };
}
