/** @format */
// app/employer/jobs/new/hooks/usePostJob.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib";
import { API_BASE } from "../constants";
import {
  INIT,
  PROGRESS_FIELDS,
  type JobForm,
  type JobFormErrors,
  type SectionId,
} from "../types/post-job.types";

function validate(form: JobForm): JobFormErrors {
  const e: JobFormErrors = {};
  if (!form.title.trim()) e.title = "Job title is required";
  if (!form.location.trim()) e.location = "Location is required";
  if (!form.description.trim()) e.description = "Job description is required";
  if (!form.requirements.trim()) e.requirements = "Requirements are required";
  if (!form.deadline) e.deadline = "Application deadline is required";
  if (form.salaryMin && form.salaryMax && +form.salaryMin > +form.salaryMax)
    e.salaryMax = "Max salary must be greater than min";
  return e;
}

export function usePostJob() {
  const router = useRouter();

  const [form, setForm] = useState<JobForm>(INIT);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const setDescription = useCallback(
    (val: string) => setForm((prev) => ({ ...prev, description: val })),
    [],
  );

  const setField = useCallback(
    (key: keyof JobForm) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      },
    [],
  );

  const addSkill = useCallback(() => {
    const s = skillInput.trim().replace(/,$/, "");
    if (s && !form.skills.includes(s) && form.skills.length < 12) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
      setSkillInput("");
    }
  }, [skillInput, form.skills]);

  const removeSkill = useCallback((skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
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

  const handleSubmit = useCallback(
    async (status: "draft" | "active") => {
      setServerError(null);
      if (status === "active") {
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          if (errs.title || errs.deadline) setActiveSection("basic");
          else if (errs.location) setActiveSection("location");
          else if (errs.salaryMax) setActiveSection("compensation");
          else if (errs.description || errs.requirements)
            setActiveSection("description");
          return;
        }
      }
      setSubmitting(true);
      try {
        console.log("Job Data--------> ", form);
        const job = await api<{ id: string }>(`${API_BASE}/jobs`, "POST", {
          ...form,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
          openings: Number(form.openings) || 1,
          status,
        });
        router.push(`/employer/jobs/${job.id}`);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to post job",
        );
        setSubmitting(false);
      }
    },
    [form, router],
  );

  const progress = useMemo(() => {
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
    form,
    setField,
    setDescription,
    skillInput,
    setSkillInput,
    addSkill,
    removeSkill,
    handleSkillKeyDown,
    errors,
    serverError,
    activeSection,
    setActiveSection,
    submitting,
    progress,
    handleSubmit,
  };
}
