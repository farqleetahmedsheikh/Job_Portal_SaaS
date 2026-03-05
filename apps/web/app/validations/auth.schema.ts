/** @format */

import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password is required"),
});

export const emailSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const otpSchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const completeProfileSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  experience: z
    .number({ message: "Experience must be a number" })
    .min(0, "Experience cannot be negative"),
  companyName: z.string().min(2, "Company name is required"),
});
