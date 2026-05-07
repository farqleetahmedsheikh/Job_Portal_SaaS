/** @format */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { API_BASE } from "../../constants";
import { z } from "zod";

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (email) {
      setValue("email", email, { shouldValidate: true });
    }
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api(`${API_BASE}/auth/reset-password`, "PATCH", {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      router.push("/login?reset=success");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Reset Password"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
      submitLabel="Reset Password"
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
        label="Email"
        type="email"
        placeholder="you@email.com"
        register={register("email")}
        error={errors.email}
      />
      <InputField
        label="OTP"
        type="text"
        placeholder="123456"
        register={register("otp")}
        error={errors.otp}
      />
      <InputField
        type="password"
        label="New Password"
        placeholder="••••••••"
        register={register("newPassword")}
        error={errors.newPassword}
      />
      <InputField
        type="password"
        label="Confirm Password"
        placeholder="••••••••"
        register={register("confirmPassword")}
        error={errors.confirmPassword}
      />
    </AuthForm>
  );
}
