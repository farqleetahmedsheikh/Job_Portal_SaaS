/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { Company } from '../../companies/entities/company.entity';
import { Application } from '../../applications/entities/application.entity';
import { CodingTest } from '../../coding-tests/entities/coding-test.entity';

@Entity('jobs')
@Index(['status'])
@Index(['title', 'location'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, (company: Company) => company.jobs, {
    onDelete: 'CASCADE',
  })
  company: Company;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  salaryMin?: number;

  @Column({ nullable: true })
  salaryMax?: number;

  @Column({ default: 'open' })
  status: string;

  @OneToMany(() => Application, (app) => app.job)
  applications: Application[];

  @OneToMany(() => CodingTest, (test) => test.job)
  codingTests: CodingTest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
