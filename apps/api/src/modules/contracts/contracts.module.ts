import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
// import { MailModule } from '../mail/mail.module';
import { MessagingModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractTemplate } from '../templates/entities/contract-template.entity';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractUsage } from './entities/contract-usage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Company,
      ContractTemplate,
      ContractUsage,
    ]),
    // MailModule,
    MessagingModule,
    NotificationsModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
