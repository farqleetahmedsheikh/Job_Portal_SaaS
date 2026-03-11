// ─────────────────────────────────────────────────────────────
//  ENUMS  (mirror SQL enums — keep in src/common/enums.ts)
// ─────────────────────────────────────────────────────────────
export enum UserRole {
  APPLICANT = 'applicant',
  EMPLOYER = 'employer',
}
export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}
export enum LocationType {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ON_SITE = 'on-site',
}
export enum ExperienceLevel {
  L01 = '0-1',
  L13 = '1-3',
  L35 = '3-5',
  L5P = '5+',
  L10P = '10+',
}
export enum CompanySize {
  S1 = '1-10',
  S2 = '11-50',
  S3 = '51-200',
  S4 = '201-500',
  S5 = '501-1000',
  S6 = '1001-5000',
  S7 = '5000+',
}
export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}
export enum AppStatus {
  NEW = 'new',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}
export enum InterviewType {
  VIDEO = 'video',
  PHONE = 'phone',
  ONSITE = 'onsite',
}
export enum InterviewStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
export enum ResumeStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}
export enum SalaryCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  PKR = 'PKR',
  INR = 'INR',
}
export enum NotifType {
  APP_RECEIVED = 'application_received',
  APP_STATUS = 'application_status_changed',
  IV_SCHEDULED = 'interview_scheduled',
  IV_REMINDER = 'interview_reminder',
  OFFER = 'offer_received',
  MESSAGE = 'message_received',
  JOB_ALERT = 'job_alert',
  PROFILE_VIEWED = 'profile_viewed',
  SYSTEM = 'system',
}
export enum AppSource {
  LINKEDIN = 'linkedin',
  COMPANY_SITE = 'company_site',
  REFERRAL = 'referral',
  ANGELLIST = 'angellist',
  INDEED = 'indeed',
  GLASSDOOR = 'glassdoor',
  HIRESPHERE = 'hiresphere',
  OTHER = 'other',
}
