/** @format */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib";
import { API_BASE } from "../constants";
import {
  PROGRESS_FIELDS,
  type JobForm,
  type JobFormErrors,
  type SectionId,
} from "../types/post-job.types";

// Shape returned by GET /jobs/:id
interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  type: string;
  location: string;
  locationType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceLevel: string;
  expiresAt: string | null;
  openings: number;
  description: string;
  responsibilities: string | null;
  requirements: string;
  niceToHave: string | null;
  benefits: string | null;
  skills: string[];
  status: "active" | "paused" | "draft" | "closed";
}

function jobToForm(j: JobDetail): JobForm {
  return {
    title: j.title,
    department: j.department ?? "",
    type: j.type,
    location: j.location,
    locationType: j.locationType,
    salaryMin: j.salaryMin != null ? String(j.salaryMin) : "",
    salaryMax: j.salaryMax != null ? String(j.salaryMax) : "",
    salaryCurrency: j.salaryCurrency,
    experienceLevel: j.experienceLevel,
    // expiresAt ISO → date input needs YYYY-MM-DD
    deadline: j.expiresAt ? j.expiresAt.slice(0, 10) : "",
    openings: String(j.openings),
    description: j.description,
    responsibilities: j.responsibilities ?? "",
    requirements: j.requirements,
    niceToHave: j.niceToHave ?? "",
    benefits: j.benefits ?? "",
    skills: j.skills ?? [],
    status:
      j.status === "paused" || j.status === "closed"
        ? "active" // editing a paused/closed job — let user decide new status
        : j.status,
  };
}

function validate(form: JobForm): JobFormErrors {
  const e: JobFormErrors = {};
  if (!form.title.trim()) e.title = "Job title is required";
  if (!form.location.trim()) e.location = "Location is required";
  if (!form.description.trim()) e.description = "Job description is required";
  if (!form.requirements.trim()) e.requirements = "Requirements are required";
  if (form.salaryMin && form.salaryMax && +form.salaryMin > +form.salaryMax)
    e.salaryMax = "Max salary must be greater than min";
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
        setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
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

      if (status === "active") {
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          if (errs.title) setActiveSection("basic");
          else if (errs.location) setActiveSection("location");
          else if (errs.salaryMax) setActiveSection("compensation");
          else if (errs.description || errs.requirements)
            setActiveSection("description");
          return;
        }
      }

      setSubmitting(true);
      try {
        await api(`${API_BASE}/jobs/${jobId}`, "PATCH", {
          title: form.title.trim(),
          department: form.department.trim() || undefined,
          type: form.type,
          location: form.location.trim(),
          locationType: form.locationType,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
          salaryCurrency: form.salaryCurrency,
          experienceLevel: form.experienceLevel,
          expiresAt: form.deadline || undefined,
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
      setSubmitting(true);
      setServerError(null);
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
    [jobId, router],
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
  };
}
