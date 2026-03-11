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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Bumped by DB trigger on every new message — used for inbox sort order
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  // ── Relations ──

  @ManyToOne(() => Job, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job!: Job | null;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, {
    cascade: true,
  })
  participants?: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages?: Message[];
}
