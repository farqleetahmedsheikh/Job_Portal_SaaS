/** @format */
// app/applicant/profile/profile.config.tsx

import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Linkedin,
  Github,
  Globe,
  FileText,
} from "lucide-react";
import type {
  ProfileForm,
  PrivacyForm,
  NotificationsForm,
} from "../types/profile.types";

export interface FieldConfig {
  name: keyof ProfileForm;
  label: string;
  type?: string;
  placeholder: string;
  span?: boolean;
  textarea?: boolean;
  icon: React.ReactNode;
  readOnly?: boolean;
  applicantOnly?: boolean;
}

export interface ToggleConfig<T> {
  name: keyof T;
  label: string;
  desc: string;
}

// ── Text / number fields ───────────────────────────────────────────────────────
export const FIELDS: FieldConfig[] = [
  // User table
  {
    name: "fullName",
    label: "Full Name",
    icon: <User size={11} />,
    placeholder: "Your full name",
  },
  {
    name: "email",
    label: "Email Address",
    icon: <Mail size={11} />,
    placeholder: "you@example.com",
    type: "email",
    readOnly: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    icon: <Phone size={11} />,
    placeholder: "+1 (555) 000-0000",
    type: "tel",
  },
  {
    name: "bio",
    label: "Bio",
    icon: null,
    placeholder: "A short bio about yourself...",
    span: true,
    textarea: true,
  },

  // Applicant profile
  {
    name: "jobTitle",
    label: "Job Title",
    icon: <Briefcase size={11} />,
    placeholder: "e.g. Frontend Developer",
    applicantOnly: true,
  },
  {
    name: "location",
    label: "Location",
    icon: <MapPin size={11} />,
    placeholder: "City, Country",
    applicantOnly: true,
  },
  {
    name: "experienceYears",
    label: "Years of Experience",
    icon: <User size={11} />,
    placeholder: "2",
    type: "number",
    applicantOnly: true,
  },
  {
    name: "summary",
    label: "Professional Summary",
    icon: <FileText size={11} />,
    placeholder: "Describe your background and goals...",
    span: true,
    textarea: true,
    applicantOnly: true,
  },
  {
    name: "linkedinUrl",
    label: "LinkedIn URL",
    icon: <Linkedin size={11} />,
    placeholder: "https://linkedin.com/in/username",
    applicantOnly: true,
  },
  {
    name: "githubUrl",
    label: "GitHub URL",
    icon: <Github size={11} />,
    placeholder: "https://github.com/username",
    applicantOnly: true,
  },
  {
    name: "portfolioUrl",
    label: "Portfolio URL",
    icon: <Globe size={11} />,
    placeholder: "https://yourportfolio.com",
    applicantOnly: true,
  },
];

// ── Privacy / visibility toggles ──────────────────────────────────────────────
export const PRIVACY_TOGGLES: ToggleConfig<PrivacyForm>[] = [
  {
    name: "openToWork",
    label: "Open to Work",
    desc: "Show the 'Open to Work' banner on your profile",
  },
  {
    name: "isOpenToWork",
    label: "Accepting Opportunities",
    desc: "Appear in recruiter searches for active candidates",
  },
  {
    name: "isPublic",
    label: "Public Profile",
    desc: "Allow anyone with the link to view your profile",
  },
  {
    name: "recruitersOnly",
    label: "Recruiters Only",
    desc: "Limit profile visibility to verified recruiters",
  },
  {
    name: "showEmail",
    label: "Show Email Address",
    desc: "Display your email on your public profile",
  },
  {
    name: "showPhone",
    label: "Show Phone Number",
    desc: "Display your phone number on your public profile",
  },
  {
    name: "activityVisible",
    label: "Activity Visible",
    desc: "Let others see your recent activity and application stats",
  },
];

// ── Notification toggles ───────────────────────────────────────────────────────
export const NOTIFICATION_TOGGLES: ToggleConfig<NotificationsForm>[] = [
  // Email
  {
    name: "notifEmailApplications",
    label: "Application Updates",
    desc: "Email me when my application status changes",
  },
  {
    name: "notifEmailMessages",
    label: "New Messages",
    desc: "Email me when I receive a new message",
  },
  {
    name: "notifEmailDigest",
    label: "Weekly Digest",
    desc: "Send a weekly summary of job matches and activity",
  },
  {
    name: "notifEmailMarketing",
    label: "Tips & Promotions",
    desc: "Occasional product updates and career tips",
  },
  // Push
  {
    name: "notifPushApplications",
    label: "Push: Applications",
    desc: "Push notification on application status changes",
  },
  {
    name: "notifPushMessages",
    label: "Push: Messages",
    desc: "Push notification on new messages",
  },
  {
    name: "notifPushReminders",
    label: "Push: Reminders",
    desc: "Interview and deadline reminders",
  },
  {
    name: "notifPushJobAlerts",
    label: "Push: Job Alerts",
    desc: "New job postings that match your profile",
  },
];

// ── Danger zone ────────────────────────────────────────────────────────────────
export const DANGER_ACTIONS = [
  {
    label: "Change Password",
    desc: "Update your password to keep your account secure",
    variant: "btn-ghost" as const,
    route: "/change-password",
  },
  {
    label: "Delete Account",
    desc: "Permanently remove your account and all associated data",
    variant: "btn-danger" as const,
    route: "/delete-account",
  },
];
