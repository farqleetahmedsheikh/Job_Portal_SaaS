/** @format */
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store/session.store";
import { api } from "../lib/index";
import type { SessionUser } from "../store/session.store";
import type { LoginPayload, RegisterPayload, AuthResponse } from "../types";
import { API_BASE } from "../constants";

export function useSession() {
  // ✅ Hooks called INSIDE the function — correct
  const { state, setUser, clearUser, setLoading, setHydrated } =
    useSessionStore();
  const { user, isLoading } = state;
  const router = useRouter();

  const hydrate = useCallback(async () => {
    try {
      const me = await api<SessionUser>(`${API_BASE}/auth/me`, "GET");
      setUser(me);
    } catch {
      clearUser();
    } finally {
      setHydrated(true);
    }
  }, [setUser, clearUser, setHydrated]);

  const login = useCallback(
    async (data: LoginPayload): Promise<string | null> => {
      setLoading(true);
      try {
        const res = await api<AuthResponse>(
          `${API_BASE}/auth/login`,
          "POST",
          data,
        );
        setUser(res.user as SessionUser);
        router.push(
          res.user.role === "applicant"
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

  const register = useCallback(
    async (data: RegisterPayload): Promise<string | null> => {
      setLoading(true);
      try {
        const res = await api<AuthResponse>(
          `${API_BASE}/auth/register`,
          "POST",
          data,
        );
        setUser(res.user as SessionUser);
        router.push(
          res.user.role === "applicant"
            ? "/applicant/dashboard"
            : "/employer/dashboard",
        );
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Registration failed";
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, router],
  );

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
