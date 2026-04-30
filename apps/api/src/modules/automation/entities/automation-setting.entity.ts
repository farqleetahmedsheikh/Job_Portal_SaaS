import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['companyId'], { unique: true })
@Entity('automation_settings')
export class AutomationSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'auto_application_confirmation', default: true })
  autoApplicationConfirmation!: boolean;

  @Column({ name: 'auto_shortlist_message', default: true })
  autoShortlistMessage!: boolean;

  @Column({ name: 'auto_rejection_message', default: true })
  autoRejectionMessage!: boolean;

  @Column({ name: 'auto_interview_reminders', default: true })
  autoInterviewReminders!: boolean;

  @Column({ name: 'auto_follow_up_after_no_response', default: false })
  autoFollowUpAfterNoResponse!: boolean;

  @Column({ name: 'follow_up_delay_days', type: 'smallint', default: 3 })
  followUpDelayDays!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
