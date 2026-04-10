/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { User } from '../users/entities/user.entity';
import { UpdateApplicantProfileDto } from './dto/update-profile.dto';
import { SearchApplicantsDto } from './dto/search-applicant.dto';
import { UpdateEducationsDto } from './dto/update-education.dto';
import { UpdateExperiencesDto } from './dto/update-experience.dto';
import { EducationDto } from './dto/education.dto';
import { ExperienceDto } from './dto/experience.dto';

// ✅ Uses exact entity property names — jobTitle not title
type UpsertApplicantData = Partial<{
  jobTitle: string | null;
  experienceYears: number | null;
  skills: string[];
  location: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  isOpenToWork: boolean;
  openToWork: boolean;
  educations: EducationDto[]; // ← new
  experiences: ExperienceDto[]; // ← new
}>;

@Injectable()
export class ApplicantsService {
  private readonly logger = new Logger(ApplicantsService.name);

  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── Upsert — called from auth (complete-profile) and users (PATCH /me) ──────
  async upsert(
    userId: string,
    data: UpsertApplicantData,
  ): Promise<ApplicantProfile> {
    let profile = await this.profileRepo.findOneBy({ userId });

    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    // Only assign keys that were explicitly passed — skip undefined
    for (const key of Object.keys(data) as (keyof UpsertApplicantData)[]) {
      const value = data[key];
      if (value !== undefined) {
        (profile as any)[key] = value;
      }
    }

    try {
      return await this.profileRepo.save(profile);
    } catch (err) {
      this.logger.error(
        `Failed to upsert applicant profile for user ${userId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException(
        'Failed to update applicant profile',
      );
    }
  }

  // ── Get own full profile ────────────────────────────────────────────────────
  async getMyProfile(userId: string): Promise<ApplicantProfile> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Applicant profile not found');
    return profile;
  }

  // ── Get public profile (employer views applicant) ───────────────────────────
  async getPublicProfile(targetUserId: string): Promise<ApplicantProfile> {
    const profile = await this.profileRepo.findOne({
      where: { userId: targetUserId, isPublic: true },
      relations: ['user'],
    });
    if (!profile)
      throw new NotFoundException('Profile not found or is private');
    return profile;
  }

  // ── Update core profile fields ──────────────────────────────────────────────
  async updateProfile(
    userId: string,
    dto: UpdateApplicantProfileDto,
  ): Promise<ApplicantProfile> {
    const profile = await this.ownedOrFail(userId);
    Object.assign(profile, dto);

    try {
      return await this.profileRepo.save(profile);
    } catch (err) {
      this.logger.error(
        `Failed to update profile for user ${userId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  // ── Replace education list (full replace — JSONB column) ────────────────────
  async updateEducations(
    userId: string,
    dto: UpdateEducationsDto,
  ): Promise<ApplicantProfile> {
    const profile = await this.ownedOrFail(userId);
    profile.educations = dto.educations as any;
    return this.profileRepo.save(profile);
  }

  // ── Replace work experience list (full replace — JSONB column) ──────────────
  async updateExperiences(
    userId: string,
    dto: UpdateExperiencesDto,
  ): Promise<ApplicantProfile> {
    const profile = await this.ownedOrFail(userId);
    profile.experiences = dto.experiences as any;
    return this.profileRepo.save(profile);
  }

  // ── Toggle open-to-work ──────────────────────────────────────────────────────
  async toggleOpenToWork(userId: string): Promise<{ isOpenToWork: boolean }> {
    const profile = await this.ownedOrFail(userId);
    profile.isOpenToWork = !profile.isOpenToWork;
    await this.profileRepo.save(profile);
    return { isOpenToWork: profile.isOpenToWork };
  }

  // ── Toggle public visibility ─────────────────────────────────────────────────
  async togglePublic(userId: string): Promise<{ isPublic: boolean }> {
    const profile = await this.ownedOrFail(userId);
    profile.isPublic = !profile.isPublic;
    await this.profileRepo.save(profile);
    return { isPublic: profile.isPublic };
  }

  // ── Employer: search open-to-work applicants ─────────────────────────────────
  async search(dto: SearchApplicantsDto) {
    const { q, skills, location, page = 1, limit = 20 } = dto;

    const qb = this.profileRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.profile_visible = TRUE') // ✅ matches entity column name: isPublic → profile_visible
      .andWhere('p.open_to_work = TRUE'); // ✅ matches entity column name: openToWork → open_to_work

    if (q) {
      qb.andWhere(
        '(u.full_name ILIKE :q OR p.job_title ILIKE :q OR p.summary ILIKE :q)',
        { q: `%${q}%` },
      );
    }
    if (skills?.length) qb.andWhere('p.skills @> :skills', { skills });
    if (location)
      qb.andWhere('p.location ILIKE :location', { location: `%${location}%` });

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Private ──────────────────────────────────────────────────────────────────
  private async ownedOrFail(userId: string): Promise<ApplicantProfile> {
    const profile = await this.profileRepo.findOneBy({ userId });
    if (!profile) throw new NotFoundException('Applicant profile not found');
    return profile;
  }
}
