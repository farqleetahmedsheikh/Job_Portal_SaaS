/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { BillingEvent } from './entities/billing-event.entity';
import { AddonPurchase } from './entities/addon-purchase.entity';
import { Subscription } from './entities/subscription.entity';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';

import {
  BillingEventType,
  AddonType,
  BillingInterval,
  SubscriptionPlan,
  JobStatus,
  CountryCode,
  CurrencyCode,
  PaymentProviderType,
} from '../../common/enums/enums';
import {
  ADDON_PRICES,
  PLAN_LIMITS,
  getPlanPrice,
} from '../../config/plan-limits.config';
import { SubscriptionsService } from './subscriptions.service';
import { VerificationService } from './verification.service';
import { LimitsService } from './limits.service';
import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  currencyForCountry,
} from '../../common/region/defaults';
import { SafepayProvider } from './providers/safepay.provider';
import { StripeProvider } from './providers/stripe.provider';
import { ManualPaymentProvider } from './providers/manual.provider';
import { PaymentProvider } from './providers/payment-provider.interface';

interface BillingPaymentContext {
  country: CountryCode;
  currency: CurrencyCode;
  provider: PaymentProvider;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingEvent)
    private readonly eventRepo: Repository<BillingEvent>,
    @InjectRepository(AddonPurchase)
    private readonly addonRepo: Repository<AddonPurchase>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
    private readonly subscriptions: SubscriptionsService,
    private readonly verification: VerificationService,
    private readonly limits: LimitsService,
    private readonly safepay: SafepayProvider,
    private readonly stripe: StripeProvider,
    private readonly manual: ManualPaymentProvider,
  ) {}

  // ── Create checkout session ──────────────────────────────────────────────
  async createCheckout(
    userId: string,
    plan: SubscriptionPlan,
    billingInterval: BillingInterval = BillingInterval.MONTHLY,
  ): Promise<{ checkoutUrl: string; provider: PaymentProviderType }> {
    const context = await this.resolvePaymentContext(userId);
    this.assertProviderConfigured(context);

    const amount = getPlanPrice(plan, billingInterval) * 100;
    this.logger.log(
      `Checkout requested for user ${userId} plan ${plan} interval ${billingInterval} amount ${amount} ${context.currency} via ${context.provider.type}`,
    );

    return context.provider.createCheckout({
      userId,
      amountMinor: amount,
      currency: context.currency,
      country: context.country,
      plan,
      billingInterval,
    });
  }

  // ── Purchase addon ────────────────────────────────────────────────────────
  async createAddonCheckout(
    userId: string,
    type: AddonType,
    jobId?: string,
  ): Promise<{ checkoutUrl: string; provider: PaymentProviderType }> {
    const context = await this.resolvePaymentContext(userId);
    this.assertProviderConfigured(context);

    const amount = ADDON_PRICES[type] * 100;
    this.logger.log(
      `Addon checkout requested for user ${userId} type ${type} job ${jobId ?? 'none'} amount ${amount} ${context.currency} via ${context.provider.type}`,
    );

    return context.provider.createCheckout({
      userId,
      amountMinor: amount,
      currency: context.currency,
      country: context.country,
      addonType: type,
      jobId,
    });
  }

  // ── Safepay webhook handler ───────────────────────────────────────────────
  async handleSafepayWebhook(body: any, signature: string): Promise<void> {
    this.verifySafepaySignature(body, signature);
    if (!signature) throw new BadRequestException('Missing webhook signature');

    switch (body.type) {
      case 'payment.success':
        await this.onPaymentSuccess(body.data);
        break;

      case 'subscription.renewed':
        await this.onSubscriptionRenewed(body.data);
        break;

      case 'subscription.cancelled':
        await this.onSubscriptionCancelled(body.data);
        break;

      case 'payment.failed':
        await this.subscriptions.markPastDue(body.data.subscription_id);
        break;

      default:
        this.logger.warn(`Unhandled webhook type: ${body.type}`);
    }

    // Always persist raw event — immutable audit log
    await this.eventRepo.save(
      this.eventRepo.create({
        userId: body.data?.metadata?.userId,
        type: BillingEventType.SUBSCRIPTION_CHARGE,
        amount: (body.data?.amount ?? 0) / 100,
        currency: body.data?.currency ?? 'PKR',
        gatewayPaymentId: body.data?.payment_id,
        meta: body,
      }),
    );
  }

  // ── Apply addon after payment confirmed ───────────────────────────────────
  async applyAddon(
    userId: string,
    type: AddonType,
    jobId?: string,
    gatewayPaymentId?: string,
  ): Promise<void> {
    switch (type) {
      case AddonType.EXTRA_POST:
        await this.subRepo.increment({ userId }, 'jobPostsRemaining', 1);
        break;

      case AddonType.BOOST_CAP:
        if (!jobId)
          throw new BadRequestException('jobId required for cap boost');
        await this.jobRepo.increment({ id: jobId }, 'applicantCap', 25);
        await this.jobRepo.update(
          { id: jobId, status: JobStatus.CLOSED },
          { status: JobStatus.ACTIVE, capReachedAt: undefined },
        );
        break;

      case AddonType.FEATURE_JOB:
        if (!jobId) throw new BadRequestException('jobId required to feature');
        await this.jobRepo.update(jobId, {
          isFeatured: true,
          featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        break;
    }

    await this.addonRepo.save(
      this.addonRepo.create({
        userId,
        jobId,
        type,
        amount: ADDON_PRICES[type],
        currency: 'PKR',
        gatewayPaymentId,
        appliedAt: new Date(),
      }),
    );
  }

  // ── Billing history ───────────────────────────────────────────────────────
  async getBillingHistory(userId: string): Promise<BillingEvent[]> {
    return this.eventRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getCapabilities(userId: string) {
    const sub = await this.subscriptions.getOrCreate(userId);
    const payment = await this.getPaymentOptions(userId);
    const limits = PLAN_LIMITS[sub.plan];
    const interviewUsage = await this.limits.getInterviewUsage(userId);

    return {
      plan: sub.plan,
      status: sub.status,
      billingInterval: sub.billingInterval,
      currency: payment.currency,
      paymentProvider: payment.provider,
      trialEndAt: sub.trialEndAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      limits: this.serializeLimits(limits),
      usage: {
        interviews: interviewUsage,
        jobPostsRemaining: sub.jobPostsRemaining,
        featuredSlotsRemaining: sub.featuredSlotsRemaining,
      },
    };
  }

  async getPaymentOptions(userId: string) {
    const context = await this.resolvePaymentContext(userId);
    const configured = context.provider.isConfigured();
    return {
      country: context.country,
      currency: context.currency,
      provider: context.provider.type,
      configured,
      checkoutAvailable: false,
      message: configured
        ? `${context.provider.type} is configured, but live checkout wiring still needs provider-specific implementation.`
        : this.providerUnavailableMessage(context),
    };
  }

  private serializeLimits(limits: (typeof PLAN_LIMITS)[SubscriptionPlan]) {
    return Object.fromEntries(
      Object.entries(limits).map(([key, value]) => [
        key,
        value === Infinity ? 'unlimited' : value,
      ]),
    );
  }

  // ── Private: webhook handlers ─────────────────────────────────────────────
  private async onPaymentSuccess(data: any): Promise<void> {
    const { userId, plan, addonType, jobId, billingInterval } =
      data.metadata ?? {};

    if (addonType) {
      await this.applyAddon(userId, addonType, jobId, data.payment_id);
      return;
    }

    if (plan) {
      await this.subscriptions.activate(
        userId,
        plan,
        data.subscription_id,
        data.customer_id,
        billingInterval,
      );
    }
  }

  private async onSubscriptionRenewed(data: any): Promise<void> {
    const sub = await this.subscriptions.findByGatewayId(data.subscription_id);
    if (!sub) return;
    await this.subscriptions.resetMonthlyQuotas(sub.userId);
  }

  private async onSubscriptionCancelled(data: any): Promise<void> {
    const sub = await this.subscriptions.findByGatewayId(data.subscription_id);
    if (!sub) return;
    await this.subscriptions.downgradeToFree(sub.userId);
    await this.verification.lapse(sub.userId);
  }

  private verifySafepaySignature(body: any, signature: string): void {
    const secret = this.config.get<string>('SAFEPAY_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('SAFEPAY_WEBHOOK_SECRET is not configured');
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expected !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async resolvePaymentContext(
    userId: string,
  ): Promise<BillingPaymentContext> {
    const [sub, user, company] = await Promise.all([
      this.subscriptions.getOrCreate(userId),
      this.userRepo.findOne({ where: { id: userId } }),
      this.companyRepo.findOne({ where: { ownerId: userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    const country = company?.country ?? user.country ?? DEFAULT_COUNTRY;
    const expectedCurrency = currencyForCountry(country);
    const currency =
      sub.currency && sub.currency !== DEFAULT_CURRENCY
        ? sub.currency
        : expectedCurrency;

    if (sub.currency !== currency) {
      sub.currency = currency;
      await this.subRepo.save(sub);
    }

    return {
      country,
      currency,
      provider: this.selectProvider(country, currency),
    };
  }

  private selectProvider(
    country: CountryCode,
    currency: CurrencyCode,
  ): PaymentProvider {
    if (country === CountryCode.PK && currency === CurrencyCode.PKR) {
      return this.safepay;
    }
    if (currency === CurrencyCode.USD) return this.stripe;
    return this.manual;
  }

  private assertProviderConfigured(context: BillingPaymentContext): void {
    if (context.provider.isConfigured()) return;
    throw new ServiceUnavailableException(
      this.providerUnavailableMessage(context),
    );
  }

  private providerUnavailableMessage(context: BillingPaymentContext): string {
    if (context.provider.type === PaymentProviderType.SAFEPAY) {
      return `Payment provider not configured for ${context.country}/${context.currency}. Missing: ${this.missingSafepayConfig().join(', ')}`;
    }
    if (context.provider.type === PaymentProviderType.STRIPE) {
      return `Payment provider not configured for ${context.country}/${context.currency}. Missing: STRIPE_SECRET_KEY`;
    }
    return `Payment provider not configured for ${context.country}/${context.currency}.`;
  }

  private missingSafepayConfig(): string[] {
    const configEntries: Array<[string, string | undefined]> = [
      ['SAFEPAY_API_KEY', this.config.get<string>('SAFEPAY_API_KEY')],
      ['SAFEPAY_MERCHANT_ID', this.config.get<string>('SAFEPAY_MERCHANT_ID')],
    ];

    return configEntries.filter(([, value]) => !value).map(([key]) => key);
  }
}
