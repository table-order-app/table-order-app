import React, { useState, useEffect } from "react";
import { getCategories } from "../services/menuService";

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface CategorySelectionProps {
  onSelectCategory: (categoryId: number) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
          setError(null);
        } else {
          setError(response.error || "カテゴリ情報の取得に失敗しました");
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("カテゴリ情報の取得に失敗しました");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="w-full text-center p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="w-full text-center p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          カテゴリを選択
        </h2>
        <p className="text-gray-600 text-sm">
          お好みのメニューカテゴリをお選びください
        </p>
      </div>

      {/* カテゴリグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center justify-center border border-orange-200 hover:border-orange-300 hover:transform hover:scale-105"
          >
            {/* カテゴリアイコン */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-4 group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12.88 11.53z"/>
              </svg>
            </div>
            
            {/* カテゴリ名 */}
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
              {category.name}
            </h3>
            
            {/* 説明文 */}
            {category.description && (
              <p className="text-sm text-gray-600 text-center line-clamp-2">
                {category.description}
              </p>
            )}

            {/* 選択矢印 */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
