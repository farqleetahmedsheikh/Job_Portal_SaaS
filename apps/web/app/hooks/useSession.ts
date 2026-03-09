/** @format */
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store/session.store";
import { api } from "../lib";
import type { SessionUser } from "../store/session.store";
import type { LoginPayload, RegisterPayload, AuthResponse } from "../types";
import { API_BASE } from "../constants";

export function useSession() {
  const { state, setUser, clearUser, setLoading, setHydrated } =
    useSessionStore();
  const { user, isLoading } = state;
  const router = useRouter();

  // ── Hydrate on hard refresh ───────────────────────────
  const hydrate = useCallback(async () => {
    try {
      // /auth/me returns SafeUser directly
      const me = await api<SessionUser>(`${API_BASE}/auth/me`);
      setUser(me);
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
        const user = await api<AuthResponse>(
          `${API_BASE}/auth/login`,
          "POST",
          data,
        );
        console.log("Logged in user:", user); // Debug log to verify response structure
        // user IS the safe user — no user.user nesting
        setUser(user as SessionUser);
        if (!user.isProfileComplete) {
          router.replace("/complete-profile");
          return null;
        }

        router.push(
          user.role === "applicant"
            ? "/applicant/dashboard"
            : "/employer/dashboard",
        );
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
        const user = await api<AuthResponse>(
          `${API_BASE}/auth/register`,
          "POST",
          data,
        );

        setUser(user as SessionUser);

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
