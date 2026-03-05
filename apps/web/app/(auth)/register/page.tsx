/** @format */

"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";
import { AuthLinks } from "../../components/Auth/AuthLinks";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api("/api/auth/register", "POST", data);
      alert("Registered successfully!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Register"
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
    >
      <InputField
        label="Full Name"
        placeholder="John Doe"
        register={register("fullName")}
        error={errors.fullName}
      />
      <InputField
        label="Email"
        placeholder="example@mail.com"
        register={register("email")}
        error={errors.email}
      />
      <InputField
        type="password"
        label="Password"
        placeholder="******"
        register={register("password")}
        error={errors.password}
      />
      <AuthLinks
        rightLinkText="Already have an account?"
        rightLinkHref="/login"
      />
    </AuthForm>
  );
}
