/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { AuthLinks } from "../../components/Auth/AuthLinks";
import { useSession } from "../../hooks/useSession";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  DEFAULT_TIMEZONE,
  TIMEZONES,
} from "../../lib/region";

type FormInput = z.input<typeof registerSchema>;
type FormData = z.output<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(registerSchema) as Resolver<
      FormInput,
      unknown,
      FormData
    >,
    defaultValues: {
      role: "applicant",
      country: DEFAULT_COUNTRY,
      timezone: DEFAULT_TIMEZONE,
      termsAccepted: false,
      privacyAccepted: false,
      marketingConsent: false,
    },
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
      subtitle="Join HiringFly today"
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

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            Country
          </span>
          <select
            {...register("country")}
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
          {errors.country && (
            <span style={{ color: "var(--status-danger)", fontSize: 12 }}>
              {errors.country.message}
            </span>
          )}
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            Timezone
          </span>
          <select
            {...register("timezone")}
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
          {errors.timezone && (
            <span style={{ color: "var(--status-danger)", fontSize: 12 }}>
              {errors.timezone.message}
            </span>
          )}
        </label>
      </div>

      <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" {...register("termsAccepted")} />
          <span>
            I accept the{" "}
            <Link href="/terms" style={{ color: "var(--color-secondary)" }}>
              Terms
            </Link>
            .
          </span>
        </label>
        {errors.termsAccepted && (
          <span style={{ color: "var(--status-danger)", fontSize: 12 }}>
            {errors.termsAccepted.message}
          </span>
        )}
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" {...register("privacyAccepted")} />
          <span>
            I accept the{" "}
            <Link href="/privacy" style={{ color: "var(--color-secondary)" }}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.privacyAccepted && (
          <span style={{ color: "var(--status-danger)", fontSize: 12 }}>
            {errors.privacyAccepted.message}
          </span>
        )}
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" {...register("marketingConsent")} />
          <span>Send me product and hiring updates by email.</span>
        </label>
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
