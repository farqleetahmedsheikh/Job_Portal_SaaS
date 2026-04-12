import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from './entities/subscription.entity';
import { BillingEvent } from './entities/billing-event.entity';
import { AddonPurchase } from './entities/addon-purchase.entity';
import { DailyApplyLimit } from './entities/daily-apply-limit.entity';
import { VerificationDoc } from './entities/verification-doc.entity';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../companies/entities/company.entity';

import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SubscriptionsService } from './subscriptions.service';
import { LimitsService } from './limits.service';
import { VerificationService } from './verification.service';

@Global() // LimitsService needed everywhere
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      BillingEvent,
      AddonPurchase,
      DailyApplyLimit,
      VerificationDoc,
      Job,
      Company,
    ]),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    SubscriptionsService,
    LimitsService,
    VerificationService,
  ],
  exports: [
    LimitsService,
    SubscriptionsService,
    VerificationService,
    BillingService,
  ],
})
export class BillingModule {}
