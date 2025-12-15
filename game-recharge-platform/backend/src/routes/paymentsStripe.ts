import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../db';
import { upsertUserFromAuth } from '../auth/userSync';
import { stripe } from '../payments/stripe';
import { config } from '../config';
import Stripe from 'stripe';

export const stripePaymentsRouter = Router();

const createIntentInput = z.object({
  orderId: z.string().min(1),
});

stripePaymentsRouter.post('/payments/stripe/create-intent', requireAuth, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const { orderId } = createIntentInput.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }

    // Stripe expects smallest currency unit. For JPY, it's already integer.
    const intent = await stripe.paymentIntents.create({
      amount: order.amount,
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { provider: 'STRIPE', providerPaymentId: intent.id },
    });

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (e) {
    next(e);
  }
});

// Stripe webhook: configure endpoint in Stripe dashboard and set STRIPE_WEBHOOK_SECRET
stripePaymentsRouter.post(
  '/webhooks/stripe',
  async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'];
      if (!sig || typeof sig !== 'string') return res.status(400).send('Missing stripe-signature');

      const secret = config.stripe.webhookSecret;
      if (!secret) return res.status(400).send('Missing STRIPE_WEBHOOK_SECRET');

      const event = stripe.webhooks.constructEvent(req.body, sig, secret) as Stripe.Event;

      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = (pi.metadata?.orderId as string | undefined) || undefined;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID', providerPaymentId: pi.id, provider: 'STRIPE' },
          });
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = (pi.metadata?.orderId as string | undefined) || undefined;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'FAILED', providerPaymentId: pi.id, provider: 'STRIPE' },
          });
        }
      }

      res.json({ received: true });
    } catch (e) {
      next(e);
    }
  }
);


