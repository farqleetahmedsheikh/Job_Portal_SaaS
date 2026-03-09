import {
  Controller,
  Get,
  UseGuards,
  NotFoundException,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service'; // ← import type
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { ApplicantProfilesService } from '../applicants/applicant-profiles.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly applicantProfiles: ApplicantProfilesService,
  ) {}

  @Get('profile-strength') // ← removed :id param — using JWT sub directly
  async getProfileStrength(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.users.findByIdWithFullProfile(currentUser.sub);
    if (!user) throw new NotFoundException('User not found');
    return this.users.calculateProfileStrength(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: UpdateUserProfileDto,
  ) {
    const { sub: userId, role } = currentUser;

    // 1 — Always update user table fields
    await this.users.update(userId, {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      bio: dto.bio,
    });

    // 2 — Update applicant profile if role matches
    if (role === UserRole.APPLICANT) {
      await this.applicantProfiles.upsert(userId, {
        jobTitle: dto.jobTitle,
        experienceYears: dto.experienceYears,
        skills: dto.skills,
        location: dto.location,
        linkedinUrl: dto.linkedinUrl,
        githubUrl: dto.githubUrl,
      });
    }

    // 3 — Return full updated user with relations
    const fullUser = await this.users.findByIdWithFullProfile(userId);
    if (!fullUser) throw new NotFoundException('User not found');
    return fullUser;
  }
}
