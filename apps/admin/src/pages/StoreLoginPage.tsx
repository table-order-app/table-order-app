import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

const StoreLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // リダイレクト元のページを取得
  const from = (location.state as any)?.from || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 簡易バリデーション
      if (!storeId) {
        setError("店舗IDを入力してください");
        return;
      }

      const numericStoreId = Number(storeId);

      if (isNaN(numericStoreId) || numericStoreId <= 0) {
        setError("有効な店舗IDを入力してください");
        return;
      }

      // LocalStorageに店舗情報を保存
      localStorage.setItem("accorto_admin_store_id", storeId);
      localStorage.setItem("accorto_admin_login_time", new Date().toISOString());

      // 元のページまたはダッシュボードに遷移
      navigate(from, { replace: true });
    } catch (err) {
      setError("ログインに失敗しました");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // デフォルト値でスキップ
    localStorage.setItem("accorto_admin_store_id", "1");
    localStorage.setItem("accorto_admin_login_time", new Date().toISOString());
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Accorto Admin
            </h1>
            <p className="text-gray-600">
              管理する店舗IDを入力してください
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
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
                店舗ID
              </label>
              <input
                id="storeId"
                name="storeId"
                type="number"
                min="1"
                required
                value={storeId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例: 1"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    設定中...
                  </div>
                ) : (
                  "管理画面にログイン"
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                デフォルト設定でスキップ (店舗1)
              </button>
            </div>
          </form>

          {/* 開発用情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              試験用機能 - セキュリティは重視していません
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLoginPage;