/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { API_BASE } from "../../constants";
import { z } from "zod";

type FormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api(`${API_BASE}/auth/forgot-password`, "POST", data);
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Forgot Password"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
      submitLabel="Send OTP"
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
    </AuthForm>
  );
}
