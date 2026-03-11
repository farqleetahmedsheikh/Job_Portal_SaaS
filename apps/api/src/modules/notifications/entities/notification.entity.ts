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
import { NotifType } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

// ─── Drop in: src/modules/notifications/entities/notification.entity.ts ──────

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt']) // fast inbox query
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: NotifType })
  type!: NotifType;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'is_read', default: false })
  isRead?: boolean;

  // Polymorphic reference — points to whichever entity triggered this notification
  // e.g. ref_type = 'application', ref_id = <application_uuid>
  // Use ref_type + ref_id on frontend to build the notification link
  @Column({ name: 'ref_id', type: 'uuid', nullable: true })
  refId?: string | null;

  @Column({ name: 'ref_type', length: 40, nullable: true })
  refType?: string | null; // 'application' | 'interview' | 'job' | 'message'

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relations ──

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
