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
    <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
      <div className="bg-white rounded-2xl shadow-lg p-16 border text-center w-full max-w-2xl">
        {/* ウェルカムメッセージ */}
        <div className="mb-10">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ようこそ
          </h1>
          <p className="text-gray-600 text-xl">
            お席からお気軽にご注文いただけます
          </p>
        </div>

        {/* 注文ボタン */}
        <form onSubmit={handleStartOrder}>
          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white py-6 px-8 rounded-xl font-bold transition-colors duration-200 text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            注文を始める
          </button>
        </form>

        {/* 簡単な説明 */}
        <div className="mt-8 text-base text-gray-500">
          <p>メニューを選んでカートに追加し、ご注文ください</p>
          <p className="mt-2 text-sm text-gray-400">タブレットで簡単操作</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;