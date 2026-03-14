/** @format */

export interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  upcomingInterviews: number;
}

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected";

export interface RecentApplication {
  id: string;
  name: string;
  jobTitle: string;
  avatarUrl: string | null;
  status: ApplicationStatus;
  appliedAt: string; // ISO date string
}

export interface UpcomingInterview {
  id: string;
  candidate: string;
  jobTitle: string;
  scheduledAt: string; // ISO date string
  type: "video" | "phone" | "in-person";
  avatarUrl: string | null;
}

export interface ActiveJob {
  id: string;
  title: string;
  applicants: number;
  viewsCount: number;
  createdAt: string; // ISO date string
  deadline: string | null;
  status: "active" | "paused" | "closed";
}

export interface DashboardData {
  stats: EmployerStats;
  applications: RecentApplication[];
  interviews: UpcomingInterview[];
  jobs: ActiveJob[];
}

// ── Status display config ──────────────────────────────────────────────────────
export const STATUS_CFG: Record<
  ApplicationStatus,
  { label: string; cls: string }
> = {
  new: { label: "New", cls: "sNew" },
  reviewing: { label: "Reviewing", cls: "sReviewing" },
  shortlisted: { label: "Shortlisted", cls: "sShortlisted" },
  interview: { label: "Interview", cls: "sInterview" },
  offered: { label: "Offered", cls: "sOffered" },
  rejected: { label: "Rejected", cls: "sRejected" },
};
