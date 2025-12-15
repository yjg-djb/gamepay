import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, Lightbulb, ShieldCheck, Zap } from 'lucide-react';
import { SKUCard } from '../components/SKUCard';
import { PaymentModal } from '../components/PaymentModal';
import { games as fallbackGames } from '../services/mockData';
import { apiGetGameMerchants, apiGetGames } from '../services/api';
import { useAppAuth } from '../auth/useAppAuth';
import type { Game } from '../types';

export const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loginWithRedirect } = useAppAuth();
  const [games, setGames] = useState<Game[]>(fallbackGames);
  
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [merchants, setMerchants] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');

  useEffect(() => {
    // Ensure we land at the top when coming from the homepage card (like the reference UI)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const apiGames = await apiGetGames();
        if (cancelled) return;
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
            imageUrl: s.imageUrl,
            sortOrder: (s as any).sortOrder,
          })),
        }));
        setGames(adapted);
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGetGameMerchants(id);
        if (cancelled) return;
        const ms = (data.merchants || []).map((m) => ({ id: m.id, name: m.name }));
        setMerchants(ms);
        setSelectedMerchantId(ms[0]?.id || '');
      } catch {
        if (cancelled) return;
        setMerchants([]);
        setSelectedMerchantId('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const game = useMemo(() => games.find((g) => g.id === id), [games, id]);

  if (!game) {
    return <div className="pt-20 text-center">{t('gameNotFound')}</div>;
  }

  const currentLang = i18n.language as keyof typeof game.name;
  const gameName = game.name[currentLang] || game.name.en;

  const handleBuy = (skuId: string) => {
    if (!isAuthenticated) {
      void loginWithRedirect();
      return;
    }
    setSelectedSkuId(skuId);
    setShowPayment(true);
  };

  const selectedSku = game.skus.find((s) => s.id === selectedSkuId);

  const sortedSkus = useMemo(() => {
    return [...game.skus].sort((a: any, b: any) => {
      const ao = Number(a.sortOrder ?? 0);
      const bo = Number(b.sortOrder ?? 0);
      if (ao !== bo) return ao - bo;
      return a.price - b.price;
    });
  }, [game.skus]);

  return (
    <div className="animate-fade-in pb-20 pt-16 bg-gray-50 min-h-screen">
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={game.bannerUrl} alt={gameName} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-xl hover:bg-black/40 transition-colors border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">{t('home')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8 mb-10">
            <img 
              src={game.iconUrl} 
              alt={gameName} 
              className="w-32 h-32 rounded-3xl shadow-xl border-4 border-white object-cover bg-gray-100"
            />
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display mb-3">{gameName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="font-medium">{game.developer}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span className="font-bold">{game.rating ?? 0}</span>
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-gray-500">{game.downloads ?? '-'} Downloads</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
               <div className="p-2 bg-blue-100 rounded-xl">
                 <ShieldCheck className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 text-sm">Official Partner</h3>
                 <p className="text-xs text-gray-500 mt-1">Direct recharge from official channels.</p>
               </div>
             </div>
             <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex items-start space-x-3">
               <div className="p-2 bg-purple-100 rounded-xl">
                 <Lightbulb className="w-6 h-6 text-purple-600" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 text-sm">Best Price Guarantee</h3>
                 <p className="text-xs text-gray-500 mt-1">Save up to 20% compared to in-game.</p>
               </div>
             </div>
             <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex items-start space-x-3">
               <div className="p-2 bg-green-100 rounded-xl">
                 <Zap className="w-6 h-6 text-green-600" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 text-sm">Instant Delivery</h3>
                 <p className="text-xs text-gray-500 mt-1">Items added to your account in seconds.</p>
               </div>
             </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('selectProduct')}</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{game.skus.length} Items</span>
          </div>

          {merchants.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="text-sm font-semibold text-gray-700">Merchant</div>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedSkus.map((sku) => (
              <SKUCard 
                key={sku.id} 
                sku={sku} 
                game={game} 
                onBuy={() => handleBuy(sku.id)} 
              />
            ))}
          </div>
        </div>
      </div>

      {showPayment && selectedSku && (
        <PaymentModal 
          game={game} 
          sku={selectedSku} 
          merchantId={selectedMerchantId || undefined}
          onClose={() => setShowPayment(false)} 
        />
      )}
    </div>
  );
};

