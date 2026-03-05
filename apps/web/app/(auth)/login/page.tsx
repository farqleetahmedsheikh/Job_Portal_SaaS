/** @format */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";
import { AuthLinks } from "../../components/Auth/AuthLinks";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await api("/api/auth/login", "POST", data);
      alert("Logged in successfully!");
      console.log("Login response:", response);
      // Optionally redirect to dashboard
      // router.push("/dashboard");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Login" onSubmit={handleSubmit(onSubmit)} loading={loading}>
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
      <AuthLinks
        leftLinkText="Don’t have an account?"
        leftLinkHref="/register"
        rightLinkText="Forgot Password?"
        rightLinkHref="/forgot-password"
      />
    </AuthForm>
  );
}
