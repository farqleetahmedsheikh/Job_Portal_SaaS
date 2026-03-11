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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { InterviewStatus, UserRole } from '../../common/enums/enums';
import { InterviewsService } from './interviews.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { CompleteInterviewDto } from './dto/complete-interview.dto';
import { CancelInterviewDto } from './dto/cancel-interview.dto';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly svc: InterviewsService) {}

  // ── Employer ────────────────────────────────────────────────────────────────

  // GET /api/interviews?status=upcoming
  @Get()
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  findForEmployer(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('status') status?: InterviewStatus,
  ) {
    return this.svc.findForEmployer(user.sub, status);
  }

  // POST /api/interviews
  @Post()
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  schedule(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: ScheduleInterviewDto,
  ) {
    return this.svc.schedule(user.sub, dto);
  }

  // PATCH /api/interviews/:id/reschedule
  @Patch(':id/reschedule')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: RescheduleInterviewDto,
  ) {
    return this.svc.reschedule(id, user.sub, dto);
  }

  // PATCH /api/interviews/:id/complete
  @Patch(':id/complete')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CompleteInterviewDto,
  ) {
    return this.svc.complete(id, user.sub, dto);
  }

  // DELETE /api/interviews/:id  (cancel)
  @Delete(':id')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CancelInterviewDto,
  ) {
    return this.svc.cancel(id, user.sub, dto);
  }

  // ── Applicant ───────────────────────────────────────────────────────────────

  // GET /api/interviews/mine
  @Get('mine')
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  findMine(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('status') status?: InterviewStatus,
  ) {
    return this.svc.findForApplicant(user.sub, status);
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  // GET /api/interviews/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }
}
