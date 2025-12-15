import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAppAuth } from '../auth/useAppAuth';
import { useToast } from '../store/useToast';
import {
  apiMerchantGetGames,
  apiMerchantGetOrders,
  apiMerchantGetStats,
  apiMerchantCreateGame,
  apiMerchantUpdateGame,
  apiMerchantDeleteGame,
  apiMerchantCreateSku,
  apiMerchantUpdateSku,
  apiMerchantDeleteSku,
} from '../services/api';
import type { Game, Order, SKU } from '../types';
import { games as fallbackGames, mockMerchantOrders as fallbackOrders } from '../services/mockData';

export const Merchant: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { merchantTab, setMerchantTab, currentLang } = useStore();
  const { isAuthenticated, isLoading, role, loginWithRedirect, getApiAccessToken } = useAppAuth();
  const pushToast = useToast((s) => s.push);
  const [stats, setStats] = useState<{ totalOrders: number; totalRevenue: number; todayOrders: number; todayRevenue: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>(fallbackOrders);
  const [games, setGames] = useState<Game[]>(fallbackGames);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Orders filters + pagination
  const [ordersGameFilter, setOrdersGameFilter] = useState<string>('all');
  const [ordersPage, setOrdersPage] = useState(1);

  // Game form state
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // SKU form state
  const [showSkuForm, setShowSkuForm] = useState(false);
  const [editingSku, setEditingSku] = useState<SKU | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void loginWithRedirect();
      return;
    }
    if (role !== 'merchant' && role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate, role]);

  const refreshData = async () => {
    setError(null);
    try {
      const token = await getApiAccessToken();
      const [s, o, g] = await Promise.all([
        apiMerchantGetStats(token),
        apiMerchantGetOrders(token),
        apiMerchantGetGames(token),
      ]);

        setStats({
          totalOrders: s.totalOrders,
          totalRevenue: s.totalRevenue,
          todayOrders: s.todayOrders || 0,
          todayRevenue: s.todayRevenue || 0,
        });

      const adaptedOrders: Order[] = (o.orders || []).map((ord: any) => ({
        id: ord.id,
        amount: ord.amount,
        currency: ord.currency,
        status: ord.status,
        createdAt: ord.createdAt,
        game: {
          id: ord.game.id,
          merchantId: ord.game.merchantId,
          name: { zh: ord.game.nameZh, ja: ord.game.nameJa, en: ord.game.nameEn },
          developer: ord.game.developer,
          iconUrl: ord.game.iconUrl,
          bannerUrl: ord.game.bannerUrl,
          badge: ord.game.badge,
          rating: ord.game.rating,
          downloads: ord.game.downloads,
          skus: [],
        },
        sku: {
          id: ord.sku.id,
          gameId: ord.sku.gameId || ord.game.id,
          name: { zh: ord.sku.nameZh, ja: ord.sku.nameJa, en: ord.sku.nameEn },
          price: ord.sku.price,
          originalPrice: ord.sku.originalPrice,
          bonus: ord.sku.bonus,
          currency: ord.sku.currency,
          limited: ord.sku.limited,
          imageUrl: ord.sku.imageUrl ?? undefined,
          sortOrder: ord.sku.sortOrder ?? undefined,
        },
      }));
      setOrders(adaptedOrders);

      const adaptedGames: Game[] = (g.games || []).map((gg: any) => ({
        id: gg.id,
        merchantId: gg.merchantId,
        name: { zh: gg.nameZh, ja: gg.nameJa, en: gg.nameEn },
        developer: gg.developer,
        iconUrl: gg.iconUrl,
        bannerUrl: gg.bannerUrl,
        badge: gg.badge,
        rating: gg.rating,
        downloads: gg.downloads,
        skus: (gg.skus || []).map((s: any) => ({
          id: s.id,
          gameId: s.gameId,
          name: { zh: s.nameZh, ja: s.nameJa, en: s.nameEn },
          price: s.price,
          originalPrice: s.originalPrice,
          bonus: s.bonus,
          currency: s.currency,
          limited: s.limited,
          imageUrl: s.imageUrl ?? undefined,
          sortOrder: s.sortOrder ?? undefined,
        })),
      }));
      setGames(adaptedGames);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (role !== 'merchant' && role !== 'admin')) return;
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role, getApiAccessToken]);

  if (!isAuthenticated || (role !== 'merchant' && role !== 'admin')) return null;

  const allSKUs = useMemo(() => {
    return games.flatMap((g) => g.skus.map((s) => ({ ...s, gameName: g.name[currentLang] || g.name.en })));
  }, [currentLang, games]);

  const ordersPageSize = 10;
  const filteredOrders = useMemo(() => {
    const base = ordersGameFilter === 'all' ? orders : orders.filter((o) => o.game.id === ordersGameFilter);
    return base;
  }, [orders, ordersGameFilter]);
  const ordersTotalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const ordersPageClamped = Math.min(ordersPage, ordersTotalPages);
  const pagedOrders = filteredOrders.slice((ordersPageClamped - 1) * ordersPageSize, ordersPageClamped * ordersPageSize);

  const perGameStats = useMemo(() => {
    const map = new Map<string, { game: Game; totalOrders: number; paidOrders: number; revenue: number }>();
    for (const g of games) {
      map.set(g.id, { game: g, totalOrders: 0, paidOrders: 0, revenue: 0 });
    }
    for (const o of orders) {
      const entry = map.get(o.game.id);
      if (!entry) continue;
      entry.totalOrders += 1;
      if (o.status === 'PAID') {
        entry.paidOrders += 1;
        entry.revenue += o.amount;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [games, orders]);

  const submitGame = async (form: {
    nameZh: string;
    nameJa: string;
    nameEn: string;
    developer: string;
    iconUrl: string;
    bannerUrl: string;
    badge: string;
    rating?: number;
    downloads?: string;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      if (editingGame) {
        await apiMerchantUpdateGame(token, editingGame.id, form);
      } else {
        await apiMerchantCreateGame(token, form);
      }
      setShowGameForm(false);
      setEditingGame(null);
      await refreshData();
      pushToast({ type: 'success', message: 'Game saved' });
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      pushToast({ type: 'error', message: e?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const submitSku = async (form: {
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
  }) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      if (editingSku) {
        await apiMerchantUpdateSku(token, editingSku.id, form);
      } else {
        await apiMerchantCreateSku(token, form);
      }
      setShowSkuForm(false);
      setEditingSku(null);
      await refreshData();
      pushToast({ type: 'success', message: 'SKU saved' });
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      pushToast({ type: 'error', message: e?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm('Delete this game? All SKUs will also be deleted.')) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiMerchantDeleteGame(token, id);
      await refreshData();
      pushToast({ type: 'success', message: 'Game deleted' });
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
      pushToast({ type: 'error', message: e?.message || 'Delete failed' });
    } finally {
      setBusy(false);
    }
  };

  const deleteSku = async (id: string) => {
    if (!confirm('Delete this SKU?')) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiMerchantDeleteSku(token, id);
      await refreshData();
      pushToast({ type: 'success', message: 'SKU deleted' });
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
      pushToast({ type: 'error', message: e?.message || 'Delete failed' });
    } finally {
      setBusy(false);
    }
  };

  const renderGamesTab = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t('gameList')}</h2>
        <button
          onClick={() => {
            setEditingGame(null);
            setShowGameForm(true);
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:from-blue-600 hover:to-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addGame')}</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('gameName')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('developer')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">SKUs</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {games.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <img src={g.iconUrl} className="w-10 h-10 rounded-xl mr-3 object-cover shadow-sm" alt="" />
                    <span className="font-medium text-gray-900">{g.name[currentLang] || g.name.en}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{g.developer}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{g.skus.length}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingGame(g);
                        setShowGameForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGame(g.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No games yet. Click "Add Game" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SKU Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">SKU {t('manageSKU')}</h2>
          <button
            onClick={() => {
              setEditingSku(null);
              setShowSkuForm(true);
            }}
            disabled={games.length === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSKU')}</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('game')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('name')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('price')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('bonusItems')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allSKUs.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-600">{s.gameName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{s.name[currentLang] || s.name.en}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-bold">
                    {s.currency} {s.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-600 font-medium">{s.bonus || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingSku(s as any);
                          setShowSkuForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSku(s.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {allSKUs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No SKUs yet. Add a game first, then create SKUs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-display">{t('merchant')}</h1>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 font-medium flex items-center hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('home')}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: t('totalOrders'), value: stats ? stats.totalOrders.toLocaleString() : '-', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-100' },
          { label: t('totalRevenue'), value: stats ? `¥${stats.totalRevenue.toLocaleString()}` : '-', color: 'from-green-500 to-green-600', textColor: 'text-green-100' },
          { label: t('todayOrders'), value: stats ? stats.todayOrders.toLocaleString() : '-', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-100' },
          { label: t('todayRevenue'), value: stats ? `¥${stats.todayRevenue.toLocaleString()}` : '-', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-100' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-lg`}>
            <p className={`${stat.textColor} text-sm font-medium`}>{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {['orders', 'games', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMerchantTab(tab)}
            className={`py-2 px-6 rounded-lg font-medium text-sm transition-all ${
              merchantTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'orders' ? t('recentOrders') : tab === 'games' ? t('manageGames') : t('statistics')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        {merchantTab === 'orders' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold">{t('recentOrders')}</h2>
              <button
                type="button"
                onClick={() => pushToast({ type: 'success', message: 'Export success (mock)' })}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
              >
                Export (mock)
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
              <select
                value={ordersGameFilter}
                onChange={(e) => {
                  setOrdersGameFilter(e.target.value);
                  setOrdersPage(1);
                }}
                className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All games</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name[currentLang] || g.name.en}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500">
                {filteredOrders.length} orders • page {ordersPageClamped}/{ordersTotalPages}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('user')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('game')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('orderAmount')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('orderDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('orderStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-mono text-gray-500">{o.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">-</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{o.game.name[currentLang] || o.game.name.en}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{o.sku.name[currentLang] || o.sku.name.en}</td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-900">
                        {o.currency} {o.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {(() => {
                          const d = new Date(o.createdAt);
                          return isNaN(d.getTime()) ? o.createdAt : d.toLocaleString();
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            o.status === 'PAID'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}
                        >
                          {o.status === 'PAID' ? t('completed') : t('pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                disabled={ordersPageClamped <= 1}
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={ordersPageClamped >= ordersTotalPages}
                onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {merchantTab === 'games' && renderGamesTab()}

        {merchantTab === 'stats' && (
          <>
            <h2 className="text-xl font-bold mb-6">{t('statistics')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4">{t('revenueTrend7d')}</h3>
                <div className="h-48 flex items-end justify-between space-x-2">
                  {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all relative group"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4">{t('topGames')}</h3>
                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('game')}</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('totalOrders')}</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Paid</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('totalRevenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {perGameStats.slice(0, 12).map((row) => (
                        <tr key={row.game.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={row.game.iconUrl} className="w-9 h-9 rounded-lg object-cover" alt="" />
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{row.game.name[currentLang] || row.game.name.en}</div>
                                <div className="text-xs text-gray-500 font-mono truncate">{row.game.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">{row.totalOrders}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">{row.paidOrders}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">¥{row.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                      {games.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No games yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Game Form Modal */}
      {showGameForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
          onClick={(e) => e.target === e.currentTarget && setShowGameForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingGame ? t('edit') + ' Game' : t('addGame')}</h3>
              <button onClick={() => setShowGameForm(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <GameForm
              initial={editingGame}
              disabled={busy}
              onSubmit={submitGame}
              onCancel={() => {
                setShowGameForm(false);
                setEditingGame(null);
              }}
            />
          </div>
        </div>
      )}

      {/* SKU Form Modal */}
      {showSkuForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
          onClick={(e) => e.target === e.currentTarget && setShowSkuForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingSku ? t('edit') + ' SKU' : t('addSKU')}</h3>
              <button onClick={() => setShowSkuForm(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <SKUForm
              games={games}
              initial={editingSku}
              disabled={busy}
              onSubmit={submitSku}
              onCancel={() => {
                setShowSkuForm(false);
                setEditingSku(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`}
    />
  );
}

function GameForm(props: {
  initial: Game | null;
  disabled: boolean;
  onSubmit: (data: {
    nameZh: string;
    nameJa: string;
    nameEn: string;
    developer: string;
    iconUrl: string;
    bannerUrl: string;
    badge: string;
    rating?: number;
    downloads?: string;
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [nameZh, setNameZh] = useState(props.initial?.name.zh || '');
  const [nameJa, setNameJa] = useState(props.initial?.name.ja || '');
  const [nameEn, setNameEn] = useState(props.initial?.name.en || '');
  const [developer, setDeveloper] = useState(props.initial?.developer || '');
  const [iconUrl, setIconUrl] = useState(props.initial?.iconUrl || '');
  const [bannerUrl, setBannerUrl] = useState(props.initial?.bannerUrl || '');
  const [badge, setBadge] = useState(props.initial?.badge || 'new');
  const [rating, setRating] = useState<number | ''>(props.initial?.rating ?? '');
  const [downloads, setDownloads] = useState(props.initial?.downloads ?? '');

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit({
          nameZh,
          nameJa,
          nameEn,
          developer,
          iconUrl,
          bannerUrl,
          badge,
          rating: rating === '' ? undefined : Number(rating),
          downloads: downloads || undefined,
        });
      }}
    >
      <div>
        <label className="text-sm text-gray-600">Badge</label>
        <Select value={badge} onChange={(e) => setBadge(e.target.value as any)} disabled={props.disabled}>
          <option value="hot">hot</option>
          <option value="sale">sale</option>
          <option value="new">new</option>
        </Select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Rating</label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={rating}
          onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={props.disabled}
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (ZH)</label>
        <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (JA)</label>
        <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (EN)</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('developer')}</label>
        <Input value={developer} onChange={(e) => setDeveloper(e.target.value)} disabled={props.disabled} required />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Icon URL</label>
        <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} disabled={props.disabled} required />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Banner URL</label>
        <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Downloads</label>
        <Input value={downloads} onChange={(e) => setDownloads(e.target.value)} disabled={props.disabled} />
      </div>
      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel} className="px-4 py-2 rounded-xl border border-gray-200">
          {t('cancel')}
        </button>
        <button
          disabled={props.disabled}
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
        >
          {t('save')}
        </button>
      </div>
    </form>
  );
}

function SKUForm(props: {
  games: Game[];
  initial: SKU | null;
  disabled: boolean;
  onSubmit: (data: {
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
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [gameId, setGameId] = useState(props.initial?.gameId || props.games[0]?.id || '');
  const [nameZh, setNameZh] = useState(props.initial?.name.zh || '');
  const [nameJa, setNameJa] = useState(props.initial?.name.ja || '');
  const [nameEn, setNameEn] = useState(props.initial?.name.en || '');
  const [price, setPrice] = useState(props.initial?.price || 0);
  const [originalPrice, setOriginalPrice] = useState(props.initial?.originalPrice || 0);
  const [bonus, setBonus] = useState(props.initial?.bonus || '');
  const [currency, setCurrency] = useState(props.initial?.currency || 'JPY');
  const [limited, setLimited] = useState(props.initial?.limited || false);
  const [imageUrl, setImageUrl] = useState((props.initial as any)?.imageUrl || '');
  const [sortOrder, setSortOrder] = useState<number | ''>((props.initial as any)?.sortOrder ?? '');

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit({
          gameId,
          nameZh,
          nameJa,
          nameEn,
          price: Number(price),
          originalPrice: Number(originalPrice),
          bonus,
          currency,
          limited,
          imageUrl: imageUrl || undefined,
          sortOrder: sortOrder === '' ? undefined : Number(sortOrder),
        });
      }}
    >
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">{t('game')}</label>
        <Select value={gameId} onChange={(e) => setGameId(e.target.value)} disabled={props.disabled} required>
          {props.games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name.en}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (ZH)</label>
        <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (JA)</label>
        <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} disabled={props.disabled} required />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Name (EN)</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('price')}</label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          disabled={props.disabled}
          required
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Original Price</label>
        <Input
          type="number"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(Number(e.target.value))}
          disabled={props.disabled}
          required
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('bonusItems')}</label>
        <Input value={bonus} onChange={(e) => setBonus(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Currency</label>
        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Sort Order</label>
        <Input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={props.disabled}
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Image URL</label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={props.disabled} placeholder="/images/..." />
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input type="checkbox" checked={limited} onChange={(e) => setLimited(e.target.checked)} />
        <span className="text-sm text-gray-700">{t('limitedTime')}</span>
      </div>
      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel} className="px-4 py-2 rounded-xl border border-gray-200">
          {t('cancel')}
        </button>
        <button
          disabled={props.disabled}
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
        >
          {t('save')}
        </button>
      </div>
    </form>
  );
}
