import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../companies/entities/company.entity';
import { Application } from '../applications/entities/application.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobSkill } from './entities/job-skill.entity';
import { SavedJob } from './entities/saved-job.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsExpiryTask } from './jobs-expiry.task';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      JobSkill,
      SavedJob,
      Company,
      Application,
      ApplicantProfile,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsExpiryTask],
  exports: [JobsService],
})
export class JobsModule {}
