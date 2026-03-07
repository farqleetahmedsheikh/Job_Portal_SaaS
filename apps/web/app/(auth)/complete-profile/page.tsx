/** @format */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";

// --- Schemas ---
const applicantSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  experienceYears: z.number().min(0, "Experience cannot be negative"),
  skills: z.string().min(2, "At least one skill required"), // comma-separated
});

const employerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  industry: z.string().min(2, "Industry is required"),
});

type ApplicantForm = z.infer<typeof applicantSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

type Role = "APPLICANT" | "EMPLOYER" | null;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  // Determine role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toUpperCase() as Role;
    setRole(storedRole || null);
  }, []);

  // Applicant form
  const applicantForm = useForm<ApplicantForm>({
    resolver: zodResolver(applicantSchema),
  });

  // Employer form
  const employerForm = useForm<EmployerForm>({
    resolver: zodResolver(employerSchema),
  });

  // --- Unified submit handlers ---
  const handleApplicantSubmit: SubmitHandler<ApplicantForm> = async (data) => {
    if (!userId) return alert("User not found. Please login again.");

    setLoading(true);
    try {
      await api(
        `http://localhost:9000/api/auth/applicant-profile/${userId}`,
        "POST",
        {
          jobTitle: data.jobTitle,
          experienceYears: data.experienceYears,
          skills: data.skills.split(",").map((s) => s.trim()),
        },
      );
      alert("Applicant profile completed!");
      router.push("/login");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployerSubmit: SubmitHandler<EmployerForm> = async (data) => {
    if (!userId) return alert("User not found. Please login again.");

    setLoading(true);
    try {
      await api(
        `http://localhost:9000/api/auth/employer-profile/${userId}`,
        "POST",
        data,
      );
      alert("Company profile completed!");
      router.push("/login");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (!role) return <p>Loading...</p>;

  return (
    <>
      {role === "APPLICANT" && (
        <AuthForm
          title="Complete Your Profile"
          onSubmit={applicantForm.handleSubmit(handleApplicantSubmit)}
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

      {role === "EMPLOYER" && (
        <AuthForm
          title="Complete Your Company Profile"
          onSubmit={employerForm.handleSubmit(handleEmployerSubmit)}
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
