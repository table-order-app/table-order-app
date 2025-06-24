import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, isPublicPath } from '../utils/authUtils';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 認証ガードコンポーネント
 * ログインが必要なページにアクセスする際の認証チェックを行う
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      // パブリックページ（ログイン不要）の場合はスキップ
      if (isPublicPath(location.pathname)) {
        return;
      }

      // ログインしていない場合はログインページにリダイレクト
      if (!isLoggedIn()) {

        navigate('/store-login', { 
          replace: true,
          state: { from: location.pathname } // 元のページを記録
        });
        return;
      }

      // ログイン済みでログインページにいる場合はホームにリダイレクト
      if (location.pathname === '/store-login' && isLoggedIn()) {

        navigate('/', { replace: true });
        return;
      }
    };

    // 初回チェック
    checkAuth();

    // LocalStorageの変更を監視（他のタブでログアウトした場合など）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('accorto_kitchen_')) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

export default AuthGuard;