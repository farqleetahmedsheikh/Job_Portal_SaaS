import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('applicant_profiles')
@Index(['userId'], { unique: true }) // enforce one profile per user at DB level
@Entity('applicant_profiles')
export class ApplicantProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Explicit FK column — needed for upsert queries
  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'job_title', length: 120, nullable: true })
  jobTitle?: string | null;

  @Column({ name: 'experience_years', type: 'smallint', nullable: true })
  experienceYears?: number | null;

  // PostgreSQL native text array
  @Column({ type: 'text', array: true, default: '{}' })
  skills?: string[];

  @Column({ length: 120, nullable: true })
  location?: string | null;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @Column({ name: 'linkedin_url', type: 'text', nullable: true })
  linkedinUrl?: string | null;

  @Column({ name: 'github_url', type: 'text', nullable: true })
  githubUrl?: string | null;

  @Column({ name: 'portfolio_url', type: 'text', nullable: true })
  portfolioUrl?: string | null;

  // ── Privacy / visibility settings (from Settings page) ──

  @Column({ name: 'open_to_work', default: true })
  openToWork!: boolean;

  @Column({ name: 'recruiters_only', default: false })
  recruitersOnly!: boolean;

  @Column({ name: 'show_email', default: false })
  showEmail!: boolean;

  @Column({ name: 'show_phone', default: false })
  showPhone!: boolean;

  @Column({ name: 'activity_visible', default: true })
  activityVisible!: boolean;

  @Column({ name: 'profile_visible', default: true })
  profileVisible!: boolean;

  // ── Notification preferences (from Settings > Notifications) ──

  @Column({ name: 'notif_email_applications', default: true })
  notifEmailApplications!: boolean;

  @Column({ name: 'notif_email_messages', default: true })
  notifEmailMessages!: boolean;

  @Column({ name: 'notif_email_digest', default: false })
  notifEmailDigest!: boolean;

  @Column({ name: 'notif_email_marketing', default: false })
  notifEmailMarketing!: boolean;

  @Column({ name: 'notif_push_applications', default: true })
  notifPushApplications!: boolean;

  @Column({ name: 'notif_push_messages', default: true })
  notifPushMessages!: boolean;

  @Column({ name: 'notif_push_reminders', default: true })
  notifPushReminders!: boolean;

  @Column({ name: 'notif_push_job_alerts', default: false })
  notifPushJobAlerts!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  // ── Relation ──

  @OneToOne(() => User, (u) => u.applicantProfile)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
