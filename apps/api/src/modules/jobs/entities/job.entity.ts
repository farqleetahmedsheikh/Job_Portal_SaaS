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
  Check,
} from 'typeorm';
import {
  JobType,
  LocationType,
  ExperienceLevel,
  JobStatus,
  SalaryCurrency,
} from '../../../common/enums/enums';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { JobSkill } from './job-skill.entity';
import { Application } from 'src/modules/applications/entities/application.entity';

// ─── Drop in: src/modules/jobs/entities/job.entity.ts ────────────────────────

@Entity('jobs')
@Check(
  `"salary_max" IS NULL OR "salary_min" IS NULL OR "salary_max" >= "salary_min"`,
)
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ name: 'company_id' })
  companyId?: string;

  @Column({ name: 'posted_by_id' })
  postedById?: string;

  @Column({ length: 150 })
  title?: string;

  @Column({ length: 80, nullable: true })
  department?: string | null;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type?: JobType;

  @Column({
    name: 'location_type',
    type: 'enum',
    enum: LocationType,
    default: LocationType.REMOTE,
  })
  locationType?: LocationType;

  @Column({ length: 150 })
  location?: string;

  @Column({
    name: 'experience_level',
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
  })
  experienceLevel?: ExperienceLevel | null;

  @Column({
    name: 'salary_min',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salaryMin?: number | null;

  @Column({
    name: 'salary_max',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salaryMax?: number | null;

  @Column({
    name: 'salary_currency',
    type: 'enum',
    enum: SalaryCurrency,
    default: SalaryCurrency.USD,
  })
  salaryCurrency?: SalaryCurrency;

  @Column({ name: 'salary_is_public', default: true })
  salaryIsPublic?: boolean;

  @Column({ type: 'smallint', default: 1 })
  openings?: number;

  @Column({ type: 'date', nullable: true })
  deadline?: Date | null;

  // draft → active → paused → closed / expired
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status?: JobStatus;

  // Rich text fields — store as plain text, render as markdown on frontend
  @Column({ type: 'text' })
  description?: string;

  @Column({ type: 'text', nullable: true })
  responsibilities?: string | null;

  @Column({ type: 'text', nullable: true })
  requirements?: string | null;

  @Column({ name: 'nice_to_have', type: 'text', nullable: true })
  niceToHave?: string | null;

  @Column({ type: 'text', nullable: true })
  benefits?: string | null;

  // Denormalized array for fast queries — also stored normalized in job_skills
  @Column({ type: 'text', array: true, default: '{}' })
  skills?: string[];

  // Counters — updated by DB triggers, never write manually
  @Column({ name: 'views_count', default: 0 })
  viewsCount?: number;

  @Column({ name: 'applicants_count', default: 0 })
  applicantsCount?: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;

  // ── Relations ──

  @ManyToOne(() => Company, (c) => c.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'posted_by_id' })
  postedBy?: User;

  @OneToMany(() => JobSkill, (js) => js.job, { cascade: true })
  jobSkills?: JobSkill[];

  @OneToMany(() => Application, (a) => a.job)
  applications?: Application[];
}
