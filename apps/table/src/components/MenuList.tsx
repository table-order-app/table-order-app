import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuItem } from "../types";
import { getMenuItemsByCategory } from "../services/menuService";
import { getPath } from "../routes";
import { hasValidImage, getImageUrl } from "../utils/imageUtils";

const MenuCard: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden ${className || ""}`}>
      {children}
    </div>
  );
};

const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <Link
      to={getPath.menuDetail(item.id)}
      className="no-underline text-inherit"
    >
      <MenuCard className="h-full">
        {/* 画像がある場合のみ画像セクションを表示 */}
        {hasValidImage(item.image) && !imageError && (
          <div className="relative pb-[60%] overflow-hidden">
            <img
              src={getImageUrl(item.image)!}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Content Section */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">
            {item.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-orange-500">
              ¥{item.price.toLocaleString()}
            </span>
          </div>
        </div>
      </MenuCard>
    </Link>
  );
};

interface MenuListProps {
  categoryId: number;
}

const MenuList: React.FC<MenuListProps> = ({ categoryId }) => {
  // 表示するメニューアイテム
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12; // 1ページあたりのアイテム数

  // カテゴリが変更されたらメニューを更新
  useEffect(() => {
    async function fetchMenuItems() {
      setLoading(true);
      try {
        const response = await getMenuItemsByCategory(categoryId);
        if (response.success && response.data) {
          setMenuItems(response.data);
          setError(null);
          setCurrentPage(1); // カテゴリ変更時は1ページ目に戻る
        } else {
          setError(response.error || "メニュー情報の取得に失敗しました");
          setMenuItems([]);
        }
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("メニュー情報の取得に失敗しました");
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMenuItems();
  }, [categoryId]);

  // ページネーション計算
  const totalPages = Math.ceil(menuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = menuItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <div className="flex flex-col items-center bg-white rounded-lg p-8 shadow-sm border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">メニューを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center max-w-md shadow-sm">
          <div className="text-4xl mb-4">😔</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md shadow-sm">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">メニューが見つかりません</h3>
          <p className="text-gray-600">このカテゴリにはまだメニューが登録されていません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* メニューグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {currentItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {/* 前のページボタン */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>

          {/* ページ番号 */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          {/* 次のページボタン */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}

      {/* ページ情報 */}
      {totalPages > 1 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          {menuItems.length}件中 {startIndex + 1}-{Math.min(endIndex, menuItems.length)}件を表示
        </div>
      )}
    </div>
  );
};

export default MenuList;