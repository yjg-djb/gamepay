import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requirePermission } from '../middleware/auth';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const merchantApplyRouter = Router();

const applicationInput = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  description: z.string().min(10).max(2000),
});

// User submits a merchant application
merchantApplyRouter.post('/merchant/apply', requireAuthOrDemo, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    const data = applicationInput.parse(req.body);

    // Check if user already has a pending application
    const existingPending = await prisma.merchantApplication.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existingPending) {
      return res.status(400).json({
        error: 'duplicate',
        message: 'You already have a pending application',
      });
    }

    // Check if user is already a merchant
    const existingMerchant = await prisma.merchantUser.findFirst({
      where: { userId: user.id },
    });
    if (existingMerchant) {
      return res.status(400).json({
        error: 'already_merchant',
        message: 'You are already a merchant',
      });
    }

    const application = await prisma.merchantApplication.create({
      data: {
        userId: user.id,
        ...data,
      },
    });

    res.status(201).json(application);
  } catch (e) {
    next(e);
  }
});

// User checks their application status
merchantApplyRouter.get('/merchant/apply/status', requireAuthOrDemo, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);

    const applications = await prisma.merchantApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (e) {
    next(e);
  }
});

// Admin: List all applications (with optional status filter)
merchantApplyRouter.get('/admin/merchant-applications', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const where = status ? { status: status as any } : {};

    const applications = await prisma.merchantApplication.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (e) {
    next(e);
  }
});

// Admin: Approve an application
merchantApplyRouter.post('/admin/merchant-applications/:id/approve', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body || {};

    const application = await prisma.merchantApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return res.status(404).json({ error: 'not_found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        error: 'invalid_status',
        message: 'Application is not pending',
      });
    }

    // Create merchant and link user
    const result = await prisma.$transaction(async (tx) => {
      // Create merchant
      const merchant = await tx.merchant.create({
        data: {
          name: application.companyName,
        },
      });

      // Link user to merchant
      await tx.merchantUser.create({
        data: {
          merchantId: merchant.id,
          userId: application.userId,
        },
      });

      // Update user role to MERCHANT
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'MERCHANT' },
      });

      // Update application status
      const updatedApp = await tx.merchantApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewNote: reviewNote || null,
        },
      });

      return { merchant, application: updatedApp };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Admin: Reject an application
merchantApplyRouter.post('/admin/merchant-applications/:id/reject', requireAuthOrDemo, requirePermission('admin:all'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body || {};

    const application = await prisma.merchantApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: 'not_found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        error: 'invalid_status',
        message: 'Application is not pending',
      });
    }

    const updatedApp = await prisma.merchantApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: reviewNote || 'Application rejected',
      },
    });

    res.json(updatedApp);
  } catch (e) {
    next(e);
  }
});







