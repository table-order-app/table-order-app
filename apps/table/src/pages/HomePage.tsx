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
    <div className="w-full max-w-xl mx-auto flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-xl shadow-sm p-12 border text-center w-full">
        {/* ウェルカムメッセージ */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            ようこそ
          </h1>
          <p className="text-gray-600 text-sm">
            お席からお気軽にご注文いただけます
          </p>
        </div>

        {/* 注文ボタン */}
        <form onSubmit={handleStartOrder}>
          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white py-4 px-6 rounded-lg font-medium transition-colors duration-200 text-lg shadow-sm"
          >
            注文を始める
          </button>
        </form>

        {/* 簡単な説明 */}
        <div className="mt-6 text-xs text-gray-500">
          <p>メニューを選んでカートに追加し、ご注文ください</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;