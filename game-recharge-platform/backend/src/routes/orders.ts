import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const ordersRouter = Router();

const createOrderInput = z.object({
  skuId: z.string().min(1),
  merchantId: z.string().min(1).optional(),
});

ordersRouter.get('/orders/me', requireAuthOrDemo, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { game: true, sku: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

ordersRouter.post('/orders', requireAuthOrDemo, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const { skuId, merchantId: requestedMerchantId } = createOrderInput.parse(req.body);
    const sku = await prisma.sKU.findUnique({ where: { id: skuId }, include: { game: true } });
    if (!sku) return res.status(404).json({ error: 'not_found', message: 'SKU not found' });

    // Resolve merchant for this order (supports many-to-many MerchantGame binding)
    let merchantId: string | null = requestedMerchantId || null;

    if (merchantId) {
      const link = await prisma.merchantGame.findFirst({
        where: { merchantId, gameId: sku.gameId, isActive: true },
        include: { merchant: true },
      });
      if (!link) {
        return res.status(403).json({ error: 'forbidden', message: 'Merchant is not bound to this game' });
      }
      if (link.merchant.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'forbidden', message: 'Merchant is suspended' });
      }
    } else {
      // Default: pick the first ACTIVE merchant bound to this game
      const link = await prisma.merchantGame.findFirst({
        where: { gameId: sku.gameId, isActive: true },
        include: { merchant: true },
        orderBy: { createdAt: 'asc' },
      });

      if (link && link.merchant.status === 'ACTIVE') {
        merchantId = link.merchantId;
      } else {
        // Fallback to the game's owner merchant if still active
        const owner = await prisma.merchant.findUnique({ where: { id: sku.game.merchantId } });
        if (!owner || owner.status !== 'ACTIVE') {
          return res.status(400).json({ error: 'no_merchant', message: 'No active merchant available for this game' });
        }
        merchantId = owner.id;
      }
    }

    const visitorId =
      (req as any).auth?.payload?.sub ? String((req as any).auth.payload.sub) : user.auth0Sub || user.id;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        merchantId,
        gameId: sku.gameId,
        skuId: sku.id,
        visitorId,
        amount: sku.price,
        currency: sku.currency,
      },
      include: { game: true, sku: true },
    });

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

// Demo-only: mark an order as paid (for UI demos without Stripe/PayPal keys)
ordersRouter.post('/orders/:id/demo-pay', requireAuthOrDemo, async (req, res, next) => {
  try {
    // Only allow when demo headers are used
    const demoRole = req.header('X-Demo-Role');
    if (!demoRole) return res.status(403).json({ error: 'forbidden', message: 'Demo only' });

    const user = await upsertUserFromAuth(req);
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'not_found' });

    // Keep it simple: allow demo users to only pay their own orders
    if (order.userId !== user.id) return res.status(403).json({ error: 'forbidden' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
      include: { game: true, sku: true },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});












