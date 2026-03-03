import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { CreateApplicantProfileDto } from './dto/applicant.dto';

@Injectable()
export class ApplicantProfileService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private repo: Repository<ApplicantProfile>,
    private usersService: UsersService,
  ) {}

  async upsertProfile(userId: string, dto: CreateApplicantProfileDto) {
    await this.repo.save({
      userId,
      ...dto,
    });

    await this.usersService.markProfileCompleted(userId);

    return { success: true };
  }
}
