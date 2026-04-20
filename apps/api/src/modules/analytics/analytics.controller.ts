import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import { UserRole } from '../../common/enums/enums';
import * as cu from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('employer')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  getEmployer(
    @cu.CurrentUser() user: cu.JwtPayload,
    @Query('range') range: '7d' | '30d' | '90d' = '30d',
  ) {
    return this.svc.getEmployerAnalytics(user.sub, range);
  }
}
