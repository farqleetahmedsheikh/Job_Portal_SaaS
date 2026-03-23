/** @format */

export type AppStatus =
  | "applied"
  | "reviewing"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export type JobType = "full-time" | "part-time" | "contract" | "remote";

export type SortKey = "date" | "status" | "company";

export interface Application {
  id: string;
  role: string;
  company: string;
  logo: string; // initials fallback
  location: string;
  type: JobType;
  salary: string;
  appliedDate: string; // formatted display string
  lastUpdate: string; // relative e.g. "2 days ago"
  status: AppStatus;
  source: string;
  notes?: string;
  jobUrl?: string;
}

export interface ApplicationStats {
  total: number;
  active: number;
  interview: number;
  offered: number;
  rejected: number;
}
