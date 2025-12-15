import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Star, Sparkles } from 'lucide-react';
import { GameCard } from '../components/GameCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { games as fallbackGames } from '../services/mockData';
import { apiGetGames } from '../services/api';
import { useStore } from '../store/useStore';
import type { Game } from '../types';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentLang } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState<Game[]>(fallbackGames);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const apiGames = await apiGetGames();
        if (cancelled) return;
        // Adapt API game shape to frontend `Game`
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

  const { featured, newArrivals, specialOffers, all } = useMemo(() => {
    let filtered = games;
    const term = searchTerm.trim().toLowerCase();
    
    if (term) {
      filtered = games.filter((game) => {
      const names = Object.values(game.name).map((n) => n.toLowerCase());
      const dev = game.developer.toLowerCase();
      return names.some((n) => n.includes(term)) || dev.includes(term);
    });
    }

    return {
      featured: filtered.filter(g => g.badge === 'hot'),
      newArrivals: filtered.filter(g => g.badge === 'new'),
      specialOffers: filtered.filter(g => g.badge === 'sale'),
      all: filtered
    };
  }, [games, searchTerm]);

  const Section = ({ title, icon: Icon, games }: { title: string, icon?: any, games: Game[] }) => {
    if (games.length === 0) return null;
    return (
      <section className="mb-12">
        <div className="flex items-center space-x-2 mb-6 px-1">
          {Icon && <Icon className="w-6 h-6 text-blue-600" />}
          <h2 className="text-2xl font-bold text-gray-900 font-display">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, i) => (
            <GameCard 
              key={game.id} 
              game={game} 
              index={i} 
              onClick={(id) => navigate(`/game/${id}`)} 
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="animate-fade-in pb-20">
      <section className="relative overflow-hidden bg-[#0f1014] text-white">
         {/* Dark Background for Carousel Area */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 opacity-50"></div>
         
         <div className="relative pt-10 pb-4">
             <HeroCarousel games={games.slice(0, 5)} onGameClick={(id) => navigate(`/game/${id}`)} />
         </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 mb-12">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!searchTerm && (
          <>
            <Section title={t('featuredGames')} icon={Star} games={featured} />
            <Section title={t('newArrivals')} icon={Sparkles} games={newArrivals} />
            <Section title={t('specialOffers')} icon={Zap} games={specialOffers} />
          </>
        )}
        
        {searchTerm && (
          <Section title={t('allGames')} games={all} />
        )}

        {!searchTerm && all.length > 0 && (
          <div className="mt-12 text-center">
            <button className="bg-white border border-gray-200 text-gray-600 px-8 py-3 rounded-full hover:bg-gray-50 transition-colors font-medium">
              {t('allGames')}
          </button>
        </div>
        )}
        </div>
    </div>
  );
};
