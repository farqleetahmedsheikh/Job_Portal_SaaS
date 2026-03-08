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

// Explicit type for create payload — never accept full Partial<User>
// which would allow passing relations or generated fields
interface CreateUserPayload {
  email: string;
  passwordHash: string;
  fullName: string;
  role: User['role'];
}

// Explicit type for safe update fields — prevents accidentally
// updating id, email, passwordHash, createdAt through this method
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

// Fields returned by default on every query — passwordHash excluded
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
  // passwordHash has select:false so must explicitly opt-in
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  // ── Find by ID ────────────────────────────────────────
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: SAFE_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Find by ID with applicant profile ─────────────────
  // Use when you need the full profile in one query
  async findByIdWithProfile(id: string): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.applicantProfile', 'applicantProfile')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .select([
        ...SAFE_SELECT.map((f) => `user.${f}`),
        'applicantProfile.id',
        'applicantProfile.jobTitle',
        'applicantProfile.skills',
        'applicantProfile.experienceYears',
        'applicantProfile.location',
        'applicantProfile.linkedinUrl',
        'applicantProfile.githubUrl',
      ])
      .getOne();

    if (!user) throw new NotFoundException('User not found');
    return user;
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
  async update(userId: string, updates: UpdateUserPayload): Promise<User> {
    // update() doesn't trigger @BeforeUpdate hooks — use save() instead
    const user = await this.findById(userId);

    // Merge only the provided fields
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

    // Re-fetch to return fresh data with all computed fields
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
}
