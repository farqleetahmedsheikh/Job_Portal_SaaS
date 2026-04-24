/** @format */
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/index";
import { API_BASE } from "../constants";
import { AppStatus } from "../types/applicants.types";

// ── Raw API shape ────────────────────────────────────────────────────────────
interface RawProfile {
  id: string;
  status: AppStatus;
  isStarred: boolean;
  matchScore?: number;
  createdAt: string;
  coverLetter?: string;
  employerNotes?: string;
  resume?: { fileUrl?: string; filename?: string };
  applicant: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    applicantProfile?: {
      jobTitle?: string;
      location?: string;
      experienceYears?: number;
      summary?: string;
      skills?: string[];
      linkedinUrl?: string;
      githubUrl?: string;
      portfolioUrl?: string;
      experiences?: {
        role?: string;
        company?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }[];
      educations?: {
        degree?: string;
        school?: string;
        year?: string;
        gpa?: string;
      }[];
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  job?: { id?: string; title?: string };
}

// ── Normalised shape the UI consumes ─────────────────────────────────────────
export interface ApplicantProfile {
  id: string;
  userId: string;
  name: string;
  avatar: string; // initials fallback
  avatarUrl?: string;
  title: string;
  location: string;
  email: string;
  showEmail: boolean;
  phone: string;
  showPhone: boolean;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  experienceYears?: number;
  appliedAt: string;
  status: AppStatus;
  match: number;
  starred: boolean;
  summary?: string;
  skills: string[];
  experiences: {
    role: string;
    company: string;
    period: string;
    duration: string;
    desc: string;
  }[];
  educations: {
    degree: string;
    school: string;
    year: string;
    gpa?: string;
  }[];
  resumeUrl?: string;
  coverLetter?: string;
  notes: string;
  jobId?: string;
  jobTitle?: string;
}

function toInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatPeriod(start?: string, end?: string) {
  const fmt = (d?: string) => (d ? new Date(d).getFullYear().toString() : "");
  const s = fmt(start);
  const e = end ? fmt(end) : "Present";
  return s ? `${s}–${e}` : "";
}

function calcDuration(start?: string, end?: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const yrs = Math.round(
    (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 365),
  );
  return yrs <= 0 ? "<1 yr" : `${yrs} yr${yrs > 1 ? "s" : ""}`;
}

function normalise(raw: RawProfile): ApplicantProfile {
  console.log("Raw Profile------->", raw);
  const p = raw.applicant?.applicantProfile;
  const name = raw.applicant?.fullName ?? "Unknown";
  return {
    id: raw.id,
    userId: raw.applicant.id,
    name,
    avatar: toInitials(name),
    avatarUrl: raw.applicant?.avatarUrl,
    title: p?.jobTitle ?? "—",
    location: p?.location ?? "—",
    email: raw.applicant?.email ?? "",
    showEmail: raw.applicant.applicantProfile?.showEmail ?? false,
    phone: raw.applicant?.phone ?? "",
    showPhone: raw.applicant.applicantProfile?.showPhone ?? false,
    linkedin: p?.linkedinUrl,
    github: p?.githubUrl,
    portfolio: p?.portfolioUrl,
    experienceYears: p?.experienceYears,
    appliedAt: raw.createdAt,
    status: raw.status,
    match: raw.matchScore ?? 0,
    starred: raw.isStarred,
    summary: p?.summary,
    skills: p?.skills ?? [],
    experiences: (p?.experiences ?? []).map((e) => ({
      role: e.role ?? "—",
      company: e.company ?? "—",
      period: formatPeriod(e.startDate, e.endDate),
      duration: calcDuration(e.startDate, e.endDate),
      desc: e.description ?? "",
    })),
    educations: (p?.educations ?? []).map((e) => ({
      degree: e.degree ?? "—",
      school: e.school ?? "—",
      year: e.year ?? "",
      gpa: e.gpa,
    })),
    resumeUrl: raw.resume?.fileUrl,
    coverLetter: raw.coverLetter,
    notes: raw.employerNotes ?? "",
    jobId: raw.job?.id,
    jobTitle: raw.job?.title,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useApplicantProfile(applicationId: string) {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<RawProfile>(`${API_BASE}/applications/${applicationId}`, "GET")
      .then((data) => {
        if (!cancelled) {
          setProfile(normalise(data));
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
  }, [applicationId]);

  const changeStatus = useCallback(
    async (status: AppStatus) => {
      await api(`${API_BASE}/applications/${applicationId}/status`, "PATCH", {
        status,
      });
      setProfile((p) => (p ? { ...p, status } : p));
    },
    [applicationId],
  );

  const toggleStar = useCallback(async () => {
    setProfile((p) => (p ? { ...p, starred: !p.starred } : p)); // optimistic
    await api(`${API_BASE}/applications/${applicationId}/star`, "PATCH").catch(
      () => {
        setProfile((p) => (p ? { ...p, starred: !p.starred } : p)); // rollback
      },
    );
  }, [applicationId]);

  const saveNotes = useCallback(
    async (notes: string) => {
      await api(`${API_BASE}/applications/${applicationId}/notes`, "PATCH", {
        notes,
      });
      setProfile((p) => (p ? { ...p, notes } : p));
    },
    [applicationId],
  );

  return { profile, loading, error, changeStatus, toggleStar, saveNotes };
}
