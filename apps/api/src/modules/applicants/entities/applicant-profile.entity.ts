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
@Index(['userId'], { unique: true })
export class ApplicantProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    name: 'job_title',
    type: 'varchar',
    length: 120,
    nullable: true,
    default: null,
  })
  jobTitle?: string | null;

  @Column({
    name: 'experience_years',
    type: 'smallint',
    nullable: true,
    default: null,
  })
  experienceYears?: number | null;

  // ── JSONB — default must be a string, not a JS array literal ──────────────
  @Column({ type: 'jsonb', default: '[]' })
  educations!: {
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear?: string;
    grade?: string;
    description?: string;
  }[];

  @Column({ type: 'jsonb', default: '[]' })
  experiences!: {
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    skills?: string[];
  }[];

  @Column({ type: 'text', array: true, default: '{}' })
  skills!: string[];

  @Column({ type: 'varchar', length: 120, nullable: true, default: null })
  location?: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  summary?: string | null;

  @Column({ name: 'linkedin_url', type: 'text', nullable: true, default: null })
  linkedinUrl?: string | null;

  @Column({ name: 'github_url', type: 'text', nullable: true, default: null })
  githubUrl?: string | null;

  @Column({
    name: 'portfolio_url',
    type: 'text',
    nullable: true,
    default: null,
  })
  portfolioUrl?: string | null;

  // ── Visibility ─────────────────────────────────────────────────────────────
  @Column({ name: 'open_to_work', type: 'boolean', default: true })
  openToWork!: boolean;

  @Column({ name: 'is_open_to_work', type: 'boolean', default: false })
  isOpenToWork!: boolean;

  @Column({ name: 'profile_visible', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'recruiters_only', type: 'boolean', default: false })
  recruitersOnly!: boolean;

  @Column({ name: 'show_email', type: 'boolean', default: false })
  showEmail!: boolean;

  @Column({ name: 'show_phone', type: 'boolean', default: false })
  showPhone!: boolean;

  @Column({ name: 'activity_visible', type: 'boolean', default: true })
  activityVisible!: boolean;

  // ── Notification preferences ───────────────────────────────────────────────
  @Column({ name: 'notif_email_applications', type: 'boolean', default: true })
  notifEmailApplications!: boolean;

  @Column({ name: 'notif_email_messages', type: 'boolean', default: true })
  notifEmailMessages!: boolean;

  @Column({ name: 'notif_email_digest', type: 'boolean', default: false })
  notifEmailDigest!: boolean;

  @Column({ name: 'notif_email_marketing', type: 'boolean', default: false })
  notifEmailMarketing!: boolean;

  @Column({ name: 'notif_push_applications', type: 'boolean', default: true })
  notifPushApplications!: boolean;

  @Column({ name: 'notif_push_messages', type: 'boolean', default: true })
  notifPushMessages!: boolean;

  @Column({ name: 'notif_push_reminders', type: 'boolean', default: true })
  notifPushReminders!: boolean;

  @Column({ name: 'notif_push_job_alerts', type: 'boolean', default: false })
  notifPushJobAlerts!: boolean;

  // ── Timestamps ─────────────────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  // ── Relation ───────────────────────────────────────────────────────────────
  @OneToOne(() => User, (u) => u.applicantProfile)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
