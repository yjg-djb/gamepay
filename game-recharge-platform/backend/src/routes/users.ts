import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const usersRouter = Router();

// Admin: Get all users
usersRouter.get('/admin/users', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            merchants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      users: users.map((u) => ({
        ...u,
        ordersCount: u._count.orders,
        merchantsCount: u._count.merchants,
        _count: undefined,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// Admin: Get single user
usersRouter.get('/admin/users/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          select: { id: true, amount: true, currency: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        merchants: {
          include: {
            merchant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
});

// Admin: Update user role
const updateUserRoleInput = z.object({
  role: z.enum(['USER', 'ADMIN', 'MERCHANT']),
});

usersRouter.put('/admin/users/:id/role', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);

    const { role } = updateUserRoleInput.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'not_found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Admin: Delete user
usersRouter.delete('/admin/users/:id', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    await upsertUserFromAuth(req);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Prevent self-deletion
    const authUser = (req as any).auth?.payload?.sub;
    if (user.auth0Sub === authUser) {
      return res.status(400).json({ error: 'cannot_delete_self', message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});







