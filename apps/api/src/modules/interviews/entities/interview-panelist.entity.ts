/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Interview } from './interview.entity';
@Entity('interview_panelists')
export class InterviewPanelist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId?: string;

  // Nullable — external panelists have no user account
  @Column({ name: 'user_id', nullable: true })
  userId!: string;

  // Free-text name used when user_id is null
  @Column({ length: 120, nullable: true })
  name?: string;

  @ManyToOne(() => Interview, (i) => i.panelists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview?: Interview;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
