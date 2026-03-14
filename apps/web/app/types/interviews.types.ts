/** @format */

export type InterviewType = "video" | "phone" | "onsite";
export type InterviewStatus = "upcoming" | "completed" | "cancelled";

export interface Interview {
  id: string;
  candidate: string;
  avatarUrl: string | null;
  role: string;
  scheduledAt: string; // ISO — replaces separate date + time strings
  duration: number; // minutes
  type: InterviewType;
  status: InterviewStatus;
  meetLink: string | null;
  interviewers: string[];
  notes: string | null;
}

export interface ScheduleForm {
  candidateId: string;
  candidate: string;
  role: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
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

export const TYPE_META: Record<InterviewType, { label: string; cls: string }> =
  {
    video: { label: "Video", cls: "typeVideo" },
    phone: { label: "Phone", cls: "typePhone" },
    onsite: { label: "On-site", cls: "typeOnsite" },
  };

export const STATUS_META: Record<
  InterviewStatus,
  { label: string; cls: string }
> = {
  upcoming: { label: "Upcoming", cls: "sUpcoming" },
  completed: { label: "Completed", cls: "sCompleted" },
  cancelled: { label: "Cancelled", cls: "sCancelled" },
};
