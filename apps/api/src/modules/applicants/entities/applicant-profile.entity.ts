import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('applicant_profiles')
@Index(['userId'], { unique: true }) // enforce one profile per user at DB level
export class ApplicantProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── FK stored as plain column — queryable without JOIN ─
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.applicantProfile, {
    onDelete: 'CASCADE', // delete profile when user is deleted
  })
  @JoinColumn({ name: 'userId' }) // FK column name matches above
  user!: User;

  // ── Profile fields ─────────────────────────────────────
  @Column({ type: 'varchar', nullable: true, default: null })
  jobTitle!: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  location!: string | null;

  @Column({ type: 'smallint', nullable: true, default: null })
  experienceYears!: number | null;

  // text[] is more efficient than simple-array for querying/indexing
  @Column({ type: 'text', array: true, nullable: true, default: null })
  skills!: string[] | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  linkedinUrl!: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  githubUrl!: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  portfolioUrl!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  summary!: string | null;

  // ── Timestamps ─────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
