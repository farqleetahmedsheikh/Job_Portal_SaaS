import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationStatus } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';

@Entity('verification_docs')
export class VerificationDoc {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'business_reg_number', nullable: true })
  businessRegNumber?: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl?: string;

  @Column({ name: 'official_email', nullable: true })
  officialEmail?: string;

  @Column({ name: 'doc_url', nullable: true })
  docUrl?: string; // uploaded registration certificate

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @Column({ name: 'reviewer_notes', type: 'text', nullable: true })
  reviewerNotes?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById?: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
