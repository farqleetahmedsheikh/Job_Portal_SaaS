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
import { CodingTest } from 'src/modules/coding-tests/entities/coding-test.entity';

@Entity('jobs')
@Check(
  `"salary_max" IS NULL OR "salary_min" IS NULL OR "salary_max" >= "salary_min"`,
)
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId?: string;

  @Column({ name: 'posted_by_id', type: 'uuid' })
  postedById?: string;

  // ✅ All string columns need explicit type: 'varchar' or type: 'text'
  //    TypeORM cannot infer the PG type from `string | null` — it sees "Object"
  @Column({ type: 'varchar', length: 150 })
  title?: string;

  @Column({ type: 'varchar', length: 80, nullable: true, default: null })
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

  @Column({ type: 'varchar', length: 150 })
  location?: string;

  @Column({
    name: 'experience_level',
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
    default: null,
  })
  experienceLevel?: ExperienceLevel | null;

  @Column({
    name: 'salary_min',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  salaryMin?: number | null;

  @Column({
    name: 'salary_max',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  salaryMax?: number | null;

  @Column({
    name: 'salary_currency',
    type: 'enum',
    enum: SalaryCurrency,
    default: SalaryCurrency.USD,
  })
  salaryCurrency?: SalaryCurrency;

  @Column({ name: 'salary_is_public', type: 'boolean', default: true })
  salaryIsPublic?: boolean;

  @Column({ type: 'smallint', default: 1 })
  openings?: number;

  @Column({ type: 'date', nullable: true, default: null })
  deadline?: Date | null;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status?: JobStatus;

  // Rich text — type: 'text' must be explicit even for non-nullable
  @Column({ type: 'text' })
  description?: string;

  @Column({ type: 'text', nullable: true, default: null })
  responsibilities?: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  requirements?: string | null;

  @Column({ name: 'nice_to_have', type: 'text', nullable: true, default: null })
  niceToHave?: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  benefits?: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  skills?: string[];

  // Counters — updated by DB triggers, never write manually
  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount?: number;

  @Column({ name: 'applicants_count', type: 'int', default: 0 })
  applicantsCount?: number;

  // ── Applicant cap ──────────────────────────────────────
  @Column({ name: 'applicant_cap', default: 25 })
  applicantCap!: number;

  @Column({ name: 'applicant_count', default: 0 })
  applicantCount!: number;

  @Column({ name: 'cap_reached_at', type: 'timestamptz', nullable: true })
  capReachedAt?: Date;

  // ── Featured ───────────────────────────────────────────
  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'featured_until', type: 'timestamptz', nullable: true })
  featuredUntil?: Date;

  @Column({
    name: 'published_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  publishedAt?: Date | null;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  expiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;

  // ── Relations ──────────────────────────────────────────────────────────────
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

  @OneToMany(() => CodingTest, (ct) => ct.job)
  codingTests?: CodingTest[];
}
