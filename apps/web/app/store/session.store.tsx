/** @format */
"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SafeApplicantProfile {
  id: string;
  jobTitle: string | null;
  experienceYears: number | null;
  skills: string[];
  location: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  isOpenToWork: boolean;
  isPublic: boolean;
  educations: unknown[];
  experiences: unknown[];

  // ── Visibility ──────────────────────────────────────────────────────────────
  openToWork: boolean;
  recruitersOnly: boolean;
  showEmail: boolean;
  showPhone: boolean;
  activityVisible: boolean;

  // ── Notification preferences ────────────────────────────────────────────────
  notifEmailApplications: boolean;
  notifEmailMessages: boolean;
  notifEmailDigest: boolean;
  notifEmailMarketing: boolean;
  notifPushApplications: boolean;
  notifPushMessages: boolean;
  notifPushReminders: boolean;
  notifPushJobAlerts: boolean;
}

export interface SafeCompany {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  isVerified: boolean;
}

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: "applicant" | "employer" | "admin" | "super_admin" | "supervisor";
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string | null;
  onboardingRole?: "applicant" | "employer" | null;
  applicantProfile: SafeApplicantProfile | null;
  companies: SafeCompany | null;
};

// ─── State ────────────────────────────────────────────────────────────────────
interface SessionState {
  user: SessionUser | null;
  isLoading: boolean;
  isHydrated: boolean;
}

type Action =
  | { type: "SET_USER"; payload: SessionUser }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_HYDRATED"; payload: boolean };

const initialState: SessionState = {
  user: null,
  isLoading: false,
  isHydrated: false,
};

function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "CLEAR_USER":
      return { ...state, user: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_HYDRATED":
      return { ...state, isHydrated: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface SessionCtx {
  state: SessionState;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
  setLoading: (v: boolean) => void;
  setHydrated: (v: boolean) => void;
}

const SessionContext = createContext<SessionCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SessionStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const setUser = useCallback(
    (user: SessionUser) => dispatch({ type: "SET_USER", payload: user }),
    [],
  );
  const clearUser = useCallback(() => dispatch({ type: "CLEAR_USER" }), []);
  const setLoading = useCallback(
    (v: boolean) => dispatch({ type: "SET_LOADING", payload: v }),
    [],
  );
  const setHydrated = useCallback(
    (v: boolean) => dispatch({ type: "SET_HYDRATED", payload: v }),
    [],
  );

  return (
    <SessionContext.Provider
      value={{ state, setUser, clearUser, setLoading, setHydrated }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useSessionStore() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error(
      "useSessionStore must be used within <SessionStoreProvider>",
    );
  return ctx;
}

// ─── Selectors ────────────────────────────────────────────────────────────────
export const useUser = () => useSessionStore().state.user;
export const useIsAuthed = () => !!useSessionStore().state.user;
export const useUserRole = () => useSessionStore().state.user?.role ?? null;
export const useIsApplicant = () =>
  useSessionStore().state.user?.role === "applicant";
export const useIsEmployer = () =>
  useSessionStore().state.user?.role === "employer";
export const useIsAdmin = () =>
  ["admin", "super_admin", "supervisor"].includes(
    useSessionStore().state.user?.role ?? "",
  );
export const useApplicantProfile = () =>
  useSessionStore().state.user?.applicantProfile ?? null;
export const useCompany = () => useSessionStore().state.user?.companies ?? null;
