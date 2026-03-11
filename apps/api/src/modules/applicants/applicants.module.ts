import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { ApplicantsService } from './applicant.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicantProfile, User])],
  providers: [ApplicantsService],
  exports: [ApplicantsService], // exported so AuthModule can use it
})
export class ApplicantProfilesModule {}
