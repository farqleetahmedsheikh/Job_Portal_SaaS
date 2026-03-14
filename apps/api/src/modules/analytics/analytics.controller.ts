/** @format */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService, DateRange } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { UserRole } from 'src/common/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  // GET /api/analytics/employer?range=30d
  @Get('employer')
  getEmployerAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('range') range: string = '30d',
  ) {
    const validRanges: DateRange[] = ['7d', '30d', '90d', '12m'];
    const r = validRanges.includes(range as DateRange)
      ? (range as DateRange)
      : '30d';

    return this.svc.getEmployerAnalytics(user.sub, r);
  }
}
