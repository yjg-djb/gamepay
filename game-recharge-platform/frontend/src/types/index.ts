export interface SKU {
  id: string;
  gameId: string;
  name: { zh: string; ja: string; en: string };
  price: number;
  originalPrice: number;
  bonus: string;
  currency: string;
  limited: boolean;
  imageUrl?: string;
  sortOrder?: number;
}

export interface Game {
  id: string;
  merchantId: string;
  name: { zh: string; ja: string; en: string };
  developer: string;
  iconUrl: string;
  bannerUrl: string;
  rating?: number;
  downloads?: string;
  badge: 'hot' | 'sale' | 'new';
  skus: SKU[];
}

export interface User {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'merchant';
}

export interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  game: Game;
  sku: SKU;
}

export type Language = 'zh' | 'ja' | 'en';

