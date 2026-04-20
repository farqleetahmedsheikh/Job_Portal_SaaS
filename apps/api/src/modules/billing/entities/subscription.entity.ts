import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  VerificationStatus,
} from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

@Index(['userId', 'status'])
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan!: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  // ── Monthly quotas — reset each billing period ─────────────────────────────
  @Column({ name: 'job_posts_remaining', default: 2 })
  jobPostsRemaining!: number;

  @Column({ name: 'featured_slots_remaining', default: 0 })
  featuredSlotsRemaining!: number;

  // ── Billing period ─────────────────────────────────────────────────────────
  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date;

  // ── Gateway ────────────────────────────────────────────────────────────────
  @Column({ name: 'gateway_subscription_id', nullable: true })
  gatewaySubscriptionId?: string;

  @Column({ name: 'gateway_customer_id', nullable: true })
  gatewayCustomerId?: string;

  // ── Verification add-on ────────────────────────────────────────────────────
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'verification_gateway_sub_id', nullable: true })
  verificationGatewaySubId?: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
