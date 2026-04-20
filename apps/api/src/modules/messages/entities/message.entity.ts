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

// ─── Drop in: src/modules/messaging/entities/message.entity.ts ───────────────

@Index(['conversationId', 'isDeleted', 'createdAt'])
@Index(['senderId', 'conversationId'])
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @Column({ name: 'sender_id' })
  senderId!: string;

  @Column({ type: 'text' })
  text!: string;

  // Soft-delete: message text hidden from UI but record kept for audit
  @Column({ name: 'is_deleted', default: false })
  isDeleted?: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relations ──

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender?: User;
}
