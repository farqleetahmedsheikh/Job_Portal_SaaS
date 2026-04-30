import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/enums';
import {
  CreateAdminUserDto,
  RejectCompanyDto,
  SuggestSupportReplyDto,
  UpdateAdminUserDto,
  UpdateComplaintDto,
} from './dto/admin-actions.dto';
import {
  QueryAdminCompaniesDto,
  QueryAdminUsersDto,
  QueryComplaintsDto,
  QueryLogsDto,
  QueryTransactionsDto,
} from './dto/admin-query.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRoles, AdminRolesGuard } from './guards/admin-role.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.admin.dashboard(user.sub);
  }

  @Post('users/admins')
  @AdminRoles(UserRole.SUPER_ADMIN)
  createAdmin(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.admin.createAdmin(user.sub, dto);
  }

  @Get('users')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  users(@Query() query: QueryAdminUsersDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateUser(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.admin.updateUser(user.sub, user.role as UserRole, id, dto);
  }

  @Get('companies')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  companies(@Query() query: QueryAdminCompaniesDto) {
    return this.admin.listCompanies(query);
  }

  @Patch('companies/:id/verify')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  verifyCompany(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.verifyCompany(user.sub, id);
  }

  @Patch('companies/:id/reject')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  rejectCompany(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectCompanyDto,
  ) {
    return this.admin.rejectCompany(user.sub, id, dto);
  }

  @Get('complaints')
  complaints(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query() query: QueryComplaintsDto,
  ) {
    return this.admin.listComplaints(query, user.sub, user.role as UserRole);
  }

  @Patch('complaints/:id')
  updateComplaint(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.admin.updateComplaint(user.sub, user.role as UserRole, id, dto);
  }

  @Post('ai-support/suggest-reply')
  suggestReply(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: SuggestSupportReplyDto,
  ) {
    return this.admin.suggestSupportReply(user.sub, user.role as UserRole, dto);
  }

  @Get('transactions')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  transactions(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.admin.transactions(query, user.sub);
  }

  @Get('subscriptions')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  subscriptions(@Query() query: QueryTransactionsDto) {
    return this.admin.listSubscriptions(query);
  }

  @Get('logs')
  @AdminRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  logs(@Query() query: QueryLogsDto) {
    return this.admin.logs(query);
  }

  @Get('revenue-insights')
  @AdminRoles(UserRole.SUPER_ADMIN)
  revenueInsights(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.admin.revenueInsights(user.sub);
  }
}
