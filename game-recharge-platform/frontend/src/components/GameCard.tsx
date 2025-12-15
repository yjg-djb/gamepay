import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Game } from '../types';
import { useStore } from '../store/useStore';

interface GameCardProps {
  game: Game;
  index: number;
  onClick: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, index, onClick }) => {
  const { t } = useTranslation();
  const { currentLang } = useStore();
  
  const gameName = game.name[currentLang] || game.name.en;
  
  const getBadgeStyle = (badge: string) => {
    switch(badge) {
      case 'hot': return 'badge-hot';
      case 'sale': return 'badge-sale';
      case 'new': return 'badge-new';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeText = (badge: string) => {
    switch(badge) {
      case 'hot': return t('hotSale');
      case 'sale': return t('discount');
      case 'new': return t('newItem');
      default: return '';
    }
  };

  return (
    <div 
      className="game-card bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer group hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onClick(game.id)}
    >
      {/* Banner Section - Large and prominent */}
      <div className="relative w-full aspect-[21/9] overflow-hidden">
        <img 
            src={game.bannerUrl} 
            alt={`${gameName} Banner`}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        
        {/* Gradient Overlay for text readability if we put text on banner, but here we just use it for polish */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badge */}
        <div className="absolute top-4 left-0">
           <span className={`${getBadgeStyle(game.badge)} text-white text-xs font-bold px-4 py-1.5 rounded-r-full shadow-lg`}>
            {getBadgeText(game.badge)}
          </span>
        </div>
      </div>
      
      {/* Info Section - Clean and horizontal */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src={game.iconUrl} 
            alt={gameName} 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow-md border border-gray-100 bg-white object-cover"
          />
          <div>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{gameName}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{game.developer}</p>
          </div>
        </div>
        
        <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition-colors">
            <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
