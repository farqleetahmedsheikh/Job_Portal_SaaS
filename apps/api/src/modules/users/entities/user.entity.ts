/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity';
import { Company } from '../../companies/entities/company.entity';
import { Subscription } from '../../billing/entities/subscription.entity';
import { CountryCode, SupportedTimezone } from '../../../common/enums/enums';
import {
  DEFAULT_COUNTRY,
  DEFAULT_TIMEZONE,
} from '../../../common/region/defaults';

@Entity('users')
@Index(['email'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ length: 255 })
  email!: string;

  // select:false → never returned in queries unless explicitly added
  // @Exclude()   → stripped by class-transformer in responses
  @Column({ name: 'password_hash', length: 255, select: false })
  @Exclude()
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'varchar', length: 2, default: DEFAULT_COUNTRY })
  country!: CountryCode;

  @Column({ type: 'varchar', length: 64, default: DEFAULT_TIMEZONE })
  timezone!: SupportedTimezone;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'avatar_public_id', type: 'text', nullable: true })
  avatarPublicId!: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'is_profile_complete', default: false })
  isProfileComplete!: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

  @Column({ name: 'has_completed_onboarding', default: false })
  hasCompletedOnboarding!: boolean;

  @Column({ name: 'marketing_consent', type: 'boolean', default: false })
  marketingConsent!: boolean;

  @Column({
    name: 'terms_accepted_at',
    type: 'timestamptz',
    nullable: true,
  })
  termsAcceptedAt?: Date | null;

  @Column({
    name: 'privacy_accepted_at',
    type: 'timestamptz',
    nullable: true,
  })
  privacyAcceptedAt?: Date | null;

  @Column({
    name: 'deletion_requested_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletionRequestedAt?: Date | null;

  @Column({
    name: 'data_export_requested_at',
    type: 'timestamptz',
    nullable: true,
  })
  dataExportRequestedAt?: Date | null;

  @Column({
    name: 'onboarding_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  onboardingCompletedAt?: Date | null;

  @Column({
    type: 'varchar',
    name: 'onboarding_role',
    length: 30,
    nullable: true,
  })
  onboardingRole?: UserRole | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  // ── Relations (loaded on demand — don't add `eager:true` unless needed) ──

  @OneToOne(() => ApplicantProfile, (p) => p.user, { cascade: true })
  applicantProfile?: ApplicantProfile;

  @OneToOne(() => Company, (c) => c.owner, { cascade: true })
  company?: Company;

  @OneToOne(() => Subscription, (s) => s.user, { nullable: true })
  subscription?: Subscription;

  // ── Hooks ──

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    this.email = this.email?.toLowerCase().trim();
  }
}
