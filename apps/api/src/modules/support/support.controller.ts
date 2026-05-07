import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  CreateComplaintDto,
  QueryMyComplaintsDto,
  ReportTargetDto,
} from './dto/create-complaint.dto';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('complaints')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  createComplaint(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.support.createComplaint(user.sub, user.role as UserRole, dto);
  }

  @Post('report-job')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reportJob(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: ReportTargetDto,
  ) {
    return this.support.reportJob(user.sub, user.role as UserRole, dto);
  }

  @Post('report-company')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reportCompany(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: ReportTargetDto,
  ) {
    return this.support.reportCompany(user.sub, user.role as UserRole, dto);
  }

  @Post('report-user')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reportUser(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: ReportTargetDto,
  ) {
    return this.support.reportUser(user.sub, user.role as UserRole, dto);
  }

  @Get('complaints/my')
  myComplaints(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query() query: QueryMyComplaintsDto,
  ) {
    return this.support.listMyComplaints(
      user.sub,
      user.role as UserRole,
      query,
    );
  }

  @Get('complaints/:id')
  myComplaint(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.support.getMyComplaint(user.sub, user.role as UserRole, id);
  }
}
