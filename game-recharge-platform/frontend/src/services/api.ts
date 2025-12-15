import { z } from 'zod';
import type { ApiGame } from '../types/api';
import { useStore } from '../store/useStore';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit & { token?: string; parse?: (data: unknown) => T }) {
  const { authMode, demoRole, demoMerchantId } = useStore.getState();

  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(authMode === 'demo' && demoRole !== 'visitor'
        ? {
            'X-Demo-Role': demoRole,
            ...(demoRole === 'merchant' && demoMerchantId ? { 'X-Demo-Merchant-Id': demoMerchantId } : {}),
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) throw new ApiError(`API error: ${res.status}`, res.status, data);
  return options.parse ? options.parse(data) : (data as T);
}

// Schemas (minimal)
export const MeSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  role: z.string(),
});

export const OrderSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  createdAt: z.string(),
  game: z.object({
    id: z.string(),
    nameZh: z.string(),
    nameJa: z.string(),
    nameEn: z.string(),
    developer: z.string(),
    iconUrl: z.string(),
    bannerUrl: z.string(),
    badge: z.string(),
  }),
  sku: z.object({
    id: z.string(),
    gameId: z.string().optional(),
    nameZh: z.string(),
    nameJa: z.string(),
    nameEn: z.string(),
    price: z.number(),
    originalPrice: z.number(),
    bonus: z.string(),
    currency: z.string(),
    limited: z.boolean(),
    imageUrl: z.string().nullable().optional(),
  }),
});

export const OrdersSchema = z.array(OrderSchema);

export async function apiGetMe(token: string) {
  return request('/api/me', { method: 'GET', token, parse: (d) => MeSchema.parse(d) });
}

export async function apiCreateOrder(token: string, skuId: string) {
  return request('/api/orders', { method: 'POST', token, body: JSON.stringify({ skuId }) });
}

export async function apiCreateOrderWithMerchant(token: string, skuId: string, merchantId?: string) {
  return request('/api/orders', {
    method: 'POST',
    token,
    body: JSON.stringify({ skuId, ...(merchantId ? { merchantId } : {}) }),
  });
}

export async function apiDemoPayOrder(token: string, orderId: string) {
  return request(`/api/orders/${orderId}/demo-pay`, { method: 'POST', token });
}

const GameMerchantsSchema = z.object({
  gameId: z.string(),
  merchants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable().optional(),
      status: z.string(),
    })
  ),
});

export async function apiGetGameMerchants(gameId: string) {
  return request(`/api/games/${gameId}/merchants`, { method: 'GET', parse: (d) => GameMerchantsSchema.parse(d) });
}

export async function apiGetMyOrders(token: string) {
  return request('/api/orders/me', { method: 'GET', token, parse: (d) => OrdersSchema.parse(d) });
}

export async function apiMerchantGetStats(token: string) {
  return request<{
    merchantId: string;
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayPaidOrders: number;
    todayRevenue: number;
  }>('/api/merchant/me/stats', { method: 'GET', token });
}

export async function apiMerchantGetOrders(token: string) {
  return request<{ merchantId: string; orders: any[] }>('/api/merchant/me/orders', { method: 'GET', token });
}

export async function apiMerchantGetGames(token: string) {
  return request<{ merchantId: string; games: any[] }>('/api/merchant/me/games', { method: 'GET', token });
}

export async function apiCreateStripeIntent(token: string, orderId: string) {
  return request<{ clientSecret: string | null; paymentIntentId: string }>(
    '/api/payments/stripe/create-intent',
    { method: 'POST', token, body: JSON.stringify({ orderId }) }
  );
}

export async function apiCreatePaypalOrder(token: string, orderId: string) {
  return request<{ paypalOrderId: string }>(
    '/api/payments/paypal/create-order',
    { method: 'POST', token, body: JSON.stringify({ orderId }) }
  );
}

export async function apiCapturePaypalOrder(token: string, orderId: string, paypalOrderId: string) {
  return request<{ status: string }>(
    '/api/payments/paypal/capture-order',
    { method: 'POST', token, body: JSON.stringify({ orderId, paypalOrderId }) }
  );
}

export const GamesSchema = z.array(
  z.object({
    id: z.string(),
    merchantId: z.string(),
    nameZh: z.string(),
    nameJa: z.string(),
    nameEn: z.string(),
    developer: z.string(),
    iconUrl: z.string(),
    bannerUrl: z.string(),
    badge: z.string(),
    rating: z.number().optional(),
    downloads: z.string().optional(),
    skus: z.array(
      z.object({
        id: z.string(),
        gameId: z.string(),
        nameZh: z.string(),
        nameJa: z.string(),
        nameEn: z.string(),
        price: z.number(),
        originalPrice: z.number(),
        bonus: z.string(),
        currency: z.string(),
        limited: z.boolean(),
        imageUrl: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      })
    ),
  })
);

// Admin: Merchants
export const AdminMerchantsSchema = z.object({
  merchants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable().optional(),
      status: z.string(),
      createdAt: z.string(),
      gamesCount: z.number(),
      gameIds: z.array(z.string()),
      totalOrders: z.number(),
      paidOrders: z.number(),
      totalRevenue: z.number(),
    })
  ),
});

export async function apiGetGames(): Promise<ApiGame[]> {
  return request('/api/games', { method: 'GET', parse: (d) => GamesSchema.parse(d) as any });
}

export async function apiAdminGetMerchants(token: string) {
  return request('/api/admin/merchants', { method: 'GET', token, parse: (d) => AdminMerchantsSchema.parse(d) as any });
}

export async function apiAdminCreateMerchant(
  token: string,
  input: { name: string; email?: string; status?: 'ACTIVE' | 'SUSPENDED'; gameIds?: string[] }
) {
  return request('/api/admin/merchants', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiAdminUpdateMerchant(
  token: string,
  id: string,
  input: { name?: string; email?: string; status?: 'ACTIVE' | 'SUSPENDED' }
) {
  return request(`/api/admin/merchants/${id}`, { method: 'PUT', token, body: JSON.stringify(input) });
}

export async function apiAdminSetMerchantGames(token: string, id: string, gameIds: string[]) {
  return request(`/api/admin/merchants/${id}/games`, { method: 'PUT', token, body: JSON.stringify({ gameIds }) });
}

export async function apiAdminCreateGame(token: string, input: any) {
  return request('/api/admin/games', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiAdminUpdateGame(token: string, id: string, input: any) {
  return request(`/api/admin/games/${id}`, { method: 'PUT', token, body: JSON.stringify(input) });
}

export async function apiAdminDeleteGame(token: string, id: string) {
  return request(`/api/admin/games/${id}`, { method: 'DELETE', token });
}

export async function apiAdminCreateSku(token: string, input: any) {
  return request('/api/admin/skus', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiAdminUpdateSku(token: string, id: string, input: any) {
  return request(`/api/admin/skus/${id}`, { method: 'PUT', token, body: JSON.stringify(input) });
}

export async function apiAdminDeleteSku(token: string, id: string) {
  return request(`/api/admin/skus/${id}`, { method: 'DELETE', token });
}

// Merchant CRUD for Games
export async function apiMerchantCreateGame(token: string, input: any) {
  return request('/api/merchant/me/games', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiMerchantUpdateGame(token: string, id: string, input: any) {
  return request(`/api/merchant/me/games/${id}`, { method: 'PUT', token, body: JSON.stringify(input) });
}

export async function apiMerchantDeleteGame(token: string, id: string) {
  return request(`/api/merchant/me/games/${id}`, { method: 'DELETE', token });
}

// Merchant CRUD for SKUs
export async function apiMerchantCreateSku(token: string, input: any) {
  return request('/api/merchant/me/skus', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiMerchantUpdateSku(token: string, id: string, input: any) {
  return request(`/api/merchant/me/skus/${id}`, { method: 'PUT', token, body: JSON.stringify(input) });
}

export async function apiMerchantDeleteSku(token: string, id: string) {
  return request(`/api/merchant/me/skus/${id}`, { method: 'DELETE', token });
}

// Merchant Application APIs
export async function apiSubmitMerchantApplication(
  token: string,
  input: { companyName: string; contactName: string; contactEmail: string; description: string }
) {
  return request('/api/merchant/apply', { method: 'POST', token, body: JSON.stringify(input) });
}

export async function apiGetMyMerchantApplications(token: string) {
  return request<{ applications: any[] }>('/api/merchant/apply/status', { method: 'GET', token });
}

export async function apiAdminGetMerchantApplications(token: string, status?: string) {
  const query = status ? `?status=${status}` : '';
  return request<{ applications: any[] }>(`/api/admin/merchant-applications${query}`, { method: 'GET', token });
}

export async function apiAdminApproveMerchantApplication(token: string, id: string, reviewNote?: string) {
  return request(`/api/admin/merchant-applications/${id}/approve`, {
    method: 'POST',
    token,
    body: JSON.stringify({ reviewNote }),
  });
}

export async function apiAdminRejectMerchantApplication(token: string, id: string, reviewNote?: string) {
  return request(`/api/admin/merchant-applications/${id}/reject`, {
    method: 'POST',
    token,
    body: JSON.stringify({ reviewNote }),
  });
}

// Admin User Management APIs
export async function apiAdminGetUsers(token: string) {
  return request<{ users: any[] }>('/api/admin/users', { method: 'GET', token });
}

export async function apiAdminGetUser(token: string, id: string) {
  return request<any>(`/api/admin/users/${id}`, { method: 'GET', token });
}

export async function apiAdminUpdateUserRole(token: string, id: string, role: 'USER' | 'ADMIN' | 'MERCHANT') {
  return request(`/api/admin/users/${id}/role`, { method: 'PUT', token, body: JSON.stringify({ role }) });
}

export async function apiAdminDeleteUser(token: string, id: string) {
  return request(`/api/admin/users/${id}`, { method: 'DELETE', token });
}


