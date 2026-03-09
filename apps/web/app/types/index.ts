/** @format */

// ─── User ─────────────────────────────────────────────────
export type UserRole = "applicant" | "employer";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
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
}

export interface AuthResponse {
  id: string;
  fullName: string;
  email: string;
  role: "applicant" | "employer";
  avatar: string | null;
  isProfileComplete: boolean;
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
  company: string;
  logo: string;
  location: string;
  type: JobType;
  mode: WorkMode;
  salary: string;
  salaryRaw: number;
  experience: string;
  description: string;
  tags: string[];
  posted: string;
  featured?: boolean;
  isNew?: boolean;
  urgent?: boolean;
}

export interface Application {
  id: string;
  job: Pick<Job, "title" | "company" | "logo">;
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
