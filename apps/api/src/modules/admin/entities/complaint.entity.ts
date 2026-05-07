import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ComplaintStatus, ComplaintType } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

@Index(['status', 'createdAt'])
@Index(['assignedTo', 'status'])
@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: ComplaintType })
  type!: ComplaintType;

  @Column({ type: 'varchar', length: 180, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.OPEN,
  })
  status!: ComplaintStatus;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ name: 'response', type: 'text', nullable: true })
  response!: string | null;

  @Column({ name: 'related_job_id', type: 'uuid', nullable: true })
  relatedJobId!: string | null;

  @Column({ name: 'related_company_id', type: 'uuid', nullable: true })
  relatedCompanyId!: string | null;

  @Column({ name: 'related_user_id', type: 'uuid', nullable: true })
  relatedUserId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User | null;
}
