export type AppRole = 'user' | 'admin' | 'merchant';

export interface AppClaims {
  roles: string[];
  permissions: string[];
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  if (typeof value === 'string') return [value];
  return [];
}

/**
 * Extract roles/permissions from Auth0 token claims.
 * Supports both:
 * - non-namespaced `permissions` (Auth0 RBAC option)
 * - namespaced custom claims: `${namespace}/roles`, `${namespace}/permissions`
 */
export function getAppClaimsFromIdTokenClaims(
  claims: Record<string, unknown> | undefined,
  namespace?: string
): AppClaims {
  if (!claims) return { roles: [], permissions: [] };

  const roles = [
    ...toStringArray(claims['roles']),
    ...(namespace ? toStringArray(claims[`${namespace}/roles`]) : []),
  ];

  const permissions = [
    ...toStringArray(claims['permissions']),
    ...(namespace ? toStringArray(claims[`${namespace}/permissions`]) : []),
  ];

  // De-dupe while preserving order
  return {
    roles: Array.from(new Set(roles)),
    permissions: Array.from(new Set(permissions)),
  };
}

export function inferRoleFromClaims(claims: AppClaims): AppRole {
  const roles = claims.roles.map((r) => r.toLowerCase());
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('merchant')) return 'merchant';
  return 'user';
}


