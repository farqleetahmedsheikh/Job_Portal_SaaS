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
  Check,
} from 'typeorm';
import { InterviewType, InterviewStatus } from '../../../common/enums/enums';
import { Application } from '../../applications/entities/application.entity';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { InterviewPanelist } from './interview-panelist.entity';

// ─── Drop in: src/modules/interviews/entities/interview.entity.ts ─────────────

@Entity('interviews')
@Check(`"rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)`)
@Check(`"duration_mins" > 0`)
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id' })
  applicationId!: string;

  @Column({ name: 'scheduled_by_id' })
  scheduledById!: string;

  // Denormalized from application for faster queries on employer dashboard
  @Column({ name: 'job_id' })
  jobId!: string;

  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'duration_mins', type: 'smallint', default: 45 })
  durationMins?: number;

  @Column({ type: 'enum', enum: InterviewType, default: InterviewType.VIDEO })
  type?: InterviewType;

  // upcoming → completed | cancelled
  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.UPCOMING,
  })
  status?: InterviewStatus;

  // Video link shown as "Join" button on interviews page
  @Column({ name: 'meet_link', type: 'text', nullable: true })
  meetLink?: string | null;

  // Pre-interview notes — visible to employer panelists
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  // Post-interview notes — filled after completion
  @Column({ type: 'text', nullable: true })
  feedback?: string | null;

  // 1–5 star rating from interviewer
  @Column({ type: 'smallint', nullable: true })
  rating?: number | null;

  // Prevents sending reminder email twice
  @Column({ name: 'reminder_sent', default: false })
  reminderSent?: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relations ──

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application?: Application;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'scheduled_by_id' })
  scheduledBy?: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job?: Job;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: User;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @OneToMany(() => InterviewPanelist, (p) => p.interview, { cascade: true })
  panelists?: InterviewPanelist[];
}
