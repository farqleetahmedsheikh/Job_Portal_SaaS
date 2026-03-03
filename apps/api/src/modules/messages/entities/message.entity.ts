/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['receiver', 'read'])
@Index(['sender'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who sends the message
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  /**
   * User who receives the message
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  /**
   * Message body
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * Read / Unread status
   */
  @Column({ default: false })
  read: boolean;

  /**
   * Timestamp
   */
  @CreateDateColumn()
  createdAt: Date;
}
