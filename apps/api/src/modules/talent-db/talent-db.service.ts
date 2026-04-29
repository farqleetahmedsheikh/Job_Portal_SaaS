import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { Company } from '../companies/entities/company.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { LimitsService } from '../billing/limits.service';
import { PLAN_LIMITS } from '../../config/plan-limits.config';
import { SubscriptionPlan, UserRole } from '../../common/enums/enums';
import {
  QueryTalentDbDto,
  TalentExperienceLevel,
} from './dto/query-talent-db.dto';
import { SavedCandidate } from './entities/saved-candidate.entity';

type TalentResume = {
  id: string;
  name: string;
  fileUrl?: string;
  isDefault: boolean;
  createdAt: Date;
};

type TalentCandidate = {
  userId: string;
  fullName: string;
  email: string | null;
  avatar: string | null;
  headline: string | null;
  skills: string[];
  experienceSummary: string | null;
  experienceLevel: TalentExperienceLevel;
  experienceYears: number | null;
  location: string | null;
  profileCompleteness: number;
  lastActiveAt: Date | null;
  createdAt: Date;
  github: string | null;
  linkedin: string | null;
  isOpenToWork: boolean;
  isSaved: boolean;
  isLocked: boolean;
  contactAllowed: boolean;
  resume: TalentResume | null;
  resumes?: TalentResume[];
  education?: unknown[];
  experience?: unknown[];
  contact?: {
    email: string | null;
    phone: string | null;
  } | null;
};

@Injectable()
export class TalentDbService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Resume)
    private readonly resumeRepo: Repository<Resume>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(SavedCandidate)
    private readonly savedRepo: Repository<SavedCandidate>,
    private readonly limits: LimitsService,
  ) {}

  async search(userId: string, dto: QueryTalentDbDto) {
    const access = await this.getAccess(userId);
    const page = Math.max(1, dto.page ?? 1);
    const requestedLimit = Math.min(20, Math.max(1, dto.limit ?? 12));
    const limit = access.hasTalentDb
      ? requestedLimit
      : Math.min(requestedLimit, 10);

    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('profile.profile_visible = TRUE')
      .andWhere('user.role = :role', { role: UserRole.APPLICANT })
      .andWhere('user.is_active = TRUE')
      .andWhere('user.deleted_at IS NULL');

    this.applyFilters(qb, dto);

    const [profiles, total] = await qb
      .orderBy('user.last_active_at', 'DESC', 'NULLS LAST')
      .addOrderBy('profile.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const userIds = profiles.map((profile) => profile.userId);
    const [resumeMap, savedIds] = await Promise.all([
      this.defaultResumeMap(userIds),
      this.savedCandidateIds(access.companyId, userIds),
    ]);

    return {
      data: profiles.map((profile, index) =>
        this.serializeCandidate(profile, {
          resume: resumeMap.get(profile.userId) ?? null,
          isSaved: savedIds.has(profile.userId),
          hasTalentDb: access.hasTalentDb,
          contactAllowed: false,
          locked: !access.hasTalentDb || index >= limit,
          includeDetail: false,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        hasTalentDb: access.hasTalentDb,
        locked: !access.hasTalentDb,
        requiredPlan: access.hasTalentDb ? null : SubscriptionPlan.GROWTH,
      },
    };
  }

  async detail(userId: string, candidateId: string) {
    const access = await this.getAccess(userId);
    const profile = await this.profileRepo.findOne({
      where: { userId: candidateId, isPublic: true },
      relations: ['user'],
    });

    if (!profile || profile.user?.role !== UserRole.APPLICANT) {
      throw new NotFoundException('Candidate not found');
    }

    const appliedToCompany = await this.hasAppliedToCompany(
      access.companyId,
      candidateId,
    );
    if (!access.hasTalentDb && !appliedToCompany) {
      throw new ForbiddenException({
        message: 'Upgrade required',
        code: 'UPGRADE_REQUIRED',
        feature: 'talent_db',
        requiredPlan: SubscriptionPlan.GROWTH,
      });
    }

    const [resumes, savedIds] = await Promise.all([
      this.resumeRepo.find({
        where: { userId: candidateId },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      }),
      this.savedCandidateIds(access.companyId, [candidateId]),
    ]);

    const contactAllowed =
      access.hasTalentDb ||
      appliedToCompany ||
      profile.showEmail ||
      profile.showPhone;

    return this.serializeCandidate(profile, {
      resume: resumes[0]
        ? this.serializeResume(resumes[0], contactAllowed)
        : null,
      resumes: resumes.map((resume) =>
        this.serializeResume(resume, contactAllowed),
      ),
      isSaved: savedIds.has(candidateId),
      hasTalentDb: access.hasTalentDb,
      contactAllowed,
      locked: false,
      includeDetail: true,
    });
  }

  async save(userId: string, candidateId: string) {
    const access = await this.getAccess(userId);
    await this.limits.requireFeature(userId, 'hasTalentDb');

    const candidate = await this.profileRepo.findOne({
      where: { userId: candidateId, isPublic: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const saved = this.savedRepo.create({
      companyId: access.companyId,
      candidateId,
    });
    await this.savedRepo
      .createQueryBuilder()
      .insert()
      .into(SavedCandidate)
      .values(saved)
      .orIgnore()
      .execute();

    return { saved: true };
  }

  async unsave(userId: string, candidateId: string) {
    const access = await this.getAccess(userId);
    await this.savedRepo.delete({ companyId: access.companyId, candidateId });
    return { saved: false };
  }

  async saved(userId: string, dto: QueryTalentDbDto) {
    const access = await this.getAccess(userId);
    await this.limits.requireFeature(userId, 'hasTalentDb');
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(20, Math.max(1, dto.limit ?? 12));

    const [savedRows, total] = await this.savedRepo.findAndCount({
      where: { companyId: access.companyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const ids = savedRows.map((row) => row.candidateId);
    if (!ids.length) {
      return {
        data: [],
        meta: { page, limit, total, hasTalentDb: true, locked: false },
      };
    }

    const profiles = await this.profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('profile.user_id IN (:...ids)', { ids })
      .andWhere('profile.profile_visible = TRUE')
      .getMany();
    const resumeMap = await this.defaultResumeMap(ids);
    const savedIds = new Set(ids);

    return {
      data: profiles.map((profile) =>
        this.serializeCandidate(profile, {
          resume: resumeMap.get(profile.userId) ?? null,
          isSaved: savedIds.has(profile.userId),
          hasTalentDb: true,
          contactAllowed: false,
          locked: false,
          includeDetail: false,
        }),
      ),
      meta: { page, limit, total, hasTalentDb: true, locked: false },
    };
  }

  private async getAccess(userId: string) {
    const [plan, company] = await Promise.all([
      this.limits.getActivePlan(userId),
      this.companyRepo.findOne({ where: { ownerId: userId }, select: ['id'] }),
    ]);

    if (!company) {
      throw new ForbiddenException(
        'Create a company profile before using talent database',
      );
    }

    return {
      plan,
      companyId: company.id,
      hasTalentDb: PLAN_LIMITS[plan].hasTalentDb,
    };
  }

  private applyFilters(
    qb: ReturnType<Repository<ApplicantProfile>['createQueryBuilder']>,
    dto: QueryTalentDbDto,
  ) {
    if (dto.search) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('user.full_name ILIKE :search', {
              search: `%${dto.search}%`,
            })
            .orWhere('profile.job_title ILIKE :search', {
              search: `%${dto.search}%`,
            })
            .orWhere('profile.summary ILIKE :search', {
              search: `%${dto.search}%`,
            })
            .orWhere('profile.skills::text ILIKE :search', {
              search: `%${dto.search}%`,
            });
        }),
      );
    }

    if (dto.location) {
      qb.andWhere('profile.location ILIKE :location', {
        location: `%${dto.location}%`,
      });
    }

    if (dto.skills?.length) {
      qb.andWhere('profile.skills && :skills', { skills: dto.skills });
    }

    if (dto.experienceLevel) {
      const [min, max] = this.experienceRange(dto.experienceLevel);
      if (max === null) {
        qb.andWhere('profile.experience_years >= :minExp', { minExp: min });
      } else {
        qb.andWhere(
          '(profile.experience_years >= :minExp AND profile.experience_years <= :maxExp)',
          { minExp: min, maxExp: max },
        );
      }
    }
  }

  private experienceRange(
    level: TalentExperienceLevel,
  ): [number, number | null] {
    if (level === TalentExperienceLevel.JUNIOR) return [0, 2];
    if (level === TalentExperienceLevel.MID) return [3, 5];
    return [6, null];
  }

  private async defaultResumeMap(userIds: string[]) {
    const map = new Map<string, TalentResume>();
    if (!userIds.length) return map;
    const resumes = await this.resumeRepo.find({
      where: userIds.map((userId) => ({ userId })),
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    for (const resume of resumes) {
      if (!map.has(resume.userId)) {
        map.set(resume.userId, this.serializeResume(resume, false));
      }
    }
    return map;
  }

  private async savedCandidateIds(companyId: string, candidateIds: string[]) {
    if (!candidateIds.length) return new Set<string>();
    const rows = await this.savedRepo
      .createQueryBuilder('saved')
      .select('saved.candidate_id', 'candidateId')
      .where('saved.company_id = :companyId', { companyId })
      .andWhere('saved.candidate_id IN (:...candidateIds)', { candidateIds })
      .getRawMany<{ candidateId: string }>();
    return new Set(rows.map((row) => row.candidateId));
  }

  private async hasAppliedToCompany(companyId: string, candidateId: string) {
    const count = await this.applicationRepo
      .createQueryBuilder('application')
      .innerJoin('application.job', 'job')
      .where('application.applicant_id = :candidateId', { candidateId })
      .andWhere('job.company_id = :companyId', { companyId })
      .getCount();
    return count > 0;
  }

  private serializeCandidate(
    profile: ApplicantProfile,
    options: {
      resume: TalentResume | null;
      resumes?: TalentResume[];
      isSaved: boolean;
      hasTalentDb: boolean;
      contactAllowed: boolean;
      locked: boolean;
      includeDetail: boolean;
    },
  ): TalentCandidate {
    const user = profile.user as User;
    const contactAllowed = options.contactAllowed || options.hasTalentDb;
    const fullName = options.locked
      ? this.maskName(user.fullName)
      : user.fullName;

    return {
      userId: profile.userId,
      fullName,
      email: contactAllowed && profile.showEmail ? user.email : null,
      avatar: user.avatarUrl ?? null,
      headline: profile.jobTitle ?? null,
      skills: profile.skills ?? [],
      experienceSummary: this.experienceSummary(profile),
      experienceLevel: this.experienceLevelFromYears(profile.experienceYears),
      experienceYears: profile.experienceYears ?? null,
      location: profile.location ?? null,
      profileCompleteness: this.profileCompleteness(profile, user),
      lastActiveAt: profile.activityVisible
        ? (user.lastActiveAt ?? null)
        : null,
      createdAt: user.createdAt,
      github: options.locked ? null : (profile.githubUrl ?? null),
      linkedin: options.locked ? null : (profile.linkedinUrl ?? null),
      isOpenToWork: profile.openToWork || profile.isOpenToWork,
      isSaved: options.isSaved,
      isLocked: options.locked,
      contactAllowed,
      resume: options.resume,
      resumes: options.includeDetail ? (options.resumes ?? []) : undefined,
      education: options.includeDetail ? profile.educations : undefined,
      experience: options.includeDetail ? profile.experiences : undefined,
      contact: options.includeDetail
        ? {
            email: contactAllowed && profile.showEmail ? user.email : null,
            phone:
              contactAllowed && profile.showPhone ? (user.phone ?? null) : null,
          }
        : undefined,
    };
  }

  private serializeResume(resume: Resume, includeUrl: boolean): TalentResume {
    return {
      id: resume.id,
      name: resume.name,
      fileUrl: includeUrl ? resume.fileUrl : undefined,
      isDefault: resume.isDefault,
      createdAt: resume.createdAt,
    };
  }

  private experienceSummary(profile: ApplicantProfile) {
    const current = profile.experiences?.find((item) => item.isCurrent);
    if (current?.title && current.company) {
      return `${current.title} at ${current.company}`;
    }
    if (
      profile.experienceYears !== null &&
      profile.experienceYears !== undefined
    ) {
      return `${profile.experienceYears} years experience`;
    }
    return profile.summary ?? null;
  }

  private profileCompleteness(profile: ApplicantProfile, user: User) {
    const checks = [
      Boolean(user.fullName),
      Boolean(profile.jobTitle),
      Boolean(profile.summary),
      Boolean(profile.location),
      Boolean(profile.skills?.length),
      Boolean(profile.experiences?.length),
      Boolean(profile.educations?.length),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private experienceLevelFromYears(
    years?: number | null,
  ): TalentExperienceLevel {
    if (years === null || years === undefined || years <= 2) {
      return TalentExperienceLevel.JUNIOR;
    }
    if (years <= 5) return TalentExperienceLevel.MID;
    return TalentExperienceLevel.SENIOR;
  }

  private maskName(name: string) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return 'Candidate';
    return `${parts[0]} ${parts[1]?.[0] ?? ''}.`.trim();
  }
}
