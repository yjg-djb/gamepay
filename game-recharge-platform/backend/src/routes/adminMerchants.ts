import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const adminMerchantsRouter = Router();

const merchantCreateInput = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  gameIds: z.array(z.string().min(1)).optional(),
});

const merchantUpdateInput = merchantCreateInput
  .omit({ gameIds: true })
  .partial()
  .extend({ name: z.string().min(1).max(200).optional() });

adminMerchantsRouter.get('/admin/merchants', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);

    const [merchants, totalOrdersAgg, paidAgg] = await Promise.all([
      prisma.merchant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          merchantGames: { where: { isActive: true }, select: { gameId: true } },
        },
      }),
      prisma.order.groupBy({
        by: ['merchantId'],
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ['merchantId'],
        where: { status: 'PAID' },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const totalMap = new Map<string, number>(totalOrdersAgg.map((g) => [g.merchantId, g._count._all]));
    const paidMap = new Map<string, { paidOrders: number; revenue: number }>(
      paidAgg.map((g) => [g.merchantId, { paidOrders: g._count._all, revenue: g._sum.amount || 0 }])
    );

    res.json({
      merchants: merchants.map((m) => {
        const paid = paidMap.get(m.id) || { paidOrders: 0, revenue: 0 };
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          status: m.status,
          createdAt: m.createdAt,
          gamesCount: m.merchantGames.length,
          gameIds: m.merchantGames.map((mg) => mg.gameId),
          totalOrders: totalMap.get(m.id) || 0,
          paidOrders: paid.paidOrders,
          totalRevenue: paid.revenue,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

adminMerchantsRouter.post('/admin/merchants', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = merchantCreateInput.parse(req.body);

    const created = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          name: data.name,
          email: data.email,
          status: (data.status as any) || 'ACTIVE',
        },
      });

      if (data.gameIds && data.gameIds.length > 0) {
        await tx.merchantGame.createMany({
          data: data.gameIds.map((gameId) => ({ merchantId: merchant.id, gameId, isActive: true })),
          skipDuplicates: true,
        });
      }

      return merchant;
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

adminMerchantsRouter.put('/admin/merchants/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = merchantUpdateInput.parse(req.body);

    const existing = await prisma.merchant.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const updated = await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

const setMerchantGamesInput = z.object({
  gameIds: z.array(z.string().min(1)),
});

adminMerchantsRouter.put(
  '/admin/merchants/:id/games',
  requireAuthOrDemo,
  requirePermission('admin:all'),
  async (req, res, next) => {
    try {
      await upsertUserFromAuth(req);
      const { gameIds } = setMerchantGamesInput.parse(req.body);

      const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
      if (!merchant) return res.status(404).json({ error: 'not_found' });

      await prisma.$transaction(async (tx) => {
        await tx.merchantGame.deleteMany({ where: { merchantId: merchant.id } });
        if (gameIds.length > 0) {
          await tx.merchantGame.createMany({
            data: gameIds.map((gameId) => ({ merchantId: merchant.id, gameId, isActive: true })),
            skipDuplicates: true,
          });
        }
      });

      res.json({ ok: true, merchantId: merchant.id, gameIds });
    } catch (e) {
      next(e);
    }
  }
);



