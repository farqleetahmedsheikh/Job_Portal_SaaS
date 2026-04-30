import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { BillingEvent } from '../billing/entities/billing-event.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { VerificationDoc } from '../billing/entities/verification-doc.entity';
import { Company } from '../companies/entities/company.entity';
import { ContractUsage } from '../contracts/entities/contract-usage.entity';
import { Job } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminActivity } from './entities/admin-activity.entity';
import { Complaint } from './entities/complaint.entity';
import { SystemLog } from './entities/system-log.entity';
import { SystemLogExceptionFilter } from './filters/system-log-exception.filter';
import { AdminRolesGuard } from './guards/admin-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminActivity,
      Application,
      BillingEvent,
      Company,
      Complaint,
      ContractUsage,
      Job,
      Subscription,
      SystemLog,
      User,
      VerificationDoc,
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminRolesGuard,
    {
      provide: APP_FILTER,
      useClass: SystemLogExceptionFilter,
    },
  ],
  exports: [AdminService],
})
export class AdminModule {}
