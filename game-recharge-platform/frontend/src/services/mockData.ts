import { Game, Order } from '../types';

const topIcons = [
  'icon_1A88CBMaO7G.png', 'icon_4T2phVU0T7S.png', 'icon_5h84vwM69vk.png', 'icon_88HdPTjcd6f.png',
  'icon_9W6yP5U5i8h.png', 'icon_AdXR4V33Zvz.png', 'icon_aOge3C5IFzK.png', 'icon_AXBckJo0syl.png',
  'icon_c6MTU6wJL25.png', 'icon_dnVdWTn6UhC.png', 'icon_eJtOPSV8wFR.png', 'icon_EURmHCnYHg3.0.png',
  'icon_fdlKG0CAJvn.png', 'icon_FePW2WOJvoJ.png', 'icon_GdI0GjVbukL.png', 'icon_InhgRXRCA0E.png'
];

const topBanners = [
  'banner_5VE288BXcEx.png', 'banner_67Axck2xpqA.png', 'banner_6Brm4qK6aUk.png', 'banner_AB2CmeGBt5u.png',
  'banner_aNaxXugjy8M.png', 'banner_aoh6OvTh9c8.png', 'banner_bGjbn7jsVbk.png', 'banner_Bpzo6YG5CEd.png',
  'banner_Bsw7Hdg3ONB.png', 'banner_C6mHgn3NaKG.png', 'banner_cAYSxGQxs0J.png', 'banner_CH1SbTS82zv.png',
  'banner_cmXxZwvbjn5.png', 'banner_eOuVfhgi639.png', 'banner_EwMCJ2laX2z.png', 'banner_FHACX1he4WE.png'
];

const tripSkus = [
  { id: 'sku_18t_1', name: { zh: 'ダイヤパックA', ja: 'ダイヤパックA', en: 'Diamond Pack A' }, price: 120, originalPrice: 120, image: '1_DENldD4Ox16.png' },
  { id: 'sku_18t_2', name: { zh: 'ダイヤパックB', ja: 'ダイヤパックB', en: 'Diamond Pack B' }, price: 490, originalPrice: 490, image: '2_2jXn4wj83Db.png' },
  { id: 'sku_18t_3', name: { zh: 'ダイヤパックC', ja: 'ダイヤパックC', en: 'Diamond Pack C' }, price: 1000, originalPrice: 1000, image: '3_61uuOsgLAWv.png' },
  { id: 'sku_18t_4', name: { zh: 'ダイヤパックD', ja: 'ダイヤパックD', en: 'Diamond Pack D' }, price: 1480, originalPrice: 1480, image: '4_3YOcFKvQAwj.png' },
  { id: 'sku_18t_5', name: { zh: 'ダイヤパックE', ja: 'ダイヤパックE', en: 'Diamond Pack E' }, price: 2000, originalPrice: 2000, image: '5_7q2EH4DWoqI.png' },
  { id: 'sku_18t_6', name: { zh: 'ダイヤパックF', ja: 'ダイヤパックF', en: 'Diamond Pack F' }, price: 3000, originalPrice: 3000, image: '6_0AqW0N1aO5h.png' },
  { id: 'sku_18t_7', name: { zh: 'パス', ja: 'パス', en: 'Pass' }, price: 480, originalPrice: 480, image: '99_Is9DEe2sEip.png' },
  { id: 'sku_18t_8', name: { zh: '特別パック', ja: '特別パック', en: 'Special Pack' }, price: 10000, originalPrice: 10000, image: '100_CiGCr7i04qL.png' },
];

export const games: Game[] = [
  // 18TRIP Game
  {
    id: 'game_18trip',
    merchantId: 'merchant_official',
    name: { zh: '18TRIP', ja: '18TRIP', en: '18TRIP' },
    developer: 'LIBER Entertainment',
    iconUrl: '/images/games/18trip/1_DENldD4Ox16.png',
    bannerUrl: '/images/top/banner_5VE288BXcEx.png', // Fallback banner
    rating: 4.9,
    downloads: '1M+',
    badge: 'hot',
    skus: tripSkus.map(s => ({
      id: s.id,
      gameId: 'game_18trip',
      name: s.name,
      price: s.price,
      originalPrice: s.originalPrice,
      bonus: '',
      currency: 'JPY',
      limited: false,
      imageUrl: `/images/games/18trip/${s.image}`
    }))
  },
    { id: 'game_monster_strike', merchantId: 'merchant_demo', name: { zh: '怪物弹珠', ja: 'モンスターストライク', en: 'Monster Strike' }, developer: 'MIXI', iconUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=200&h=200&fit=crop', bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop', rating: 4.8, downloads: '50M+', badge: 'hot', skus: [{ id: 'sku_ms_1', gameId: 'game_monster_strike', name: { zh: '超满开包', ja: '超満開パック', en: 'Super Pack' }, price: 10000, originalPrice: 12000, bonus: '5倍', currency: 'JPY', limited: true },{ id: 'sku_ms_2', gameId: 'game_monster_strike', name: { zh: '满开包', ja: '満開パック', en: 'Bloom Pack' }, price: 4600, originalPrice: 5000, bonus: '7倍', currency: 'JPY', limited: false }] },
    { id: 'game_dragon_poker', merchantId: 'merchant_demo', name: { zh: '龙扑克', ja: 'ドラゴンポーカー', en: 'Dragon Poker' }, developer: 'Asobism', iconUrl: 'https://images.unsplash.com/photo-1627856014759-2a01d51bc58c?w=200&h=200&fit=crop', bannerUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=600&fit=crop', rating: 4.5, downloads: '10M+', badge: 'sale', skus: [{ id: 'sku_dp_1', gameId: 'game_dragon_poker', name: { zh: '龙石720个', ja: '竜石720個', en: '720 Dragon Stones' }, price: 10000, originalPrice: 12000, bonus: '18%', currency: 'JPY', limited: true }] }
];

// Generate more random games
for (let i = 0; i < 15; i++) {
  const icon = topIcons[i % topIcons.length];
  const banner = topBanners[i % topBanners.length];
  games.push({
    id: `game_random_${i}`,
    merchantId: 'merchant_demo',
    name: { zh: `Game ${i+1}`, ja: `ゲーム ${i+1}`, en: `Game ${i+1}` },
    developer: `Developer ${i+1}`,
    iconUrl: `/images/top/${icon}`,
    bannerUrl: `/images/top/${banner}`,
    rating: 4.0 + (i % 10) / 10,
    downloads: `${(i+1) * 10}k+`,
    badge: i % 3 === 0 ? 'new' : (i % 3 === 1 ? 'sale' : 'hot'),
    skus: [
      { id: `sku_rnd_${i}_1`, gameId: `game_random_${i}`, name: { zh: 'Coin Pack 1', ja: 'コインパック 1', en: 'Coin Pack 1' }, price: 1000, originalPrice: 1000, bonus: '', currency: 'JPY', limited: false },
      { id: `sku_rnd_${i}_2`, gameId: `game_random_${i}`, name: { zh: 'Coin Pack 2', ja: 'コインパック 2', en: 'Coin Pack 2' }, price: 5000, originalPrice: 5500, bonus: '10%', currency: 'JPY', limited: true }
    ]
  });
}

export const mockOrders: Order[] = [
    { id: 'ORD001', amount: 10000, currency: 'JPY', status: 'PAID', createdAt: '2025-01-10', game: games[0], sku: games[0].skus[0] },
    { id: 'ORD002', amount: 4600, currency: 'JPY', status: 'PAID', createdAt: '2025-01-09', game: games[0], sku: games[0].skus[1] },
    { id: 'ORD003', amount: 10000, currency: 'JPY', status: 'PENDING', createdAt: '2025-01-08', game: games[1], sku: games[1].skus[0] }
];

export const mockMerchantOrders: Order[] = [
    {id:'MO001',amount:10000,currency:'JPY',createdAt:'2025-01-10 14:30',status:'PAID',game:games[0],sku:games[0].skus[0]},
    {id:'MO002',amount:4600,currency:'JPY',createdAt:'2025-01-10 13:15',status:'PAID',game:games[0],sku:games[0].skus[1]},
    {id:'MO003',amount:10000,currency:'JPY',createdAt:'2025-01-10 12:00',status:'PENDING',game:games[1],sku:games[1].skus[0]}
];
