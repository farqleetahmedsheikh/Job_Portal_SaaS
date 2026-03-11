/** @format */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('company_perks')
export class CompanyPerk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ length: 120 })
  perk?: string;

  // Controls display order on Company Profile page
  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder?: number;

  @ManyToOne(() => Company, (c) => c.perks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;
}
