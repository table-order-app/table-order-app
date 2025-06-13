import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { validateTable } from "../services/tableService";

const StoreLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeCode, setStoreCode] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // リダイレクト元のページを取得
  const from = (location.state as any)?.from || "/";

  // ページ読み込み時にLocalStorageの値を確認
  useEffect(() => {
    const existingStoreCode = localStorage.getItem("accorto_store_code");
    const existingTableNumber = localStorage.getItem("accorto_table_number");
    
    console.log('Initial localStorage values:', { 
      existingStoreCode, 
      existingTableNumber 
    });
    
    // 既存の値があれば初期値として設定（オプション）
    // if (existingStoreCode) setStoreCode(existingStoreCode);
    // if (existingTableNumber) setTableNumber(existingTableNumber);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 簡易バリデーション
      if (!storeCode.trim() || !tableNumber) {
        setError("店舗コードとテーブル番号を入力してください");
        return;
      }

      if (storeCode.trim().length !== 8) {
        setError("店舗コードは8文字で入力してください");
        return;
      }

      const numericTableNumber = Number(tableNumber);
      if (isNaN(numericTableNumber) || numericTableNumber <= 0) {
        setError("有効なテーブル番号を入力してください");
        return;
      }

      // テーブルの存在確認
      console.log('Validating table:', { storeCode: storeCode.toUpperCase(), tableNumber: numericTableNumber });
      const validationResult = await validateTable(storeCode.toUpperCase(), numericTableNumber);
      
      if (!validationResult.success || !validationResult.exists) {
        setError(validationResult.error || "テーブルが存在しません");
        return;
      }

      console.log('Table validation successful:', validationResult.data);

      // LocalStorageに店舗情報を保存
      console.log('Saving to localStorage:', { storeCode: storeCode.toUpperCase(), tableNumber });
      localStorage.setItem("accorto_store_code", storeCode.toUpperCase());
      localStorage.setItem("accorto_table_number", tableNumber);
      localStorage.setItem("accorto_login_time", new Date().toISOString());

      // 元のページまたはホームページに遷移
      navigate(from, { replace: true });
    } catch (err) {
      setError("ログインに失敗しました");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      
      // デフォルト値でスキップ（テスト用: STORE001）
      const defaultStoreCode = "STORE001";
      const defaultTableNumber = 1;
      
      console.log('Validating default values:', { storeCode: defaultStoreCode, tableNumber: defaultTableNumber });
      
      // テーブルの存在確認
      const validationResult = await validateTable(defaultStoreCode, defaultTableNumber);
      
      if (!validationResult.success || !validationResult.exists) {
        setError(`デフォルト設定でログインできません: ${validationResult.error}`);
        return;
      }
      
      console.log('Default table validation successful:', validationResult.data);
      console.log('Setting default values:', { storeCode: defaultStoreCode, tableNumber: defaultTableNumber });
      
      localStorage.setItem("accorto_store_code", defaultStoreCode);
      localStorage.setItem("accorto_table_number", defaultTableNumber.toString());
      localStorage.setItem("accorto_login_time", new Date().toISOString());
      navigate(from, { replace: true });
    } catch (err) {
      setError("スキップログインに失敗しました");
      console.error("Skip login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Table Order
            </h1>
            <p className="text-gray-600">
              店舗コードとテーブル番号を入力してください
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-center tracking-widest text-gray-900 bg-white text-lg font-semibold"
                placeholder="DFH7L2L8"
                style={{ letterSpacing: '0.1em', fontSize: '16px' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                8文字の英数字コード
              </p>
            </div>

            <div>
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-2">
                テーブル番号
              </label>
              <input
                id="tableNumber"
                name="tableNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                required
                value={tableNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  console.log('Table number input change:', value);
                  setTableNumber(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white text-center text-lg font-medium"
                placeholder="例: 1"
                style={{ fontSize: '16px' }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    設定中...
                  </div>
                ) : (
                  "設定して開始"
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                デフォルト設定でスキップ (DFH7L2L8・テーブル1)
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