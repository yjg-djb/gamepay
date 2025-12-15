import type { Request } from 'express';
import { prisma } from '../db';
import { config } from '../config';

export async function resolveMerchantIdForRequest(req: Request): Promise<string | null> {
  const payload = (req as any).auth?.payload as Record<string, any> | undefined;
  if (!payload?.sub) return null;

  const ns = config.auth0.namespace || '';
  const direct = payload['merchant_id'] || (ns ? payload[`${ns}/merchant_id`] : undefined);
  if (typeof direct === 'string' && direct.length > 0) return direct;

  const user = await prisma.user.findUnique({ where: { auth0Sub: String(payload.sub) } });
  if (!user) return null;

  const link = await prisma.merchantUser.findFirst({ where: { userId: user.id } });
  return link?.merchantId || null;
}













