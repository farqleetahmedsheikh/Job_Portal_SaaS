import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../admin/entities/complaint.entity';
import { AdminActivity } from '../admin/entities/admin-activity.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint, AdminActivity])],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
