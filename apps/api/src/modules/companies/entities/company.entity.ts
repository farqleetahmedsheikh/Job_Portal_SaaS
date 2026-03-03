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
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

@Entity('companies')
@Index(['owner', 'name'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.companies, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  employees?: string;

  @Column({ nullable: false })
  location!: string;

  @Column({ nullable: false })
  industry!: string;

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
