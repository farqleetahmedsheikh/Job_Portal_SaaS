/** @format */

import type { CountryCode, SupportedTimezone } from "../lib/region";

export type UserRole =
  | "applicant"
  | "employer"
  | "admin"
  | "super_admin"
  | "supervisor";

export interface SafeApplicantProfile {
  id: string;
  jobTitle: string | null;
  experienceYears: number | null;
  skills: string[];
  location: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  isOpenToWork: boolean;
  isPublic: boolean;
  educations: unknown[];
  experiences: unknown[];
  openToWork?: boolean;
  recruitersOnly?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  activityVisible?: boolean;
  notifEmailApplications?: boolean;
  notifEmailMessages?: boolean;
  notifEmailDigest?: boolean;
  notifEmailMarketing?: boolean;
  notifPushApplications?: boolean;
  notifPushMessages?: boolean;
  notifPushReminders?: boolean;
  notifPushJobAlerts?: boolean;
}

export interface SafeCompany {
  id: string;
  companyName: string;
  industry: string | null;
  location: string | null;
  country: CountryCode;
  city: string | null;
  timezone: SupportedTimezone;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  isVerified: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  country?: CountryCode;
  timezone?: SupportedTimezone;
  avatar: string | null;
  phone?: string | null;
  bio?: string | null;
  isProfileComplete?: boolean;
  isEmailVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string | Date | null;
  onboardingRole?: "applicant" | "employer" | null;
  marketingConsent?: boolean;
  termsAcceptedAt?: string | Date | null;
  privacyAcceptedAt?: string | Date | null;
  deletionRequestedAt?: string | Date | null;
  dataExportRequestedAt?: string | Date | null;
  applicantProfile?: SafeApplicantProfile | null;
  company?: SafeCompany | null;
}

export type SessionUser = Required<
  Pick<
    User,
    | "id"
    | "fullName"
    | "email"
    | "role"
    | "avatar"
    | "phone"
    | "bio"
    | "isProfileComplete"
    | "isEmailVerified"
    | "country"
    | "timezone"
  >
> &
  Pick<
    User,
    | "hasCompletedOnboarding"
    | "onboardingCompletedAt"
    | "onboardingRole"
    | "marketingConsent"
    | "termsAcceptedAt"
    | "privacyAcceptedAt"
    | "deletionRequestedAt"
    | "dataExportRequestedAt"
  > & {
    applicantProfile: SafeApplicantProfile | null;
    company: SafeCompany | null;
  };
