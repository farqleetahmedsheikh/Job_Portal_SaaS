import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from './entities/subscription.entity';
import { BillingEvent } from './entities/billing-event.entity';
import { AddonPurchase } from './entities/addon-purchase.entity';
import { DailyApplyLimit } from './entities/daily-apply-limit.entity';
import { VerificationDoc } from './entities/verification-doc.entity';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';

import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SubscriptionsService } from './subscriptions.service';
import { LimitsService } from './limits.service';
import { VerificationService } from './verification.service';
import { Interview } from '../interviews/entities/interview.entity';
import { BillingCron } from './billing.cron';
import { SafepayProvider } from './providers/safepay.provider';
import { StripeProvider } from './providers/stripe.provider';
import { ManualPaymentProvider } from './providers/manual.provider';

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
      User,
      Interview,
    ]),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    SubscriptionsService,
    LimitsService,
    VerificationService,
    BillingCron,
    SafepayProvider,
    StripeProvider,
    ManualPaymentProvider,
  ],
  exports: [
    LimitsService,
    SubscriptionsService,
    VerificationService,
    BillingService,
  ],
})
export class BillingModule {}
