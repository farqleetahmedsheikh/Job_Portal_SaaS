/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/enums';
import { UpdateEmployerNotesDto } from './dto/update-employer-notes.dto';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { AiMatcherService } from './ai-matcher.service';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly svc: ApplicationsService,
    private readonly matcher: AiMatcherService,
  ) {}

  // ── Applicant ───────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  apply(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.svc.apply(user.sub, dto);
  }

  @Get('mine')
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  getMine(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getMyApplications(user.sub);
  }

  @Get('status')
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  async getApplicationStatus(
    @Query('jobId') jobId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    const applied = await this.svc.hasApplied(user.sub, jobId);
    return { applied };
  }

  @Delete(':id/withdraw')
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.withdraw(id, user.sub);
  }

  // ── Employer ────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  findAll(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('jobId') jobId?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const opts = {
      limit: limit ? Number(limit) : undefined,
      sort: sort as 'recent' | 'match' | undefined,
    };
    return jobId
      ? this.svc.findByJob(jobId, user.sub, opts)
      : this.svc.findAllByEmployer(user.sub, opts); // ← was missing
  }

  @Patch('bulk-status')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  bulkStatus(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: BulkStatusUpdateDto,
  ) {
    return this.svc.bulkChangeStatus(user.sub, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.svc.changeStatus(id, user.sub, dto);
  }

  @Patch(':id/star')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  toggleStar(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.toggleStar(id, user.sub);
  }

  @Patch(':id/notes')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  updateNotes(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployerNotesDto,
  ) {
    return this.svc.updateNotes(id, user.sub, dto);
  }

  @Post(':id/view')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  markViewed(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markViewed(id);
  }

  // POST /api/applications/:id/score  — score one application
  @Post(':id/score')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  async scoreOne(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    const score = await this.matcher.scoreApplication(id, user.sub);
    return { score };
  }

  // POST /api/applications/score-job/:jobId  — score all for a job
  @Post('score-job/:jobId')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async scoreJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    // ✅ Fire and forget — don't await, don't block the response
    this.matcher.scoreAllForJob(jobId, user.sub).catch((err) => {
      // Log but don't surface to user — they already got 202
      console.error('Background scoring failed:', err);
    });
    return {
      message: 'Scoring started. Results will appear as they complete.',
    };
  }

  // ── Shared (last — catches any :id) ─────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }
}
