import { ReactNode } from "react";
import { getLoginInfo, logout } from "../utils/authUtils";
import { useNavigate } from "react-router-dom";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const loginInfo = getLoginInfo();

  const handleLogout = () => {
    if (confirm('ログアウトして店舗を変更しますか？')) {
      logout();
      navigate('/store-login', { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-white shadow z-10">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold">キッチンモニター</h1>
          {loginInfo && (
            <span className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 md:px-3 py-1 rounded-full">
              店舗: {loginInfo.storeCode}
            </span>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className="px-2 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden md:inline">ログアウト</span>
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
