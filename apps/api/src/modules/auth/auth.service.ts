/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/modules/auth/auth.service.ts
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
import { ApplicantsService } from '../applicants/applicant.service';
import { CompaniesService } from '../companies/companies.service';
// import { MailService } from '../mail/mail.service';
import { CacheService } from '../cache/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  CompleteApplicantProfileDto,
  CompleteEmployerProfileDto,
} from './dto/complete-profile.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  phone: string | null;
  bio: string | null;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: Date | null;
  onboardingRole: UserRole | null;
  applicantProfile: SafeApplicantProfile | null;
  company: SafeCompany | null;
}

export interface SafeApplicantProfile {
  id: string;
  jobTitle: string | null;
  experienceYears: number | null;
  skills: string[];
  location: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  isOpenToWork: boolean;
  isPublic: boolean;
  educations: unknown[];
  experiences: unknown[];
}

export interface SafeCompany {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  isVerified: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_TTL_SECONDS = 5 * 60;
const OTP_CACHE_PREFIX = 'otp:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly applicantProfiles: ApplicantsService,
    private readonly companies: CompaniesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    // private readonly mail: MailService,
    private readonly cache: CacheService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────
  // Collects: fullName, email, password, role
  // isProfileComplete stays false → frontend redirects to /complete-profile
  async register(dto: RegisterDto, res: Response): Promise<SafeUser> {
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR].includes(
        dto.role,
      )
    ) {
      throw new BadRequestException(
        'Admin accounts must be created by a super admin',
      );
    }

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

    const fullUser = await this.users.findByIdWithFullProfile(user.id);
    return this.toSafeUser(fullUser ?? user);
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, res: Response): Promise<SafeUser> {
    const user = await this.users.findByEmailWithPassword(dto.email);

    if (!user) throw new UnauthorizedException('User not found!');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive)
      throw new UnauthorizedException('Account has been deactivated');

    const fullUser = await this.users.findByIdWithFullProfile(user.id);
    if (!fullUser) throw new UnauthorizedException('User not found');

    this.setAuthCookie(res, user.id, user.role);
    return this.toSafeUser(fullUser);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout(res: Response): void {
    res.clearCookie('token', { path: '/' });
  }

  // ── Me ─────────────────────────────────────────────────────────────────────
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.users.findByIdWithFullProfile(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.toSafeUser(user);
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  async sendForgotPasswordOtp(email: string): Promise<{ message: string }> {
    const SAFE_MESSAGE = 'If that email exists, an OTP has been sent';

    const user = await this.users.findByEmail(email);
    if (!user) return { message: SAFE_MESSAGE };

    await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);
    const otp = String(randomInt(100000, 999999));
    await this.cache.set(`${OTP_CACHE_PREFIX}${email}`, otp, OTP_TTL_SECONDS);

    try {
      // await this.mail.sendOtp(email, otp);
    } catch (err) {
      await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);
      this.logger.error(
        `Failed to send OTP email to ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    return { message: SAFE_MESSAGE };
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const stored = await this.cache.get(`${OTP_CACHE_PREFIX}${email}`);
    if (!stored) throw new BadRequestException('OTP expired or not requested');
    if (!this.constantTimeEqual(otp, stored))
      throw new BadRequestException('Invalid OTP');

    await this.cache.del(`${OTP_CACHE_PREFIX}${email}`);
    return { message: 'OTP verified successfully' };
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    await this.verifyOtp(email, otp);

    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const bcryptRounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);
    await this.users.update(user.id, { passwordHash });

    return { message: 'Password reset successfully' };
  }

  // ── Complete applicant profile ─────────────────────────────────────────────
  // Minimal fields collected on /complete-profile page
  // Sets isProfileComplete = true → frontend redirects to dashboard
  async completeApplicantProfile(
    userId: string,
    dto: CompleteApplicantProfileDto,
  ): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // ✅ Use entity field names — jobTitle (not title), all nullable
    await this.applicantProfiles.upsert(userId, {
      jobTitle: dto.jobTitle ?? null,
      experienceYears: dto.experienceYears ?? null,
      skills: dto.skills ?? [],
      location: dto.location ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      githubUrl: dto.githubUrl ?? null,
      summary: dto.summary ?? null,
    });

    await this.users.update(userId, { isProfileComplete: true });

    const fullUser = await this.users.findByIdWithFullProfile(userId);
    if (!fullUser) throw new NotFoundException('User not found');
    return this.toSafeUser(fullUser);
  }

  // ── Complete employer profile ──────────────────────────────────────────────
  // Minimal fields: companyName, industry, location
  // Sets isProfileComplete = true → frontend redirects to dashboard
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
      websiteUrl: dto.website ?? '',
      description: dto.about ?? '',
    });

    await this.users.update(userId, { isProfileComplete: true });

    const fullUser = await this.users.findByIdWithFullProfile(userId);
    if (!fullUser) throw new NotFoundException('User not found');
    return this.toSafeUser(fullUser);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  Private helpers
  // ════════════════════════════════════════════════════════════════════════════

  private setAuthCookie(res: Response, userId: string, role: UserRole): void {
    const payload: JwtPayload = { sub: userId, role };
    const token = this.jwt.sign(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: this.config.get<string>('app.env') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
  }

  private toSafeUser(user: User): SafeUser {
    const ap = user.applicantProfile ?? null;
    const company = user.companies?.[0] ?? null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      isProfileComplete: user.isProfileComplete ?? false,
      isEmailVerified: user.isEmailVerified ?? false,
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      onboardingRole: user.onboardingRole ?? null,

      // ✅ Map entity field names — no invented fields
      applicantProfile: ap
        ? {
            id: ap.id,
            jobTitle: ap.jobTitle ?? null,
            experienceYears: ap.experienceYears ?? null,
            skills: ap.skills ?? [],
            location: ap.location ?? null,
            summary: ap.summary ?? null,
            linkedinUrl: ap.linkedinUrl ?? null,
            githubUrl: ap.githubUrl ?? null,
            portfolioUrl: ap.portfolioUrl ?? null,
            isOpenToWork: ap.isOpenToWork ?? false,
            isPublic: ap.isPublic ?? true,
            educations: ap.educations ?? [],
            experiences: ap.experiences ?? [],
          }
        : null,

      company: company
        ? {
            id: company.id,
            companyName: company.companyName,
            industry: company.industry,
            location: company.location,
            websiteUrl: company.website ?? null,
            logoUrl: company.logoUrl ?? null,
            description: company.description ?? null,
            isVerified: company.isVerified ?? false,
          }
        : null,
    };
  }

  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }
}
