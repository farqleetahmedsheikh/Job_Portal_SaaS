/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Resume } from '../../resumes/entities/resume.entity';
import { Application } from '../../applications/entities/application.entity';
import { Company } from '../../companies/entities/company.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['createdAt'])
@Index(['deletedAt'])
export class User {
  // ── Identity ──────────────────────────────────────────
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ select: false }) // never loaded unless explicitly requested
  @Exclude() // stripped by ClassSerializerInterceptor
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  // ── Base profile ──────────────────────────────────────
  @Column({ length: 100 })
  fullName!: string;

  @Column({ length: 20, type: 'varchar', nullable: true, default: null })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  profilePicture!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  bio!: string | null;

  // ── Status flags ──────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  isProfileComplete!: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // ── Hooks ─────────────────────────────────────────────
  @BeforeInsert()
  normalizeEmailInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  normalizeEmailUpdate() {
    if (this.email) this.email = this.email.toLowerCase().trim();
  }

  // ── Relations ─────────────────────────────────────────
  // Role-specific profile — only one will be populated based on role
  @OneToOne(() => ApplicantProfile, (p) => p.user, { nullable: true })
  applicantProfile!: ApplicantProfile | null;

  @OneToMany(() => Resume, (r) => r.user)
  resumes!: Resume[];

  @OneToMany(() => Application, (a) => a.applicant)
  applications!: Application[];

  @OneToMany(() => Company, (c) => c.owner)
  companies!: Company[];

  @OneToMany(() => Message, (m) => m.sender)
  sentMessages!: Message[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  // ── Timestamps ────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt!: Date | null;
}
