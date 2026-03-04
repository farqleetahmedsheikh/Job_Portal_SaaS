import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { CodingSubmission } from './coding-submission.entity';

@Entity('coding_tests')
@Index(['job'])
export class CodingTest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Job this test belongs to
   */
  @ManyToOne(() => Job, (job: Job) => job.codingTests, {
    onDelete: 'CASCADE',
  })
  job!: Job;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  instructions!: string;

  /**
   * Time limit
   */
  @Column({ type: 'int' })
  durationMinutes!: number;

  /**
   * Maximum achievable score
   */
  @Column({ type: 'int' })
  maxScore!: number;

  /**
   * Optional language restrictions
   * example: ['javascript', 'python']
   */
  @Column({ type: 'text', array: true, nullable: true })
  allowedLanguages?: string[];

  @OneToMany(() => CodingSubmission, (submission) => submission.test)
  submissions!: CodingSubmission[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
