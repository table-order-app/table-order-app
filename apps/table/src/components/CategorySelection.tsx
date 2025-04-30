import React from "react";

// モックデータ：カテゴリ一覧
const mockCategories = [
  { id: 1, name: "ご飯もの", image: "🍚" },
  { id: 2, name: "麺類", image: "🍜" },
  { id: 3, name: "前菜・サラダ", image: "🥗" },
  { id: 4, name: "肉料理", image: "🍖" },
  { id: 5, name: "魚料理", image: "🐟" },
  { id: 6, name: "デザート", image: "🍰" },
  { id: 7, name: "ドリンク", image: "🥤" },
  { id: 8, name: "アルコール", image: "🍺" },
];

interface CategorySelectionProps {
  onSelectCategory: (categoryId: number) => void;
  onBack: () => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  onSelectCategory,
  onBack,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-[#e0815e] px-4 py-2 rounded-md hover:bg-[#e0815e10] transition-colors"
        >
          ← 戻る
        </button>
        <h2 className="text-xl font-semibold text-center">カテゴリを選択</h2>
        <div className="w-16"></div> {/* バランスを取るための空の要素 */}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mockCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col items-center justify-center h-32"
          >
            <div className="text-4xl mb-2">{category.image}</div>
            <div className="text-center font-medium text-gray-800">
              {category.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
