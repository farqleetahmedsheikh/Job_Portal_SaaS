import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';

interface UpsertApplicantProfilePayload {
  jobTitle?: string | null;
  experienceYears?: number | null;
  skills?: string[] | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  summary?: string | null;
}

@Injectable()
export class ApplicantProfilesService {
  private readonly logger = new Logger(ApplicantProfilesService.name);

  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
  ) {}

  // ── Find by userId ─────────────────────────────────────
  async findByUserId(userId: string): Promise<ApplicantProfile | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }

  async findByUserIdOrFail(userId: string): Promise<ApplicantProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile) throw new NotFoundException('Applicant profile not found');
    return profile;
  }

  // ── Upsert — safe to call on create and update ─────────
  async upsert(
    userId: string,
    payload: UpsertApplicantProfilePayload,
  ): Promise<ApplicantProfile> {
    try {
      let profile = await this.findByUserId(userId);

      if (profile) {
        // Update existing
        Object.assign(profile, payload);
      } else {
        // Create new
        profile = this.profileRepo.create({ userId, ...payload });
      }

      return await this.profileRepo.save(profile);
    } catch (err) {
      this.logger.error(
        `Failed to upsert applicant profile for user ${userId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException(
        'Failed to save applicant profile',
      );
    }
  }

  // ── Delete ─────────────────────────────────────────────
  async delete(userId: string): Promise<void> {
    await this.profileRepo.delete({ userId });
  }
}
