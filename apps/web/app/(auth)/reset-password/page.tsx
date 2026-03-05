/** @format */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Call your backend reset password API
      await api("/api/auth/reset-password", "POST", data);
      alert("Password reset successfully!");
      // Optionally redirect to login
      // router.push("/auth/login");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Reset Password"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
    >
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
