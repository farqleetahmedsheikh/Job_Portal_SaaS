import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyPerk } from '../companies/entities/company-perk.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, CompanyPerk])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // exported so other services can fire notifications
})
export class NotificationsModule {}
