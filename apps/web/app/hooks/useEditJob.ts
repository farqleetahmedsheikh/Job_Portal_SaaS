/** @format */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib";
import { API_BASE } from "../constants";
import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  currencyForCountry,
  timezoneForCountry,
} from "../lib/region";
import {
  PROGRESS_FIELDS,
  type JobForm,
  type JobFormErrors,
  type SectionId,
} from "../types/post-job.types";

interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  type: string;
  location: string;
  city: string | null;
  country: string;
  currency: string;
  timezone: string;
  locationType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceLevel: string;
  expiresAt: string | null;
  deadline: string | null;
  openings: number;
  description: string;
  responsibilities: string | null;
  requirements: string;
  niceToHave: string | null;
  benefits: string | null;
  skills: string[];
  status: "active" | "paused" | "draft" | "closed" | "expired";
}

function jobToForm(j: JobDetail): JobForm {
  return {
    title: j.title,
    department: j.department ?? "",
    type: j.type,
    location: j.location,
    city: j.city ?? "",
    country: j.country ?? DEFAULT_COUNTRY,
    currency: j.currency ?? j.salaryCurrency ?? DEFAULT_CURRENCY,
    timezone: j.timezone ?? DEFAULT_TIMEZONE,
    locationType: j.locationType,
    salaryMin: j.salaryMin != null ? String(j.salaryMin) : "",
    salaryMax: j.salaryMax != null ? String(j.salaryMax) : "",
    salaryCurrency: j.salaryCurrency ?? j.currency ?? DEFAULT_CURRENCY,
    experienceLevel: j.experienceLevel,
    // prefer deadline column, fall back to expiresAt
    deadline: (j.deadline ?? j.expiresAt ?? "").slice(0, 10),
    openings: String(j.openings),
    description: j.description,
    responsibilities: j.responsibilities ?? "",
    requirements: j.requirements,
    niceToHave: j.niceToHave ?? "",
    benefits: j.benefits ?? "",
    skills: j.skills ?? [],
    // expired / paused / closed → let user decide new status
    status: j.status === "active" || j.status === "draft" ? j.status : "draft",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Today as YYYY-MM-DD in local time */
function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Tomorrow as YYYY-MM-DD in local time */
function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function validate(form: JobForm): JobFormErrors {
  const e: JobFormErrors = {};

  if (!form.title.trim()) e.title = "Job title is required";
  if (!form.location.trim()) e.location = "Location is required";
  if (!form.description.trim()) e.description = "Job description is required";
  if (!form.requirements.trim()) e.requirements = "Requirements are required";

  if (form.salaryMin && form.salaryMax && +form.salaryMin > +form.salaryMax)
    e.salaryMax = "Max salary must be greater than min";

  // ── Deadline checks ───────────────────────────────────────────────────────
  if (form.deadline) {
    const today = todayString();
    // const tomorrow = tomorrowString();

    if (form.deadline <= today) {
      // deadline is today or already in the past
      e.deadline =
        form.deadline < today
          ? "Deadline has already passed — please set a future date"
          : "Deadline cannot be today — applicants need at least one day to apply";
    }
  }

  return e;
}

export function useEditJob(jobId: string) {
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [form, setForm] = useState<JobForm | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Fetch existing job ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    api<JobDetail>(`${API_BASE}/jobs/${jobId}`, "GET")
      .then((j) => {
        setJob(j);
        setForm(jobToForm(j));
        setLoading(false);
      })
      .catch((err) => {
        setServerError(
          err instanceof Error ? err.message : "Failed to load job",
        );
        setLoading(false);
      });
  }, [jobId]);

  // ── Field change ───────────────────────────────────────────────────────────
  const setField = useCallback(
    (key: keyof JobForm) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        const value = e.target.value;
        setForm((prev) => {
          if (!prev) return prev;
          if (key === "country") {
            const currency = currencyForCountry(value);
            return {
              ...prev,
              country: value,
              currency,
              salaryCurrency: currency,
              timezone: timezoneForCountry(value),
            };
          }
          if (key === "currency" || key === "salaryCurrency") {
            return { ...prev, currency: value, salaryCurrency: value };
          }
          return { ...prev, [key]: value };
        });
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      },
    [],
  );

  // ── Skills ─────────────────────────────────────────────────────────────────
  const addSkill = useCallback(() => {
    const s = skillInput.trim().replace(/,$/, "");
    if (!form || !s || form.skills.includes(s) || form.skills.length >= 12)
      return;
    setForm((prev) => (prev ? { ...prev, skills: [...prev.skills, s] } : prev));
    setSkillInput("");
  }, [skillInput, form]);

  const removeSkill = useCallback((skill: string) => {
    setForm((prev) =>
      prev ? { ...prev, skills: prev.skills.filter((s) => s !== skill) } : prev,
    );
  }, []);

  const handleSkillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addSkill();
      }
    },
    [addSkill],
  );

  // ── Save (PATCH) ───────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (status: "draft" | "active") => {
      if (!form) return;
      setServerError(null);

      // Always validate deadline regardless of draft/active
      const deadlineErrors: JobFormErrors = {};
      if (form.deadline) {
        const today = todayString();
        if (form.deadline < today) {
          deadlineErrors.deadline =
            "Deadline has already passed — please set a future date";
        } else if (form.deadline === today) {
          deadlineErrors.deadline =
            "Deadline cannot be today — applicants need at least one day to apply";
        }
      }

      if (status === "active") {
        const errs = { ...validate(form), ...deadlineErrors };
        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          // scroll to the offending section
          if (errs.title) setActiveSection("basic");
          else if (errs.location) setActiveSection("location");
          else if (errs.salaryMax) setActiveSection("compensation");
          else if (errs.deadline) setActiveSection("compensation");
          else if (errs.description || errs.requirements)
            setActiveSection("description");
          return;
        }
      } else if (Object.keys(deadlineErrors).length > 0) {
        // Even draft saves must not have a past/today deadline
        setErrors(deadlineErrors);
        return;
      }

      setSubmitting(true);
      try {
        await api(`${API_BASE}/jobs/${jobId}`, "PATCH", {
          title: form.title.trim(),
          department: form.department.trim() || undefined,
          type: form.type,
          location: form.location.trim(),
          city: form.city.trim() || undefined,
          country: form.country,
          currency: form.currency,
          timezone: form.timezone,
          locationType: form.locationType,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
          salaryCurrency: form.salaryCurrency,
          experienceLevel: form.experienceLevel,
          expiresAt: form.deadline || undefined,
          deadline: form.deadline || undefined,
          openings: Number(form.openings) || 1,
          description: form.description.trim(),
          responsibilities: form.responsibilities.trim() || undefined,
          requirements: form.requirements.trim(),
          niceToHave: form.niceToHave.trim() || undefined,
          benefits: form.benefits.trim() || undefined,
          skills: form.skills,
          status,
        });

        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          router.push(`/employer/jobs/${jobId}/applicants`);
        }, 1500);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to save job",
        );
        setSubmitting(false);
      }
    },
    [form, jobId, router],
  );

  // ── Status-only actions (pause / close / reopen) ───────────────────────────
  const handleStatusChange = useCallback(
    async (status: "active" | "paused" | "closed") => {
      if (!form) return;
      setServerError(null);

      // Block re-activating if deadline is in the past or today
      if (status === "active" && form.deadline) {
        const today = todayString();
        if (form.deadline <= today) {
          setServerError(
            form.deadline < today
              ? "Cannot reactivate: the deadline has already passed. Edit the deadline first."
              : "Cannot reactivate: deadline is today. Set a future deadline first.",
          );
          return;
        }
      }

      setSubmitting(true);
      try {
        await api(`${API_BASE}/jobs/${jobId}/status`, "PATCH", { status });
        router.push("/employer/jobs");
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to update status",
        );
        setSubmitting(false);
      }
    },
    [jobId, form, router],
  );

  // ── Progress ───────────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (!form) return { filled: 0, total: PROGRESS_FIELDS.length + 1, pct: 0 };
    const filled = PROGRESS_FIELDS.filter(
      (k) => String(form[k]).trim().length > 0,
    ).length;
    const withSkills = filled + (form.skills.length > 0 ? 1 : 0);
    const total = PROGRESS_FIELDS.length + 1;
    return {
      filled: withSkills,
      total,
      pct: Math.round((withSkills / total) * 100),
    };
  }, [form]);

  // ── Derived — is the loaded job expired ───────────────────────────────────
  const isExpired =
    job?.status === "expired" ||
    (!!job?.deadline && job.deadline.slice(0, 10) < todayString()) ||
    (!!job?.expiresAt && new Date(job.expiresAt) < new Date());

  return {
    job,
    form,
    setField,
    skillInput,
    setSkillInput,
    addSkill,
    removeSkill,
    handleSkillKeyDown,
    errors,
    serverError,
    activeSection,
    setActiveSection,
    loading,
    submitting,
    saved,
    progress,
    handleSave,
    handleStatusChange,
    isExpired, // UI can show a warning banner when true
    todayString, // pass to <input type="date" min={tomorrowString()}> in the form
    tomorrowString,
  };
}
