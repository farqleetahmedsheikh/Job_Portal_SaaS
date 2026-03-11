/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ResumeStatus } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

// ─── Drop in: src/modules/resumes/entities/resume.entity.ts ──────────────────

@Entity('resumes')
// Partial index: only one default per user (DB also enforces this via trigger)
@Index(['userId', 'isDefault'], {
  where: 'is_default = TRUE AND deleted_at IS NULL',
})
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  // Size in bytes — used to show file size on Resume Manager page
  @Column({ name: 'file_size', type: 'int' })
  fileSize!: number;

  @Column({ name: 'mime_type', length: 60, default: 'application/pdf' })
  mimeType!: string;

  // processing → ready → error  (set by file processing job)
  @Column({
    type: 'enum',
    enum: ResumeStatus,
    default: ResumeStatus.PROCESSING,
  })
  status!: ResumeStatus;

  // Star badge on Resume Manager page — DB trigger enforces only one per user
  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;

  // ── Relations ──

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
