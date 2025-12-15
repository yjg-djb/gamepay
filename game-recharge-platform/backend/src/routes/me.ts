import { Router } from 'express';
import { requireAuthOrDemo } from '../middleware/demoAuth';
import { upsertUserFromAuth } from '../auth/userSync';

export const meRouter = Router();

meRouter.get('/me', requireAuthOrDemo, async (req, res, next) => {
  try {
    const user = await upsertUserFromAuth(req);
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
});












