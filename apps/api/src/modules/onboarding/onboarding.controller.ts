import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  getStatus(@CurrentUser() user: JwtPayload) {
    return this.onboarding.getStatus(user.sub, user.role);
  }

  @Patch('complete')
  complete(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.onboarding.complete(user.sub, user.role, dto);
  }
}
