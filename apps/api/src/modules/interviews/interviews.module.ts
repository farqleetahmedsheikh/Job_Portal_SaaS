import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewPanelist } from './entities/interview-panelist.entity';
import { Interview } from './entities/interview.entity';
import { Company } from '../companies/entities/company.entity';
import { Application } from '../applications/entities/application.entity';
import { InterviewsController } from './interviews.controller';
import { InterviewGateway } from './interview.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      InterviewPanelist,
      Application,
      Company,
    ]),
    NotificationsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewGateway, JwtService, ConfigService],
  exports: [InterviewsService],
})
export class InterviewsModule {}
