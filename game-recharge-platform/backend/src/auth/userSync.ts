import type { Request } from 'express';
import { prisma } from '../db';
import { UserRole } from '@prisma/client';

export async function upsertUserFromAuth(req: Request) {
  const payload = (req as any).auth?.payload as Record<string, any> | undefined;
  if (!payload?.sub) throw Object.assign(new Error('Missing auth subject'), { status: 401 });

  const sub = String(payload.sub);
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const name = typeof payload.name === 'string' ? payload.name : undefined;

  // If you enable Auth0 RBAC, permissions will be in access token, but roles might not.
  // We infer role from permissions to keep backend consistent.
  const perms = (payload.permissions as string[] | undefined) || [];
  let role: UserRole = UserRole.USER;
  if (perms.includes('admin:all')) role = UserRole.ADMIN;
  else if (perms.includes('merchant:all')) role = UserRole.MERCHANT;

  return prisma.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub, email, name, role },
    update: { email, name, role },
  });
}













