/** @format */

"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validations/auth.schema";
import { InputField } from "../../components/Auth/InputField";
import { AuthForm } from "../../components/Auth/AuthForm";
import { api } from "../../lib/api";
import { z } from "zod";
import { AuthLinks } from "../../components/Auth/AuthLinks";

type FormData = z.infer<typeof registerSchema> & {
  role: "applicant" | "employer";
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "applicant",
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("Submitting form with data:", data);
    setLoading(true);
    try {
      const res: { accessToken: string; role: string; userId: string } =
        await api("http://localhost:9000/api/auth/register", "POST", data);
      console.log("register response: ----->", res);
      localStorage.setItem("token", res.accessToken);
      localStorage.setItem("role", res.role);
      localStorage.setItem("userId", res.userId);
      alert("Registered successfully!");
      router.push("/complete-profile");
    } catch (err: unknown) {
      console.log(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = watch("role");

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

      {/* Role Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Role
        </label>
        <div className="flex gap-4">
          <label
            className={`cursor-pointer ${selectedRole === "applicant" ? "font-bold text-primary" : ""}`}
          >
            <input
              type="radio"
              value="applicant"
              {...register("role")}
              className="mr-1"
            />
            Applicant
          </label>
          <label
            className={`cursor-pointer ${selectedRole === "employer" ? "font-bold text-primary" : ""}`}
          >
            <input
              type="radio"
              value="employer"
              {...register("role")}
              className="mr-1"
            />
            Employer
          </label>
        </div>
        {errors.role && (
          <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
        )}
      </div>

      <AuthLinks
        rightLinkText="Already have an account?"
        rightLinkHref="/login"
      />
    </AuthForm>
  );
}
