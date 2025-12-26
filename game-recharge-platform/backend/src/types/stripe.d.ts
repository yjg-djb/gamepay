import 'stripe';

declare module 'stripe' {
  namespace Stripe {
    interface StripeConfig {
      apiVersion?: LatestApiVersion | '2024-06-20';
    }
  }
}
