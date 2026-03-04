import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Resume } from '../../resumes/entities/resume.entity';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';
import { ApplicationHistory } from './application-history.entity';

@Entity('applications')
@Index(['job', 'applicant', 'resume'], { unique: true })
@Index(['status'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  job!: Job;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  applicant!: User;

  @ManyToOne(() => Resume, { onDelete: 'SET NULL' })
  resume!: Resume;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status!: ApplicationStatus;

  @Column({ type: 'float', default: 0 })
  aiScore!: number;

  @OneToMany(() => ApplicationHistory, (history) => history.application)
  history!: ApplicationHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
