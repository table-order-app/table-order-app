import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserGroup, hasPermission } from '../config/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredGroup?: UserGroup;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredGroup,
  requireAuth = true 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 認証状態を確認中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  // 認証が必要な場合
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 特定のグループ権限が必要な場合
  if (requiredGroup && user) {
    const hasAccess = hasPermission(user.groups, requiredGroup);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h1>
            <p className="text-gray-600 mb-6">
              このページにアクセスするには適切な権限が必要です。
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              戻る
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;