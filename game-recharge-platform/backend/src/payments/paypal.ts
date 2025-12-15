import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { config } from '../config';

function environment() {
  if (config.paypal.env === 'live') {
    return new checkoutNodeJssdk.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret);
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);
}

export const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment());

export { checkoutNodeJssdk };













