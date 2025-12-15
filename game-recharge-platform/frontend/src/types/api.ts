export interface ApiGame {
  id: string;
  merchantId: string;
  nameZh: string;
  nameJa: string;
  nameEn: string;
  developer: string;
  iconUrl: string;
  bannerUrl: string;
  badge: 'hot' | 'sale' | 'new' | string;
  rating?: number;
  downloads?: string;
  skus: ApiSKU[];
}

export interface ApiSKU {
  id: string;
  gameId: string;
  nameZh: string;
  nameJa: string;
  nameEn: string;
  price: number;
  originalPrice: number;
  bonus: string;
  currency: string;
  limited: boolean;
  imageUrl?: string;
  sortOrder?: number;
}

export interface ApiOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  game: ApiGame;
  sku: ApiSKU;
}











