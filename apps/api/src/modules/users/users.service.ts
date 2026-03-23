/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ProfileStrengthResponse,
  ProfileStrengthItem,
} from './dto/profile-strength.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface CreateUserPayload {
  email: string;
  passwordHash: string;
  fullName: string;
  role: User['role'];
}

type UpdateUserPayload = Partial<
  Pick<
    User,
    | 'fullName'
    | 'phone'
    | 'avatarUrl'
    | 'bio'
    | 'isProfileComplete'
    | 'isEmailVerified'
    | 'isActive'
    | 'passwordHash'
  >
>;

// ─── Safe select — passwordHash never included ─────────────────────────────────
const SAFE_SELECT: (keyof User)[] = [
  'id',
  'email',
  'role',
  'fullName',
  'phone',
  'avatarUrl',
  'bio',
  'isProfileComplete',
  'isEmailVerified',
  'isActive',
  'createdAt',
  'updatedAt',
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly ds: DataSource,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Find by email (no password) ────────────────────────────────────────────
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
      select: SAFE_SELECT,
    });
  }

  // ── Find by email WITH password (login only) ───────────────────────────────
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  // ── Find by ID (no relations) ──────────────────────────────────────────────
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Find by ID with full profile (login / me / after update) ──────────────
  // Uses leftJoin + select (NOT leftJoinAndSelect + select — that drops the join)
  async findByIdWithFullProfile(id: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.applicantProfile', 'ap')
      .leftJoin('user.companies', 'co')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .select([
        // ── base user — no passwordHash
        ...SAFE_SELECT.map((f) => `user.${f}`),

        // ── applicant profile — all fields the frontend needs
        'ap.id',
        'ap.jobTitle',
        'ap.skills',
        'ap.experienceYears',
        'ap.location',
        'ap.summary',
        'ap.linkedinUrl',
        'ap.githubUrl',
        'ap.portfolioUrl',
        'ap.isOpenToWork',
        'ap.isPublic',
        'ap.educations',
        'ap.experiences',

        // ── company
        'co.id',
        'co.companyName',
        'co.industry',
        'co.location',
        'co.websiteUrl',
        'co.logoUrl',
        'co.about',
        'co.isVerified',
      ])
      .getOne();
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  async create(payload: CreateUserPayload): Promise<User> {
    try {
      const user = this.userRepo.create({
        ...payload,
        email: payload.email.toLowerCase().trim(),
      });
      return await this.userRepo.save(user);
    } catch (err) {
      this.logger.error(
        'Failed to create user',
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  // Uses save() not update() so @BeforeUpdate hooks fire correctly
  async update(userId: string, updates: UpdateUserPayload): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, updates);

    try {
      await this.userRepo.save(user);
    } catch (err) {
      this.logger.error(
        `Failed to update user ${userId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to update user');
    }

    return this.findById(userId);
  }

  // ── Soft delete ─────────────────────────────────────────────────────────────
  async softDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepo.softRemove(user);
  }

  // ── Delete account (called from DELETE /users/me) ──────────────────────────
  async deleteAccount(userId: string): Promise<void> {
    await this.softDelete(userId);
  }

  // ── Deactivate (reversible) ────────────────────────────────────────────────
  async deactivate(userId: string): Promise<void> {
    await this.update(userId, { isActive: false });
  }

  // ── Exists check ───────────────────────────────────────────────────────────
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepo.count({
      where: { email: email.toLowerCase().trim() },
    });
    return count > 0;
  }

  // ── Dashboard stats (role-aware) ───────────────────────────────────────────
  async getDashboardStats(userId: string, role: UserRole) {
    if (role === UserRole.APPLICANT) {
      return this.getApplicantStats(userId);
    }
    return this.getEmployerStats(userId);
  }

  // ── Profile strength ───────────────────────────────────────────────────────
  calculateProfileStrength(user: User): ProfileStrengthResponse {
    const isApplicant = user.role === UserRole.APPLICANT;
    const profile = user.applicantProfile;
    const company = user.companies?.[0];

    const checklist: ProfileStrengthItem[] = isApplicant
      ? [
          { label: 'Full name set', done: !!user.fullName, weight: 10 },
          {
            label: 'Profile photo uploaded',
            done: !!user.avatarUrl,
            weight: 10,
          },
          { label: 'Phone number added', done: !!user.phone, weight: 10 },
          { label: 'Bio written', done: !!user.bio, weight: 10 },
          { label: 'Job title set', done: !!profile?.jobTitle, weight: 15 },
          {
            label: 'Skills added',
            done: !!profile?.skills?.length,
            weight: 15,
          },
          {
            label: 'Experience set',
            done: profile?.experienceYears != null,
            weight: 10,
          },
          { label: 'Location added', done: !!profile?.location, weight: 5 },
          {
            label: 'LinkedIn connected',
            done: !!profile?.linkedinUrl,
            weight: 10,
          },
          { label: 'GitHub connected', done: !!profile?.githubUrl, weight: 5 },
        ]
      : [
          { label: 'Full name set', done: !!user.fullName, weight: 10 },
          {
            label: 'Profile photo uploaded',
            done: !!user.avatarUrl,
            weight: 10,
          },
          { label: 'Phone number added', done: !!user.phone, weight: 10 },
          { label: 'Bio written', done: !!user.bio, weight: 10 },
          {
            label: 'Company name set',
            done: !!company?.companyName,
            weight: 15,
          },
          {
            label: 'Industry specified',
            done: !!company?.industry,
            weight: 15,
          },
          {
            label: 'Company location set',
            done: !!company?.location,
            weight: 10,
          },
          { label: 'Website added', done: !!company?.website, weight: 10 },
          {
            label: 'Company description',
            done: !!company?.description,
            weight: 10,
          },
        ];

    const strength = checklist.reduce(
      (sum, item) => sum + (item.done ? item.weight : 0),
      0,
    );

    return { strength, checklist };
  }

  // ── Private: applicant stats ───────────────────────────────────────────────
  private async getApplicantStats(userId: string) {
    const rows = await this.ds.query(
      `SELECT
         COUNT(*)::int                                                          AS total_applications,
         COUNT(*) FILTER (WHERE a.status::text IN ('reviewing','shortlisted','interview'))::int
                                                                               AS active_applications,
         (SELECT COUNT(*)::int FROM saved_jobs
          WHERE user_id = $1)                                                  AS saved_jobs,
         (SELECT COUNT(*)::int FROM interviews
          WHERE candidate_id = $1 AND status::text = 'upcoming')               AS upcoming_interviews
       FROM applications a
       WHERE a.applicant_id = $1`,
      [userId],
    );
    const r = rows[0];
    return {
      totalApplications: r.total_applications,
      activeApplications: r.active_applications,
      savedJobs: r.saved_jobs,
      upcomingInterviews: r.upcoming_interviews,
    };
  }

  // ── Private: employer stats ────────────────────────────────────────────────
  private async getEmployerStats(userId: string) {
    const rows = await this.ds.query(
      `SELECT
         (SELECT COUNT(*)::int FROM jobs j
          JOIN companies c ON c.id = j.company_id
          WHERE c.owner_id = $1 AND j.status = 'active' AND j.deleted_at IS NULL)   AS active_jobs,

         (SELECT COUNT(*)::int FROM applications a
          JOIN jobs j ON j.id = a.job_id
          JOIN companies c ON c.id = j.company_id
          WHERE c.owner_id = $1)                                                      AS total_applications,

         (SELECT COUNT(*)::int FROM applications a
          JOIN jobs j ON j.id = a.job_id
          JOIN companies c ON c.id = j.company_id
          WHERE c.owner_id = $1 AND a.status = 'new')                                AS new_applications,

         (SELECT COUNT(*)::int FROM interviews i
          JOIN jobs j ON j.id = i.job_id
          JOIN companies c ON c.id = j.company_id
          WHERE c.owner_id = $1 AND i.status = 'upcoming')                           AS upcoming_interviews`,
      [userId],
    );

    const r = rows[0];
    return {
      activeJobs: r.active_jobs,
      totalApplications: r.total_applications,
      newApplications: r.new_applications,
      upcomingInterviews: r.upcoming_interviews,
    };
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────────

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    // Upload new image — if user already has one, overwrite in-place by reusing publicId
    const result = await this.cloudinary.uploadAvatar(
      file.buffer,
      user.avatarPublicId ?? undefined,
    );

    user.avatarUrl = result.url;
    user.avatarPublicId = result.publicId;

    return this.userRepo.save(user);
  }

  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.avatarPublicId) return;

    await this.cloudinary.delete(user.avatarPublicId, 'image');

    user.avatarUrl = '';
    user.avatarPublicId = '';

    await this.userRepo.save(user);
  }
}
