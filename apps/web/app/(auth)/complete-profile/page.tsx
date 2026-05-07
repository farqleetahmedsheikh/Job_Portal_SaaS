/** @format */
"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { useSessionStore } from "../../store/session.store";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  DEFAULT_TIMEZONE,
  TIMEZONES,
} from "../../lib/region";
import { normalizeSessionUser, type RawSessionUser } from "../../lib/session";

// ─── Schemas ──────────────────────────────────────────────
const applicantSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  experienceYears: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ error: "Must be a number" })
      .min(0, "Cannot be negative")
      .max(50, "Cannot exceed 50"),
  ),
  skills: z.string().min(2, "At least one skill required"),
  location: z.string().optional(),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const employerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  city: z.string().optional(),
  country: z.string().default(DEFAULT_COUNTRY),
  timezone: z.string().default(DEFAULT_TIMEZONE),
  industry: z.string().min(2, "Industry is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

type ApplicantForm = z.infer<typeof applicantSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

// ─── Page ─────────────────────────────────────────────────
export default function CompleteProfilePage() {
  const router = useRouter();
  const { state, setUser } = useSessionStore();
  const { user, isHydrated } = state;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const applicantForm = useForm<ApplicantForm, unknown, ApplicantForm>({
    resolver: zodResolver(applicantSchema) as Resolver<ApplicantForm>,
  });
  const employerForm = useForm<EmployerForm, unknown, EmployerForm>({
    resolver: zodResolver(employerSchema) as Resolver<EmployerForm>,
    defaultValues: {
      country: user?.country ?? DEFAULT_COUNTRY,
      timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    },
  });
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.isProfileComplete) {
      router.replace(
        user.role === "applicant"
          ? "/applicant/dashboard"
          : "/employer/dashboard",
      );
    }
  }, [isHydrated, router, user]);

  if (!isHydrated || !user || user.isProfileComplete) {
    return null;
  }

  // ── Applicant submit ──────────────────────────────────
  const handleApplicantSubmit = async (data: ApplicantForm) => {
    setError(null);
    try {
      const updated = await api<RawSessionUser>(
        `${API_BASE}/auth/applicant-profile/${user.id}`,
        "POST",
        {
          jobTitle: data.jobTitle,
          experienceYears: data.experienceYears,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          location: data.location?.trim() || undefined,
          linkedinUrl: data.linkedinUrl?.trim() || undefined,
          githubUrl: data.githubUrl?.trim() || undefined,
        },
      );
      setUser(normalizeSessionUser(updated));
      setSuccess(true);
      setTimeout(() => router.replace("/applicant/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  // ── Employer submit ───────────────────────────────────
  const handleEmployerSubmit = async (data: EmployerForm) => {
    setError(null);
    try {
      const updated = await api<RawSessionUser>(
        `${API_BASE}/auth/employer-profile/${user.id}`,
        "POST",
        {
          companyName: data.companyName,
          location: data.location,
          city: data.city?.trim() || undefined,
          country: data.country,
          timezone: data.timezone,
          industry: data.industry,
          website: data.website?.trim() || undefined,
          about: data.description?.trim() || undefined,
        },
      );
      setUser(normalizeSessionUser(updated));
      setSuccess(true);
      setTimeout(() => router.push("/employer/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (success) {
    return (
      <div
        style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40 }}>✓</p>
          <h2>Profile complete!</h2>
          <p style={{ color: "var(--text-muted)" }}>Redirecting you now...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          style={{
            color: "var(--status-danger)",
            fontSize: 13,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}

      {/* ── Applicant form ── */}
      {user.role === "applicant" && (
        <AuthForm
          title="Complete Your Profile"
          subtitle="Help employers find the right fit"
          onSubmit={applicantForm.handleSubmit(handleApplicantSubmit)}
          loading={applicantForm.formState.isSubmitting}
          submitLabel="Save Profile"
        >
          <InputField
            label="Job Title"
            placeholder="Frontend Developer"
            register={applicantForm.register("jobTitle")}
            error={applicantForm.formState.errors.jobTitle}
          />
          <InputField
            label="Years of Experience"
            type="number"
            placeholder="2"
            register={applicantForm.register("experienceYears", {
              valueAsNumber: true,
            })}
            error={applicantForm.formState.errors.experienceYears}
          />
          <InputField
            label="Skills (comma separated)"
            placeholder="React, TypeScript, Node.js"
            register={applicantForm.register("skills")}
            error={applicantForm.formState.errors.skills}
          />
          <InputField
            label="Location (optional)"
            placeholder="Lahore, Pakistan"
            register={applicantForm.register("location")}
            error={applicantForm.formState.errors.location}
          />
          <InputField
            label="LinkedIn URL (optional)"
            placeholder="https://linkedin.com/in/username"
            register={applicantForm.register("linkedinUrl")}
            error={applicantForm.formState.errors.linkedinUrl}
          />
          <InputField
            label="GitHub URL (optional)"
            placeholder="https://github.com/username"
            register={applicantForm.register("githubUrl")}
            error={applicantForm.formState.errors.githubUrl}
          />
        </AuthForm>
      )}

      {/* ── Employer form ── */}
      {user.role === "employer" && (
        <AuthForm
          title="Set Up Your Company"
          subtitle="Tell candidates about your company"
          onSubmit={employerForm.handleSubmit(handleEmployerSubmit)}
          loading={employerForm.formState.isSubmitting}
          submitLabel="Save Company"
        >
          <InputField
            label="Company Name"
            placeholder="Acme Corp"
            register={employerForm.register("companyName")}
            error={employerForm.formState.errors.companyName}
          />
          <InputField
            label="Location"
            placeholder="Karachi, Pakistan"
            register={employerForm.register("location")}
            error={employerForm.formState.errors.location}
          />
          <InputField
            label="City (optional)"
            placeholder="Karachi"
            register={employerForm.register("city")}
            error={employerForm.formState.errors.city}
          />
          <div
            style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
          >
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                Country
              </span>
              <select
                {...employerForm.register("country")}
                style={{
                  minHeight: 42,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  padding: "0 12px",
                }}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                Timezone
              </span>
              <select
                {...employerForm.register("timezone")}
                style={{
                  minHeight: 42,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  padding: "0 12px",
                }}
              >
                {TIMEZONES.map((timezone) => (
                  <option key={timezone.code} value={timezone.code}>
                    {timezone.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <InputField
            label="Industry"
            placeholder="Software Development"
            register={employerForm.register("industry")}
            error={employerForm.formState.errors.industry}
          />
          <InputField
            label="Website (optional)"
            placeholder="https://company.com"
            register={employerForm.register("website")}
            error={employerForm.formState.errors.website}
          />
        </AuthForm>
      )}
    </>
  );
}
