import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/role.guard';
import { AutomationService } from './automation.service';
import { QueryAutomationLogsDto } from './dto/query-automation-logs.dto';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';

@Controller('automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get('settings')
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.automation.getSettings(user.sub);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAutomationSettingsDto,
  ) {
    return this.automation.updateSettings(user.sub, dto);
  }

  @Get('logs')
  getLogs(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAutomationLogsDto,
  ) {
    return this.automation.getLogs(user.sub, query);
  }
}
