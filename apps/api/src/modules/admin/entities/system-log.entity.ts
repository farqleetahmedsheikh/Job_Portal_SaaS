import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SystemLogLevel } from '../../../common/enums/enums';

@Index(['level', 'createdAt'])
@Index(['route', 'createdAt'])
@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SystemLogLevel })
  level!: SystemLogLevel;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  route!: string | null;

  @Column({ type: 'varchar', length: 12, nullable: true })
  method!: string | null;

  @Column({ name: 'stack_trace', type: 'text', nullable: true })
  stackTrace!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
