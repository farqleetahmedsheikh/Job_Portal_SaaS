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
import { CompanySize } from '../../../common/enums/enums';
import { User } from '../../users/entities/user.entity';
import { CompanyPerk } from './company-perk.entity';
import { Job } from 'src/modules/jobs/entities/job.entity';

// ─── Drop in: src/modules/companies/entities/company.entity.ts ───────────────

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @Column({ name: 'company_name', length: 150 })
  companyName!: string;

  @Column({ length: 160, nullable: true, unique: true })
  slug?: string | null;

  @Column({ length: 255, nullable: true })
  tagline?: string | null;

  @Column({ type: 'text', nullable: true })
  about?: string | null;

  @Column({ type: 'text', nullable: true })
  culture?: string | null;

  @Column({ length: 80, nullable: true })
  industry?: string | null;

  @Column({ type: 'enum', enum: CompanySize, nullable: true })
  size?: CompanySize | null;

  @Column({ length: 150, nullable: true })
  location!: string | null;

  @Column({ name: 'founded_year', type: 'smallint', nullable: true })
  foundedYear?: number | null;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl?: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string | null;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl?: string | null;

  @Column({ name: 'linkedin_url', type: 'text', nullable: true })
  linkedinUrl?: string | null;

  @Column({ name: 'twitter_url', type: 'text', nullable: true })
  twitterUrl?: string | null;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagramUrl?: string | null;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

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
