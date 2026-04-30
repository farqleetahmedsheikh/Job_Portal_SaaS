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
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { Company } from '../../companies/entities/company.entity';
import { Application } from '../../applications/entities/application.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

// ─── Drop in: src/modules/messaging/entities/conversation.entity.ts ──────────

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Which job this conversation is about — shown as the "job chip" in chat header
  // Nullable because conversations can exist without a specific job context
  @Column({ name: 'job_id', nullable: true })
  jobId!: string | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId!: string | null;

  @Column({ name: 'employer_id', type: 'uuid', nullable: true })
  employerId!: string | null;

  @Column({ name: 'applicant_id', type: 'uuid', nullable: true })
  applicantId!: string | null;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt?: Date | null;

  @Column({ name: 'archived_by_employer', default: false })
  archivedByEmployer!: boolean;

  @Column({ name: 'archived_by_applicant', default: false })
  archivedByApplicant!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Bumped by DB trigger on every new message — used for inbox sort order
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  // ── Relations ──

  @ManyToOne(() => Job, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job!: Job | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company!: Company | null;

  @ManyToOne(() => Application, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'application_id' })
  application!: Application | null;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, {
    cascade: true,
  })
  participants?: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages?: Message[];
}
