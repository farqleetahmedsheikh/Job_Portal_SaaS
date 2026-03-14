/** @format */

export enum UserRole {
  APPLICANT = 'applicant',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
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
  ZERO_TO_ONE = '0-1',
  ONE_TO_THREE = '1-3',
  THREE_TO_FIVE = '3-5',
  FIVE_PLUS = '5+',
  TEN_PLUS = '10+',
}

export enum CompanySize {
  XS = '1-10',
  SM = '11-50',
  MD = '51-200',
  LG = '201-500',
  XL = '501-1000',
  XXL = '1001-5000',
  ENT = '5000+',
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
  HIRED = 'hired',
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
