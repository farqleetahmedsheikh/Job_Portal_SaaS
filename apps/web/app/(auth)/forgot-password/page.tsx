/** @format */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";

type FormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Call backend forgot password API
      await api("/api/auth/forgot-password", "POST", data);
      alert("OTP sent to your email!");
      // Optionally redirect to verify OTP page
      // router.push("/auth/verify-otp");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Forgot Password"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
    >
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
