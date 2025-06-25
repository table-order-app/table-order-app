import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../routes";

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  

  useEffect(() => {
    // 3秒後に自動で注文履歴ページに遷移
    const timer = setTimeout(() => {
      navigate(getPath.orderConfirmation(), { replace: true });
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleContinueShopping = () => {
    navigate(getPath.categories());
  };

  const handleViewOrders = () => {
    navigate(getPath.orderConfirmation());
  };

  const handleBackToHome = () => {
    navigate(getPath.home());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 成功アイコン */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* メッセージ部分 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            ご注文ありがとうございます！
          </h1>
          
          <p className="text-gray-600 mb-2">
            注文を正常に受け付けました
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            調理開始までしばらくお待ちください
          </p>


          {/* アクションボタン */}
          <div className="space-y-3">
            {/* カテゴリ選択画面への導線（メインアクション） */}
            <button
              onClick={handleContinueShopping}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:from-orange-600 hover:to-red-600"
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">🍽️</span>
                追加注文する
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            {/* 注文状況確認への導線 */}
            <button
              onClick={handleViewOrders}
              className="w-full bg-white text-gray-700 py-3 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:bg-gray-50 hover:shadow-md"
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">📋</span>
                注文状況を確認する
              </div>
            </button>

            {/* ホームに戻る（サブアクション） */}
            <button
              onClick={handleBackToHome}
              className="w-full text-gray-500 py-2 rounded-xl font-medium transition-colors hover:text-gray-700"
            >
              ホームに戻る
            </button>
          </div>

          {/* 自動遷移の案内 */}
          <p className="text-xs text-gray-400 mt-6">
            8秒後に注文状況画面に自動で移動します
          </p>
        </div>

        {/* 装飾要素 */}
        <div className="absolute top-10 left-10 opacity-20">
          <div className="text-4xl animate-float">🎉</div>
        </div>
        <div className="absolute top-20 right-16 opacity-20">
          <div className="text-3xl animate-float-delay">✨</div>
        </div>
        <div className="absolute bottom-20 left-20 opacity-20">
          <div className="text-2xl animate-float">🌟</div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 3s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessPage;