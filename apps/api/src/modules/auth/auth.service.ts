// auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Response } from 'express';

import { UsersService } from '../users/users.service';
import { ApplicantProfilesService } from '../applicants/applicant-profile.service';
import { CompaniesService } from '../companies/companies.service';
import { MailService } from '../mail/mail.service';
import { CacheService } from '../cache/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  CompleteApplicantProfileDto,
  CompleteEmployerProfileDto,
} from './dto/complete-profile.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';

// ─── Types ────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isProfileComplete: boolean;
}

// ─── Constants ────────────────────────────────────────────
const OTP_TTL_SECONDS = 5 * 60;
const OTP_CACHE_PREFIX = 'otp:';
const DUMMY_HASH =
  '$2b$12$dummyhashusedtopreventimusertimingattacksonloginendpoint';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly applicantProfiles: ApplicantProfilesService,
    private readonly companies: CompaniesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly cache: CacheService,
  ) {}

  // ── Register ──────────────────────────────────────────────
  async register(dto: RegisterDto, res: Response): Promise<SafeUser> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const bcryptRounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);

    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      fullName: dto.fullName,
    });

    this.setAuthCookie(res, user.id, user.role);
    return this.toSafeUser(user);
  }

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto, res: Response): Promise<SafeUser> {
    // passwordHash has select:false — must explicitly select it for login only
    const user = await this.users.findByEmailWithPassword(dto.email);

    // Always run compare — prevents timing attacks that reveal valid emails
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    this.setAuthCookie(res, user.id, user.role);
    return this.toSafeUser(user);
  }

  // ── Logout ────────────────────────────────────────────────
  logout(res: Response): void {
    res.clearCookie('token', { path: '/' });
  }

  // ── Me ────────────────────────────────────────────────────
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.toSafeUser(user);
  }

  // ── Forgot password ───────────────────────────────────────
  async sendForgotPasswordOtp(email: string): Promise<{ message: string }> {
    // Always return same message — never reveal if email exists
    const SAFE_MESSAGE = 'If that email exists, an OTP has been sent';

    const user = await this.users.findByEmail(email);
    if (!user) return { message: SAFE_MESSAGE };

    // Invalidate previous OTP before issuing new one
    await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);

    const otp = String(randomInt(100000, 999999));
    await this.cache.set(`${OTP_CACHE_PREFIX}${email}`, otp, OTP_TTL_SECONDS);

    try {
      await this.mail.sendOtp(email, otp);
    } catch (err) {
      // Clean up OTP if mail fails — don't leave a dangling cache entry
      await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);
      this.logger.error(
        `Failed to send OTP email to ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    return { message: SAFE_MESSAGE };
  }

  // ── Verify OTP ────────────────────────────────────────────
  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const stored = await this.cache.get(`${OTP_CACHE_PREFIX}${email}`);

    if (!stored) {
      throw new BadRequestException('OTP expired or not requested');
    }

    // Constant-time comparison — prevents timing attacks on OTP value
    if (!this.constantTimeEqual(otp, stored)) {
      throw new BadRequestException('Invalid OTP');
    }

    // Consume immediately — one use only
    await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);

    return { message: 'OTP verified successfully' };
  }

  // ── Reset password ────────────────────────────────────────
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // verifyOtp consumes the OTP — no double-use possible
    await this.verifyOtp(email, otp);

    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const bcryptRounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);

    await this.users.update(user.id, { passwordHash });

    return { message: 'Password reset successfully' };
  }

  // ── Complete applicant profile ────────────────────────────
  // Writes to applicant_profiles table — not the users table
  async completeApplicantProfile(
    userId: string,
    dto: CompleteApplicantProfileDto,
  ): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Upsert profile — safe to call multiple times
    await this.applicantProfiles.upsert(userId, {
      jobTitle: dto.jobTitle ?? null,
      experienceYears: dto.experienceYears ?? null,
      skills: dto.skills ?? null,
      location: dto.location ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      githubUrl: dto.githubUrl ?? null,
    });

    // Only flag on user row — no profile-specific data here
    const updated = await this.users.update(userId, {
      isProfileComplete: true,
    });

    return this.toSafeUser(updated);
  }

  // ── Complete employer profile ─────────────────────────────
  // Creates a company record — employer profile IS their company
  async completeEmployerProfile(
    userId: string,
    dto: CompleteEmployerProfileDto,
  ): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.companies.create(userId, {
      companyName: dto.companyName,
      location: dto.location,
      industry: dto.industry,
      website: dto.website ?? null,
      description: dto.description ?? null,
    });

    const updated = await this.users.update(userId, {
      isProfileComplete: true,
    });

    return this.toSafeUser(updated);
  }

  // ════════════════════════════════════════════════════════
  //  Private helpers
  // ════════════════════════════════════════════════════════

  private setAuthCookie(res: Response, userId: string, role: UserRole): void {
    const payload: JwtPayload = { sub: userId, role };
    const token = this.jwt.sign(payload); // expiry comes from module config

    res.cookie('token', token, {
      httpOnly: true,
      secure: this.config.get<string>('app.env') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.profilePicture ?? null,
      isProfileComplete: user.isProfileComplete ?? false,
    };
  }

  // Timing-safe string comparison — prevents timing attacks on OTP
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }
}
