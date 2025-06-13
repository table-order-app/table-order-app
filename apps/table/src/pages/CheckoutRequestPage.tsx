import React from "react";
import { useNavigate } from "react-router-dom";

const CheckoutRequestPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleBackToHistory = () => {
    navigate("/order-confirmation");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* アイコン */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* メインメッセージ */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          会計をスタッフに要請しました
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          スタッフがお席までお伺いいたします。<br />
          しばらくお待ちください。
        </p>

        {/* 装飾的な区切り線 */}
        <div className="flex items-center justify-center mb-6">
          <div className="border-t border-gray-200 flex-grow"></div>
          <div className="px-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
          <div className="border-t border-gray-200 flex-grow"></div>
        </div>

        {/* 感謝メッセージ */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-orange-800 mb-2">
            ありがとうございました
          </h2>
          <p className="text-orange-700 text-sm">
            本日はご来店いただき誠にありがとうございます。<br />
            またのご来店を心よりお待ちしております。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          <button
            onClick={handleBackToHistory}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            注文履歴に戻る
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            ホームに戻る
          </button>
        </div>

        {/* フッター情報 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            ご不明な点がございましたら<br />
            お気軽にスタッフまでお声がけください
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutRequestPage;