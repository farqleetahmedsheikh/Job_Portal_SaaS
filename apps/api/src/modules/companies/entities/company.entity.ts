import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

@Entity('companies')
@Index(['ownerId']) // fast owner lookup without JOIN
@Index(['ownerId', 'companyName'], { unique: true }) // one company name per owner
@Index(['industry']) // fast industry filtering
@Index(['createdAt']) // fast sorting
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── FK as plain column ────────────────────────────────
  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.companies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  // ── Company info ──────────────────────────────────────
  @Column({ length: 150 })
  companyName!: string;

  @Column({ length: 100 })
  industry!: string;

  @Column({ length: 200 })
  location!: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  website!: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  logoUrl!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  description!: string | null;

  // Range stored as string e.g. "50-100", "1000+"
  @Column({ length: 20, type: 'varchar', nullable: true, default: null })
  employeeCount!: string | null;

  @Column({ default: false })
  isVerified!: boolean;

  // ── Relations ─────────────────────────────────────────
  @OneToMany(() => Job, (job) => job.company)
  jobs!: Job[];

  // ── Timestamps ────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt!: Date | null;
}
