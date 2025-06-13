import { db } from './index';
import { 
  stores,
  categories, 
  menuItems, 
  options, 
  toppings, 
  tables, 
  staffMembers,
  settings,
  storeInfo
} from './schema';

const seed = async () => {
  console.log('Seeding database...');
  
  // 店舗データの作成
  const storeData = await db.insert(stores).values({
    storeCode: 'STORE001',
    name: 'Accorto レストラン',
    address: '東京都渋谷区1-1-1',
    phone: '03-1234-5678',
    email: 'info@accorto.example.com',
    password: 'password123',
    ownerName: 'オーナー様',
    active: true,
  }).returning();
  
  const storeId = storeData[0].id;
  
  // カテゴリデータの作成
  const categoriesData = await db.insert(categories).values([
    { storeId, name: '前菜・サラダ', description: '食事の前に楽しむ一品やフレッシュサラダ' },
    { storeId, name: 'ピザ', description: '本格石窯で焼き上げるピザ' },
    { storeId, name: 'パスタ・リゾット', description: '手打ちパスタと本格リゾット' },
    { storeId, name: 'メイン料理', description: '厳選素材のメインディッシュ' },
    { storeId, name: 'デザート', description: '手作りの絶品スイーツ' },
    { storeId, name: 'ドリンク', description: '厳選ドリンク各種' },
  ]).returning();
  
  // メニューアイテムデータの作成
  await db.insert(menuItems).values([
    // 前菜・サラダ
    {
      storeId,
      categoryId: categoriesData[0].id,
      name: 'シーザーサラダ',
      description: '新鮮なロメインレタスとクルトンのクラシックサラダ',
      price: 890,
      image: '/assets/images/caesar-salad.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[0].id,
      name: 'カプレーゼ',
      description: '新鮮モッツァレラとトマト、バジルの前菜',
      price: 1200,
      image: '/assets/images/caprese.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[0].id,
      name: 'プロシュート',
      description: '24ヶ月熟成生ハムとメロンの盛り合わせ',
      price: 1800,
      image: '/assets/images/prosciutto.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[0].id,
      name: 'ブルスケッタ',
      description: 'トマトとガーリックの香ばしいトースト',
      price: 680,
      image: '/assets/images/bruschetta.jpg',
      available: true,
    },

    // ピザ
    {
      storeId,
      categoryId: categoriesData[1].id,
      name: 'マルゲリータ',
      description: 'トマト、モッツァレラ、バジルのクラシックピザ',
      price: 1680,
      image: '/assets/images/margherita.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[1].id,
      name: 'クアトロフォルマッジ',
      description: '4種のチーズが織りなす濃厚な味わい',
      price: 2180,
      image: '/assets/images/quattro-formaggi.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[1].id,
      name: 'ディアボラ',
      description: 'スパイシーサラミとチリペッパーのピザ',
      price: 1980,
      image: '/assets/images/diavola.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[1].id,
      name: 'プロシュート・エ・ルッコラ',
      description: '生ハムとルッコラの贅沢ピザ',
      price: 2480,
      image: '/assets/images/prosciutto-rucola.jpg',
      available: true,
    },

    // パスタ・リゾット
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: 'カルボナーラ',
      description: 'クリーミーな卵とベーコンのパスタ',
      price: 1600,
      image: '/assets/images/carbonara.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: 'ボロネーゼ',
      description: '本場ボローニャ風ミートソースパスタ',
      price: 1800,
      image: '/assets/images/bolognese.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: 'ペスカトーレ',
      description: '魚介の旨味たっぷりトマトソースパスタ',
      price: 2200,
      image: '/assets/images/pescatore.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: 'アラビアータ',
      description: 'ピリ辛トマトソースのスパイシーパスタ',
      price: 1450,
      image: '/assets/images/arrabbiata.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: 'きのこのリゾット',
      description: '5種のきのこと白トリュフオイルのリゾット',
      price: 1900,
      image: '/assets/images/mushroom-risotto.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[2].id,
      name: '海老とアスパラのリゾット',
      description: '新鮮海老とアスパラガスのクリーミーリゾット',
      price: 2100,
      image: '/assets/images/shrimp-risotto.jpg',
      available: true,
    },

    // メイン料理
    {
      storeId,
      categoryId: categoriesData[3].id,
      name: 'ビーフステーキ',
      description: 'A5ランク和牛のステーキと季節の野菜添え',
      price: 3800,
      image: '/assets/images/beef-steak.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[3].id,
      name: '子羊のロースト',
      description: 'ハーブ香る子羊のロースト',
      price: 3200,
      image: '/assets/images/lamb-roast.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[3].id,
      name: '鮮魚のアクアパッツァ',
      description: '本日の鮮魚をトマトと白ワインで煮込んだ一品',
      price: 2800,
      image: '/assets/images/acqua-pazza.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[3].id,
      name: 'チキンのグリル',
      description: 'ハーブマリネした鶏胸肉のグリル',
      price: 2200,
      image: '/assets/images/grilled-chicken.jpg',
      available: true,
    },

    // デザート
    {
      storeId,
      categoryId: categoriesData[4].id,
      name: 'ティラミス',
      description: 'マスカルポーネとコーヒーの定番デザート',
      price: 750,
      image: '/assets/images/tiramisu.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[4].id,
      name: 'パンナコッタ',
      description: 'なめらかなイタリアンデザート、季節のフルーツ添え',
      price: 680,
      image: '/assets/images/panna-cotta.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[4].id,
      name: 'ジェラート3種盛り',
      description: 'バニラ、チョコレート、ストロベリーの3種盛り',
      price: 850,
      image: '/assets/images/gelato.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[4].id,
      name: 'カンノーリ',
      description: 'シチリア伝統の揚げ菓子、リコッタクリーム入り',
      price: 780,
      image: '/assets/images/cannoli.jpg',
      available: true,
    },

    // ドリンク
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'エスプレッソ',
      description: '濃厚で香り高い本格エスプレッソ',
      price: 450,
      image: '/assets/images/espresso.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'カプチーノ',
      description: 'ふわふわミルクフォームのカプチーノ',
      price: 550,
      image: '/assets/images/cappuccino.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'ハウスワイン（赤）',
      description: 'イタリア産の厳選赤ワイン',
      price: 750,
      image: '/assets/images/red-wine.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'ハウスワイン（白）',
      description: 'フルーティーな白ワイン',
      price: 750,
      image: '/assets/images/white-wine.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'サンペレグリノ',
      description: 'イタリア産スパークリングウォーター',
      price: 400,
      image: '/assets/images/sanpellegrino.jpg',
      available: true,
    },
    {
      storeId,
      categoryId: categoriesData[5].id,
      name: 'オレンジジュース',
      description: '100%フレッシュオレンジジュース',
      price: 480,
      image: '/assets/images/orange-juice.jpg',
      available: true,
    },
  ]);
  
  // テーブルデータの作成
  await db.insert(tables).values([
    { storeId, number: 1, capacity: 2, area: 'area1', status: 'available' },
    { storeId, number: 2, capacity: 2, area: 'area1', status: 'available' },
    { storeId, number: 3, capacity: 4, area: 'area1', status: 'available' },
    { storeId, number: 4, capacity: 4, area: 'area1', status: 'occupied' },
    { storeId, number: 5, capacity: 6, area: 'area2', status: 'available' },
    { storeId, number: 6, capacity: 6, area: 'area2', status: 'available' },
    { storeId, number: 7, capacity: 8, area: 'area2', status: 'reserved' },
    { storeId, number: 8, capacity: 2, area: 'area3', status: 'available' },
    { storeId, number: 9, capacity: 4, area: 'area3', status: 'available' },
    { storeId, number: 10, capacity: 2, area: 'area4', status: 'maintenance' },
  ]);
  
  // スタッフデータの作成
  await db.insert(staffMembers).values([
    { name: '管理者', email: 'admin@example.com', role: 'admin' },
    { name: 'スタッフ1', email: 'staff1@example.com', role: 'staff' },
    { name: 'キッチン1', email: 'kitchen1@example.com', role: 'kitchen' },
  ]);
  
  // 店舗情報の作成
  await db.insert(storeInfo).values({
    name: 'Accorto レストラン',
    address: '東京都渋谷区1-1-1',
    phone: '03-1234-5678',
    email: 'info@accorto.example.com',
    businessHours: JSON.stringify({
      monday: '11:00-22:00',
      tuesday: '11:00-22:00',
      wednesday: '11:00-22:00',
      thursday: '11:00-22:00',
      friday: '11:00-23:00',
      saturday: '11:00-23:00',
      sunday: '11:00-22:00',
    }),
  });
  
  console.log('Seeding completed successfully');
};

seed()
  .catch(console.error)
  .finally(() => process.exit());
