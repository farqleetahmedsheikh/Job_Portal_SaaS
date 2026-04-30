/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from '../../../common/enums/enums';

// ─── Drop in: src/modules/messaging/entities/message.entity.ts ───────────────

@Index(['conversationId', 'isDeleted', 'createdAt'])
@Index(['senderId', 'conversationId'])
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @Column({ name: 'sender_id', nullable: true })
  senderId!: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    default: MessageType.USER,
  })
  type!: MessageType;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  // Soft-delete: message text hidden from UI but record kept for audit
  @Column({ name: 'is_deleted', default: false })
  isDeleted?: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relations ──

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender?: User | null;
}
