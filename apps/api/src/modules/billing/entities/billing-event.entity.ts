import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BillingEventType } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

@Entity('billing_events')
@Index(['userId', 'createdAt'])
export class BillingEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: BillingEventType })
  type!: BillingEventType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'PKR' })
  currency!: string;

  @Column({ name: 'gateway_payment_id', nullable: true })
  gatewayPaymentId?: string;

  // Raw webhook payload — never modify, append-only audit log
  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
