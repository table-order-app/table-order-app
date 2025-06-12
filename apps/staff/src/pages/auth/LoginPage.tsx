import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, StaffLoginData } from '../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<StaffLoginData>({
    storeCode: '',
    loginId: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームの変更処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'storeCode' ? value.toUpperCase() : value // 店舗コードのみ大文字に変換
    }));
    
    // エラーをクリア
    if (error) {
      setError(null);
    }
  };

  // ログイン処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.storeCode.trim() || !formData.loginId.trim() || !formData.password.trim()) {
      setError('店舗コード、ログインID、パスワードをすべて入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(formData);
      
      if (result.success) {
        // ログイン成功時のリダイレクト
        const from = location.state?.from || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            スタッフログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            スタッフ用管理画面にアクセスします
          </p>
        </div>

        {/* ログインフォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* エラー表示 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    ログインエラー
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* 店舗コード */}
            <div>
              <label htmlFor="storeCode" className="block text-sm font-medium text-gray-700">
                店舗コード
              </label>
              <input
                id="storeCode"
                name="storeCode"
                type="text"
                value={formData.storeCode}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-center tracking-widest"
                placeholder="A5X8K2M7"
                maxLength={8}
                style={{ letterSpacing: '0.1em' }}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                8文字の英数字コード（管理者から発行されます）
              </p>
            </div>

            {/* ログインID */}
            <div>
              <label htmlFor="loginId" className="block text-sm font-medium text-gray-700">
                ログインID
              </label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                autoComplete="username"
                value={formData.loginId}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ログインIDを入力"
                required
              />
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="パスワードを入力"
                required
              />
            </div>
          </div>

          {/* ログインボタン */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                </div>
              )}
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          {/* ヘルプテキスト */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              店舗コード、ログインID、パスワードは管理者から発行されます
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;