import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MenuList from "../components/MenuList";
import { useCart } from "../contexts/CartContext";
import { getPath } from "../routes";

const MenuListPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { cartItems, setIsCartOpen } = useCart();

  const handleSelectMenu = (menuId: number) => {
    // メニュー詳細ページに遷移
    navigate(getPath.menuDetail(menuId));
  };

  const handleBack = () => {
    // カテゴリー選択ページに戻る
    navigate(getPath.categories());
  };

  const handleOpenCart = () => {
    // カートを開く
    setIsCartOpen(true);
  };

  // categoryIdがstring型で渡ってくるので数値に変換
  const initialCategoryId = categoryId ? parseInt(categoryId) : 1;

  return (
    <MenuList
      initialCategoryId={initialCategoryId}
      onBack={handleBack}
      onSelectMenu={handleSelectMenu}
      onOpenCart={handleOpenCart}
      cartItemCount={cartItems.length}
    />
  );
};

export default MenuListPage;
