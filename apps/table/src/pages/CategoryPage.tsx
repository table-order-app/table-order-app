import React from "react";
import { useNavigate } from "react-router-dom";
import CategorySelection from "../components/CategorySelection";
import { getPath } from "../routes";

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectCategory = (categoryId: number) => {
    // メニュー一覧ページに遷移（カテゴリIDをパラメータとして渡す）
    navigate(getPath.menuList(categoryId));
  };

  const handleBack = () => {
    // ホームページに戻る
    navigate(getPath.home());
  };

  return (
    <CategorySelection
      onSelectCategory={handleSelectCategory}
      onBack={handleBack}
    />
  );
};

export default CategoryPage;
