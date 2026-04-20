import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/role.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  SubscriptionPlan,
  AddonType,
} from '../../common/enums/enums';
import { BillingService } from './billing.service';
import { SubscriptionsService } from './subscriptions.service';
import { VerificationService } from './verification.service';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly subscriptions: SubscriptionsService,
    private readonly verification: VerificationService,
  ) {}

  // GET /api/billing/subscription
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  getSubscription(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.subscriptions.getOrCreate(user.sub);
  }

  // POST /api/billing/checkout/:plan
  @Post('checkout/:plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  createCheckout(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Param('plan') plan: SubscriptionPlan,
  ) {
    return this.billing.createCheckout(user.sub, plan);
  }

  // POST /api/billing/addon
  @Post('addon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  createAddonCheckout(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() body: { type: AddonType; jobId?: string },
  ) {
    return this.billing.createAddonCheckout(user.sub, body.type, body.jobId);
  }

  // GET /api/billing/history
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getBillingHistory(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.billing.getBillingHistory(user.sub);
  }

  // POST /api/billing/verification/submit
  @Post('verification/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  submitVerification(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body()
    body: {
      businessRegNumber: string;
      websiteUrl?: string;
      officialEmail: string;
      docUrl?: string;
    },
  ) {
    return this.verification.submitVerification(user.sub, body);
  }

  // GET /api/billing/verification/status
  @Get('verification/status')
  @UseGuards(JwtAuthGuard)
  getVerificationStatus(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.verification.getStatus(user.sub);
  }

  // POST /api/billing/webhooks/safepay  — no auth, verified by signature
  @Post('webhooks/safepay')
  @HttpCode(HttpStatus.OK)
  safepayWebhook(
    @Body() body: any,
    @Headers('x-safepay-signature') signature: string,
  ) {
    // ✅ Reject immediately with 400 not 500
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }
    return this.billing.handleSafepayWebhook(body, signature);
  }
}
