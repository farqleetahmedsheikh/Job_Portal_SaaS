import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Resume } from '../../resumes/entities/resume.entity';
import { Application } from '../../applications/entities/application.entity';
import { Company } from '../../companies/entities/company.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ nullable: false })
  fullName!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: false, default: false })
  profileCompleted!: boolean;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  /* Relations */
  @OneToMany(() => Resume, (resume) => resume.user)
  resumes?: Resume[];

  @OneToMany(() => Application, (app) => app.applicant)
  applications?: Application[];

  @OneToMany(() => Company, (company) => company.owner)
  companies?: Company[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
