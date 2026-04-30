import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['companyId', 'isActive'])
@Entity('pipeline_rules')
export class PipelineRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'varchar', length: 80 })
  trigger!: string;

  @Column({ name: 'condition_type', type: 'varchar', length: 80 })
  conditionType!: string;

  @Column({
    name: 'condition_value',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  conditionValue!: string | null;

  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType!: string;

  @Column({ name: 'action_payload', type: 'jsonb', nullable: true })
  actionPayload!: Record<string, unknown> | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
