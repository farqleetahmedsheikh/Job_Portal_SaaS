/** @format */
// app/employer/jobs/new/post-job.types.ts

export interface JobForm {
  title: string;
  department: string;
  type: string;
  location: string;
  locationType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  experienceLevel: string;
  deadline: string;
  openings: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave: string;
  benefits: string;
  skills: string[];
  status: "draft" | "active";
}

export type JobFormErrors = Partial<Record<keyof JobForm, string>>;

export const INIT: JobForm = {
  title: "",
  department: "",
  type: "full-time",
  location: "",
  locationType: "remote",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  experienceLevel: "3-5",
  deadline: "",
  openings: "1",
  description: "",
  responsibilities: "",
  requirements: "",
  niceToHave: "",
  benefits: "",
  skills: [],
  status: "active",
};

export const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

export const EXPERIENCE_LEVELS = [
  { value: "0-1", label: "0–1 years (Entry level)" },
  { value: "1-3", label: "1–3 years (Junior)" },
  { value: "3-5", label: "3–5 years (Mid-level)" },
  { value: "5+", label: "5+ years (Senior)" },
  { value: "10+", label: "10+ years (Staff/Principal)" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export const LOCATION_TYPES = [
  { value: "remote", label: "Remote", desc: "Work from anywhere" },
  { value: "hybrid", label: "Hybrid", desc: "Mix of office & remote" },
  { value: "on-site", label: "On-site", desc: "Office only" },
];

export const NAV_SECTIONS = [
  { id: "basic", title: "Job Basics", desc: "Core information about the role" },
  {
    id: "location",
    title: "Location & Type",
    desc: "Where and how the role is performed",
  },
  {
    id: "compensation",
    title: "Compensation",
    desc: "Salary range and benefits",
  },
  {
    id: "description",
    title: "Job Description",
    desc: "Detailed role description and requirements",
  },
] as const;

export type SectionId = (typeof NAV_SECTIONS)[number]["id"];

export const PROGRESS_FIELDS: (keyof JobForm)[] = [
  "title",
  "location",
  "salaryMin",
  "description",
  "requirements",
];
