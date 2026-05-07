import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentProviderType } from '../../../common/enums/enums';
import {
  PaymentCheckoutRequest,
  PaymentCheckoutResponse,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
  readonly type = PaymentProviderType.MANUAL;

  isConfigured(): boolean {
    return false;
  }

  async createCheckout(
    _request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResponse> {
    throw new NotImplementedException(
      'Manual payment workflow is not enabled yet. Please contact support.',
    );
  }
}
