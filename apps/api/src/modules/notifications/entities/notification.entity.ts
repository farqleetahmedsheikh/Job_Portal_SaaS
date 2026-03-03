/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
@Index(['user', 'read'])
@Index(['type'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user: User) => user.notifications, {
    onDelete: 'CASCADE',
  })
  user: User;

  /**
   * Notification type
   * examples:
   * - application_status_changed
   * - interview_scheduled
   * - new_message
   */
  @Column()
  type: string;

  /**
   * Short title for UI
   */
  @Column()
  title: string;

  /**
   * Detailed message
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Read / Unread
   */
  @Column({ default: false })
  read: boolean;

  /**
   * Extra payload (IDs, deep links, AI scores, etc.)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Timestamp
   */
  @CreateDateColumn()
  createdAt: Date;
}
/* eslint-enable @typescript-eslint/no-unsafe-call */
