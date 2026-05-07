import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderType } from '../../../common/enums/enums';
import {
  PaymentCheckoutRequest,
  PaymentCheckoutResponse,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly type = PaymentProviderType.STRIPE;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('STRIPE_SECRET_KEY'));
  }

  async createCheckout(
    _request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResponse> {
    throw new NotImplementedException(
      'Stripe credentials are configured, but checkout API wiring is not implemented yet.',
    );
  }
}
