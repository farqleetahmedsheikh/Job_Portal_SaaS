import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('resumes')
@Index(['user'])
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.resumes, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  title!: string;

  @Column()
  fileUrl!: string;

  @Column({ nullable: true })
  yearsOfExperience?: number;

  @Column({ type: 'text', array: true, nullable: true })
  skills?: string[];

  @Column({ type: 'text', nullable: true })
  education?: string;

  @Column({ type: 'text', array: true, nullable: true })
  certifications?: string[];

  @Column({ type: 'float', default: 0 })
  aiScore!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
