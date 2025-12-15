import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const gamesRouter = Router();

const gameInput = z.object({
  merchantId: z.string().min(1),
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

gamesRouter.get('/games', async (_req, res, next) => {
  try {
    const games = await prisma.game.findMany({ include: { skus: true } });
    res.json(games);
  } catch (e) {
    next(e);
  }
});

gamesRouter.get('/games/:id', async (req, res, next) => {
  try {
    const game = await prisma.game.findUnique({ where: { id: req.params.id }, include: { skus: true } });
    if (!game) return res.status(404).json({ error: 'not_found' });
    res.json(game);
  } catch (e) {
    next(e);
  }
});

// Public: merchants bound to a game (for demo multi-merchant checkout)
gamesRouter.get('/games/:id/merchants', async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) return res.status(404).json({ error: 'not_found' });

    const links = await prisma.merchantGame.findMany({
      where: { gameId, isActive: true, merchant: { status: 'ACTIVE' } },
      include: { merchant: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      gameId,
      merchants: links.map((l) => ({
        id: l.merchant.id,
        name: l.merchant.name,
        email: l.merchant.email,
        status: l.merchant.status,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// Admin CRUD
gamesRouter.post('/admin/games', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = gameInput.parse(req.body);
    const game = await prisma.game.create({ data });
    res.status(201).json(game);
  } catch (e) {
    next(e);
  }
});

gamesRouter.put('/admin/games/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = gameInput.partial().parse(req.body);
    const game = await prisma.game.update({ where: { id: req.params.id }, data });
    res.json(game);
  } catch (e) {
    next(e);
  }
});

gamesRouter.delete('/admin/games/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    await prisma.game.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});


