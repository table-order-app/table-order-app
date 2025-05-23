import { db } from './index';
import { 
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
  
  // カテゴリデータの作成
  const categoriesData = await db.insert(categories).values([
    { name: '前菜', description: '食事の前に楽しむ一品' },
    { name: 'メイン', description: 'メインディッシュ' },
    { name: 'デザート', description: '食後のスイーツ' },
    { name: 'ドリンク', description: '飲み物各種' },
  ]).returning();
  
  // メニューアイテムデータの作成
  await db.insert(menuItems).values([
    {
      categoryId: categoriesData[0].id,
      name: 'シーザーサラダ',
      description: '新鮮なロメインレタスとクルトンのクラシックサラダ',
      price: 800,
      image: '/assets/images/caesar-salad.jpg',
      available: true,
    },
    {
      categoryId: categoriesData[1].id,
      name: 'ステーキセット',
      description: 'A5ランク和牛のステーキと季節の野菜添え',
      price: 3500,
      image: '/assets/images/steak.jpg',
      available: true,
    },
    {
      categoryId: categoriesData[2].id,
      name: 'パンナコッタ',
      description: 'なめらかなイタリアンデザート、季節のフルーツ添え',
      price: 700,
      image: '/assets/images/panna-cotta.jpg',
      available: true,
    },
  ]);
  
  // テーブルデータの作成
  await db.insert(tables).values([
    { number: 1, capacity: 4, area: 'area1', status: 'available' },
    { number: 2, capacity: 2, area: 'area1', status: 'available' },
    { number: 3, capacity: 6, area: 'area2', status: 'available' },
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
