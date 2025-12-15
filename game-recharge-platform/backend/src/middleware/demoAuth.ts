import type { Request, Response, NextFunction } from 'express';
import { requireAuth as jwtRequireAuth } from './auth';

type DemoRole = 'admin' | 'merchant' | 'user';

function getHeader(req: Request, name: string): string | undefined {
  const v = req.header(name);
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function parseDemoRole(req: Request): DemoRole | undefined {
  const raw = (getHeader(req, 'X-Demo-Role') || '').toLowerCase();
  if (raw === 'admin' || raw === 'merchant' || raw === 'user') return raw;
  return undefined;
}

/**
 * Demo auth:
 * - Use `X-Demo-Role: admin|merchant|user`
 * - Optional `X-Demo-Merchant-Id: <merchantId>` for merchant context
 * - Populates `req.auth.payload` so existing permission middleware continues to work.
 */
export function requireAuthOrDemo(req: Request, res: Response, next: NextFunction) {
  const role = parseDemoRole(req);
  if (!role) {
    // Fall back to real JWT auth (Auth0) if demo headers aren't present.
    return (jwtRequireAuth as any)(req, res, next);
  }

  const merchantId = getHeader(req, 'X-Demo-Merchant-Id') || 'merchant_demo';
  const permissions =
    role === 'admin' ? ['admin:all'] : role === 'merchant' ? ['merchant:all'] : [];

  const sub = role === 'merchant' ? `demo|merchant|${merchantId}` : `demo|${role}`;

  (req as any).auth = {
    payload: {
      sub,
      permissions,
      ...(role === 'merchant' ? { merchant_id: merchantId } : {}),
      // Provide some basic identity fields for convenience (optional)
      email: role === 'admin' ? 'admin@demo.local' : role === 'merchant' ? `${merchantId}@demo.local` : 'user@demo.local',
      name: role === 'admin' ? 'Demo Admin' : role === 'merchant' ? `Demo Merchant (${merchantId})` : 'Demo User',
    },
  };

  return next();
}



