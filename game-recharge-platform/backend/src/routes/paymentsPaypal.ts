import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { upsertUserFromAuth } from '../auth/userSync';
import { prisma } from '../db';
import { paypalClient, checkoutNodeJssdk } from '../payments/paypal';

export const paypalPaymentsRouter = Router();

const createPaypalOrderInput = z.object({
  orderId: z.string().min(1),
});

paypalPaymentsRouter.post('/payments/paypal/create-order', requireAuth, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const { orderId } = createPaypalOrderInput.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          amount: {
            currency_code: order.currency,
            value: (order.amount / 100).toFixed(2), // for non-JPY currencies
          },
        },
      ],
    });

    // For JPY (no decimals), PayPal expects integer string
    if (order.currency.toUpperCase() === 'JPY') {
      (request as any).body.purchase_units[0].amount.value = String(order.amount);
    }

    const response = await paypalClient.execute(request);
    const paypalOrderId = response.result.id as string;

    await prisma.order.update({
      where: { id: order.id },
      data: { provider: 'PAYPAL', providerPaymentId: paypalOrderId },
    });

    res.json({ paypalOrderId });
  } catch (e) {
    next(e);
  }
});

const captureInput = z.object({
  orderId: z.string().min(1),
  paypalOrderId: z.string().min(1),
});

paypalPaymentsRouter.post('/payments/paypal/capture-order', requireAuth, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const { orderId, paypalOrderId } = captureInput.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    const response = await paypalClient.execute(request);

    const status = response.result.status as string;
    if (status === 'COMPLETED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
    }

    res.json({ status, paypal: response.result });
  } catch (e) {
    next(e);
  }
});













