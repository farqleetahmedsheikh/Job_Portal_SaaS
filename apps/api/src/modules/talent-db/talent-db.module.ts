import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { SavedCandidate } from './entities/saved-candidate.entity';
import { TalentDbController } from './talent-db.controller';
import { TalentDbService } from './talent-db.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantProfile,
      Resume,
      Company,
      Application,
      SavedCandidate,
    ]),
  ],
  controllers: [TalentDbController],
  providers: [TalentDbService],
})
export class TalentDbModule {}
