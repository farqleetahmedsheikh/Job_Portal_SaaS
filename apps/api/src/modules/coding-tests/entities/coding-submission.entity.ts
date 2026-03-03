/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CodingTest } from './coding-test.entity';
import { User } from '../../users/entities/user.entity';

@Entity('coding_submissions')
@Index(['test', 'applicant'], { unique: true })
@Index(['score'])
export class CodingSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Test being attempted
   */
  @ManyToOne(() => CodingTest, (test: CodingTest) => test.submissions, {
    onDelete: 'CASCADE',
  })
  test: CodingTest;

  /**
   * Applicant who submitted
   */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  applicant: User;

  /**
   * Submitted code
   */
  @Column({ type: 'text' })
  code: string;

  /**
   * Programming language
   */
  @Column()
  language: string;

  /**
   * Score after evaluation
   */
  @Column({ type: 'float', default: 0 })
  score: number;

  /**
   * AI or human feedback
   */
  @Column({ type: 'text', nullable: true })
  feedback?: string;

  /**
   * AI evaluation metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  aiEvaluation?: Record<string, any>;

  @CreateDateColumn()
  submittedAt: Date;
}
