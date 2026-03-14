/** @format */

export type AppStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected";

export type SortKey = "match" | "date" | "name";

export interface Applicant {
  id: string;
  name: string;
  avatarUrl: string | null;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  appliedAt: string; // ISO date string
  status: AppStatus;
  match: number;
  starred: boolean;
  resumeUrl: string | null;
}

export const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "sNew" },
  reviewing: { label: "Reviewing", cls: "sReviewing" },
  shortlisted: { label: "Shortlisted", cls: "sShortlisted" },
  interview: { label: "Interview", cls: "sInterview" },
  offered: { label: "Offered", cls: "sOffered" },
  rejected: { label: "Rejected", cls: "sRejected" },
};

export const PIPELINE: AppStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];
