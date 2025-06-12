import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { getCurrentStore, generateStoreCode } from "../../services/authService";
import { useState } from "react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentStore, setCurrentStore] = useState(getCurrentStore());
  const [copySuccess, setCopySuccess] = useState(false);
  const [generating, setGenerating] = useState(false);

  // デバッグ用ログ
  console.log("Current store data:", currentStore);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleCopyStoreCode = async () => {
    if (currentStore?.storeCode) {
      try {
        await navigator.clipboard.writeText(currentStore.storeCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('コピーに失敗しました:', err);
      }
    }
  };

  const handleGenerateStoreCode = async () => {
    if (generating) return;
    
    try {
      setGenerating(true);
      const updatedStore = await generateStoreCode();
      setCurrentStore(updatedStore);
      console.log("店舗コードが生成されました:", updatedStore.storeCode);
    } catch (error) {
      console.error('店舗コードの生成に失敗しました:', error);
      alert('店舗コードの生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const dashboardCards = [
    {
      title: "メニュー管理",
      description: "メニューの追加、編集、カテゴリの管理などを行います。",
      buttonLabel: "メニュー管理へ",
      path: getPath.menu(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: "スタッフ管理",
      description: "スタッフの追加、編集、権限設定などを行います。",
      buttonLabel: "スタッフ管理へ",
      path: getPath.staff(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      title: "テーブル設定",
      description: "店舗内テーブル登録などを行います。",
      buttonLabel: "テーブル設定へ",
      path: getPath.tables(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">ダッシュボード</h2>
      
      {/* 店舗情報セクション */}
      {currentStore ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">店舗情報</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">店舗名</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-gray-900 font-medium">{currentStore.name}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">店舗コード</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="text-lg font-mono font-bold text-indigo-600">
                    {currentStore.storeCode || "未設定"}
                  </span>
                </div>
                {currentStore.storeCode ? (
                  <button
                    onClick={handleCopyStoreCode}
                    className="px-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center"
                    title="店舗コードをコピー"
                  >
                    {copySuccess ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateStoreCode}
                    disabled={generating}
                    className="px-3 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 flex items-center justify-center"
                    title="店舗コードを生成"
                  >
                    {generating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                スタッフがログインする際に必要なコードです
                {!currentStore.storeCode && " - 「+」ボタンで生成してください"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">店舗情報の読み込み中</h3>
          <p className="text-yellow-700">店舗情報を取得できませんでした。再ログインが必要かもしれません。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 h-64 flex flex-col"
          >
            {/* カードコンテンツ */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 p-3 rounded-lg mr-4">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm flex-1">
                {card.description}
              </p>
              
              <button
                onClick={() => handleNavigation(card.path)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 px-4 rounded-md font-medium transition-colors duration-200 text-sm mt-4"
              >
                {card.buttonLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
