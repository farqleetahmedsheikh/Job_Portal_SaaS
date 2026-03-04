import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('applicant_profiles')
export class ApplicantProfile {
  @PrimaryColumn('uuid')
  profileId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user!: User;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'int' })
  experienceYears!: number;

  @Column({ nullable: true })
  linkedinUrl?: string;

  @Column({ type: 'simple-array', nullable: false })
  skills!: Array<string>;

  @Column({ nullable: true })
  githubUrl?: string;
}
