import { auth as jwtAuth } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const requireAuth = jwtAuth({
  issuerBaseURL: `https://${config.auth0.domain}/`,
  audience: config.auth0.audience,
});

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const perms = (req as any).auth?.payload?.permissions as string[] | undefined;
    if (perms && perms.includes(permission)) return next();
    return res.status(403).json({ error: 'forbidden', message: `Missing permission: ${permission}` });
  };
}













