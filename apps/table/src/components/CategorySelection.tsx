import React from "react";
import { mockCategories } from "./MenuList";

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
          className="text-[#e0815e] px-3 py-1.5 rounded-md hover:bg-[#e0815e10] transition-colors text-sm"
        >
          ← 戻る
        </button>
        <h2 className="text-lg font-semibold text-center text-gray-700">
          カテゴリを選択
        </h2>
        <div className="w-16"></div> {/* バランスを取るための空の要素 */}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-1">
        {mockCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center h-24 border border-gray-100"
          >
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
