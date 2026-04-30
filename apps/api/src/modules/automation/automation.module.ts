import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { MailModule } from '../mail/mail.module';
import { MessagingModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AutomationController } from './automation.controller';
import { AutomationProcessor } from './automation.processor';
import { AutomationService } from './automation.service';
import { AutomationLog } from './entities/automation-log.entity';
import { AutomationSetting } from './entities/automation-setting.entity';
import { InterviewReminderLog } from './entities/interview-reminder-log.entity';
import { PipelineRule } from './entities/pipeline-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutomationSetting,
      AutomationLog,
      InterviewReminderLog,
      PipelineRule,
      Company,
      Application,
      Interview,
    ]),
    NotificationsModule,
    MailModule,
    MessagingModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationProcessor],
  exports: [AutomationService],
})
export class AutomationModule {}
