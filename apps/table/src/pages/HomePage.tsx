import React from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../routes";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // カテゴリ選択画面に遷移
    navigate(getPath.categories());
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-center mb-6">ようこそ</h2>

      <p className="text-gray-600 mb-6 text-center">
        注文を始めるボタンを押して、お食事の注文を始めましょう
      </p>

      <form onSubmit={handleStartOrder} className="space-y-4">
        <div className="flex justify-center">
          <button
            type="submit"
            className="w-64 bg-[#e0815e] text-white py-2 px-4 rounded-md hover:bg-[#d3704f] transition duration-200"
          >
            注文を始める
          </button>
        </div>
      </form>
    </div>
  );
};

export default HomePage;
