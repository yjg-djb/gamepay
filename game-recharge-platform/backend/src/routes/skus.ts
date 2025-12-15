import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const skusRouter = Router();

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

skusRouter.get('/games/:gameId/skus', async (req, res, next) => {
  try {
    const skus = await prisma.sKU.findMany({ where: { gameId: req.params.gameId } });
    res.json(skus);
  } catch (e) {
    next(e);
  }
});

// Admin CRUD
skusRouter.post('/admin/skus', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = skuInput.parse(req.body);
    const nextOrder =
      data.sortOrder ??
      (await prisma.sKU.aggregate({
        where: { gameId: data.gameId },
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

skusRouter.put('/admin/skus/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    const data = skuInput.partial().parse(req.body);
    const sku = await prisma.sKU.update({ where: { id: req.params.id }, data });
    res.json(sku);
  } catch (e) {
    next(e);
  }
});

skusRouter.delete('/admin/skus/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);
    await prisma.sKU.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});











