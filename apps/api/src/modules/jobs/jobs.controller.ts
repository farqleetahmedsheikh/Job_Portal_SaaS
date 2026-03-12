import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { JobStatus, UserRole } from '../../common/enums/enums';
import { JobsService } from './jobs.service';
import { QueryJobsDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ChangeJobStatusDto } from './dto/change-job-status.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ── Public ─────────────────────────────────────────────────────────────────
  // GET /api/jobs/mine  — employer's own job listings
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  getMyJobs(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('status') status?: JobStatus,
  ) {
    return this.jobsService.findMyJobs(user.sub, status);
  }

  // POST /api/jobs
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  create(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(user.sub, dto);
  }

  // GET /api/jobs?q=&location=&type=&page=
  @Get()
  browse(@Query() query: QueryJobsDto) {
    return this.jobsService.findAll(query);
  }

  // GET /api/jobs/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  // ── Employer ────────────────────────────────────────────────────────────────

  // PATCH /api/jobs/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.sub, dto);
  }

  // PATCH /api/jobs/:id/status
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: ChangeJobStatusDto,
  ) {
    return this.jobsService.changeStatus(id, user.sub, dto);
  }

  // POST /api/jobs/:id/duplicate
  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.duplicate(id, user.sub);
  }

  // DELETE /api/jobs/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.remove(id, user.sub);
  }

  // GET /api/jobs/:id/applicants  — employer views applicant pipeline
  @Get(':id/applicants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  getApplicants(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.getApplicants(id, user.sub);
  }

  // ── Saved jobs (applicant) ──────────────────────────────────────────────────
  // GET /api/jobs/saved
  @Get('saved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.APPLICANT)
  getSaved(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.getSavedJobs(user.sub);
  }

  // POST /api/jobs/:id/save
  @Post(':id/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.APPLICANT)
  saveJob(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.saveJob(user.sub, id);
  }

  // DELETE /api/jobs/:id/save
  @Delete(':id/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  unsaveJob(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.jobsService.unsaveJob(user.sub, id);
  }
}
