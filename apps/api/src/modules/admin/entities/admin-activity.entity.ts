import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Index(['adminId', 'createdAt'])
@Index(['targetType', 'targetId'])
@Entity('admin_activities')
export class AdminActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId!: string;

  @Column({ type: 'varchar', length: 120 })
  action!: string;

  @Column({ name: 'target_type', type: 'varchar', length: 80, nullable: true })
  targetType!: string | null;

  @Column({ name: 'target_id', type: 'varchar', length: 120, nullable: true })
  targetId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin?: User;
}
