/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppStatus } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';
import { Application } from './application.entity';
@Entity('application_status_history')
export class ApplicationStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id' })
  applicationId!: string;

  @Column({ name: 'changed_by_id' })
  changedById!: string;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: AppStatus,
    nullable: true,
  })
  fromStatus?: AppStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: AppStatus })
  toStatus?: AppStatus;

  // Optional reason shown in status history timeline
  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt?: Date;

  // ── Relations ──

  @ManyToOne(() => Application, (a) => a.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application?: Application;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy?: User;
}
