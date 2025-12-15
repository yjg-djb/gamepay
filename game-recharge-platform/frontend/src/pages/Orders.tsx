import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppAuth } from '../auth/useAppAuth';
import { apiGetMyOrders } from '../services/api';
import type { Order } from '../types';

export const Orders: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect, getApiAccessToken } = useAppAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return;
    void (async () => {
      setLoadingOrders(true);
      try {
        const token = await getApiAccessToken();
        const data = await apiGetMyOrders(token);
        if (cancelled) return;
        // Adapt API order shape to frontend Order type
        const adapted: Order[] = data.map((o) => ({
          id: o.id,
          amount: o.amount,
          currency: o.currency,
          status: o.status,
          createdAt: o.createdAt,
          game: {
            id: o.game.id,
            merchantId: (o.game as any).merchantId || '',
            name: { zh: o.game.nameZh, ja: o.game.nameJa, en: o.game.nameEn },
            developer: o.game.developer,
            iconUrl: o.game.iconUrl,
            bannerUrl: o.game.bannerUrl,
            badge: (o.game.badge as any) || 'new',
            rating: (o.game as any).rating,
            downloads: (o.game as any).downloads,
            skus: [],
          },
          sku: {
            id: o.sku.id,
            gameId: (o.sku as any).gameId || o.game.id,
            name: { zh: o.sku.nameZh, ja: o.sku.nameJa, en: o.sku.nameEn },
            price: o.sku.price,
            originalPrice: o.sku.originalPrice,
            bonus: o.sku.bonus,
            currency: o.sku.currency,
            limited: o.sku.limited,
          },
        }));
        setOrders(adapted);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getApiAccessToken, isAuthenticated]);

  if (!isAuthenticated) return null;

  const currentLang = (i18n.language as 'zh' | 'ja' | 'en') || 'zh';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-display">{t('orderHistory')}</h1>
        <button 
          onClick={() => navigate('/')} 
          className="text-blue-600 font-medium flex items-center hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('home')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderId')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('game')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('product')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderAmount')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderDate')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(loadingOrders ? [] : orders).map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{order.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.game.name[currentLang] || order.game.name.en}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.sku.name[currentLang] || order.sku.name.en}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.currency} {order.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(() => {
                      const d = new Date(order.createdAt);
                      return isNaN(d.getTime()) ? order.createdAt : d.toLocaleString();
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'PAID' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {order.status === 'PAID' ? t('completed') : t('pending')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

