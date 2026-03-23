/** @format */

export type ApplicantStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected";

export type SortKey = "date" | "name" | "match" | "status";

export interface AllApplicant {
  id: string;
  name: string;
  email: string;
  avatar: string; // initials fallback
  avatarUrl?: string;
  title: string; // applicant's current/desired role
  location: string;
  match: number; // 0–100 skill match score
  status: ApplicantStatus;
  appliedAt: string; // ISO
  starred: boolean;
  // which job they applied to
  jobId: string;
  jobTitle: string;
  resumeUrl?: string;
  skills: string[];
  experience?: string; // e.g. "4 years"
}

export interface JobOption {
  id: string;
  title: string;
  count: number; // total applicants for this job
}

export interface AllApplicantsStats {
  total: number;
  new: number;
  shortlisted: number;
  interview: number;
  offered: number;
}
