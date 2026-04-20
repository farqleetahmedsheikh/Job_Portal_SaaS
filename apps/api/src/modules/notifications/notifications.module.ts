import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyPerk } from '../companies/entities/company-perk.entity';
import { Notification } from './entities/notification.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, CompanyPerk])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    MailService,
    NotificationsGateway,
    JwtService,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
