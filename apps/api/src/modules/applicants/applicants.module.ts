import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { ApplicantProfilesService } from './applicant-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicantProfile])],
  providers: [ApplicantProfilesService],
  exports: [ApplicantProfilesService], // exported so AuthModule can use it
})
export class ApplicantProfilesModule {}
