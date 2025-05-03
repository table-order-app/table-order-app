import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MenuDetail from "../components/MenuDetail";
import { useCart } from "../contexts/CartContext";
import { MenuItem, Option, Topping } from "../types";

const MenuDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { menuId } = useParams<{ menuId: string }>();
  const { addToCart } = useCart();

  const handleAddToCart = (
    menuItem: MenuItem,
    options: Option[],
    toppings: Topping[],
    notes: string,
    quantity: number
  ) => {
    // カートに追加
    addToCart(menuItem, options, toppings, notes, quantity);

    // メニュー一覧ページに戻る
    navigate(-1);
  };

  // menuIdがstring型で渡ってくるので数値に変換
  const menuIdNum = menuId ? parseInt(menuId) : 0;

  return <MenuDetail menuId={menuIdNum} onAddToCart={handleAddToCart} />;
};

export default MenuDetailPage;
