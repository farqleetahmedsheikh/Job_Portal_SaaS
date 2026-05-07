import {
  BillingInterval,
  CountryCode,
  CurrencyCode,
  PaymentProviderType,
  SubscriptionPlan,
  AddonType,
} from '../../../common/enums/enums';

export interface PaymentCheckoutRequest {
  userId: string;
  amountMinor: number;
  currency: CurrencyCode;
  country: CountryCode;
  plan?: SubscriptionPlan;
  addonType?: AddonType;
  jobId?: string;
  billingInterval?: BillingInterval;
}

export interface PaymentCheckoutResponse {
  checkoutUrl: string;
  provider: PaymentProviderType;
}

export interface PaymentProvider {
  readonly type: PaymentProviderType;
  isConfigured(): boolean;
  createCheckout(
    request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResponse>;
}
