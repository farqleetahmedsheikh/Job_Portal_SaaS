/** @format */
// app/applicant/profile/profile.types.ts

// ── Text / number fields (rendered via FIELDS config) ─────────────────────────
export interface ProfileForm {
  // User table
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  // Applicant profile — text
  jobTitle: string;
  location: string;
  experienceYears: string;
  skills: string; // comma-separated input → string[] on send
  summary: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

// ── Boolean fields (rendered via toggle sections) ─────────────────────────────
export interface PrivacyForm {
  openToWork: boolean;
  isOpenToWork: boolean;
  isPublic: boolean;
  recruitersOnly: boolean;
  showEmail: boolean;
  showPhone: boolean;
  activityVisible: boolean;
}

export interface NotificationsForm {
  notifEmailApplications: boolean;
  notifEmailMessages: boolean;
  notifEmailDigest: boolean;
  notifEmailMarketing: boolean;
  notifPushApplications: boolean;
  notifPushMessages: boolean;
  notifPushReminders: boolean;
  notifPushJobAlerts: boolean;
}
