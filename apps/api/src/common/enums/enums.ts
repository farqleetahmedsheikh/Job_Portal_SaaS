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
  HIRINGFLY = 'hiringFly',
  OTHER = 'other',
}

// Delivery format — how the interview is conducted
export enum InterviewType {
  VIDEO = 'video',
  PHONE = 'phone',
  ONSITE = 'onsite',
  ASYNC = 'async', // ← add async
}

// Round type — what kind of interview it is
export enum InterviewRoundType {
  TECHNICAL = 'technical',
  HR = 'hr',
  PANEL = 'panel',
  CULTURAL = 'cultural',
  FINAL = 'final',
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
}

export enum NotifType {
  APP_RECEIVED = 'application_received',
  APP_STATUS = 'application_status_changed',
  IV_SCHEDULED = 'interview_scheduled',
  IV_RESCHEDULED = 'interview_rescheduled', // ← add
  IV_CANCELLED = 'interview_cancelled', // ← add
  IV_REMINDER = 'interview_reminder',
  OFFER = 'offer_received',
  MESSAGE = 'message_received',
  JOB_ALERT = 'job_alert',
  PROFILE_VIEWED = 'profile_viewed',
  SYSTEM = 'system',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  SCALE = 'scale',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  LAPSED = 'lapsed',
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum AddonType {
  EXTRA_POST = 'extra_post',
  BOOST_CAP = 'boost_cap',
  FEATURE_JOB = 'feature_job',
}

export enum BillingEventType {
  SUBSCRIPTION_CHARGE = 'subscription_charge',
  ADDON_CHARGE = 'addon_charge',
  REFUND = 'refund',
  DISPUTE = 'dispute',
}

export enum AiMatcherTier {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
}

export enum AnalyticsTier {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  ENTERPRISE = 'enterprise',
}

export enum SupportTier {
  EMAIL = 'email',
  PRIORITY = 'priority',
  DEDICATED = 'dedicated',
}

export enum TemplateKind {
  CONTRACT = 'contract',
  OFFER_LETTER = 'offer_letter',
}

export enum EmailTemplateType {
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_RESCHEDULED = 'interview_rescheduled',
  INTERVIEW_CANCELLED = 'interview_cancelled',
  REJECTION = 'rejection',
  OFFER = 'offer',
  APPLICATION_STATUS = 'application_status',
}
