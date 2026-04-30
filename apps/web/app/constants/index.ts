/** @format */
import type { NavSection } from "../types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api";

export const NAVIGATION: Record<"applicant" | "employer", NavSection[]> = {
  applicant: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: "dashboard", href: "/applicant/dashboard" },
        { label: "Browse Jobs", icon: "search", href: "/jobs" },
        { label: "Applications", icon: "briefcase", href: "/applications" },
        { label: "Saved Jobs", icon: "bookmark", href: "/saved" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: "user", href: "/profile" },
        { label: "Settings", icon: "settings", href: "/settings" },
      ],
    },
  ],
  employer: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: "dashboard", href: "/employer/dashboard" },
        { label: "Post Job", icon: "plus", href: "/post-job" },
        { label: "Candidates", icon: "users", href: "/candidates" },
        { label: "Company", icon: "building", href: "/company" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: "user", href: "/profile" },
        { label: "Settings", icon: "settings", href: "/settings" },
      ],
    },
  ],
};

export const JOB_FILTERS = {
  TYPES: ["Full-time", "Part-time", "Contract", "Internship"] as const,
  MODES: ["Remote", "Hybrid", "On-site"] as const,
  EXPERIENCE: ["0–1 years", "2–3 years", "4–5 years", "5+ years"] as const,
  SORT: [
    { value: "relevance", label: "Most Relevant" },
    { value: "newest", label: "Newest First" },
    { value: "salary", label: "Highest Salary" },
    { value: "featured", label: "Featured" },
  ],
} as const;
