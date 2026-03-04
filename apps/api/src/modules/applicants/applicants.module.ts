import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicantProfile])],
  exports: [TypeOrmModule],
})
export class ApplicantsModule {}
