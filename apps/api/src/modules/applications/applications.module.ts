import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { ApplicationStatusHistory } from './entities/application-status-history.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { AiMatcherService } from './ai-matcher.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, ApplicationStatusHistory, Job]),
    NotificationsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, AiMatcherService],
  exports: [ApplicationsService, AiMatcherService],
})
export class ApplicationsModule {}
