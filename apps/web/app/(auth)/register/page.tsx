/** @format */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { AuthLinks } from "../../components/Auth/AuthLinks";
import { useSession } from "../../hooks/useSession";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "applicant" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    // useSession.register() handles cookie, store, and redirect
    const error = await registerUser(data);
    if (error) setServerError(error);
  };

  return (
    <AuthForm
      title="Create account"
      subtitle="Join HireSphere today"
      onSubmit={handleSubmit(onSubmit)}
      loading={isLoading}
      submitLabel="Create account"
    >
      {serverError && (
        <p
          role="alert"
          style={{ color: "var(--status-danger)", fontSize: 13, margin: 0 }}
        >
          {serverError}
        </p>
      )}

      <InputField
        label="Full Name"
        placeholder="John Doe"
        register={register("fullName")}
        error={errors.fullName}
      />
      <InputField
        label="Email"
        placeholder="you@example.com"
        register={register("email")}
        error={errors.email}
      />
      <InputField
        type="password"
        label="Password"
        placeholder="••••••••"
        register={register("password")}
        error={errors.password}
      />

      {/* Role picker */}
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 8,
            color: "var(--text-secondary)",
          }}
        >
          I am a...
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {(["applicant", "employer"] as const).map((r) => (
            <label
              key={r}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                padding: "9px 16px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${selectedRole === r ? "var(--color-secondary)" : "var(--border)"}`,
                background:
                  selectedRole === r
                    ? "rgba(var(--glow-rgb),0.08)"
                    : "transparent",
                color:
                  selectedRole === r
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                fontSize: 13,
                fontWeight: selectedRole === r ? 600 : 400,
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                value={r}
                {...register("role")}
                style={{ display: "none" }} // visually hidden — label handles click
              />
              {r === "applicant" ? "Job Seeker" : "Company"}
            </label>
          ))}
        </div>
        {errors.role && (
          <p
            role="alert"
            style={{
              color: "var(--status-danger)",
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {errors.role.message}
          </p>
        )}
      </div>

      <AuthLinks
        leftLinkText="Already have an account?"
        leftLinkHref="/login"
        rightLinkText="Terms of Service"
        rightLinkHref="/terms"
      />
    </AuthForm>
  );
}
