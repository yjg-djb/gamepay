import { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useStore } from '../store/useStore';
import type { User } from '../types';
import { getAppClaimsFromIdTokenClaims, inferRoleFromClaims } from './claims';

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Unified auth layer:
 * - demo mode (Visitor/Admin/Merchant A/B/C)
 * - auth0 mode (real login; can be used for real payments)
 */
export function useAppAuth() {
  const { authMode, setAuthMode, user, demoRole, demoMerchantId, logout: storeLogout, setDemoSession } = useStore();

  // Auth0 hook may throw if Auth0Provider isn't configured; catch and fallback to demo.
  let auth0:
    | ReturnType<typeof useAuth0>
    | null = null;
  try {
    auth0 = useAuth0();
  } catch {
    auth0 = null;
  }

  const namespace = (import.meta.env.VITE_AUTH0_NAMESPACE as string | undefined) || undefined;
  const audience = (import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined) || undefined;

  const [auth0Roles, setAuth0Roles] = useState<string[]>([]);
  const [auth0Permissions, setAuth0Permissions] = useState<string[]>([]);
  const auth0Role = useMemo(() => inferRoleFromClaims({ roles: auth0Roles, permissions: auth0Permissions }), [auth0Permissions, auth0Roles]);

  useEffect(() => {
    if (!auth0) return;
    if (authMode !== 'auth0') return;
    if (!auth0.isAuthenticated) {
      setAuth0Roles([]);
      setAuth0Permissions([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const idClaims = await auth0!.getIdTokenClaims();
        if (cancelled) return;

        let accessPayload: Record<string, unknown> | undefined;
        if (audience) {
          try {
            const accessToken = await auth0!.getAccessTokenSilently({ authorizationParams: { audience } });
            accessPayload = decodeJwtPayload(accessToken);
          } catch {
            accessPayload = undefined;
          }
        }

        const extractedFromId = getAppClaimsFromIdTokenClaims((idClaims as any) || undefined, namespace);
        const extractedFromAccess = getAppClaimsFromIdTokenClaims((accessPayload as any) || undefined, namespace);

        setAuth0Roles(Array.from(new Set([...extractedFromId.roles, ...extractedFromAccess.roles])));
        setAuth0Permissions(Array.from(new Set([...extractedFromId.permissions, ...extractedFromAccess.permissions])));
      } catch {
        if (cancelled) return;
        setAuth0Roles([]);
        setAuth0Permissions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audience, auth0, authMode, namespace]);

  // --- Auth0 branch ---
  if (authMode === 'auth0' && auth0) {
    const isAuthenticated = auth0.isAuthenticated;
    const isLoading = auth0.isLoading;

    const mappedUser: User | null = auth0.user
      ? {
          name: auth0.user.name || auth0.user.nickname || auth0.user.email || 'User',
          email: auth0.user.email || '',
          role: auth0Role,
        }
      : null;

    const loginWithRedirect = async () => {
      await auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience,
        },
      });
    };

    const logout = async () => {
      // switch UI to visitor immediately
      setAuthMode('demo');
      setDemoSession({ role: 'visitor', merchantId: null, user: null });
      // NOTE: Auth0 requires returnTo to be listed in "Allowed Logout URLs".
      // Using origin (no path) is usually the most compatible default.
      auth0.logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const getApiAccessToken = async () => {
      return await auth0.getAccessTokenSilently({
        authorizationParams: {
          audience,
        },
      });
    };

    const role = auth0Role;
    const getRole = async () => role;
    const hasRole = async (r: 'admin' | 'merchant') => role === 'admin' || role === r;

    return {
      isAuthenticated,
      isLoading,
      user: mappedUser,
      role,
      loginWithRedirect,
      logout,
      getApiAccessToken,
      getRole,
      hasRole,
      roles: auth0Roles,
      permissions: auth0Permissions,
      getClaims: async () => ({ roles: auth0Roles, permissions: auth0Permissions }),
    };
  }

  // --- Demo branch ---
  const computedUser: User | null = useMemo(() => {
    // Visitor means "logged out" in demo mode.
    if (demoRole === 'visitor') return null;
    if (user) return user;
    if (demoRole === 'admin') return { name: 'Demo Admin', email: 'admin@demo.local', role: 'admin' };
    if (demoRole === 'merchant')
      return { name: `Demo Merchant (${demoMerchantId || '-'})`, email: 'merchant@demo.local', role: 'merchant' };
    return { name: 'Demo User', email: 'user@demo.local', role: 'user' };
  }, [demoMerchantId, demoRole, user]);

  const isAuthenticated = demoRole !== 'visitor';
  const isLoading = false;

  const role = (demoRole === 'visitor' ? 'user' : demoRole) as 'user' | 'admin' | 'merchant';

  const loginWithRedirect = async () => {
    // In demo mode we show a local login screen.
    window.location.href = '/login';
  };

  const logout = async () => {
    storeLogout();
    window.location.href = '/login';
  };

  const getApiAccessToken = async () => {
    // Not used in demo mode; backend relies on demo headers instead of bearer token.
    return '';
  };

  const getRole = async () => role;
  const hasRole = async (r: 'admin' | 'merchant') => role === 'admin' || role === r;

  return {
    isAuthenticated,
    isLoading,
    user: computedUser,
    role,
    loginWithRedirect,
    logout,
    getApiAccessToken,
    getRole,
    hasRole,
    // Keep these fields for compatibility with older code paths
    roles: role === 'admin' ? ['admin'] : role === 'merchant' ? ['merchant'] : ['user'],
    permissions: role === 'admin' ? ['admin:all'] : role === 'merchant' ? ['merchant:all'] : [],
    getClaims: async () => ({ roles: [], permissions: [] }),
  };
}


