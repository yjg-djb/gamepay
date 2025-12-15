import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAppAuth } from '../auth/useAppAuth';
import type { Game, SKU } from '../types';
import {
  apiAdminCreateGame,
  apiAdminCreateSku,
  apiAdminDeleteGame,
  apiAdminDeleteSku,
  apiAdminUpdateGame,
  apiAdminUpdateSku,
  apiGetGames,
  apiAdminGetMerchants,
  apiAdminCreateMerchant,
  apiAdminUpdateMerchant,
  apiAdminSetMerchantGames,
  apiAdminGetMerchantApplications,
  apiAdminApproveMerchantApplication,
  apiAdminRejectMerchantApplication,
  apiAdminGetUsers,
  apiAdminUpdateUserRole,
  apiAdminDeleteUser,
} from '../services/api';
import { useToast } from '../store/useToast';

interface MerchantApplication {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
  user?: { id: string; email: string; name: string };
}

export const Admin: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { adminTab, setAdminTab, currentLang } = useStore();
  const { isAuthenticated, isLoading, role, loginWithRedirect, getApiAccessToken } = useAppAuth();
  const pushToast = useToast((s) => s.push);
  const [games, setGames] = useState<Game[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showSkuForm, setShowSkuForm] = useState(false);
  const [editingSku, setEditingSku] = useState<SKU | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [gamePage, setGamePage] = useState(1);
  const [skuSearch, setSkuSearch] = useState('');
  const [skuGameFilter, setSkuGameFilter] = useState<string>('all');
  const [skuPage, setSkuPage] = useState(1);

  // Merchants state
  const [merchants, setMerchants] = useState<any[]>([]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantPage, setMerchantPage] = useState(1);
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
  const [showMerchantGames, setShowMerchantGames] = useState(false);
  const [merchantGamesTarget, setMerchantGamesTarget] = useState<any | null>(null);

  // Merchant applications state
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [applicationsFilter, setApplicationsFilter] = useState<string>('PENDING');

  // Users state
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void loginWithRedirect();
      return;
    }
    if (role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate, role]);

  if (!isAuthenticated || role !== 'admin') return null;

  const refreshGames = async () => {
    setError(null);
    try {
      const apiGames = await apiGetGames();
      const adapted: Game[] = apiGames.map((g) => ({
        id: g.id,
        merchantId: g.merchantId,
        name: { zh: g.nameZh, ja: g.nameJa, en: g.nameEn },
        developer: g.developer,
        iconUrl: g.iconUrl,
        bannerUrl: g.bannerUrl,
        badge: (g.badge as any) || 'new',
        rating: g.rating,
        downloads: g.downloads,
        skus: (g.skus || []).map((s) => ({
          id: s.id,
          gameId: s.gameId,
          name: { zh: s.nameZh, ja: s.nameJa, en: s.nameEn },
          price: s.price,
          originalPrice: s.originalPrice,
          bonus: s.bonus,
          currency: s.currency,
          limited: s.limited,
            imageUrl: (s as any).imageUrl ?? undefined,
            sortOrder: (s as any).sortOrder ?? undefined,
        })),
      }));
      setGames(adapted);
    } catch (e: any) {
      setError(e?.message || 'Failed to load games');
    }
  };

  const refreshApplications = async () => {
    try {
      const token = await getApiAccessToken();
      const data = await apiAdminGetMerchantApplications(token, applicationsFilter || undefined);
      setApplications(data.applications || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load applications');
    }
  };

  const refreshUsers = async () => {
    try {
      const token = await getApiAccessToken();
      const data = await apiAdminGetUsers(token);
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    }
  };

  const refreshMerchants = async () => {
    try {
      const token = await getApiAccessToken();
      const data = await apiAdminGetMerchants(token);
      setMerchants(data.merchants || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load merchants');
    }
  };

  useEffect(() => {
    void refreshGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminTab === 'applications') {
      void refreshApplications();
    } else if (adminTab === 'merchants') {
      void refreshMerchants();
    } else if (adminTab === 'users') {
      void refreshUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab, applicationsFilter]);

  const allSKUs = useMemo(() => {
    return games.flatMap((g) => g.skus.map((s) => ({ ...s, gameName: g.name[currentLang] || g.name.en })));
  }, [currentLang, games]);

  const submitGame = async (form: {
    merchantId: string;
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
        await apiAdminUpdateGame(token, editingGame.id, form);
      } else {
        await apiAdminCreateGame(token, form);
      }
      setShowGameForm(false);
      setEditingGame(null);
      await refreshGames();
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
        await apiAdminUpdateSku(token, editingSku.id, form);
      } else {
        await apiAdminCreateSku(token, form);
      }
      setShowSkuForm(false);
      setEditingSku(null);
      await refreshGames();
      pushToast({ type: 'success', message: 'SKU saved' });
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      pushToast({ type: 'error', message: e?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm('Delete this game?')) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminDeleteGame(token, id);
      await refreshGames();
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
      await apiAdminDeleteSku(token, id);
      await refreshGames();
      pushToast({ type: 'success', message: 'SKU deleted' });
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
      pushToast({ type: 'error', message: e?.message || 'Delete failed' });
    } finally {
      setBusy(false);
    }
  };

  const approveApplication = async (id: string) => {
    const note = prompt('Review note (optional):');
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminApproveMerchantApplication(token, id, note || undefined);
      await refreshApplications();
      pushToast({ type: 'success', message: 'Application approved' });
    } catch (e: any) {
      setError(e?.message || 'Approve failed');
      pushToast({ type: 'error', message: e?.message || 'Approve failed' });
    } finally {
      setBusy(false);
    }
  };

  const rejectApplication = async (id: string) => {
    const note = prompt('Rejection reason:');
    if (!note) {
      alert('Please provide a rejection reason');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminRejectMerchantApplication(token, id, note);
      await refreshApplications();
      pushToast({ type: 'success', message: 'Application rejected' });
    } catch (e: any) {
      setError(e?.message || 'Reject failed');
      pushToast({ type: 'error', message: e?.message || 'Reject failed' });
    } finally {
      setBusy(false);
    }
  };

  const renderAdminGames = () => {
    const pageSize = 10;
    const term = gameSearch.trim().toLowerCase();
    const filtered = term
      ? games.filter((g) => {
          const name = (g.name[currentLang] || g.name.en).toLowerCase();
          return name.includes(term) || g.developer.toLowerCase().includes(term) || g.id.toLowerCase().includes(term);
        })
      : games;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(gamePage, totalPages);
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
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

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <input
            value={gameSearch}
            onChange={(e) => {
              setGameSearch(e.target.value);
              setGamePage(1);
            }}
            placeholder="Search games (id/name/developer)"
            className="w-full sm:w-96 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-500">
            {filtered.length} games • page {page}/{totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('gameName')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('developer')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">SKUs</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500 font-mono">{g.id}</td>
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
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No games found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setGamePage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setGamePage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const renderAdminSKUs = () => {
    const pageSize = 10;
    const term = skuSearch.trim().toLowerCase();
    const filtered = allSKUs
      .filter((s) => (skuGameFilter === 'all' ? true : s.gameId === skuGameFilter))
      .filter((s) => {
        if (!term) return true;
        const name = (s.name[currentLang] || s.name.en).toLowerCase();
        return name.includes(term) || s.id.toLowerCase().includes(term) || String(s.gameName || '').toLowerCase().includes(term);
      })
      .sort((a: any, b: any) => {
        const g = String(a.gameName || '').localeCompare(String(b.gameName || ''), 'en');
        if (g !== 0) return g;
        const ao = Number(a.sortOrder ?? 0);
        const bo = Number(b.sortOrder ?? 0);
        if (ao !== bo) return ao - bo;
        return a.id.localeCompare(b.id);
      });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(skuPage, totalPages);
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    const moveSku = async (skuRow: any, dir: 'up' | 'down') => {
      const sameGame = allSKUs
        .filter((s: any) => s.gameId === skuRow.gameId)
        .sort((a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || a.id.localeCompare(b.id));
      const idx = sameGame.findIndex((s: any) => s.id === skuRow.id);
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || targetIdx < 0 || targetIdx >= sameGame.length) return;
      const other = sameGame[targetIdx];

      setBusy(true);
      setError(null);
      try {
        const token = await getApiAccessToken();
        const aOrder = Number(skuRow.sortOrder ?? 0);
        const bOrder = Number(other.sortOrder ?? 0);
        await Promise.all([
          apiAdminUpdateSku(token, skuRow.id, { sortOrder: bOrder }),
          apiAdminUpdateSku(token, other.id, { sortOrder: aOrder }),
        ]);
        pushToast({ type: 'success', message: 'SKU order updated' });
        await refreshGames();
      } catch (e: any) {
        setError(e?.message || 'Update failed');
        pushToast({ type: 'error', message: e?.message || 'Update failed' });
      } finally {
        setBusy(false);
      }
    };

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">SKU {t('gameList')}</h2>
          <button
            onClick={() => {
              setEditingSku(null);
              setShowSkuForm(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:from-blue-600 hover:to-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSKU')}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={skuSearch}
              onChange={(e) => {
                setSkuSearch(e.target.value);
                setSkuPage(1);
              }}
              placeholder="Search SKU (id/name/game)"
              className="w-full sm:w-96 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={skuGameFilter}
              onChange={(e) => {
                setSkuGameFilter(e.target.value);
                setSkuPage(1);
              }}
              className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All games</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name[currentLang] || g.name.en}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {filtered.length} SKUs • page {page}/{totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('game')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('name')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sort</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('price')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('bonusItems')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500">{s.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{s.gameName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{s.name[currentLang] || s.name.en}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSku(s, 'up')}
                        className="p-1 rounded hover:bg-gray-100 text-gray-600"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSku(s, 'down')}
                        className="p-1 rounded hover:bg-gray-100 text-gray-600"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <span className="ml-1 font-mono">{Number(s.sortOrder ?? 0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-bold">
                    {s.currency} {s.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-600 font-medium">{s.bonus || '-'}</td>
                  <td className="px-4 py-4">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="w-12 h-8 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
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
                      <button onClick={() => deleteSku(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setSkuPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setSkuPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN' | 'MERCHANT') => {
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminUpdateUserRole(token, userId, newRole);
      await refreshUsers();
      pushToast({ type: 'success', message: 'User role updated' });
    } catch (e: any) {
      setError(e?.message || 'Update failed');
      pushToast({ type: 'error', message: e?.message || 'Update failed' });
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminDeleteUser(token, userId);
      await refreshUsers();
      pushToast({ type: 'success', message: 'User deleted' });
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
      pushToast({ type: 'error', message: e?.message || 'Delete failed' });
    } finally {
      setBusy(false);
    }
  };

  const submitMerchant = async (form: { name: string; email?: string; status?: 'ACTIVE' | 'SUSPENDED' }) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      if (editingMerchant) {
        await apiAdminUpdateMerchant(token, editingMerchant.id, form);
        pushToast({ type: 'success', message: 'Merchant updated' });
      } else {
        await apiAdminCreateMerchant(token, form);
        pushToast({ type: 'success', message: 'Merchant created' });
      }
      setShowMerchantForm(false);
      setEditingMerchant(null);
      await refreshMerchants();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      pushToast({ type: 'error', message: e?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const saveMerchantGames = async (merchantId: string, gameIds: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiAdminSetMerchantGames(token, merchantId, gameIds);
      pushToast({ type: 'success', message: 'Merchant games updated' });
      setShowMerchantGames(false);
      setMerchantGamesTarget(null);
      await refreshMerchants();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      pushToast({ type: 'error', message: e?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  };

  const renderAdminUsers = () => {
    return (
      <>
        <h2 className="text-xl font-bold mb-6">{t('manageUsers')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('username')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('email')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{u.name || '-'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{u.email || '-'}</td>
                  <td className="px-4 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                      disabled={busy}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'MERCHANT'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="MERCHANT">MERCHANT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{u.ordersCount || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={busy}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderAdminMerchants = () => {
    const pageSize = 10;
    const term = merchantSearch.trim().toLowerCase();
    const filtered = term
      ? merchants.filter((m) => {
          const hay = `${m.id} ${m.name} ${m.email || ''}`.toLowerCase();
          return hay.includes(term);
        })
      : merchants;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(merchantPage, totalPages);
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    const toggleStatus = async (m: any) => {
      setBusy(true);
      setError(null);
      try {
        const token = await getApiAccessToken();
        const next = m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        await apiAdminUpdateMerchant(token, m.id, { status: next });
        pushToast({ type: 'success', message: `Merchant ${next === 'ACTIVE' ? 'enabled' : 'disabled'}` });
        await refreshMerchants();
      } catch (e: any) {
        setError(e?.message || 'Update failed');
        pushToast({ type: 'error', message: e?.message || 'Update failed' });
      } finally {
        setBusy(false);
      }
    };

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Merchants</h2>
          <button
            onClick={() => {
              setEditingMerchant(null);
              setShowMerchantForm(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:from-blue-600 hover:to-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Merchant</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <input
            value={merchantSearch}
            onChange={(e) => {
              setMerchantSearch(e.target.value);
              setMerchantPage(1);
            }}
            placeholder="Search merchant (id/name/email)"
            className="w-full sm:w-96 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-500">
            {filtered.length} merchants • page {page}/{totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Games</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500 font-mono">{m.id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{m.email || '-'}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        m.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{m.gamesCount}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{m.totalOrders}</td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900">¥{Number(m.totalRevenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMerchant(m);
                          setShowMerchantForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setMerchantGamesTarget(m);
                          setShowMerchantGames(true);
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        Assign Games
                      </button>
                      <button
                        onClick={() => toggleStatus(m)}
                        disabled={busy}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                          m.status === 'ACTIVE'
                            ? 'text-gray-700 hover:bg-gray-100 border-gray-200'
                            : 'text-green-700 hover:bg-green-50 border-green-200'
                        }`}
                      >
                        {m.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No merchants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setMerchantPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setMerchantPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const renderApplications = () => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'APPROVED':
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'REJECTED':
          return <XCircle className="w-5 h-5 text-red-500" />;
        default:
          return <Clock className="w-5 h-5 text-yellow-500" />;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'APPROVED':
          return 'bg-green-100 text-green-700 border-green-200';
        case 'REJECTED':
          return 'bg-red-100 text-red-700 border-red-200';
        default:
          return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
    };

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Merchant Applications</h2>
          <select
            value={applicationsFilter}
            onChange={(e) => setApplicationsFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No applications found.</div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(app.status)}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{app.companyName}</h3>
                      <p className="text-sm text-gray-500">
                        {app.contactName} &bull; {app.contactEmail}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{app.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    <span>User: {app.user?.email || app.userId}</span>
                    <span className="mx-2">&bull;</span>
                    <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveApplication(app.id)}
                        disabled={busy}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectApplication(app.id)}
                        disabled={busy}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {app.reviewNote && (
                  <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded-lg border">
                    <strong>Review Note:</strong> {app.reviewNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-display">{t('admin')}</h1>
        <button onClick={() => navigate('/')} className="text-blue-600 font-medium flex items-center hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('home')}
        </button>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {['games', 'skus', 'merchants', 'users', 'applications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`py-2 px-6 rounded-lg font-medium text-sm transition-all ${
              adminTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'games'
              ? t('manageGames')
              : tab === 'skus'
              ? t('manageSKU')
              : tab === 'merchants'
              ? 'Merchants'
              : tab === 'users'
              ? t('manageUsers')
              : 'Applications'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        {adminTab === 'games'
          ? renderAdminGames()
          : adminTab === 'skus'
          ? renderAdminSKUs()
          : adminTab === 'merchants'
          ? renderAdminMerchants()
          : adminTab === 'users'
          ? renderAdminUsers()
          : renderApplications()}
      </div>

      {/* Game Form Modal */}
      {showGameForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
          onClick={(e) => e.target === e.currentTarget && setShowGameForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingGame ? 'Edit Game' : 'Add Game'}</h3>
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
              <h3 className="text-lg font-bold">{editingSku ? 'Edit SKU' : 'Add SKU'}</h3>
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

      {/* Merchant Form Modal */}
      {showMerchantForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
          onClick={(e) => e.target === e.currentTarget && setShowMerchantForm(false)}
        >
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingMerchant ? 'Edit Merchant' : 'Add Merchant'}</h3>
              <button onClick={() => setShowMerchantForm(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <MerchantForm
              initial={editingMerchant}
              disabled={busy}
              onSubmit={submitMerchant}
              onCancel={() => {
                setShowMerchantForm(false);
                setEditingMerchant(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Merchant Games Modal */}
      {showMerchantGames && merchantGamesTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
          onClick={(e) => e.target === e.currentTarget && setShowMerchantGames(false)}
        >
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Assign Games — {merchantGamesTarget.name}</h3>
              <button onClick={() => setShowMerchantGames(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <MerchantGamesForm
              games={games}
              initialGameIds={merchantGamesTarget.gameIds || []}
              disabled={busy}
              onSubmit={(gameIds) => saveMerchantGames(merchantGamesTarget.id, gameIds)}
              onCancel={() => {
                setShowMerchantGames(false);
                setMerchantGamesTarget(null);
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

function MerchantForm(props: {
  initial: any | null;
  disabled: boolean;
  onSubmit: (data: { name: string; email?: string; status?: 'ACTIVE' | 'SUSPENDED' }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(props.initial?.name || '');
  const [email, setEmail] = useState(props.initial?.email || '');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>(props.initial?.status || 'ACTIVE');

  return (
    <form
      className="grid grid-cols-1 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit({ name, email: email || undefined, status });
      }}
    >
      <div>
        <label className="text-sm text-gray-600">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={props.disabled} required />
      </div>
      <div>
        <label className="text-sm text-gray-600">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={props.disabled} placeholder="merchant@example.com" />
      </div>
      <div>
        <label className="text-sm text-gray-600">Status</label>
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)} disabled={props.disabled}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel} className="px-4 py-2 rounded-xl border border-gray-200">
          Cancel
        </button>
        <button disabled={props.disabled} type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60">
          Save
        </button>
      </div>
    </form>
  );
}

function MerchantGamesForm(props: {
  games: Game[];
  initialGameIds: string[];
  disabled: boolean;
  onSubmit: (gameIds: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(props.initialGameIds));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedArr = Array.from(selected);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit(selectedArr);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Select games for this merchant</div>
        <div className="text-sm text-gray-500">{selectedArr.length} selected</div>
      </div>

      <div className="max-h-[55vh] overflow-auto border border-gray-200 rounded-xl divide-y">
        {props.games.map((g) => (
          <label key={g.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} disabled={props.disabled} />
            <img src={g.iconUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{g.name.en}</div>
              <div className="text-xs text-gray-500 font-mono">{g.id}</div>
            </div>
          </label>
        ))}
        {props.games.length === 0 && <div className="px-4 py-6 text-center text-gray-500">No games found.</div>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={props.onCancel} className="px-4 py-2 rounded-xl border border-gray-200">
          Cancel
        </button>
        <button disabled={props.disabled} type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60">
          Save
        </button>
      </div>
    </form>
  );
}

function GameForm(props: {
  initial: Game | null;
  disabled: boolean;
  onSubmit: (data: {
    merchantId: string;
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
  const [merchantId, setMerchantId] = useState(props.initial?.merchantId || 'merchant_demo');
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
          merchantId,
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
        <label className="text-sm text-gray-600">Merchant ID</label>
        <Input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Badge</label>
        <Select value={badge} onChange={(e) => setBadge(e.target.value)} disabled={props.disabled}>
          <option value="hot">hot</option>
          <option value="sale">sale</option>
          <option value="new">new</option>
        </Select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (ZH)</label>
        <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (JA)</label>
        <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (EN)</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('developer')}</label>
        <Input value={developer} onChange={(e) => setDeveloper(e.target.value)} disabled={props.disabled} />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Icon URL</label>
        <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} disabled={props.disabled} />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Banner URL</label>
        <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Rating</label>
        <Input value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Downloads</label>
        <Input value={downloads} onChange={(e) => setDownloads(e.target.value)} disabled={props.disabled} />
      </div>
      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel} className="px-4 py-2 rounded-xl border border-gray-200">
          {t('cancel')}
        </button>
        <button disabled={props.disabled} type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60">
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
        <Select value={gameId} onChange={(e) => setGameId(e.target.value)} disabled={props.disabled}>
          {props.games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name.en}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (ZH)</label>
        <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Name (JA)</label>
        <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} disabled={props.disabled} />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Name (EN)</label>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('price')}</label>
        <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Original Price</label>
        <Input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">{t('bonusItems')}</label>
        <Input value={bonus} onChange={(e) => setBonus(e.target.value)} disabled={props.disabled} />
      </div>
      <div>
        <label className="text-sm text-gray-600">Currency</label>
        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={props.disabled} />
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
        <button disabled={props.disabled} type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60">
          {t('save')}
        </button>
      </div>
    </form>
  );
}
