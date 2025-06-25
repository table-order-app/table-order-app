import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const StoreLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeCode, setStoreCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // リダイレクト元のページを取得
  const from = (location.state as any)?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 簡易バリデーション
      if (!storeCode.trim()) {
        setError("店舗コードを入力してください");
        return;
      }

      if (storeCode.trim().length !== 8) {
        setError("店舗コードは8文字で入力してください");
        return;
      }

      // LocalStorageに情報を保存
      localStorage.setItem("accorto_kitchen_store_code", storeCode.toUpperCase());
      localStorage.setItem("accorto_kitchen_login_time", new Date().toISOString());

      // 元のページまたはダッシュボードに遷移
      navigate(from, { replace: true });
    } catch (err) {
      setError("ログインに失敗しました");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Kitchen Display
            </h1>
            <p className="text-gray-600">
              店舗コードを入力してキッチンシステムにアクセス
            </p>
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="storeCode" className="block text-sm font-medium text-gray-700 mb-2">
                店舗コード
              </label>
              <input
                id="storeCode"
                name="storeCode"
                type="text"
                maxLength={8}
                required
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-center tracking-widest"
                placeholder="DFH7L2L8"
                style={{ letterSpacing: '0.1em' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                8文字の英数字コード
              </p>
            </div>


            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    設定中...
                  </div>
                ) : (
                  "キッチンシステムにログイン"
                )}
              </button>

            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default StoreLoginPage;