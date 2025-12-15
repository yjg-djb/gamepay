import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { SKU, Game } from '../types';
import { useStore } from '../store/useStore';

interface SKUCardProps {
  sku: SKU;
  game: Game;
  onBuy: (skuId: string, gameId: string) => void;
}

export const SKUCard: React.FC<SKUCardProps> = ({ sku, game, onBuy }) => {
  const { t } = useTranslation();
  const { currentLang } = useStore();
  
  const skuName = sku.name[currentLang] || sku.name.en;
  const discount = Math.round((1 - sku.price / sku.originalPrice) * 100);
  const cover = sku.imageUrl || game.bannerUrl || game.iconUrl;

  return (
    <div 
      className="relative bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
      onClick={() => onBuy(sku.id, game.id)}
    >
      {sku.limited && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="badge-hot text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {t('limitedTime')}
          </span>
        </div>
      )}
      
      {sku.bonus && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg border border-green-200">
            +{sku.bonus}
          </span>
        </div>
      )}
      
      {/* Cover */}
      <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={skuName}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <ShoppingCart className="w-10 h-10 text-blue-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70"></div>
        </div>
        
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.75rem]">{skuName}</h3>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400 line-through">
            {sku.currency}{sku.originalPrice.toLocaleString()}
          </div>
            <div className="text-lg font-extrabold text-gray-900">
            {sku.currency}{sku.price.toLocaleString()}
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg border border-red-100">
            -{discount}% OFF
            </span>
          </div>
        </div>
        
        <button
          type="button"
          className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-sm opacity-95 group-hover:opacity-100 transform group-hover:translate-y-[-1px] transition-all"
        >
          {t('buyNow')}
        </button>
      </div>
    </div>
  );
};

