/** @format */

import type { CountryCode, SupportedTimezone } from "../lib/region";

// ─── User ─────────────────────────────────────────────────
export type UserRole =
  | "applicant"
  | "employer"
  | "admin"
  | "super_admin"
  | "supervisor";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  country?: CountryCode;
  timezone?: SupportedTimezone;
  avatar?: string | null;
  phone?: string;
  location?: string;
  bio?: string;
  jobTitle?: string;
}

// ─── Auth ─────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  country?: CountryCode;
  timezone?: SupportedTimezone;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent?: boolean;
}

export interface AuthResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  country?: CountryCode;
  timezone?: SupportedTimezone;
  avatar: string | null;
  phone?: string | null;
  bio?: string | null;
  isProfileComplete: boolean;
  isEmailVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string | null;
  onboardingRole?: "applicant" | "employer" | null;
  marketingConsent?: boolean;
  termsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  deletionRequestedAt?: string | null;
  dataExportRequestedAt?: string | null;
  applicantProfile?: import("./user.types").SafeApplicantProfile | null;
  company?: import("./user.types").SafeCompany | null;
  companies?: import("./user.types").SafeCompany | null;
}

// ─── Job ──────────────────────────────────────────────────
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type WorkMode = "Remote" | "Hybrid" | "On-site";
export type AppStatus =
  | "applied"
  | "interview"
  | "reviewed"
  | "rejected"
  | "saved";

export interface Job {
  id: string;
  title: string;
  companyName: string;
  logo: string;
  location: string;
  type: JobType;
  mode: WorkMode;
  salary: string;
  salaryRaw: number;
  experience_level: string;
  description: string;
  tags: string[];
  posted: string;
  featured?: boolean;
  isNew?: boolean;
  urgent?: boolean;
}

export interface Application {
  id: string;
  job: Pick<Job, "title" | "companyName" | "logo">;
  status: AppStatus;
  appliedAt: string;
}

// ─── Nav ──────────────────────────────────────────────────
export interface NavItem {
  label: string;
  icon: string;
  href: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
