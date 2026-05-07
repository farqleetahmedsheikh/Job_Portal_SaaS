/** @format */

import { z } from "zod";
import { DEFAULT_COUNTRY, DEFAULT_TIMEZONE } from "../lib/region";

const countryCodes = ["PK", "IN", "BD"] as const;
const timezoneCodes = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "UTC",
] as const;

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(
    ["applicant", "employer"],
    "Role must be either applicant or employer",
  ),
  country: z.enum(countryCodes).default(DEFAULT_COUNTRY),
  timezone: z.enum(timezoneCodes).default(DEFAULT_TIMEZONE),
  termsAccepted: z
    .boolean()
    .refine((value) => value, "You must accept the terms to create an account"),
  privacyAccepted: z
    .boolean()
    .refine(
      (value) => value,
      "You must accept the privacy policy to create an account",
    ),
  marketingConsent: z.boolean().optional().default(false),
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
    otp: z.string().length(6, "OTP must be 6 digits"),
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
