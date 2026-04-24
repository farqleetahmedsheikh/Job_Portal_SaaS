import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import { UserRole } from '../../common/enums/enums';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

// ── Valid range values ────────────────────────────────────────────────────────
const VALID_RANGES = ['7d', '30d', '90d'] as const;
type DateRange = (typeof VALID_RANGES)[number];

// ── Controller ────────────────────────────────────────────────────────────────
// FIX: both guards co-located at the controller level so every route
//      inherits auth + role checks automatically — no per-method gaps.
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('employer')
  @Roles(UserRole.EMPLOYER)
  getEmployer(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    // FIX: validate range at the controller boundary before it ever
    //      reaches the service. An empty string, missing param, or
    //      any unknown value is rejected with a clear 400 — not silently
    //      coerced to 30d by the service ternary.
    @Query('range') rawRange: string = '30d',
  ) {
    const range = this.parseRange(rawRange);
    return this.analyticsService.getEmployerAnalytics(user.sub, range);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private parseRange(value: string): DateRange {
    const trimmed = value.trim() as DateRange;

    if (!VALID_RANGES.includes(trimmed)) {
      throw new BadRequestException(
        `Invalid range "${value}". Allowed values: ${VALID_RANGES.join(', ')}.`,
      );
    }

    return trimmed;
  }
}
