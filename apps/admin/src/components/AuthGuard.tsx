import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { isAuthenticated, verifyToken } from '../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicPaths = ['/login', '/signup'];

/**
 * 認証ガードコンポーネント
 * 店舗アカウントでのログインが必要なページにアクセスする際の認証チェックを行う
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // パブリックページ（ログイン不要）の場合はスキップ
      if (publicPaths.includes(location.pathname)) {
        setIsLoading(false);
        return;
      }

      // 基本認証チェック
      if (!isAuthenticated()) {
        console.log('🔒 未認証のためログインページにリダイレクトします');
        navigate('/login', { 
          replace: true,
          state: { from: location.pathname }
        });
        setIsLoading(false);
        return;
      }

      // トークン検証
      try {
        const store = await verifyToken();
        if (!store) {
          console.log('🔒 トークンが無効のためログインページにリダイレクトします');
          navigate('/login', { 
            replace: true,
            state: { from: location.pathname }
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('認証エラー:', error);
        navigate('/login', { 
          replace: true,
          state: { from: location.pathname }
        });
        setIsLoading(false);
        return;
      }

      // 認証済みでログインページにいる場合はダッシュボードにリダイレクト
      if (publicPaths.includes(location.pathname) && isAuthenticated()) {
        console.log('✅ 認証済みのためダッシュボードにリダイレクトします');
        navigate('/', { replace: true });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };

    checkAuth();

    // LocalStorageの変更を監視（他のタブでログアウトした場合など）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('accorto_auth_') || e.key?.startsWith('accorto_store_')) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, navigate]);

  // ローディング中は何も表示しない
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;