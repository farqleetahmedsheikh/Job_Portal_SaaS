import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  AutomationLogStatus,
  InterviewReminderType,
} from '../../../common/enums/enums';

@Index(['interviewId', 'reminderType'], { unique: true })
@Entity('interview_reminder_logs')
export class InterviewReminderLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId!: string;

  @Column({
    name: 'reminder_type',
    type: 'enum',
    enum: InterviewReminderType,
  })
  reminderType!: InterviewReminderType;

  @Column({ type: 'enum', enum: AutomationLogStatus })
  status!: AutomationLogStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;
}
