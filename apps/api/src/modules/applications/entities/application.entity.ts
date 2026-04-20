/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppStatus, AppSource } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Resume } from '../../resumes/entities/resume.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';

@Index(['jobId', 'status', 'appliedAt'])
@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_id' })
  jobId!: string;

  @Column({ name: 'applicant_id' })
  applicantId!: string;

  @Column({ name: 'resume_id', nullable: true })
  resumeId!: string | null;

  // Pipeline stages shown on Applicants page kanban/table
  // new → reviewing → shortlisted → interview → offered → rejected | withdrawn
  @Column({ type: 'enum', enum: AppStatus, default: AppStatus.NEW })
  status?: AppStatus;

  // Where the applicant came from (for analytics)
  @Column({ type: 'enum', enum: AppSource, default: AppSource.HIRINGFLY })
  source?: AppSource;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter?: string | null;

  // Internal notes only visible to employer — never expose to applicant
  @Column({ name: 'employer_notes', type: 'text', nullable: true })
  employerNotes?: string | null;

  // Star flag on Applicants List page
  @Column({ name: 'is_starred', default: false })
  isStarred?: boolean;

  // Tracks when employer first opened the application
  @Column({
    name: 'viewed_by_employer_at',
    type: 'timestamptz',
    nullable: true,
  })
  viewedByEmployerAt?: Date | null;

  @CreateDateColumn({ name: 'applied_at', type: 'timestamptz' })
  appliedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  // ── Relations ──

  @ManyToOne(() => Job, (j) => j.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job?: Job;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant?: User;

  @ManyToOne(() => Resume, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resume_id' })
  resume?: Resume | null;

  @Column({
    name: 'match_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    default: null,
  })
  matchScore?: number | null;

  @OneToMany(() => ApplicationStatusHistory, (h) => h.application, {
    cascade: true,
  })
  statusHistory?: ApplicationStatusHistory[];

  @OneToMany(() => ApplicationStatusHistory, (h) => h.application)
  history?: ApplicationStatusHistory[];
}
