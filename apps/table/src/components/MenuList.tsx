import React, { useState, useEffect } from "react";

// モックデータ：カテゴリ一覧（絵文字を削除）
export const mockCategories = [
  { id: 1, name: "ご飯もの" },
  { id: 2, name: "麺類" },
  { id: 3, name: "前菜・サラダ" },
  { id: 4, name: "肉料理" },
  { id: 5, name: "魚料理" },
  { id: 6, name: "デザート" },
  { id: 7, name: "ドリンク" },
  { id: 8, name: "アルコール" },
];

// モックデータ：メニュー一覧（トッピングやオプションを追加）
export const mockMenuItems = [
  // ご飯もの
  {
    id: 101,
    categoryId: 1,
    name: "白米",
    price: 200,
    image: "🍚",
    description: "国産米を使用した炊きたてご飯です",
    options: [
      { id: 1011, name: "大盛り", price: 100 },
      { id: 1012, name: "特盛り", price: 200 },
    ],
    toppings: [],
    allergens: ["米"],
  },
  {
    id: 102,
    categoryId: 1,
    name: "お茶漬け",
    price: 400,
    image: "🍵",
    description: "お好みのだしで食べるお茶漬けです",
    options: [
      { id: 1021, name: "梅", price: 0 },
      { id: 1022, name: "鮭", price: 100 },
      { id: 1023, name: "明太子", price: 150 },
    ],
    toppings: [
      { id: 10201, name: "刻み海苔", price: 50 },
      { id: 10202, name: "わさび", price: 30 },
    ],
    allergens: ["米", "魚"],
  },
  {
    id: 103,
    categoryId: 1,
    name: "オムライス",
    price: 800,
    image: "🍳",
    description: "ふわとろ卵のオムライスです",
    options: [],
    toppings: [],
    allergens: ["卵"],
  },
  {
    id: 104,
    categoryId: 1,
    name: "カレーライス",
    price: 850,
    image: "🍛",
    description: "じっくり煮込んだ特製カレーです",
    options: [],
    toppings: [],
    allergens: ["小麦", "卵", "豚肉"],
  },

  // 麺類
  {
    id: 201,
    categoryId: 2,
    name: "ラーメン",
    price: 800,
    image: "🍜",
    description: "自家製麺と秘伝のスープが絶品",
    options: [
      { id: 2011, name: "醤油", price: 0 },
      { id: 2012, name: "味噌", price: 50 },
      { id: 2013, name: "塩", price: 0 },
      { id: 2014, name: "豚骨", price: 100 },
    ],
    toppings: [
      { id: 20101, name: "チャーシュー", price: 200 },
      { id: 20102, name: "味玉", price: 100 },
      { id: 20103, name: "メンマ", price: 100 },
      { id: 20104, name: "のり", price: 50 },
    ],
    allergens: ["小麦", "卵", "豚肉"],
  },
  {
    id: 202,
    categoryId: 2,
    name: "うどん",
    price: 700,
    image: "🍲",
    description: "コシのある自家製麺のうどんです",
    options: [],
    toppings: [],
    allergens: ["小麦"],
  },
  {
    id: 203,
    categoryId: 2,
    name: "パスタ",
    price: 900,
    image: "🍝",
    description: "本格的な味わいのパスタです",
    options: [],
    toppings: [],
    allergens: ["小麦"],
  },

  // 前菜・サラダ
  {
    id: 301,
    categoryId: 3,
    name: "シーザーサラダ",
    price: 600,
    image: "🥗",
    description: "新鮮な野菜とクリーミーなドレッシング",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 302,
    categoryId: 3,
    name: "カプレーゼ",
    price: 700,
    image: "🍅",
    description: "トマトとモッツァレラチーズのカプレーゼ",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 303,
    categoryId: 3,
    name: "枝豆",
    price: 400,
    image: "🫛",
    description: "塩茹でした枝豆です",
    options: [],
    toppings: [],
    allergens: [],
  },

  // 肉料理
  {
    id: 401,
    categoryId: 4,
    name: "ステーキ",
    price: 1800,
    image: "🥩",
    description: "厳選された牛肉のステーキです",
    options: [],
    toppings: [],
    allergens: ["牛肉"],
  },
  {
    id: 402,
    categoryId: 4,
    name: "からあげ",
    price: 700,
    image: "🍗",
    description: "サクサクジューシーな唐揚げです",
    options: [],
    toppings: [],
    allergens: ["小麦", "卵"],
  },
  {
    id: 403,
    categoryId: 4,
    name: "ハンバーグ",
    price: 950,
    image: "🍔",
    description: "肉汁たっぷりのハンバーグです",
    options: [],
    toppings: [],
    allergens: ["小麦", "卵", "豚肉"],
  },

  // 魚料理
  {
    id: 501,
    categoryId: 5,
    name: "刺身盛り合わせ",
    price: 1500,
    image: "🐟",
    description: "新鮮な魚介の刺身盛り合わせです",
    options: [],
    toppings: [],
    allergens: ["魚"],
  },
  {
    id: 502,
    categoryId: 5,
    name: "焼き魚",
    price: 900,
    image: "🐠",
    description: "本日の焼き魚です",
    options: [],
    toppings: [],
    allergens: ["魚"],
  },
  {
    id: 503,
    categoryId: 5,
    name: "海鮮丼",
    price: 1200,
    image: "🍱",
    description: "新鮮な海の幸がたっぷりの海鮮丼です",
    options: [],
    toppings: [],
    allergens: ["魚"],
  },

  // デザート
  {
    id: 601,
    categoryId: 6,
    name: "チーズケーキ",
    price: 500,
    image: "🍰",
    description: "濃厚なチーズケーキです",
    options: [],
    toppings: [],
    allergens: ["乳"],
  },
  {
    id: 602,
    categoryId: 6,
    name: "アイスクリーム",
    price: 400,
    image: "🍦",
    description: "バニラアイスクリームです",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 603,
    categoryId: 6,
    name: "フルーツ盛り合わせ",
    price: 700,
    image: "🍎",
    description: "季節のフルーツ盛り合わせです",
    options: [],
    toppings: [],
    allergens: [],
  },

  // ドリンク
  {
    id: 701,
    categoryId: 7,
    name: "コーラ",
    price: 300,
    image: "🥤",
    description: "コカ・コーラです",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 702,
    categoryId: 7,
    name: "オレンジジュース",
    price: 300,
    image: "🧃",
    description: "100%オレンジジュースです",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 703,
    categoryId: 7,
    name: "コーヒー",
    price: 400,
    image: "☕",
    description: "挽きたてのコーヒーです",
    options: [],
    toppings: [],
    allergens: [],
  },

  // アルコール
  {
    id: 801,
    categoryId: 8,
    name: "ビール",
    price: 500,
    image: "🍺",
    description: "冷えたビールです",
    options: [],
    toppings: [],
    allergens: [],
  },
  {
    id: 802,
    categoryId: 8,
    name: "ワイン",
    price: 600,
    image: "🍷",
    description: "グラスワインです",
    options: [],
    toppings: [],
    allergens: ["果実"],
  },
  {
    id: 803,
    categoryId: 8,
    name: "日本酒",
    price: 700,
    image: "🍶",
    description: "地元の日本酒です",
    options: [],
    toppings: [],
    allergens: [],
  },
];

interface MenuListProps {
  initialCategoryId: number;
  onSelectMenu: (menuId: number) => void;
}

const MenuList: React.FC<MenuListProps> = ({
  initialCategoryId,
  onSelectMenu,
}) => {
  // 選択されているカテゴリID
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<number>(initialCategoryId);
  // 表示するメニューアイテム
  const [menuItems, setMenuItems] = useState<typeof mockMenuItems>([]);

  // カテゴリが変更されたらメニューを更新
  useEffect(() => {
    // 選択されたカテゴリに属するメニューをフィルタリング
    const filteredItems = mockMenuItems.filter(
      (item) => item.categoryId === selectedCategoryId
    );
    setMenuItems(filteredItems);
  }, [selectedCategoryId]);

  return (
    <div className="w-full max-w-5xl">
      {/* カテゴリー横スクロール */}
      <div className="sticky top-20 bg-[#fffafa] pt-2 pb-3 z-10 shadow-sm">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex space-x-1 px-2">
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  selectedCategoryId === category.id
                    ? "bg-[#e0815e] text-white"
                    : "bg-white hover:bg-gray-100 text-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 選択したカテゴリのタイトル */}
      <div className="mb-4 px-4 mt-2">
        <h2 className="text-lg font-semibold text-gray-700">
          {mockCategories.find((c) => c.id === selectedCategoryId)?.name ||
            "メニュー"}
        </h2>
      </div>

      {/* メニュー一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectMenu(item.id)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 flex items-center cursor-pointer border border-gray-100"
          >
            <div className="text-3xl mr-3 flex-shrink-0">{item.image}</div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-800">{item.name}</h3>
              <p className="text-[#e0815e] font-semibold">¥{item.price}</p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                {item.description}
              </p>
            </div>
            <div className="text-gray-400 ml-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuList;
