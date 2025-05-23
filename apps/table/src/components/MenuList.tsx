import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuItem } from "../types";
import { getMenuItemsByCategory } from "../services/menuService";

const SimpleCard: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className || ""}`}>
      {children}
    </div>
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

  // カテゴリが変更されたらメニューを更新
  useEffect(() => {
    async function fetchMenuItems() {
      setLoading(true);
      try {
        const response = await getMenuItemsByCategory(categoryId);
        if (response.success && response.data) {
          setMenuItems(response.data);
          setError(null);
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

  if (loading) {
    return <div className="w-full text-center p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="w-full text-center p-4 text-red-600">{error}</div>;
  }

  if (menuItems.length === 0) {
    return <div className="w-full text-center p-4">このカテゴリにはメニューがありません</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl">
      {menuItems.map((item) => (
        <Link
          key={item.id}
          to={`/menu/${item.id}`}
          className="no-underline text-inherit"
        >
          <SimpleCard className="h-full">
            <div className="relative pb-[60%] overflow-hidden rounded-t-lg">
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h3 className="font-bold mb-1 text-xl">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {item.description}
              </p>
              <p className="font-bold text-lg">¥{item.price.toLocaleString()}</p>
            </div>
          </SimpleCard>
        </Link>
      ))}
    </div>
  );
};

export default MenuList;
