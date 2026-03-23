/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApplicantsService } from './applicant.service';
import { SearchApplicantsDto } from './dto/search-applicant.dto';
import { UpdateEducationsDto } from './dto/update-education.dto';
import { UpdateExperiencesDto } from './dto/update-experience.dto';
import { UpdateApplicantProfileDto } from './dto/update-profile.dto';

@Controller('applicants')
@UseGuards(JwtAuthGuard)
export class ApplicantsController {
  constructor(private readonly service: ApplicantsService) {}

  // ── Employer: search open-to-work profiles ─────────────────────────────────
  // GET /api/applicants?q=&skills[]=react&experienceLevel=3-5&page=1
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  search(@Query() dto: SearchApplicantsDto) {
    return this.service.search(dto);
  }

  // ── Applicant: own profile ─────────────────────────────────────────────────
  // GET /api/applicants/me
  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  getMyProfile(@Req() req: any) {
    return this.service.getMyProfile(req.user.userId);
  }

  // PATCH /api/applicants/me
  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  updateProfile(@Req() req: any, @Body() dto: UpdateApplicantProfileDto) {
    return this.service.updateProfile(req.user.userId, dto);
  }

  // PATCH /api/applicants/me/educations
  @Patch('me/educations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  updateEducations(@Req() req: any, @Body() dto: UpdateEducationsDto) {
    return this.service.updateEducations(req.user.userId, dto);
  }

  // PATCH /api/applicants/me/experiences
  @Patch('me/experiences')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  updateExperiences(@Req() req: any, @Body() dto: UpdateExperiencesDto) {
    return this.service.updateExperiences(req.user.userId, dto);
  }

  // PATCH /api/applicants/me/open-to-work  — toggle
  @Patch('me/open-to-work')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  toggleOpenToWork(@Req() req: any) {
    return this.service.toggleOpenToWork(req.user.userId);
  }

  // PATCH /api/applicants/me/visibility  — toggle public/private
  @Patch('me/visibility')
  @UseGuards(RolesGuard)
  @Roles(UserRole.APPLICANT)
  togglePublic(@Req() req: any) {
    return this.service.togglePublic(req.user.userId);
  }

  // ── Public / Employer: view someone's profile ──────────────────────────────
  // GET /api/applicants/:userId
  @Get(':userId')
  getPublicProfile(@Param('userId') userId: string) {
    return this.service.getPublicProfile(userId);
  }
}
