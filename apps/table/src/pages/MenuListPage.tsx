import React from "react";
import { useParams } from "react-router-dom";
import MenuList from "../components/MenuList";

const MenuListPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  // categoryIdがstring型で渡ってくるので数値に変換
  const parsedCategoryId = categoryId ? parseInt(categoryId) : 1;

  return (
    <MenuList
      categoryId={parsedCategoryId}
    />
  );
};

export default MenuListPage;
