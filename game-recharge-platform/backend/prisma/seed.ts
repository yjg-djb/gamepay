import { prisma } from '../src/db';

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function pick<T>(i: number, arr: T[]): T {
  return arr[i % arr.length];
}

async function main() {
  // --- Merchants (stable IDs for demo login) ---
  const merchants = await Promise.all([
    prisma.merchant.upsert({
      where: { id: 'merchant_demo' },
      create: { id: 'merchant_demo', name: 'Demo Merchant', email: 'demo@merchant.local', status: 'ACTIVE' },
      update: { name: 'Demo Merchant', email: 'demo@merchant.local', status: 'ACTIVE' },
    }),
    prisma.merchant.upsert({
      where: { id: 'merchant_a' },
      create: { id: 'merchant_a', name: 'Merchant A', email: 'a@merchant.local', status: 'ACTIVE' },
      update: { name: 'Merchant A', email: 'a@merchant.local', status: 'ACTIVE' },
    }),
    prisma.merchant.upsert({
      where: { id: 'merchant_b' },
      create: { id: 'merchant_b', name: 'Merchant B', email: 'b@merchant.local', status: 'ACTIVE' },
      update: { name: 'Merchant B', email: 'b@merchant.local', status: 'ACTIVE' },
    }),
    prisma.merchant.upsert({
      where: { id: 'merchant_c' },
      create: { id: 'merchant_c', name: 'Merchant C', email: 'c@merchant.local', status: 'ACTIVE' },
      update: { name: 'Merchant C', email: 'c@merchant.local', status: 'ACTIVE' },
    }),
    prisma.merchant.upsert({
      where: { id: 'merchant_official' },
      create: { id: 'merchant_official', name: 'Official Partner', email: 'official@merchant.local', status: 'ACTIVE' },
      update: { name: 'Official Partner', email: 'official@merchant.local', status: 'ACTIVE' },
    }),
  ]);

  // Local image paths (served from frontend public folder)
  const topIcons = [
    'icon_1A88CBMaO7G.png',
    'icon_4T2phVU0T7S.png',
    'icon_5h84vwM69vk.png',
    'icon_88HdPTjcd6f.png',
    'icon_9W6yP5U5i8h.png',
    'icon_AdXR4V33Zvz.png',
    'icon_aOge3C5IFzK.png',
    'icon_AXBckJo0syl.png',
    'icon_c6MTU6wJL25.png',
    'icon_dnVdWTn6UhC.png',
    'icon_eJtOPSV8wFR.png',
    'icon_fdlKG0CAJvn.png',
  ];

  const topBanners = [
    'banner_5VE288BXcEx.png',
    'banner_67Axck2xpqA.png',
    'banner_6Brm4qK6aUk.png',
    'banner_AB2CmeGBt5u.png',
    'banner_aNaxXugjy8M.png',
    'banner_aoh6OvTh9c8.png',
    'banner_bGjbn7jsVbk.png',
    'banner_Bpzo6YG5CEd.png',
    'banner_Bsw7Hdg3ONB.png',
    'banner_C6mHgn3NaKG.png',
    'banner_cAYSxGQxs0J.png',
    'banner_CH1SbTS82zv.png',
  ];

  // --- Games ---
  const games = [
    {
      id: 'game_18trip',
      merchantId: 'merchant_official',
      nameZh: '18TRIP',
      nameJa: '18TRIP',
      nameEn: '18TRIP',
      developer: 'LIBER Entertainment',
      iconUrl: '/images/games/18trip/1_DENldD4Ox16.png',
      bannerUrl: '/images/top/banner_5VE288BXcEx.png',
      badge: 'hot',
      rating: 4.9,
      downloads: '1M+',
    },
    {
      id: 'game_monster_strike',
      merchantId: 'merchant_a',
      nameZh: '怪物弹珠',
      nameJa: 'モンスターストライク',
      nameEn: 'Monster Strike',
      developer: 'MIXI',
      iconUrl: `/images/top/${topIcons[0]}`,
      bannerUrl: `/images/top/${topBanners[1]}`,
      badge: 'hot',
      rating: 4.8,
      downloads: '50M+',
    },
    {
      id: 'game_dragon_poker',
      merchantId: 'merchant_b',
      nameZh: '龙扑克',
      nameJa: 'ドラゴンポーカー',
      nameEn: 'Dragon Poker',
      developer: 'Asobism',
      iconUrl: `/images/top/${topIcons[1]}`,
      bannerUrl: `/images/top/${topBanners[2]}`,
      badge: 'sale',
      rating: 4.5,
      downloads: '10M+',
    },
  ];

  for (let i = 0; i < 10; i++) {
    const badges = ['new', 'sale', 'hot'] as const;
    const owner = pick(i, ['merchant_a', 'merchant_b', 'merchant_c']);
    games.push({
      id: `game_random_${i}`,
      merchantId: owner,
      nameZh: `游戏 ${i + 1}`,
      nameJa: `ゲーム ${i + 1}`,
      nameEn: `Game ${i + 1}`,
      developer: `Developer ${i + 1}`,
      iconUrl: `/images/top/${topIcons[i % topIcons.length]}`,
      bannerUrl: `/images/top/${topBanners[i % topBanners.length]}`,
      badge: badges[i % 3],
      rating: 4.0 + (i % 10) / 10,
      downloads: `${(i + 1) * 10}k+`,
    });
  }

  for (const g of games) {
    await prisma.game.upsert({ where: { id: g.id }, create: g, update: g });
  }

  // --- MerchantGame bindings (many-to-many; allow overlaps) ---
  const bindings: Record<string, string[]> = {
    merchant_demo: games.map((g) => g.id),
    merchant_a: ['game_monster_strike', 'game_18trip', ...Array.from({ length: 6 }, (_, i) => `game_random_${i}`)],
    merchant_b: ['game_dragon_poker', ...Array.from({ length: 6 }, (_, i) => `game_random_${i + 3}`)],
    merchant_c: ['game_18trip', 'game_random_1', 'game_random_2', 'game_random_7', 'game_random_9'],
    merchant_official: ['game_18trip'],
  };

  for (const [merchantId, gameIds] of Object.entries(bindings)) {
    for (const gameId of gameIds) {
      await prisma.merchantGame.upsert({
        where: { merchantId_gameId: { merchantId, gameId } },
        create: { merchantId, gameId, isActive: true },
        update: { isActive: true },
      });
    }
  }

  // --- SKUs ---
  const tripSkuImages = [
    '1_DENldD4Ox16.png',
    '2_2jXn4wj83Db.png',
    '3_61uuOsgLAWv.png',
    '4_3YOcFKvQAwj.png',
    '5_7q2EH4DWoqI.png',
    '6_0AqW0N1aO5h.png',
    '99_Is9DEe2sEip.png',
    '100_CiGCr7i04qL.png',
  ];

  const tripSkus = [
    { id: 'sku_18t_1', nameZh: 'ダイヤパックA', nameJa: 'ダイヤパックA', nameEn: 'Diamond Pack A', price: 120, originalPrice: 160, bonus: '', limited: false, imageUrl: `/images/games/18trip/${tripSkuImages[0]}` },
    { id: 'sku_18t_2', nameZh: 'ダイヤパックB', nameJa: 'ダイヤパックB', nameEn: 'Diamond Pack B', price: 490, originalPrice: 610, bonus: '20%', limited: false, imageUrl: `/images/games/18trip/${tripSkuImages[1]}` },
    { id: 'sku_18t_3', nameZh: 'ダイヤパックC', nameJa: 'ダイヤパックC', nameEn: 'Diamond Pack C', price: 1000, originalPrice: 1220, bonus: '18%', limited: false, imageUrl: `/images/games/18trip/${tripSkuImages[2]}` },
    { id: 'sku_18t_4', nameZh: 'ダイヤパックD', nameJa: 'ダイヤパックD', nameEn: 'Diamond Pack D', price: 1480, originalPrice: 1840, bonus: '20%', limited: true, imageUrl: `/images/games/18trip/${tripSkuImages[3]}` },
    { id: 'sku_18t_5', nameZh: 'ダイヤパックE', nameJa: 'ダイヤパックE', nameEn: 'Diamond Pack E', price: 2000, originalPrice: 2440, bonus: '18%', limited: false, imageUrl: `/images/games/18trip/${tripSkuImages[4]}` },
    { id: 'sku_18t_6', nameZh: 'ダイヤパックF', nameJa: 'ダイヤパックF', nameEn: 'Diamond Pack F', price: 3000, originalPrice: 3680, bonus: '18%', limited: false, imageUrl: `/images/games/18trip/${tripSkuImages[5]}` },
    { id: 'sku_18t_7', nameZh: 'パス', nameJa: 'パス', nameEn: 'Pass', price: 480, originalPrice: 610, bonus: '21%', limited: true, imageUrl: `/images/games/18trip/${tripSkuImages[6]}` },
    { id: 'sku_18t_8', nameZh: '特別パック', nameJa: '特別パック', nameEn: 'Special Pack', price: 10000, originalPrice: 12200, bonus: '18%', limited: true, imageUrl: `/images/games/18trip/${tripSkuImages[7]}` },
  ].map((s, idx) => ({
    ...s,
    gameId: 'game_18trip',
    currency: 'JPY',
    sortOrder: idx + 1,
  }));

  const baseSkus = [
    {
      id: 'sku_ms_1',
      gameId: 'game_monster_strike',
      nameZh: '超满开包',
      nameJa: '超満開パック',
      nameEn: 'Super Pack',
      price: 10000,
      originalPrice: 12000,
      bonus: '5倍',
      currency: 'JPY',
      limited: true,
      imageUrl: `/images/top/${topBanners[0]}`,
      sortOrder: 1,
    },
    {
      id: 'sku_ms_2',
      gameId: 'game_monster_strike',
      nameZh: '满开包',
      nameJa: '満開パック',
      nameEn: 'Bloom Pack',
      price: 4600,
      originalPrice: 5000,
      bonus: '7倍',
      currency: 'JPY',
      limited: false,
      imageUrl: `/images/top/${topBanners[1]}`,
      sortOrder: 2,
    },
    {
      id: 'sku_dp_1',
      gameId: 'game_dragon_poker',
      nameZh: '龙石720个',
      nameJa: '竜石720個',
      nameEn: '720 Dragon Stones',
      price: 10000,
      originalPrice: 12000,
      bonus: '18%',
      currency: 'JPY',
      limited: true,
      imageUrl: `/images/top/${topBanners[2]}`,
      sortOrder: 1,
    },
  ];

  const randomSkus: any[] = [];
  for (let i = 0; i < 10; i++) {
    const gameId = `game_random_${i}`;
    const imgs = [
      topBanners[i % topBanners.length],
      topBanners[(i + 1) % topBanners.length],
      topBanners[(i + 2) % topBanners.length],
      topBanners[(i + 3) % topBanners.length],
      topBanners[(i + 4) % topBanners.length],
      topBanners[(i + 5) % topBanners.length],
    ];

    const skuRows = [
      { suffix: 1, nameZh: '小额包', nameJa: '小額パック', nameEn: 'Small Pack', price: 160, originalPrice: 200, bonus: '20%', limited: false },
      { suffix: 2, nameZh: '标准包', nameJa: '標準パック', nameEn: 'Standard Pack', price: 480, originalPrice: 610, bonus: '21%', limited: false },
      { suffix: 3, nameZh: '进阶包', nameJa: '上級パック', nameEn: 'Advanced Pack', price: 980, originalPrice: 1220, bonus: '20%', limited: true },
      { suffix: 4, nameZh: '豪华包', nameJa: '豪華パック', nameEn: 'Deluxe Pack', price: 2400, originalPrice: 3050, bonus: '21%', limited: true },
      { suffix: 5, nameZh: '大师包', nameJa: 'マスターパック', nameEn: 'Master Pack', price: 4900, originalPrice: 6100, bonus: '20%', limited: false },
      { suffix: 6, nameZh: '至尊包', nameJa: 'アルティメット', nameEn: 'Ultimate Pack', price: 9800, originalPrice: 12200, bonus: '20%', limited: true },
    ];

    skuRows.forEach((s, idx) => {
      randomSkus.push({
        id: `sku_rnd_${i}_${s.suffix}`,
        gameId,
        nameZh: s.nameZh,
        nameJa: s.nameJa,
        nameEn: s.nameEn,
        price: s.price,
        originalPrice: s.originalPrice,
        bonus: s.bonus,
        currency: 'JPY',
        limited: s.limited,
        imageUrl: `/images/top/${imgs[idx % imgs.length]}`,
        sortOrder: idx + 1,
      });
    });
  }

  const allSkus = [...tripSkus, ...baseSkus, ...randomSkus];

  for (const s of allSkus) {
    await prisma.sKU.upsert({ where: { id: s.id }, create: s, update: s });
  }

  // --- Demo users ---
  const demoUsers = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.upsert({
        where: { auth0Sub: `demo|user|${i + 1}` },
        create: { id: `user_demo_${i + 1}`, auth0Sub: `demo|user|${i + 1}`, email: `user${i + 1}@demo.local`, name: `Demo User ${i + 1}`, role: 'USER' },
        update: { email: `user${i + 1}@demo.local`, name: `Demo User ${i + 1}`, role: 'USER' },
      })
    )
  );

  // --- Orders (20-50 demo orders) ---
  const merchantIds = ['merchant_a', 'merchant_b', 'merchant_c'];
  const skuByGame = new Map<string, string[]>();
  for (const sku of allSkus) {
    const arr = skuByGame.get(sku.gameId) || [];
    arr.push(sku.id);
    skuByGame.set(sku.gameId, arr);
  }

  // Precompute merchant->gameIds available
  const merchantGameMap = new Map<string, string[]>();
  for (const m of merchantIds) merchantGameMap.set(m, bindings[m] || []);

  for (let i = 1; i <= 30; i++) {
    const id = `ord_demo_${String(i).padStart(3, '0')}`;
    const merchantId = pick(i, merchantIds);
    const gameId = pick(i * 3, merchantGameMap.get(merchantId) || ['game_monster_strike']);
    const skus = skuByGame.get(gameId) || [];
    const skuId = pick(i * 7, skus.length > 0 ? skus : ['sku_ms_1']);

    const sku = await prisma.sKU.findUnique({ where: { id: skuId } });
    if (!sku) continue;

    const user = pick(i, demoUsers);
    const status = i % 5 === 0 ? 'PENDING' : 'PAID';
    const createdAt = daysAgo(i % 7);
    createdAt.setUTCHours(8 + (i % 12), (i * 7) % 60, 0, 0);

    await prisma.order.upsert({
      where: { id },
      create: {
        id,
        userId: user.id,
        merchantId,
        gameId,
        skuId,
        visitorId: user.auth0Sub,
        amount: sku.price,
        currency: sku.currency,
        status: status as any,
        createdAt,
      },
      update: {
        merchantId,
        gameId,
        skuId,
        visitorId: user.auth0Sub,
        amount: sku.price,
        currency: sku.currency,
        status: status as any,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
