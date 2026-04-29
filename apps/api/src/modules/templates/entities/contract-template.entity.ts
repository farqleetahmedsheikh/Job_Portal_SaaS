import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateKind } from '../../../common/enums/enums';

@Index(['companyId', 'type'])
@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column()
  title!: string;

  @Column({ type: 'enum', enum: TemplateKind })
  type!: TemplateKind;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ name: 'is_advanced', default: false })
  isAdvanced!: boolean;

  @Column({ name: 'is_premium', default: false })
  isPremium!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
