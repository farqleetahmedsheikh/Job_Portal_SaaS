import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContractUsagePaymentStatus } from '../../../common/enums/enums';

@Index(['companyId', 'candidateId', 'usedAt'])
@Entity('contract_usages')
export class ContractUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId!: string;

  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId!: string | null;

  @Column({ name: 'template_id', type: 'varchar', nullable: true })
  templateId!: string | null;

  @Column({ name: 'sent_by_id', type: 'uuid' })
  sentById!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ContractUsagePaymentStatus,
  })
  paymentStatus!: ContractUsagePaymentStatus;

  @Column({ type: 'int', default: 500 })
  amount!: number;

  @CreateDateColumn({ name: 'used_at', type: 'timestamptz' })
  usedAt!: Date;
}
