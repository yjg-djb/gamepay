import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripe.secretKey, {
  // SDK 类型尚未包含最新的 API 版本，使用类型断言保持运行时配置。
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});













