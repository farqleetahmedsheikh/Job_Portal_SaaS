import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmailTemplateType } from '../../../common/enums/enums';

@Index(['companyId', 'type'], { unique: true })
@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @Column({ type: 'enum', enum: EmailTemplateType })
  type!: EmailTemplateType;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
