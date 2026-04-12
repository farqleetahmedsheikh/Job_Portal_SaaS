import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AddonType } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

@Entity('addon_purchases')
export class AddonPurchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  jobId?: string;

  @Column({ type: 'enum', enum: AddonType })
  type!: AddonType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'PKR' })
  currency!: string;

  @Column({ name: 'gateway_payment_id', nullable: true })
  gatewayPaymentId?: string;

  @Column({ name: 'applied_at', type: 'timestamptz', nullable: true })
  appliedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
