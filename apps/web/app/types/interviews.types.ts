/** @format */

export type InterviewStatus = "upcoming" | "completed" | "cancelled";
export type InterviewType = "technical" | "hr" | "panel" | "cultural" | "final";
export type InterviewFormat = "video" | "phone" | "onsite" | "async";
export type FilterTab = "all" | InterviewStatus;

export interface Panelist {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Interview {
  id: string;
  // job info
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string; // initials fallback
  companyLogoUrl?: string;
  // candidate info
  candidate: string;
  avatarUrl: string | null;
  role: string; // candidate's applied role
  // schedule
  scheduledAt: string; // ISO
  duration: number; // minutes — single source of truth
  format: InterviewFormat;
  type: InterviewType;
  location?: string; // onsite only
  meetLink: string | null; // video only
  // people
  interviewers: string[];
  panelists: Panelist[];
  // meta
  status: InterviewStatus;
  notes: string | null;
}

export interface ScheduleForm {
  candidateId: string;
  candidate: string;
  role: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewFormat;
  interviewers: string;
  notes: string;
}

export const SCHEDULE_INIT: ScheduleForm = {
  candidateId: "",
  candidate: "",
  role: "",
  date: "",
  time: "",
  duration: "45",
  type: "video",
  interviewers: "",
  notes: "",
};

export const TYPE_META: Record<
  InterviewFormat,
  { label: string; cls: string }
> = {
  video: { label: "Video", cls: "typeVideo" },
  phone: { label: "Phone", cls: "typePhone" },
  onsite: { label: "On-site", cls: "typeOnsite" },
  async: { label: "Async", cls: "typeAsync" }, // was missing
};

export const STATUS_META: Record<
  InterviewStatus,
  { label: string; cls: string }
> = {
  upcoming: { label: "Upcoming", cls: "sUpcoming" },
  completed: { label: "Completed", cls: "sCompleted" },
  cancelled: { label: "Cancelled", cls: "sCancelled" },
};
