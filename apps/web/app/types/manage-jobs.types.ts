/** @format */

export type JobStatus = "active" | "paused" | "draft" | "closed" | "expired";

export interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string;
  postedAt: string | null; // ISO
  deadline: string | null; // ISO
  status: JobStatus;
  applicants: number;
  viewsCount: number;
  newApps: number;
  isFeatured: boolean;
}

export const STATUS_META: Record<JobStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "sActive" },
  paused: { label: "Paused", cls: "sPaused" },
  draft: { label: "Draft", cls: "sDraft" },
  closed: { label: "Closed", cls: "sClosed" },
  expired: { label: "Expired", cls: "sExpired" },
};

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Closed" },
  { key: "expired", label: "Expired" },
] as const;
