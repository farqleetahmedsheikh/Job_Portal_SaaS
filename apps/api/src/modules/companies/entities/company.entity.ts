/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CompanySize, VerificationStatus } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';
import { CompanyPerk } from './company-perk.entity';
import { Job } from '../../jobs/entities/job.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @Column({ type: 'varchar', name: 'company_name', length: 150 })
  companyName!: string;

  @Column({ type: 'varchar', length: 160, nullable: true, unique: true })
  slug?: string;

  @Column({ length: 255, nullable: true })
  tagline?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'text', nullable: true })
  culture?: string;

  @Column({ length: 80, nullable: true })
  industry?: string;

  @Column({ type: 'enum', enum: CompanySize, nullable: true })
  size?: CompanySize;

  @Column({ length: 150, nullable: true })
  location!: string;

  @Column({ name: 'founded_year', type: 'smallint', nullable: true })
  foundedYear?: number;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl?: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'logo_public_id', type: 'text', nullable: true })
  logoPublicId!: string;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl?: string;

  @Column({ name: 'cover_public_id', type: 'text', nullable: true })
  coverPublicId!: string;

  @Column({ name: 'linkedin_url', type: 'text', nullable: true })
  linkedinUrl?: string;

  @Column({ name: 'twitter_url', type: 'text', nullable: true })
  twitterUrl?: string;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagramUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // ── Verification ───────────────────────────────────────
  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus!: VerificationStatus;

  @Column({
    name: 'verification_started_at',
    type: 'timestamptz',
    nullable: true,
  })
  verificationStartedAt?: Date | null;

  @Column({
    name: 'verification_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  verificationExpiresAt?: Date | null;

  @Column({
    name: 'verification_rejection_reason',
    type: 'text',
    nullable: true,
  })
  verificationRejectionReason?: string | null;

  // Cached counters — updated by DB triggers, never write manually
  @Column({ name: 'active_jobs_count', default: 0 })
  activeJobsCount?: number;

  @Column({ name: 'total_hires_count', default: 0 })
  totalHiresCount?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;

  // ── Relations ──

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @OneToMany(() => CompanyPerk, (p) => p.company, { cascade: true })
  perks?: CompanyPerk[];

  @OneToMany(() => Job, (j) => j.company)
  jobs?: Job[];
}
