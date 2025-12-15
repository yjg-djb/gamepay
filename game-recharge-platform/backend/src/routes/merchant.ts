import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';
import { resolveMerchantIdForRequest } from '../auth/merchantResolver';

export const merchantRouter = Router();

// Validation schemas
const gameInput = z.object({
  nameZh: z.string().min(1),
  nameJa: z.string().min(1),
  nameEn: z.string().min(1),
  developer: z.string().min(1),
  iconUrl: z.string().min(1),
  bannerUrl: z.string().min(1),
  badge: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  downloads: z.string().min(1).optional(),
});

const skuInput = z.object({
  gameId: z.string().min(1),
  nameZh: z.string().min(1),
  nameJa: z.string().min(1),
  nameEn: z.string().min(1),
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative(),
  bonus: z.string(),
  currency: z.string().min(1),
  limited: z.boolean().optional(),
  imageUrl: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

// Helper to check merchant permissions
async function requireMerchantAccess(req: any, res: any): Promise<string | null> {
  const perms = ((req as any).auth?.payload?.permissions as string[] | undefined) || [];
  if (!perms.includes('admin:all') && !perms.includes('merchant:all')) {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  const merchantId = await resolveMerchantIdForRequest(req);
  if (!merchantId) {
    res.status(403).json({ error: 'forbidden', message: 'No merchant scope' });
    return null;
  }

  // Non-admin merchants must be active.
  const isAdmin = perms.includes('admin:all');
  if (!isAdmin) {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      res.status(403).json({ error: 'forbidden', message: 'Unknown merchant' });
      return null;
    }
    if (merchant.status !== 'ACTIVE') {
      res.status(403).json({ error: 'forbidden', message: 'Merchant is suspended' });
      return null;
    }
  }
  return merchantId;
}

async function requireMerchantGameAccess(req: any, res: any, merchantId: string, gameId: string): Promise<boolean> {
  const perms = ((req as any).auth?.payload?.permissions as string[] | undefined) || [];
  if (perms.includes('admin:all')) return true;
  const link = await prisma.merchantGame.findFirst({ where: { merchantId, gameId, isActive: true } });
  if (!link) {
    res.status(403).json({ error: 'forbidden', message: 'No access to this game' });
    return false;
  }
  return true;
}

// Merchant scoped endpoints (uses token claim merchant_id or MerchantUser mapping)
merchantRouter.get('/merchant/me/orders', requireAuthOrDemo, async (req, res, next) => {
  try {
    const perms = ((req as any).auth?.payload?.permissions as string[] | undefined) || [];
    if (!perms.includes('admin:all') && !perms.includes('merchant:all')) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await upsertUserFromAuth(req);
    const merchantId = await resolveMerchantIdForRequest(req);
    if (!merchantId) return res.status(403).json({ error: 'forbidden', message: 'No merchant scope' });

    const orders = await prisma.order.findMany({
      where: { merchantId },
      include: { user: true, game: true, sku: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ merchantId, orders });
  } catch (e) {
    next(e);
  }
});

merchantRouter.get('/merchant/me/stats', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const perms = ((req as any).auth?.payload?.permissions as string[] | undefined) || [];
    if (!perms.includes('admin:all') && !perms.includes('merchant:all')) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const merchantId = await resolveMerchantIdForRequest(req);
    if (!merchantId) return res.status(403).json({ error: 'forbidden', message: 'No merchant scope' });

    // Get start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [totalOrders, paidOrders, revenueAgg, todayOrders, todayPaidOrders, todayRevenueAgg] = await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.count({ where: { merchantId, status: 'PAID' } }),
      prisma.order.aggregate({
        where: { merchantId, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { merchantId, createdAt: { gte: today } } }),
      prisma.order.count({ where: { merchantId, status: 'PAID', createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { merchantId, status: 'PAID', createdAt: { gte: today } },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      merchantId,
      totalOrders,
      paidOrders,
      totalRevenue: revenueAgg._sum.amount || 0,
      todayOrders,
      todayPaidOrders,
      todayRevenue: todayRevenueAgg._sum.amount || 0,
    });
  } catch (e) {
    next(e);
  }
});

merchantRouter.get('/merchant/me/games', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const perms = ((req as any).auth?.payload?.permissions as string[] | undefined) || [];
    if (!perms.includes('admin:all') && !perms.includes('merchant:all')) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const merchantId = await resolveMerchantIdForRequest(req);
    if (!merchantId) return res.status(403).json({ error: 'forbidden', message: 'No merchant scope' });
    const links = await prisma.merchantGame.findMany({
      where: { merchantId, isActive: true },
      select: { gameId: true },
    });
    const gameIds = links.map((l) => l.gameId);
    const games = await prisma.game.findMany({
      where: {
        OR: [{ id: { in: gameIds } }, { merchantId }],
      },
      include: { skus: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ merchantId, games });
  } catch (e) {
    next(e);
  }
});

// Merchant Game CRUD
merchantRouter.post('/merchant/me/games', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    const data = gameInput.parse(req.body);
    const game = await prisma.$transaction(async (tx) => {
      const created = await tx.game.create({
        data: {
          ...data,
          merchantId,
          rating: data.rating ?? 4.5,
          downloads: data.downloads ?? '0',
        },
        include: { skus: true },
      });
      await tx.merchantGame.upsert({
        where: { merchantId_gameId: { merchantId, gameId: created.id } },
        create: { merchantId, gameId: created.id, isActive: true },
        update: { isActive: true },
      });
      return created;
    });
    res.status(201).json(game);
  } catch (e) {
    next(e);
  }
});

merchantRouter.put('/merchant/me/games/:id', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    const existing = await prisma.game.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Game not found' });
    if (!(await requireMerchantGameAccess(req, res, merchantId, existing.id))) return;

    const data = gameInput.partial().parse(req.body);
    const game = await prisma.game.update({
      where: { id: req.params.id },
      data,
      include: { skus: true },
    });
    res.json(game);
  } catch (e) {
    next(e);
  }
});

merchantRouter.delete('/merchant/me/games/:id', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    const existing = await prisma.game.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Game not found' });
    if (!(await requireMerchantGameAccess(req, res, merchantId, existing.id))) return;

    // If the merchant is the owner, delete the game (affects all merchants). Otherwise, just unbind.
    if (existing.merchantId === merchantId) {
      await prisma.game.delete({ where: { id: req.params.id } });
    } else {
      await prisma.merchantGame.deleteMany({ where: { merchantId, gameId: existing.id } });
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Merchant SKU CRUD
merchantRouter.post('/merchant/me/skus', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    const data = skuInput.parse(req.body);

    const game = await prisma.game.findUnique({ where: { id: data.gameId } });
    if (!game) return res.status(404).json({ error: 'not_found', message: 'Game not found' });
    if (!(await requireMerchantGameAccess(req, res, merchantId, game.id))) return;

    const nextOrder =
      data.sortOrder ??
      (await prisma.sKU.aggregate({
        where: { gameId: game.id },
        _max: { sortOrder: true },
      }))._max.sortOrder ??
      0;

    const sku = await prisma.sKU.create({
      data: { ...data, limited: data.limited ?? false, sortOrder: data.sortOrder ?? nextOrder + 1 },
    });
    res.status(201).json(sku);
  } catch (e) {
    next(e);
  }
});

merchantRouter.put('/merchant/me/skus/:id', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    // Ensure the SKU belongs to a game this merchant can access
    const existing = await prisma.sKU.findUnique({
      where: { id: req.params.id },
      include: { game: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'SKU not found' });
    if (!(await requireMerchantGameAccess(req, res, merchantId, existing.gameId))) return;

    const data = skuInput.partial().parse(req.body);
    // If gameId is being updated, ensure new game also belongs to merchant
    if (data.gameId && data.gameId !== existing.gameId) {
      const newGame = await prisma.game.findUnique({ where: { id: data.gameId } });
      if (!newGame) return res.status(404).json({ error: 'not_found', message: 'Target game not found' });
      if (!(await requireMerchantGameAccess(req, res, merchantId, newGame.id))) return;
    }

    const sku = await prisma.sKU.update({
      where: { id: req.params.id },
      data,
    });
    res.json(sku);
  } catch (e) {
    next(e);
  }
});

merchantRouter.delete('/merchant/me/skus/:id', requireAuthOrDemo, async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const merchantId = await requireMerchantAccess(req, res);
    if (!merchantId) return;

    // Ensure the SKU belongs to a game this merchant can access
    const existing = await prisma.sKU.findUnique({
      where: { id: req.params.id },
      include: { game: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'SKU not found' });
    if (!(await requireMerchantGameAccess(req, res, merchantId, existing.gameId))) return;

    await prisma.sKU.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});


