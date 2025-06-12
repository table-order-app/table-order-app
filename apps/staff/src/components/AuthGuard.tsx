import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, verifyToken } from '../services/authService';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * 認証ガードコンポーネント
 * ログインが必要なページにアクセスする際の認証チェックを行う
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // パブリックページ（認証不要）
  const publicPaths = ['/login'];

  useEffect(() => {
    const checkAuth = async () => {
      // パブリックページの場合は認証チェックをスキップ
      if (publicPaths.includes(location.pathname)) {
        setIsLoading(false);
        return;
      }

      // 基本的な認証状態チェック
      if (!isAuthenticated()) {
        navigate('/login', { 
          replace: true, 
          state: { from: location.pathname }
        });
        return;
      }

      // トークンの有効性を検証
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          navigate('/login', { 
            replace: true, 
            state: { from: location.pathname }
          });
          return;
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        navigate('/login', { 
          replace: true, 
          state: { from: location.pathname }
        });
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  // ログインページの場合で既に認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (location.pathname === '/login' && isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">認証を確認中...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;