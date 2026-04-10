/** @format */

export type InterviewStatus = "upcoming" | "completed" | "cancelled";

// Round type — maps to backend InterviewType enum
export type InterviewType = "technical" | "hr" | "panel" | "cultural" | "final";

// Delivery format — video/phone/onsite/async
export type InterviewFormat = "video" | "phone" | "onsite" | "async";

export type FilterTab = "all" | InterviewStatus;

export interface Panelist {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogoUrl?: string;
  candidate: string;
  applicationId: string;
  avatarUrl: string | null;
  role: string;
  scheduledAt: string;
  duration: number;
  format: InterviewFormat; // video / phone / onsite / async
  type: InterviewType; // technical / hr / panel / cultural / final
  location?: string;
  meetLink: string | null;
  interviewers: string[];
  panelists: Panelist[];
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
  format: InterviewFormat; // ← was "type"
  type: InterviewType; // ← add round type
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
  format: "video", // ← was type
  type: "technical", // ← add
  interviewers: "",
  notes: "",
};

export const FORMAT_META: Record<
  InterviewFormat,
  { label: string; cls: string }
> = {
  video: { label: "Video", cls: "typeVideo" },
  phone: { label: "Phone", cls: "typePhone" },
  onsite: { label: "On-site", cls: "typeOnsite" },
  async: { label: "Async", cls: "typeAsync" },
};

// Keep TYPE_META as alias so existing code doesn't break
export const TYPE_META = FORMAT_META;

export const INTERVIEW_TYPE_META: Record<
  InterviewType,
  { label: string; cls: string }
> = {
  technical: { label: "Technical", cls: "itTechnical" },
  hr: { label: "HR", cls: "itHr" },
  panel: { label: "Panel", cls: "itPanel" },
  cultural: { label: "Culture fit", cls: "itCultural" },
  final: { label: "Final", cls: "itFinal" },
};

export const STATUS_META: Record<
  InterviewStatus,
  { label: string; cls: string }
> = {
  upcoming: { label: "Upcoming", cls: "sUpcoming" },
  completed: { label: "Completed", cls: "sCompleted" },
  cancelled: { label: "Cancelled", cls: "sCancelled" },
};
