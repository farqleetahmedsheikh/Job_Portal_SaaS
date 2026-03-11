/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
// ─── Drop in: src/modules/jobs/entities/job-skill.entity.ts ──────────────────
import { Job } from './job.entity';
// Normalized skill table — used for analytics and matching queries

@Entity('job_skills')
@Index(['jobId', 'skill'], { unique: true })
export class JobSkill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_id' })
  jobId!: string;

  @Column({ length: 80 })
  skill?: string;

  @ManyToOne(() => Job, (j) => j.jobSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job?: Job;
}

// ─── Drop in: src/modules/jobs/entities/──────────────────
