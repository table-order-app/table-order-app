import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MenuList from "../components/MenuList";
import { getPath } from "../routes";

const MenuListPage: React.FC = () => {
  const navigate = useNavigate();
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
