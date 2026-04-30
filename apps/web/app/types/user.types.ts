/** @format */

export type UserRole =
  | "APPLICANT"
  | "EMPLOYER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SUPERVISOR";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string | null;
  onboardingRole?: "applicant" | "employer" | null;
}
