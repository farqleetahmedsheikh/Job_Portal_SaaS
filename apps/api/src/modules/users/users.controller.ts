/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { ApplicantsService } from '../applicants/applicant.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly applicantProfiles: ApplicantsService,
  ) {}

  // ── GET /api/users/me ───────────────────────────────────────────────────────
  // Full user object with relations (applicantProfile or company)
  @Get('me')
  async getMe(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.users.findByIdWithFullProfile(currentUser.sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── PATCH /api/users/me ─────────────────────────────────────────────────────
  // Updates user table fields + applicant profile fields in one call
  @Patch('me')
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: UpdateUserProfileDto,
  ) {
    const { sub: userId, role } = currentUser;

    // 1 — Always update base user fields
    await this.users.update(userId, {
      fullName: dto.fullName,
      phone: dto.phone,
      bio: dto.bio,
    });

    // 2 — Update applicant profile fields if role matches
    if (role === UserRole.APPLICANT) {
      await this.applicantProfiles.upsert(userId, {
        jobTitle: dto.jobTitle,
        experienceYears: dto.experienceYears,
        skills: dto.skills,
        location: dto.location,
        linkedinUrl: dto.linkedinUrl,
        githubUrl: dto.githubUrl,
        summary: dto.summary,
        isOpenToWork: dto.isOpenToWork,
      });
    }

    // 3 — Return full updated user with relations
    const fullUser = await this.users.findByIdWithFullProfile(userId);
    if (!fullUser) throw new NotFoundException('User not found');
    return fullUser;
  }

  // ── GET /api/users/profile-strength ────────────────────────────────────────
  @Get('profile-strength')
  async getProfileStrength(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.users.findByIdWithFullProfile(currentUser.sub);
    if (!user) throw new NotFoundException('User not found');
    return this.users.calculateProfileStrength(user);
  }

  // ── GET /api/users/dashboard-stats ─────────────────────────────────────────
  // Role-aware: returns different stats for applicant vs employer
  @Get('dashboard-stats')
  async getDashboardStats(@CurrentUser() currentUser: JwtPayload) {
    return this.users.getDashboardStats(currentUser.sub, currentUser.role);
  }

  // ── DELETE /api/users/me ────────────────────────────────────────────────────
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() currentUser: JwtPayload) {
    await this.users.deleteAccount(currentUser.sub);
  }
}
