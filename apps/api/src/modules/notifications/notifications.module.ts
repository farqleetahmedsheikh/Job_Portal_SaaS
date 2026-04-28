import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyPerk } from '../companies/entities/company-perk.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, CompanyPerk]), MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, JwtService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
