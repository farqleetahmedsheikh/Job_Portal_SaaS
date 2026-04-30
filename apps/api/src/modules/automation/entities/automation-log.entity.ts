import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutomationLogStatus } from '../../../common/enums/enums';

@Index(['companyId', 'createdAt'])
@Index(['applicationId', 'trigger', 'action'])
@Index(['interviewId', 'trigger', 'action'])
@Entity('automation_logs')
export class AutomationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId!: string | null;

  @Column({ name: 'candidate_id', type: 'uuid', nullable: true })
  candidateId!: string | null;

  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  jobId!: string | null;

  @Column({ name: 'interview_id', type: 'uuid', nullable: true })
  interviewId!: string | null;

  @Column({ type: 'varchar', length: 80 })
  trigger!: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'enum', enum: AutomationLogStatus })
  status!: AutomationLogStatus;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
