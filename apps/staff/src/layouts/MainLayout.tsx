import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentStaff, getCurrentStore, logout } from "../services/authService";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const staff = getCurrentStaff();
  const store = getCurrentStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ・店舗名 */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {store?.name} - スタッフ
                </h1>
              </div>
            </div>

            {/* ユーザーメニュー */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {staff?.name.charAt(0) || "S"}
                  </span>
                </div>
                <span className="ml-2 text-gray-700 font-medium">
                  {staff?.name}
                </span>
                <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ドロップダウンメニュー */}
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{staff?.name}</p>
                      <p className="text-xs text-gray-500">
                        {staff?.role === 'admin' && '管理者'}
                        {staff?.role === 'manager' && 'マネージャー'}
                        {staff?.role === 'staff' && '一般スタッフ'}
                        {staff?.role === 'kitchen' && 'キッチンスタッフ'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* フッター */}
      <footer className="py-2 px-4 text-center text-xs text-gray-500 bg-white border-t border-gray-200">
        <p>© 2024 TableOrder - スタッフアプリ v1.0</p>
      </footer>
    </div>
  );
};

export default MainLayout;
