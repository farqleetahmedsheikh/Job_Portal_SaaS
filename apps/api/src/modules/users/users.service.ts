// users/users.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ProfileStrengthResponse,
  ProfileStrengthItem,
} from './dto/profile-strength.dto';

// ─── Payload Types ────────────────────────────────────────
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
    | 'phoneNumber'
    | 'profilePicture'
    | 'bio'
    | 'isProfileComplete'
    | 'isEmailVerified'
    | 'isActive'
    | 'passwordHash'
  >
>;

// ─── Safe select — passwordHash never included ────────────
const SAFE_SELECT: (keyof User)[] = [
  'id',
  'email',
  'role',
  'fullName',
  'phoneNumber',
  'profilePicture',
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
  ) {}

  // ── Find by email (no password) ───────────────────────
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
      select: SAFE_SELECT,
    });
  }

  // ── Find by email WITH password (login only) ──────────
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // opt-in to select:false field
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  // ── Find by ID (no relations) ─────────────────────────
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: SAFE_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Find by ID with full profile (login / me) ─────────
  // Loads both applicantProfile and companies in one query.
  // Uses leftJoin + select (NOT leftJoinAndSelect + select — that drops the join)
  async findByIdWithFullProfile(id: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.applicantProfile', 'applicantProfile')
      .leftJoin('user.companies', 'companies')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .select([
        // base user fields — no passwordHash
        ...SAFE_SELECT.map((f) => `user.${f}`),
        // applicant profile fields
        'applicantProfile.id',
        'applicantProfile.jobTitle',
        'applicantProfile.skills',
        'applicantProfile.experienceYears',
        'applicantProfile.location',
        'applicantProfile.linkedinUrl',
        'applicantProfile.githubUrl',
        'applicantProfile.portfolioUrl',
        'applicantProfile.summary',
        // company fields
        'companies.id',
        'companies.companyName',
        'companies.industry',
        'companies.location',
        'companies.website',
        'companies.logoUrl',
        'companies.description',
        'companies.isVerified',
      ])
      .getOne();
  }

  // ── Create ────────────────────────────────────────────
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

  // ── Update ────────────────────────────────────────────
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

  // ── Soft delete ───────────────────────────────────────
  async softDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepo.softRemove(user);
  }

  // ── Deactivate (reversible) ───────────────────────────
  async deactivate(userId: string): Promise<void> {
    await this.update(userId, { isActive: false });
  }

  // ── Exists check (lightweight) ────────────────────────
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepo.count({
      where: { email: email.toLowerCase().trim() },
    });
    return count > 0;
  }

  calculateProfileStrength(user: User): ProfileStrengthResponse {
    const isApplicant = user.role === UserRole.APPLICANT;
    const profile = user.applicantProfile;
    const company = user.companies?.[0];

    const checklist: ProfileStrengthItem[] = isApplicant
      ? [
          { label: 'Full name set', done: !!user.fullName, weight: 10 },
          {
            label: 'Profile photo uploaded',
            done: !!user.profilePicture,
            weight: 10,
          },
          { label: 'Phone number added', done: !!user.phoneNumber, weight: 10 },
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
            done: !!user.profilePicture,
            weight: 10,
          },
          { label: 'Phone number added', done: !!user.phoneNumber, weight: 10 },
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
}
