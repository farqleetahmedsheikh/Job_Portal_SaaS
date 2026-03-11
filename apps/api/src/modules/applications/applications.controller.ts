/* eslint-disable @typescript-eslint/no-unused-vars */
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

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  // ── Applicant ───────────────────────────────────────────────────────────────

  // POST /api/applications
  @Post()
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  apply(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.svc.apply(user.sub, dto);
  }

  // GET /api/applications/mine
  @Get('mine')
  @Roles(UserRole.APPLICANT)
  @UseGuards(RolesGuard)
  getMine(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getMyApplications(user.sub);
  }

  // DELETE /api/applications/:id/withdraw
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

  // ── Shared ──────────────────────────────────────────────────────────────────

  // GET /api/applications/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    // Service-level ownership check not done here — both employer + applicant
    // can view their own; service returns the full object, caller decides rendering
    return this.svc.findOne(id);
  }

  // ── Employer ────────────────────────────────────────────────────────────────

  // PATCH /api/applications/:id/status
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

  // PATCH /api/applications/bulk-status
  @Patch('bulk-status')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  bulkStatus(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: BulkStatusUpdateDto,
  ) {
    return this.svc.bulkChangeStatus(user.sub, dto);
  }

  // PATCH /api/applications/:id/star
  @Patch(':id/star')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  toggleStar(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.toggleStar(id);
  }

  // PATCH /api/applications/:id/notes
  @Patch(':id/notes')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployerNotesDto,
  ) {
    return this.svc.updateNotes(id, dto);
  }

  // POST /api/applications/:id/view
  @Post(':id/view')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  markViewed(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markViewed(id);
  }
}
