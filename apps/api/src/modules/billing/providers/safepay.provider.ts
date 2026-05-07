import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderType } from '../../../common/enums/enums';
import {
  PaymentCheckoutRequest,
  PaymentCheckoutResponse,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class SafepayProvider implements PaymentProvider {
  readonly type = PaymentProviderType.SAFEPAY;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('SAFEPAY_API_KEY') &&
      this.config.get<string>('SAFEPAY_MERCHANT_ID'),
    );
  }

  async createCheckout(
    _request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResponse> {
    throw new NotImplementedException(
      'Safepay credentials are configured, but checkout API wiring is not implemented yet.',
    );
  }
}
