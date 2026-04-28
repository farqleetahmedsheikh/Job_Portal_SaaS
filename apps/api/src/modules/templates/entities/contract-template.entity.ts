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

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ name: 'created_by' })
  createdBy!: string;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
