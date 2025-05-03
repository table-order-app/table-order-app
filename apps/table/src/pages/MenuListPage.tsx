import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MenuList from "../components/MenuList";
import { getPath } from "../routes";

const MenuListPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();

  const handleSelectMenu = (menuId: number) => {
    // メニュー詳細ページに遷移
    navigate(getPath.menuDetail(menuId));
  };

  // categoryIdがstring型で渡ってくるので数値に変換
  const initialCategoryId = categoryId ? parseInt(categoryId) : 1;

  return (
    <MenuList
      initialCategoryId={initialCategoryId}
      onSelectMenu={handleSelectMenu}
    />
  );
};

export default MenuListPage;
