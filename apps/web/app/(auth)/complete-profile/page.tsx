/** @format */

"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";

// Applicant minimal schema
const applicantSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  experienceYears: z.number().min(0, "Experience cannot be negative"),
  skills: z.string().min(2, "At least one skill required"), // comma-separated
});

// Employer minimal schema
const employerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  industry: z.string().min(2, "Industry is required"),
});

type ApplicantForm = z.infer<typeof applicantSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

export default function CompleteProfilePage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toUpperCase();
  const router = useRouter();

  const isApplicant = roleParam === "APPLICANT";
  const isEmployer = roleParam === "EMPLOYER";

  const [loading, setLoading] = useState(false);

  // --- Applicant form ---
  const applicantForm = useForm<ApplicantForm>({
    resolver: zodResolver(applicantSchema),
  });

  // --- Employer form ---
  const employerForm = useForm<EmployerForm>({
    resolver: zodResolver(employerSchema),
  });

  const onSubmitApplicant = async (data: ApplicantForm) => {
    setLoading(true);
    try {
      await api("/api/user/applicant-profile", "POST", {
        jobTitle: data.jobTitle,
        experienceYears: data.experienceYears,
        skills: data.skills.split(",").map((s) => s.trim()),
      });
      alert("Applicant profile completed!");
      router.push("/dashboard");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitEmployer = async (data: EmployerForm) => {
    setLoading(true);
    try {
      await api("/api/user/company-profile", "POST", data);
      alert("Company profile completed!");
      router.push("/dashboard");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isApplicant && (
        <AuthForm
          title="Complete Your Profile"
          onSubmit={applicantForm.handleSubmit(onSubmitApplicant)}
          loading={loading}
        >
          <InputField
            label="Job Title"
            placeholder="Frontend Developer"
            register={applicantForm.register("jobTitle")}
            error={applicantForm.formState.errors.jobTitle}
          />
          <InputField
            label="Experience (years)"
            type="number"
            placeholder="2"
            register={applicantForm.register("experienceYears", {
              valueAsNumber: true,
            })}
            error={applicantForm.formState.errors.experienceYears}
          />
          <InputField
            label="Skills (comma separated)"
            placeholder="React, Node, SQL"
            register={applicantForm.register("skills")}
            error={applicantForm.formState.errors.skills}
          />
        </AuthForm>
      )}

      {isEmployer && (
        <AuthForm
          title="Complete Your Company Profile"
          onSubmit={employerForm.handleSubmit(onSubmitEmployer)}
          loading={loading}
        >
          <InputField
            label="Company Name"
            placeholder="Tech Pvt Ltd"
            register={employerForm.register("companyName")}
            error={employerForm.formState.errors.companyName}
          />
          <InputField
            label="Location"
            placeholder="Islamabad"
            register={employerForm.register("location")}
            error={employerForm.formState.errors.location}
          />
          <InputField
            label="Industry"
            placeholder="Software Development"
            register={employerForm.register("industry")}
            error={employerForm.formState.errors.industry}
          />
        </AuthForm>
      )}
    </>
  );
}
