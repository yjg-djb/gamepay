import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '../types';
import { useStore } from '../store/useStore';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface HeroCarouselProps {
  games: Game[];
  onGameClick: (id: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ games, onGameClick }) => {
  const { t } = useTranslation();
  const { currentLang } = useStore();

  // Pick top 5 games for the slider
  const featuredGames = games.slice(0, 5);

  return (
    <div className="relative w-full py-8 group">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView={'auto'}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        pagination={{ 
            clickable: true,
            dynamicBullets: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="w-full !pb-12"
        breakpoints={{
            320: {
                slidesPerView: 1.5, // 手机端显示中间和两边各一点
            },
            640: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 2.5, // 桌面端更宽
            }
        }}
      >
        {featuredGames.map((game) => {
           const gameName = game.name[currentLang] || game.name.en;
           
           return (
            <SwiperSlide 
                key={game.id} 
                className="max-w-2xl overflow-visible transition-all duration-300 rounded-2xl"
            >
              {({ isActive }) => (
                <div 
                    className={`relative aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl cursor-pointer transition-all duration-300 ${isActive ? 'ring-4 ring-white/50' : 'brightness-75'}`}
                    onClick={() => onGameClick(game.id)}
                >
                  <img 
                    src={game.bannerUrl} 
                    alt={gameName} 
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className={`absolute bottom-0 left-0 p-6 sm:p-8 w-full transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        {/* Tags */}
                        <div className="flex space-x-2 mb-2">
                             {game.badge === 'hot' && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">HOT</span>}
                             {game.badge === 'new' && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>}
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 font-display">{gameName}</h2>
                        <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-2 max-w-lg">
                            {t('gameDiscount')} • {game.developer}
                        </p>
                        
                        <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors flex items-center w-fit">
                            {t('buyNow')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </SwiperSlide>
          )
        })}
      </Swiper>

      {/* Custom Navigation Buttons - Positioned absolutely relative to container */}
      <button className="swiper-button-prev-custom absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:opacity-100 opacity-0">
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
      <button className="swiper-button-next-custom absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:opacity-100 opacity-0">
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* CSS Override for Pagination */}
      <style>{`
        .swiper-pagination-bullet {
            background: rgba(255,255,255,0.5);
            width: 8px;
            height: 8px;
            transition: all 0.3s;
        }
        .swiper-pagination-bullet-active {
            background: #fff;
            width: 24px;
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

