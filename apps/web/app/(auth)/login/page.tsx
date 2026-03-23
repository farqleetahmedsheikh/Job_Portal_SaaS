/** @format */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { AuthLinks } from "../../components/Auth/AuthLinks";
import { useSession } from "../../hooks/useSession";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const error = await login(data); // returns error string or null
    if (error) setServerError(error); // rendered in UI — no alert()
  };

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to your HiringFly account"
      onSubmit={handleSubmit(onSubmit)}
      loading={isLoading}
      submitLabel="Sign in"
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
        leftLinkText="Don't have an account?"
        leftLinkHref="/register"
        rightLinkText="Forgot password?"
        rightLinkHref="/forgot-password"
      />
    </AuthForm>
  );
}
