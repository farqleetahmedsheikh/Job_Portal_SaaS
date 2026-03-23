/** @format */

export type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export interface DashboardApplication {
  id: string;
  title: string;
  company: string;
  logo: string; // initials fallback
  logoUrl?: string;
  time: string; // relative label e.g. "2d ago"
  status: ApplicationStatus;
}

export interface DashboardInterview {
  id: string;
  title: string;
  sub: string; // e.g. "Video call · 45 min"
  time: string; // e.g. "Tomorrow, 10:00 AM"
  color: string; // dot color css class suffix
}

export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  responseRate: number; // 0–100
  responseRateDelta: number; // positive = up, negative = down
  weeklyApplications: number;
  weeklyDelta: number; // % change vs prior week
}
