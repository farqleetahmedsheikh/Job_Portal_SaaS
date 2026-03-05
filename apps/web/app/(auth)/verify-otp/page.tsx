/** @format */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";

type FormData = z.infer<typeof otpSchema>;

export default function VerifyOTPPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Call backend OTP verification API
      await api("/api/auth/verify-otp", "POST", data);
      alert("OTP verified successfully!");
      // Optionally redirect to Complete Profile or Dashboard
      // router.push("/complete-profile");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Verify OTP"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
    >
      <InputField
        label="OTP"
        type="number"
        placeholder="123456"
        register={register("otp")}
        error={errors.otp}
      />
    </AuthForm>
  );
}
