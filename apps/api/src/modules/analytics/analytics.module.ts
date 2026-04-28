import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Application, Company, Interview]),
    BillingModule,
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
