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
import { ApplicantProfile } from 'src/modules/applicants/entities/applicant-profile.entity';

// ─── Drop this file in: src/modules/users/entities/user.entity.ts ───────────

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
  avatarUrl?: string | null;

  @Column({ length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ name: 'is_profile_complete', default: false })
  isProfileComplete!: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;

  // ── Relations (loaded on demand — don't add `eager:true` unless needed) ──

  @OneToOne(() => ApplicantProfile, (p) => p.user, { cascade: true })
  applicantProfile?: ApplicantProfile | null;

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

// ─── Drop this file in: src/modules/users/entities/applicant-profile.entity.ts
