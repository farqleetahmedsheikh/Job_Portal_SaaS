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
import { UserRole } from '../../../common/enums/enums';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity';
import { Company } from '../../companies/entities/company.entity';
import { Subscription } from '../../billing/entities/subscription.entity';

@Entity('users')
@Index(['email'], { unique: true, where: 'deleted_at IS NULL' })
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
  companies?: Company;

  @OneToOne(() => Subscription, (s) => s.user, { nullable: true })
  subscription?: Subscription;

  // Import Company lazily to avoid circular deps
  // @OneToMany(() => Company, (c) => c.owner)
  // companies: Company[];

  // ── Hooks ──

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    this.email = this.email?.toLowerCase().trim();
  }
}
