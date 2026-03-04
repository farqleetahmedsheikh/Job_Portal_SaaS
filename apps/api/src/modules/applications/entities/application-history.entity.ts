import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { User } from '../../users/entities/user.entity';
@Entity('application_history')
export class ApplicationHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Application, (app: Application) => app.history, {
    onDelete: 'CASCADE',
  })
  application!: Application;

  @Column()
  previousStatus!: string;

  @Column()
  newStatus!: string;

  @ManyToOne(() => User, { nullable: true })
  changedBy?: User;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
